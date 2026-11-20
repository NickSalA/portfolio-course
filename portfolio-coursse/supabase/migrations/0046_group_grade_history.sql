begin;

alter table public.group_grades
  add column revision integer not null default 0,
  add column participants_at timestamptz,
  add constraint group_grades_revision_check check (
    (revision = 0 and participants_at is null)
    or (revision > 0 and participants_at is not null and grade is not null)
  );

create table academic_access.group_grade_participants (
  group_id bigint not null,
  evaluation_id bigint not null,
  enrollment_id bigint not null references public.course_students(id) on delete restrict,
  primary key (evaluation_id, enrollment_id),
  foreign key (group_id, evaluation_id)
    references public.group_grades(group_id, evaluation_id) on delete restrict
);
create index group_grade_participants_grade_idx
  on academic_access.group_grade_participants (group_id, evaluation_id);

create table academic_access.group_grade_corrections (
  grade_id bigint not null references public.group_grades(id) on delete restrict,
  revision integer not null check (revision > 1),
  previous_grade numeric(4,2) not null,
  new_grade numeric(4,2) not null check (new_grade <> previous_grade),
  actor_id uuid not null,
  corrected_at timestamptz not null default pg_catalog.clock_timestamp(),
  reason text not null check (char_length(reason) between 1 and 1000),
  primary key (grade_id, revision)
);

alter table academic_access.group_grade_participants enable row level security;
alter table academic_access.group_grade_corrections enable row level security;
revoke all on academic_access.group_grade_participants, academic_access.group_grade_corrections
  from public, anon, authenticated;
revoke insert, update, delete, truncate on public.group_grades from public, anon, authenticated;

create function public.save_group_grade(
  target_course_id bigint,
  target_evaluation_id bigint,
  target_group_id bigint,
  new_grade numeric,
  expected_revision integer,
  correction_reason text default null
)
returns table (grade numeric, revision integer)
language plpgsql security definer set search_path = ''
as $$
declare
  activity_at timestamptz;
  saved public.group_grades%rowtype;
  participant_ids bigint[];
  has_unknown boolean;
  reason text := nullif(regexp_replace(correction_reason, '^[[:space:]]+|[[:space:]]+$', '', 'g'), '');
begin
  if not public.is_teacher_of_course(target_course_id) or auth.uid() is null then
    raise exception 'group_grade_access_denied' using errcode = '42501';
  end if;
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'group_grade_requires_read_committed' using errcode = '25001';
  end if;

  -- Use the same evaluation lock as the GRP-06 date confirmation.
  select e.performed_at into activity_at from public.course_evaluations e
  where e.id = target_evaluation_id and e.course_id = target_course_id for update;
  if not found or not exists (
    select 1 from public.groups g where g.id = target_group_id and g.course_id = target_course_id for key share
  ) then
    raise exception 'group_grade_resource_not_found' using errcode = 'P0002';
  end if;

  if new_grade is null or not (new_grade between 0 and 20)
    or new_grade <> round(new_grade, 2) or expected_revision is null or expected_revision < 0 then
    raise exception 'group_grade_invalid_value' using errcode = '22023';
  end if;

  select gg.* into saved from public.group_grades gg
  where gg.group_id = target_group_id and gg.evaluation_id = target_evaluation_id;

  if saved.grade is not null and saved.revision = 0 then
    raise exception 'group_grade_legacy_unverified' using errcode = '23514';
  end if;
  if saved.grade = new_grade then
    return query select saved.grade, saved.revision;
    return;
  end if;
  if expected_revision <> coalesce(saved.revision, 0) then
    raise exception 'group_grade_conflict' using errcode = '40001';
  end if;

  if saved.grade is null then
    if activity_at is null then
      raise exception 'activity_time_required' using errcode = '22004';
    end if;
    lock table public.authorized_students, public.course_students, academic_access.group_membership_history in share mode;
    -- The wait above can outlive the original authorization check.
    if not public.is_teacher_of_course(target_course_id) then
      raise exception 'group_grade_access_denied' using errcode = '42501';
    end if;

    select array_agg(p.enrollment_id) filter (where p.membership_state = 'grouped' and p.group_id = target_group_id),
           coalesce(bool_or(p.membership_state = 'unknown'), false)
      into participant_ids, has_unknown
    from public.resolve_activity_participants(target_course_id, target_evaluation_id) p;

    if has_unknown then
      raise exception 'group_grade_participants_unknown' using errcode = '23514';
    end if;
    if participant_ids is null then
      raise exception 'group_grade_participants_empty' using errcode = '23514';
    end if;

    if saved.id is null then
      insert into public.group_grades (group_id, evaluation_id, grade, revision, participants_at)
      values (target_group_id, target_evaluation_id, new_grade, 1, activity_at);
    else
      update public.group_grades gg set grade = new_grade, revision = 1, participants_at = activity_at,
        updated_at = pg_catalog.clock_timestamp() where gg.id = saved.id;
    end if;

    insert into academic_access.group_grade_participants (group_id, evaluation_id, enrollment_id)
    select target_group_id, target_evaluation_id, p from unnest(participant_ids) as p;
    return query select new_grade, 1;
    return;
  end if;

  if reason is null or char_length(reason) > 1000 then
    raise exception 'group_grade_reason_required' using errcode = '22023';
  end if;
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'group_grade_access_denied' using errcode = '42501';
  end if;
  insert into academic_access.group_grade_corrections
    (grade_id, revision, previous_grade, new_grade, actor_id, reason)
  values (saved.id, saved.revision + 1, saved.grade, new_grade, auth.uid(), reason);

  update public.group_grades gg set grade = new_grade, revision = saved.revision + 1,
    updated_at = pg_catalog.clock_timestamp() where gg.id = saved.id;
  return query select new_grade, saved.revision + 1;
