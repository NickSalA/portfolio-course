-- Group grades are for the teacher of the course, not for student accounts.
drop policy if exists "students read group grades" on public.group_grades;

-- The owner of the group must also own the evaluation's course. RLS policies
-- are ORed, so replace the existing write policies rather than adding new ones.
drop policy if exists "teachers insert group grades" on public.group_grades;
create policy "teachers insert group grades"
on public.group_grades for insert to authenticated
with check (exists (
  select 1 from public.groups g
  join public.course_evaluations e on e.course_id = g.course_id
  where g.id = group_grades.group_id
    and e.id = group_grades.evaluation_id
    and public.is_teacher_of_course(g.course_id)
));

drop policy if exists "teachers update group grades" on public.group_grades;
create policy "teachers update group grades"
on public.group_grades for update to authenticated
using (exists (
  select 1 from public.groups g
  where g.id = group_grades.group_id
    and public.is_teacher_of_course(g.course_id)
))
with check (exists (
  select 1 from public.groups g
  join public.course_evaluations e on e.course_id = g.course_id
  where g.id = group_grades.group_id
    and e.id = group_grades.evaluation_id
    and public.is_teacher_of_course(g.course_id)
));
