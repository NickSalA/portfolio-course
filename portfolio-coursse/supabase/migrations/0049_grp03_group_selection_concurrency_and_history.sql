-- GRP-03: harden group selection concurrency, idempotency, preassignment
-- capacity checks, and prevent direct client bypasses of course_students.group_id.
begin;

drop policy if exists "teachers create enrollments" on public.course_students;
drop policy if exists "teachers update enrollments" on public.course_students;

create function academic_access.guard_course_student_group_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' and new.group_id is not null)
     or (tg_op = 'UPDATE' and new.group_id is distinct from old.group_id) then
    if not pg_catalog.pg_has_role(
      current_user,
      (select relowner from pg_catalog.pg_class where oid = tg_relid),
      'USAGE'
    ) then
      raise exception 'group_change_requires_rpc' using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function academic_access.guard_course_student_group_write() from public, anon, authenticated;

create trigger guard_course_student_group_write
before insert or update of group_id on public.course_students
for each row execute function academic_access.guard_course_student_group_write();

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

  if enrollment_id is null or selected_group_id is null then
    raise exception 'enrollment_not_found';
  end if;

  select cs.course_id
  into enrollment_course_id
  from public.course_students cs
  where cs.id = enrollment_id
    and cs.student_id = auth.uid()
    and academic_access.can_read_enrollment(cs.course_id, null, cs.id);

  if enrollment_course_id is null then
    raise exception 'enrollment_not_found';
  end if;

  -- Lock order matches synchronize_course_groups / configure_course_group_selection:
  -- courses -> group advisory lock -> course_students row.
  select c.group_selection_opens_at, c.group_selection_closes_at
  into selection_opens_at, selection_closes_at
  from public.courses c
  where c.id = enrollment_course_id
    and c.active = true
  for share;

  if selection_opens_at is null or selection_closes_at is null
     or now() < selection_opens_at
     or now() >= selection_closes_at then
    raise exception 'group_selection_closed';
  end if;

  select g.course_id
  into group_course_id
  from public.groups g
  where g.id = selected_group_id
    and g.active = true;

  if group_course_id is null or group_course_id <> enrollment_course_id then
    raise exception 'group_not_available';
  end if;

  -- Acquire the target group lock BEFORE reading capacity so concurrent
  -- synchronize_course_groups capacity changes cannot be missed under READ COMMITTED.
  perform pg_advisory_xact_lock(selected_group_id);

  select g.course_id, g.capacity
  into group_course_id, group_capacity
  from public.groups g
  where g.id = selected_group_id
    and g.active = true;

  if group_course_id is null or group_course_id <> enrollment_course_id then
    raise exception 'group_not_available';
  end if;

  select cs.group_id
  into current_group_id
  from public.course_students cs
  where cs.id = enrollment_id
    and cs.student_id = auth.uid()
    and cs.course_id = enrollment_course_id
    and academic_access.can_read_enrollment(cs.course_id, null, cs.id)
  for update;

  if not found then
    raise exception 'enrollment_not_found';
  end if;

  -- Selecting the already-confirmed group while the window is open is idempotent.
  if current_group_id is not distinct from selected_group_id then
    return;
  end if;

  select count(*)::integer
  into active_members
  from academic_access.valid_group_members(enrollment_course_id, selected_group_id) member
  where member.enrollment_id <> select_course_group.enrollment_id;

  if active_members >= group_capacity then
    raise exception 'group_full';
  end if;

  update public.course_students
  set group_id = selected_group_id
  where id = enrollment_id
    and student_id = auth.uid();
end;
$$;

revoke all on function public.select_course_group(bigint, bigint) from public, anon;
grant execute on function public.select_course_group(bigint, bigint) to authenticated;

create or replace function public.sync_authorized_student()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  student_account_id uuid := auth.uid();
  verified_email text := academic_access.current_email();
  locked_authorization_ids bigint[];
  candidate record;
  assigned_group_id bigint;
  group_capacity integer;
  active_members integer;
begin
  if student_account_id is null or verified_email is null then
    return false;
  end if;

  -- Lock in authorization order before touching enrollments, matching roster revocation.
  locked_authorization_ids := array(
    select a.id from public.authorized_students a
    where lower(trim(a.email)) = verified_email
    order by a.id
    for update
  );

  if academic_access.current_email() is distinct from verified_email then
    return false;
  end if;

  for candidate in
    select a.id as authorization_id,
           a.course_id,
           a.group_id,
           a.student_number,
           existing.id as existing_enrollment_id,
           existing.authorized_student_id as existing_authorization_id
    from public.authorized_students a
    left join public.course_students existing
      on existing.course_id = a.course_id
     and existing.student_id = student_account_id
    where a.id = any(locked_authorization_ids)
      and a.status = 'active'
      and not exists (
        select 1 from public.course_students linked
        where linked.authorized_student_id = a.id
          and (linked.course_id <> a.course_id or linked.student_id <> student_account_id)
      )
    order by a.group_id nulls last, a.id
  loop
    if candidate.existing_enrollment_id is not null then
      -- Never overwrite an existing enrollment's group_id during resynchronization.
      update public.course_students enrollment
      set authorized_student_id = candidate.authorization_id,
          status = 'active',
          student_number = coalesce(candidate.student_number, enrollment.student_number)
      where enrollment.id = candidate.existing_enrollment_id
        and (enrollment.authorized_student_id is null
          or enrollment.authorized_student_id = candidate.authorization_id)
        and (enrollment.authorized_student_id is distinct from candidate.authorization_id
          or enrollment.status is distinct from 'active'
          or (candidate.student_number is not null
            and enrollment.student_number is distinct from candidate.student_number));
    else
      assigned_group_id := null;
      if candidate.group_id is not null then
        perform pg_advisory_xact_lock(candidate.group_id);

        select g.capacity
        into group_capacity
        from public.groups g
        where g.id = candidate.group_id
          and g.course_id = candidate.course_id
          and g.active = true;

        if group_capacity is not null then
          select count(*)::integer
          into active_members
          from academic_access.valid_group_members(candidate.course_id, candidate.group_id);

          if active_members < group_capacity then
            assigned_group_id := candidate.group_id;
          end if;
        end if;
      end if;

      insert into public.course_students as enrollment
        (course_id, student_id, authorized_student_id, group_id, status, student_number)
      values
        (candidate.course_id, student_account_id, candidate.authorization_id, assigned_group_id, 'active', candidate.student_number)
      on conflict (course_id, student_id) do update
        set authorized_student_id = excluded.authorized_student_id,
            status = excluded.status,
            student_number = coalesce(excluded.student_number, enrollment.student_number)
        where (enrollment.authorized_student_id is null
            or enrollment.authorized_student_id = excluded.authorized_student_id)
          and (enrollment.authorized_student_id is distinct from excluded.authorized_student_id
            or enrollment.status is distinct from excluded.status
            or (excluded.student_number is not null
              and enrollment.student_number is distinct from excluded.student_number));
    end if;
  end loop;

  -- Contradictory legacy links remain stored for review. They grant no access.
  update public.course_students enrollment
  set status = 'inactive'
  where enrollment.student_id = student_account_id
    and enrollment.status = 'active'
    and not exists (
      select 1 from public.authorized_students a
      where a.id = enrollment.authorized_student_id
        and a.course_id = enrollment.course_id
        and a.status = 'active'
        and lower(trim(a.email)) = verified_email
    );

  return academic_access.can_read_enrollment(null);
end;
$$;

revoke all on function public.sync_authorized_student() from public, anon;
grant execute on function public.sync_authorized_student() to authenticated;

commit;