end;
$$;

revoke all on function public.save_group_grade(bigint,bigint,bigint,numeric,integer,text) from public, anon;
grant execute on function public.save_group_grade(bigint,bigint,bigint,numeric,integer,text) to authenticated;

create function academic_access.guard_evaluation_grade_history()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if exists (select 1 from public.group_grades g where g.evaluation_id = old.id and g.grade is not null) then
      raise exception 'graded_activity_cannot_be_deleted' using errcode = '23514';
    end if;
    return old;
  end if;

  if old.performed_at is distinct from new.performed_at and exists (
    select 1 from academic_access.group_grade_participants p where p.evaluation_id = old.id
  ) and exists (
    with proposed as materialized (
      select x.enrollment_id, x.new_state, x.new_group_id
      from jsonb_to_recordset(academic_access.activity_date_impact(old.course_id, old.performed_at, new.performed_at))
        as x(enrollment_id bigint, new_state text, new_group_id bigint)
    ), graded_groups as (
      select g.group_id from public.group_grades g where g.evaluation_id = old.id and g.revision > 0
    ), frozen as (
      select p.group_id, p.enrollment_id from academic_access.group_grade_participants p where p.evaluation_id = old.id
    ), proposed_members as (
      select x.new_group_id group_id, x.enrollment_id from proposed x
      join graded_groups g on g.group_id = x.new_group_id where x.new_state = 'grouped'
    )
    select null::bigint, enrollment_id from proposed where new_state = 'unknown'
    union all
    (select * from frozen except select * from proposed_members)
    union all
    (select * from proposed_members except select * from frozen)
  ) then
    raise exception 'activity_date_changes_graded_participants' using errcode = '23514';
  end if;
  return new;
end;
$$;

revoke all on function academic_access.guard_evaluation_grade_history() from public, anon, authenticated;
create trigger guard_evaluation_grade_history
before delete or update of performed_at on public.course_evaluations
for each row execute function academic_access.guard_evaluation_grade_history();

create function public.list_group_grades_with_participants(target_course_id bigint)
returns table (group_id bigint, evaluation_id bigint, grade numeric, revision integer, participants text[])
language sql stable security definer set search_path = ''
as $$
  select gg.group_id, gg.evaluation_id, gg.grade, gg.revision, roster.names
  from public.group_grades gg
  join public.groups g on g.id = gg.group_id
  join public.course_evaluations e on e.id = gg.evaluation_id and e.course_id = g.course_id
  left join lateral (
    select array_agg(coalesce(nullif(trim(a.full_name), ''), a.email, 'Matrícula ' || cs.id)
      order by coalesce(nullif(trim(a.full_name), ''), a.email), cs.id) names
    from academic_access.group_grade_participants p
    join public.course_students cs on cs.id = p.enrollment_id and cs.course_id = g.course_id
    left join public.authorized_students a on a.id = cs.authorized_student_id and a.course_id = cs.course_id
    where p.group_id = gg.group_id and p.evaluation_id = gg.evaluation_id
  ) roster on gg.revision > 0
  where g.course_id = target_course_id and public.is_teacher_of_course(target_course_id);
$$;

revoke all on function public.list_group_grades_with_participants(bigint) from public, anon;
grant execute on function public.list_group_grades_with_participants(bigint) to authenticated;

commit;
