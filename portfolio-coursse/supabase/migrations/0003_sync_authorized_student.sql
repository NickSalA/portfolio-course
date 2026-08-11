-- Idempotently synchronizes CSV authorizations for the current user.
-- This covers first login, late imports, and later deactivation/blocking.
create or replace function public.sync_authorized_student()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_email text;
  enrollment_created boolean := false;
begin
  if auth.uid() is null then
    return false;
  end if;

  select lower(trim(u.email))
  into current_email
  from auth.users u
  where u.id = auth.uid();

  if current_email is null then
    return false;
  end if;

  insert into public.course_students (
    course_id,
    student_id,
    group_id,
    status,
    student_number
  )
  select
    a.course_id,
    auth.uid(),
    a.group_id,
    a.status,
    a.student_number
  from public.authorized_students a
  where lower(trim(a.email)) = current_email
  on conflict (course_id, student_id) do update
    set group_id = excluded.group_id,
        status = excluded.status,
        student_number = excluded.student_number;

  -- A removed authorization must not leave an active academic access behind.
  update public.course_students cs
  set status = 'inactive'
  where cs.student_id = auth.uid()
    and not exists (
      select 1
      from public.authorized_students a
      where a.course_id = cs.course_id
        and lower(trim(a.email)) = current_email
    );

  select exists (
    select 1
    from public.course_students cs
    where cs.student_id = auth.uid()
      and cs.status = 'active'
  )
  into enrollment_created;

  return enrollment_created;
end;
$$;

revoke all on function public.sync_authorized_student() from public;
grant execute on function public.sync_authorized_student() to authenticated;
