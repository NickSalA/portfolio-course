-- Supports the aggregate reads used by the teacher's group overview.
create index if not exists authorized_students_course_status_idx
  on public.authorized_students (course_id, status);

create index if not exists course_students_group_status_idx
  on public.course_students (group_id, status);

create index if not exists groups_course_id_idx
  on public.groups (course_id);
