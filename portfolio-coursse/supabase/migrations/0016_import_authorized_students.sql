-- Imports a validated CSV batch as course authorizations in one transaction.
create or replace function public.import_authorized_students(
  target_course_id bigint,
  students jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  imported_count integer;
begin
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'not_course_teacher';
  end if;

  if jsonb_typeof(students) <> 'array' then
    raise exception 'invalid_students_payload';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(students) as row(full_name text, email text, student_number text)
    where nullif(trim(row.email), '') is null
  ) then
    raise exception 'student_email_required';
  end if;

  insert into public.authorized_students (
    course_id,
    email,
    full_name,
    student_number,
    status
  )
  select
    target_course_id,
    lower(trim(row.email)),
    nullif(trim(row.full_name), ''),
    nullif(trim(row.student_number), ''),
    'active'
  from jsonb_to_recordset(students) as row(full_name text, email text, student_number text)
  on conflict (course_id, email) do update
    set full_name = coalesce(excluded.full_name, public.authorized_students.full_name),
        student_number = coalesce(excluded.student_number, public.authorized_students.student_number),
        status = 'active';

  get diagnostics imported_count = row_count;
  return imported_count;
end;
$$;

revoke all on function public.import_authorized_students(bigint, jsonb) from public;
grant execute on function public.import_authorized_students(bigint, jsonb) to authenticated;
