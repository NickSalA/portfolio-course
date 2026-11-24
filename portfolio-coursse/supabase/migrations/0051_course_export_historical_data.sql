begin;

-- EXP-03 (#40): Read-only historical base-grade attribution per authorized
-- student and evaluation for course XLSX export.
-- Strictly restricted to the responsible course teacher (`is_teacher_of_course`).
-- Only confirmed grades (`revision > 0`) backed by frozen
-- `academic_access.group_grade_participants` are returned; unverified legacy
-- rows (`revision = 0`) and current `course_students.group_id` are never used.
create function public.list_course_export_grade_attributions(
  target_course_id bigint
)
returns table (
  authorized_student_id bigint,
  evaluation_id bigint,
  group_id bigint,
  grade numeric,
  revision integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if target_course_id is null or not public.is_teacher_of_course(target_course_id) then
    raise exception 'course_export_access_denied' using errcode = '42501';
  end if;

  return query
  select
    cs.authorized_student_id,
    ggp.evaluation_id,
    ggp.group_id,
    gg.grade,
    gg.revision
  from academic_access.group_grade_participants ggp
  join public.course_students cs
    on cs.id = ggp.enrollment_id
   and cs.course_id = target_course_id
   and cs.authorized_student_id is not null
  join public.authorized_students a
    on a.id = cs.authorized_student_id
   and a.course_id = target_course_id
  join public.course_evaluations ce
    on ce.id = ggp.evaluation_id
   and ce.course_id = target_course_id
   and ce.performed_at is not null
  join public.groups g
    on g.id = ggp.group_id
   and g.course_id = target_course_id
  join public.group_grades gg
    on gg.group_id = ggp.group_id
   and gg.evaluation_id = ggp.evaluation_id
   and gg.revision > 0
   and gg.grade is not null
  order by cs.authorized_student_id, ce.position, ce.id;
end;
$$;

revoke all on function public.list_course_export_grade_attributions(bigint) from public, anon;
grant execute on function public.list_course_export_grade_attributions(bigint) to authenticated;

comment on function public.list_course_export_grade_attributions(bigint) is
  'Read-only teacher export lookup returning confirmed (revision > 0) historical group grades by authorized_student_id and evaluation_id. Never infers grades from course_students.group_id.';

commit;

