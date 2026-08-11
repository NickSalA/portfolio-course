-- Store emails in one canonical form so authorization comparisons are deterministic.
alter table public.profiles
  add constraint profiles_email_normalized_check
  check (email = lower(trim(email)));

alter table public.authorized_students
  drop constraint if exists authorized_students_course_id_email_key;

alter table public.authorized_students
  add constraint authorized_students_email_normalized_check
  check (email = lower(trim(email)));

create unique index authorized_students_course_email_unique_idx
  on public.authorized_students (course_id, lower(trim(email)));
