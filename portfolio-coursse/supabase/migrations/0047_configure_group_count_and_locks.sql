-- GRP-01: allow explicit group count configuration, require active courses,
-- and serialize capacity validation with student group selections.
begin;

drop function if exists public.synchronize_course_groups(bigint, integer);

create or replace function public.synchronize_course_groups(
  target_course_id bigint,
  target_capacity integer,
  target_group_count integer default null
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
  active_members integer;
  created_groups integer := 0;
begin
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'not_course_teacher';
  end if;

  if target_capacity is null or target_capacity < 1 then
    raise exception 'invalid_group_capacity';
  end if;

  if target_group_count is not null and target_group_count < 1 then
    raise exception 'invalid_group_count';
  end if;

  perform 1
  from public.courses
  where id = target_course_id
    and active = true
  for update;

  if not found then
    raise exception 'course_not_active';
  end if;

  select count(*)::integer
  into active_authorizations
  from public.authorized_students
  where course_id = target_course_id
    and status = 'active';

  needed_groups := coalesce(
    target_group_count,
    ceil(active_authorizations::numeric / target_capacity)::integer
  );

  for current_group in
    select g.id
    from public.groups g
    where g.course_id = target_course_id
    order by g.id
  loop
    perform pg_advisory_xact_lock(current_group.id);

    select count(*)::integer
    into active_members
    from public.course_students cs
    where cs.group_id = current_group.id
      and cs.status = 'active';

    if active_members > target_capacity then
      raise exception 'capacity_below_existing_members';
    end if;
  end loop;

  update public.courses
  set group_capacity = target_capacity
  where id = target_course_id;

  update public.groups
  set capacity = target_capacity,
      name = 'Grupo ' || position
  where course_id = target_course_id;

  loop
    select count(*)::integer
    into existing_groups
    from public.groups
    where course_id = target_course_id;

    exit when existing_groups <= needed_groups;

    select g.id
    into removable_group_id
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

  select count(*)::integer, coalesce(max(position), 0)::integer
  into existing_groups, next_position
  from public.groups
  where course_id = target_course_id;

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

create or replace function public.configure_course_group_selection(
  target_course_id bigint,
  opens_on date,
  opens_at time,
  closes_on date,
  closes_at time
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  opens_timestamp timestamptz;
  closes_timestamp timestamptz;
begin
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'not_course_teacher';
  end if;

  perform 1
  from public.courses
  where id = target_course_id
    and active = true
  for update;

  if not found then
    raise exception 'course_not_active';
  end if;

  opens_timestamp := (opens_on + opens_at) at time zone 'America/Lima';
  closes_timestamp := (closes_on + closes_at) at time zone 'America/Lima';

  if opens_timestamp is null
     or closes_timestamp is null
     or closes_timestamp <= opens_timestamp then
    raise exception 'invalid_selection_window';
  end if;

  update public.courses
  set group_selection_opens_at = opens_timestamp,
      group_selection_closes_at = closes_timestamp,
      group_selection_timezone = 'America/Lima'
  where id = target_course_id;
end;
$$;

revoke all on function public.synchronize_course_groups(bigint, integer, integer) from public, anon;
grant execute on function public.synchronize_course_groups(bigint, integer, integer) to authenticated;

revoke all on function public.configure_course_group_selection(bigint, date, time, date, time) from public, anon;
grant execute on function public.configure_course_group_selection(bigint, date, time, date, time) to authenticated;

commit;
