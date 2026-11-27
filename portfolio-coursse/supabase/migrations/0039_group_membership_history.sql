begin;

create extension if not exists btree_gist with schema extensions;

-- Take the cutover only after blocking concurrent changes to enrollments.
lock table public.course_students in share row exclusive mode;

alter table public.course_students
  add constraint course_students_history_identity_key unique (id, course_id, student_id);

create table academic_access.group_membership_history (
  enrollment_id bigint not null,
  course_id bigint not null,
  student_id uuid not null,
  membership_state text not null,
  group_id bigint,
  valid_from timestamptz not null,
  valid_until timestamptz,
  primary key (enrollment_id, valid_from),
  foreign key (enrollment_id, course_id, student_id)
    references public.course_students (id, course_id, student_id) on delete restrict,
  foreign key (course_id, group_id)
    references public.groups (course_id, id) on delete restrict,
  check (membership_state in ('grouped', 'ungrouped', 'inactive')),
  check ((membership_state = 'grouped') = (group_id is not null)),
  check (valid_until is null or valid_from < valid_until),
  exclude using gist (
    enrollment_id with =,
    tstzrange(valid_from, valid_until, '[)') with &&
  )
);

create index group_membership_history_group_idx
  on academic_access.group_membership_history (course_id, group_id)
  where group_id is not null;

alter table academic_access.group_membership_history enable row level security;
revoke all on table academic_access.group_membership_history from public, anon, authenticated;

create function academic_access.membership_state(enrollment public.course_students)
returns text
language sql stable set search_path = ''
as $$
  select case
    when enrollment.status = 'inactive' then 'inactive'
    when enrollment.group_id is null then 'ungrouped'
    else 'grouped'
  end
  from public.authorized_students a
  where a.id = enrollment.authorized_student_id
    and a.course_id = enrollment.course_id
    and lower(trim(a.email)) = academic_access.verified_google_email(enrollment.student_id)
    and (enrollment.status = 'inactive' or a.status = 'active');
$$;

revoke all on function academic_access.membership_state(public.course_students) from public, anon, authenticated;

with cutover as materialized (select clock_timestamp() as recorded_at)
insert into academic_access.group_membership_history
  (enrollment_id, course_id, student_id, membership_state, group_id, valid_from)
select cs.id, cs.course_id, cs.student_id, state.value,
  case when state.value = 'grouped' then cs.group_id end,
  cutover.recorded_at
from public.course_students cs
cross join cutover
cross join lateral (select academic_access.membership_state(cs) as value) state
where state.value is not null;

create function academic_access.record_group_membership()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  previous academic_access.group_membership_history%rowtype;
  next_state text;
  next_group_id bigint;
  boundary timestamptz;
begin
  -- The enrollment write already holds its row lock.
  select h.* into previous
  from academic_access.group_membership_history h
  where h.enrollment_id = new.id
  order by h.valid_from desc
  limit 1;

  next_state := academic_access.membership_state(new);
  if new.status = 'inactive' and previous.enrollment_id is not null then
    next_state := 'inactive';
  end if;
  if next_state = 'grouped' then
    next_group_id := new.group_id;
  end if;

  if previous.enrollment_id is not null and previous.valid_until is null then
    if previous.membership_state is not distinct from next_state
       and previous.group_id is not distinct from next_group_id then
      return new;
    end if;

    boundary := greatest(clock_timestamp(), previous.valid_from + interval '1 microsecond');
    update academic_access.group_membership_history h
    set valid_until = boundary
    where h.enrollment_id = previous.enrollment_id and h.valid_from = previous.valid_from;
  else
    boundary := greatest(clock_timestamp(), previous.valid_until);
  end if;

  if next_state is not null then
    insert into academic_access.group_membership_history
      (enrollment_id, course_id, student_id, membership_state, group_id, valid_from)
    values (new.id, new.course_id, new.student_id, next_state, next_group_id, boundary);
  end if;
  return new;
end;
$$;

