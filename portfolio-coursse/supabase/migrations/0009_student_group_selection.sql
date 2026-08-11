-- Group selection is optional and controlled by a teacher-defined time window.
alter table public.courses
  add column group_selection_opens_at timestamptz,
  add column group_selection_closes_at timestamptz,
  add constraint courses_group_selection_window_check
    check (
      group_selection_closes_at is null
      or group_selection_opens_at is null
      or group_selection_closes_at > group_selection_opens_at
    );

create or replace function public.select_course_group(
  enrollment_id bigint,
  selected_group_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  enrollment_course_id bigint;
  current_group_id bigint;
  selection_opens_at timestamptz;
  selection_closes_at timestamptz;
  group_course_id bigint;
  group_capacity integer;
  active_members integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select cs.course_id, cs.group_id
  into enrollment_course_id, current_group_id
  from public.course_students cs
  where cs.id = enrollment_id
    and cs.student_id = auth.uid()
    and cs.status = 'active'
  for update;

  if enrollment_course_id is null then
    raise exception 'enrollment_not_found';
  end if;

  select c.group_selection_opens_at, c.group_selection_closes_at
  into selection_opens_at, selection_closes_at
  from public.courses c
  where c.id = enrollment_course_id
    and c.active = true;

  if selection_opens_at is null or selection_closes_at is null
     or now() < selection_opens_at
     or now() >= selection_closes_at then
    raise exception 'group_selection_closed';
  end if;

  select g.course_id, g.capacity
  into group_course_id, group_capacity
  from public.groups g
  where g.id = selected_group_id
    and g.active = true;

  if group_course_id is null or group_course_id <> enrollment_course_id then
    raise exception 'group_not_available';
  end if;

  -- Serialize selections for the same group so the last available seat
  -- cannot be assigned twice by concurrent requests.
  perform pg_advisory_xact_lock(selected_group_id);

  select count(*)::integer
  into active_members
  from public.course_students cs
  where cs.group_id = selected_group_id
    and cs.status = 'active'
    and cs.id <> enrollment_id;

  if active_members >= group_capacity then
    raise exception 'group_full';
  end if;

  update public.course_students
  set group_id = selected_group_id
  where id = enrollment_id and student_id = auth.uid();
end;
$$;

revoke all on function public.select_course_group(bigint, bigint) from public;
grant execute on function public.select_course_group(bigint, bigint) to authenticated;
