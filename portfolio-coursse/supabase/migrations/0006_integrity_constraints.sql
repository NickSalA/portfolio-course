-- A group reference must belong to the same course as the authorization/enrollment.
alter table public.groups
  add constraint groups_course_id_id_key unique (course_id, id);

alter table public.authorized_students
  drop constraint if exists authorized_students_group_id_fkey;

alter table public.authorized_students
  add constraint authorized_students_course_group_fkey
  foreign key (course_id, group_id)
  references public.groups (course_id, id)
  on delete restrict;

alter table public.course_students
  drop constraint if exists course_students_group_id_fkey;

alter table public.course_students
  add constraint course_students_course_group_fkey
  foreign key (course_id, group_id)
  references public.groups (course_id, id)
  on delete restrict;

create or replace function public.is_teacher()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'teacher'
  );
$$;

create or replace function public.is_teacher_of_course(course bigint)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_teacher() and exists (
    select 1 from public.courses
    where id = course and teacher_id = auth.uid()
  );
$$;

-- A student must never create a course by setting teacher_id to their own id.
drop policy if exists "teachers create their courses" on public.courses;
create policy "teachers create their courses"
on public.courses for insert to authenticated
with check (public.is_teacher() and teacher_id = auth.uid());
