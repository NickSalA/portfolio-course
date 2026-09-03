-- A login/dashboard sync must not erase a group chosen by the student.
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
  if auth.uid() is null then return false; end if;
  select lower(trim(u.email)) into current_email from auth.users u where u.id = auth.uid();
  if current_email is null then return false; end if;

  insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
  select a.course_id, auth.uid(), a.id, a.group_id, a.status
  from public.authorized_students a
  where lower(trim(a.email)) = current_email
  on conflict (course_id, student_id) do update
    set authorized_student_id = excluded.authorized_student_id,
        group_id = coalesce(excluded.group_id, course_students.group_id),
        status = excluded.status;

  update public.course_students cs
  set status = 'inactive'
  where cs.student_id = auth.uid()
    and not exists (
      select 1 from public.authorized_students a
      where a.id = cs.authorized_student_id
        and lower(trim(a.email)) = current_email
    );

  select exists (
    select 1 from public.course_students cs
    where cs.student_id = auth.uid() and cs.status = 'active'
  ) into enrollment_created;
  return enrollment_created;
end;
$$;
