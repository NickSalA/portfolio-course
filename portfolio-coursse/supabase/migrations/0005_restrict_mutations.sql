-- Replace broad FOR ALL policies with explicit permissions.
-- Academic records are archived or adjusted; they are not destructively deleted.

drop policy if exists "teachers manage their courses" on public.courses;
drop policy if exists "students read their courses" on public.courses;
drop policy if exists "teachers manage their groups" on public.groups;
drop policy if exists "students read their group" on public.groups;
drop policy if exists "teachers manage authorized students" on public.authorized_students;
drop policy if exists "teachers manage enrollments" on public.course_students;
drop policy if exists "students read own enrollment" on public.course_students;
drop policy if exists "teachers manage points" on public.point_transactions;
drop policy if exists "students read own points" on public.point_transactions;

create policy "teachers read their courses"
on public.courses for select to authenticated
using (teacher_id = auth.uid());

create policy "students read their courses"
on public.courses for select to authenticated
using (exists (
  select 1 from public.course_students cs
  where cs.course_id = id
    and cs.student_id = auth.uid()
    and cs.status = 'active'
));

create policy "teachers create their courses"
on public.courses for insert to authenticated
with check (teacher_id = auth.uid());

create policy "teachers update their courses"
on public.courses for update to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

create policy "teachers read their groups"
on public.groups for select to authenticated
using (public.is_teacher_of_course(course_id));

create policy "students read their group"
on public.groups for select to authenticated
using (exists (
  select 1 from public.course_students cs
  where cs.group_id = id
    and cs.student_id = auth.uid()
    and cs.status = 'active'
));

create policy "teachers create their groups"
on public.groups for insert to authenticated
with check (public.is_teacher_of_course(course_id));

create policy "teachers update their groups"
on public.groups for update to authenticated
using (public.is_teacher_of_course(course_id))
with check (public.is_teacher_of_course(course_id));

create policy "teachers read authorized students"
on public.authorized_students for select to authenticated
using (public.is_teacher_of_course(course_id));

create policy "teachers create authorized students"
on public.authorized_students for insert to authenticated
with check (public.is_teacher_of_course(course_id));

create policy "teachers update authorized students"
on public.authorized_students for update to authenticated
using (public.is_teacher_of_course(course_id))
with check (public.is_teacher_of_course(course_id));

create policy "teachers read enrollments"
on public.course_students for select to authenticated
using (public.is_teacher_of_course(course_id));

create policy "students read own enrollment"
on public.course_students for select to authenticated
using (student_id = auth.uid() and status = 'active');

create policy "teachers create enrollments"
on public.course_students for insert to authenticated
with check (public.is_teacher_of_course(course_id));

create policy "teachers update enrollments"
on public.course_students for update to authenticated
using (public.is_teacher_of_course(course_id))
with check (public.is_teacher_of_course(course_id));

create policy "teachers read points"
on public.point_transactions for select to authenticated
using (exists (
  select 1 from public.course_students cs
  where cs.id = course_student_id
    and public.is_teacher_of_course(cs.course_id)
));

create policy "students read own points"
on public.point_transactions for select to authenticated
using (exists (
  select 1 from public.course_students cs
  where cs.id = course_student_id
    and cs.student_id = auth.uid()
    and cs.status = 'active'
));

create policy "teachers create points"
on public.point_transactions for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.course_students cs
    where cs.id = course_student_id
      and public.is_teacher_of_course(cs.course_id)
      and cs.status = 'active'
  )
);
