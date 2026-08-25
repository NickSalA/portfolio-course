-- The normalized-email unique index is an expression index, so the conflict
-- target must use the same expression.
create or replace function public.import_period_students(
  target_period_id bigint,
  students jsonb
)
returns table (imported_students integer, created_courses integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_teacher_id uuid := auth.uid();
  imported_count integer;
  created_count integer;
begin
  if not public.is_teacher() then raise exception 'not_teacher'; end if;
  if not exists (select 1 from public.academic_periods where id = target_period_id and status in ('upcoming', 'current')) then raise exception 'period_not_available'; end if;
  if jsonb_typeof(students) <> 'array' then raise exception 'invalid_students_payload'; end if;
  if exists (select 1 from jsonb_to_recordset(students) as row(course_name text, email text) where nullif(trim(row.course_name), '') is null or nullif(trim(row.email), '') is null) then raise exception 'course_and_email_required'; end if;

  with distinct_courses as (
    select distinct trim(row.course_name) as name
    from jsonb_to_recordset(students) as row(course_name text, email text)
  ), inserted_courses as (
    insert into public.courses (teacher_id, period_id, name)
    select current_teacher_id, target_period_id, name from distinct_courses
    on conflict (teacher_id, period_id, name) do nothing
    returning id
  ) select count(*)::integer into created_count from inserted_courses;

  insert into public.authorized_students (course_id, email, full_name, student_number, status)
  select course.id, lower(trim(row.email)), nullif(trim(row.full_name), ''), nullif(trim(row.student_number), ''), 'active'
  from jsonb_to_recordset(students) as row(course_name text, full_name text, email text, student_number text)
  join public.courses course on course.teacher_id = current_teacher_id and course.period_id = target_period_id and course.name = trim(row.course_name)
  on conflict (course_id, lower(trim(email))) do update
    set full_name = coalesce(excluded.full_name, public.authorized_students.full_name),
        student_number = coalesce(excluded.student_number, public.authorized_students.student_number),
        status = 'active';

  get diagnostics imported_count = row_count;
  return query select imported_count, created_count;
end;
$$;

revoke all on function public.import_period_students(bigint, jsonb) from public;
grant execute on function public.import_period_students(bigint, jsonb) to authenticated;