revoke all on function academic_access.record_group_membership() from public, anon, authenticated;
create trigger record_group_membership
after insert or update of course_id, student_id, group_id, status, authorized_student_id
on public.course_students
for each row execute function academic_access.record_group_membership();

create function public.student_group_membership_at(
  target_enrollment_id bigint, requested_at timestamptz
)
returns table (membership_state text, group_id bigint)
language plpgsql stable security definer set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.course_students cs
    where cs.id = target_enrollment_id and public.is_teacher_of_course(cs.course_id)
  ) then
    raise exception 'membership_access_denied' using errcode = '42501';
  end if;
  if requested_at is null then
    raise exception 'membership_time_required' using errcode = '22004';
  end if;

  if requested_at <= statement_timestamp() then
    return query
    select h.membership_state, h.group_id
    from academic_access.group_membership_history h
    where h.enrollment_id = target_enrollment_id
      and tstzrange(h.valid_from, h.valid_until, '[)') @> requested_at;
    if found then
      return;
    end if;
  end if;

  return query select 'unknown'::text, null::bigint;
end;
$$;

revoke all on function public.student_group_membership_at(bigint, timestamptz) from public, anon;
grant execute on function public.student_group_membership_at(bigint, timestamptz) to authenticated;

-- A grade must remain linked to its original group even if the group is empty.
alter table public.group_grades
  drop constraint group_grades_group_id_fkey,
  add constraint group_grades_group_id_fkey
    foreign key (group_id) references public.groups (id) on delete restrict;

-- Remove only surplus groups with no current or historical references.
create or replace function public.synchronize_course_groups(
  target_course_id bigint,
  target_capacity integer
)
returns table (authorized_students integer, required_groups integer, generated_groups integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  active_authorizations integer;
  needed_groups integer;
  existing_groups integer;
  next_position integer;
  removable_group_id bigint;
  current_group record;
  created_groups integer := 0;
begin
  if not public.is_teacher_of_course(target_course_id) then raise exception 'not_course_teacher'; end if;
  if target_capacity < 1 then raise exception 'invalid_group_capacity'; end if;

  select count(*)::integer into active_authorizations
  from public.authorized_students
  where course_id = target_course_id and status = 'active';
  needed_groups := ceil(active_authorizations::numeric / target_capacity)::integer;

  for current_group in
    select g.id, count(cs.id)::integer as active_members
    from public.groups g left join public.course_students cs on cs.group_id = g.id and cs.status = 'active'
    where g.course_id = target_course_id group by g.id
  loop
    if current_group.active_members > target_capacity then raise exception 'capacity_below_existing_members'; end if;
  end loop;

  update public.courses set group_capacity = target_capacity where id = target_course_id;
  update public.groups set capacity = target_capacity, name = 'Grupo ' || position where course_id = target_course_id;

  loop
    select count(*)::integer into existing_groups from public.groups where course_id = target_course_id;
    exit when existing_groups <= needed_groups;
    select g.id into removable_group_id
    from public.groups g
    where g.course_id = target_course_id
      and not exists (select 1 from public.course_students cs where cs.group_id = g.id)
      and not exists (select 1 from public.authorized_students a where a.group_id = g.id)
      and not exists (select 1 from public.group_grades grade where grade.group_id = g.id)
      and not exists (
        select 1 from academic_access.group_membership_history h
        where h.course_id = g.course_id and h.group_id = g.id
      )
    order by g.position desc
    limit 1;
    exit when removable_group_id is null;
    delete from public.groups where id = removable_group_id;
  end loop;

  select count(*)::integer, coalesce(max(position), 0)::integer into existing_groups, next_position
  from public.groups where course_id = target_course_id;
  while existing_groups < needed_groups loop
    next_position := next_position + 1;
    insert into public.groups (course_id, name, position, capacity)
    values (target_course_id, 'Grupo ' || next_position, next_position, target_capacity);
    existing_groups := existing_groups + 1;
    created_groups := created_groups + 1;
  end loop;

  return query select active_authorizations, needed_groups, created_groups;
end;
$$;

commit;
