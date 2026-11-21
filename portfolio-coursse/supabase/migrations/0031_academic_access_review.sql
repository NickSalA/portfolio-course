-- Course and canonical email identify a roster authorization. Keeping the key
-- fixed prevents dependent records from changing owners during concurrent writes.
create or replace function academic_access.protect_authorization_link()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.course_id is distinct from old.course_id
     or lower(trim(new.email)) is distinct from lower(trim(old.email)) then
    raise exception 'authorization_identity_is_immutable' using errcode = '23514';
  end if;
  return new;
end;
$$;

-- The caller authorizes access to the course before consulting its occupancy.
create function academic_access.valid_group_members(
  target_course_id bigint, target_group_id bigint default null
)
returns table (enrollment_id bigint, group_id bigint, full_name text)
language sql stable set search_path = ''
as $$
  select cs.id, cs.group_id, a.full_name
  from public.course_students cs
  join public.authorized_students a
    on a.id = cs.authorized_student_id and a.course_id = cs.course_id
  where cs.course_id = target_course_id
    and cs.group_id is not null
    and (target_group_id is null or cs.group_id = target_group_id)
    and cs.status = 'active' and a.status = 'active'
    and lower(trim(a.email)) = academic_access.verified_google_email(cs.student_id);
$$;

revoke all on function academic_access.valid_group_members(bigint, bigint) from public;

create or replace function public.select_course_group(
  enrollment_id bigint,
  selected_group_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  enrollment_course_id bigint;
  selection_opens_at timestamptz;
  selection_closes_at timestamptz;
  group_course_id bigint;
  group_capacity integer;
  active_members integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select cs.course_id
  into enrollment_course_id
  from public.course_students cs
  where cs.id = enrollment_id
    and cs.student_id = auth.uid()
    and academic_access.can_read_enrollment(cs.course_id, null, cs.id)
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
  from academic_access.valid_group_members(enrollment_course_id, selected_group_id) member
  where member.enrollment_id <> select_course_group.enrollment_id;

  if active_members >= group_capacity then
    raise exception 'group_full';
  end if;

  update public.course_students
  set group_id = selected_group_id
  where id = enrollment_id and student_id = auth.uid();
end;
$$;

create or replace function public.available_course_group_details(enrollment_id bigint)
returns table (
  id bigint, group_position integer, capacity integer, active_members integer, members jsonb
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  enrollment_course_id bigint;
  show_names boolean;
begin
  if enrollment_id is null or not academic_access.can_read_enrollment(null, null, enrollment_id) then
    raise exception 'enrollment_not_found';
  end if;

  select c.id, now() >= c.group_selection_opens_at and now() < c.group_selection_closes_at
  into enrollment_course_id, show_names
  from public.course_students cs
  join public.courses c on c.id = cs.course_id
  where cs.id = enrollment_id and c.active;

  return query
  select g.id, g.position, g.capacity, count(member.enrollment_id)::integer,
    coalesce(jsonb_agg(jsonb_build_object('full_name', member.full_name) order by member.full_name)
      filter (where show_names and nullif(trim(member.full_name), '') is not null), '[]'::jsonb)
  from public.groups g
  left join academic_access.valid_group_members(enrollment_course_id) member on member.group_id = g.id
  where g.course_id = enrollment_course_id and g.active
  group by g.id, g.position, g.capacity
  order by g.position;
end;
$$;
