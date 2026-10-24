-- Synthetic fixtures for local group-evaluation tests.
-- Include after BEGIN; callers own ROLLBACK. Never use against production.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'f1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'fixture-teacher-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f2000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'fixture-teacher-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f3000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'fixture-student-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f4000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'fixture-student-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'f5000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'fixture-unauthorized@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

update public.profiles set role = 'teacher'
where id in ('f1000000-0000-4000-8000-000000000001', 'f2000000-0000-4000-8000-000000000002');

insert into public.academic_periods (academic_year, semester, status)
values (2098, 2, 'current') returning id as fixture_period_id \gset

insert into public.courses (teacher_id, period_id, name)
values ('f1000000-0000-4000-8000-000000000001', :fixture_period_id, 'Fixture course A')
returning id as fixture_course_a_id \gset
insert into public.courses (teacher_id, period_id, name)
values ('f2000000-0000-4000-8000-000000000002', :fixture_period_id, 'Fixture course B')
returning id as fixture_course_b_id \gset

insert into public.authorized_students (course_id, full_name, email, student_number, status)
values
  (:fixture_course_a_id, 'Synthetic Student A', 'fixture-student-a@example.test', 'SYN-001', 'active'),
  (:fixture_course_a_id, 'Synthetic Student B', 'fixture-student-b@example.test', 'SYN-002', 'active');

insert into public.groups (course_id, name, position, capacity)
values (:fixture_course_a_id, 'Fixture group A1', 1, 1) returning id as fixture_group_a1_id \gset
insert into public.groups (course_id, name, position, capacity)
values (:fixture_course_a_id, 'Fixture group A2', 2, 2) returning id as fixture_group_a2_id \gset
insert into public.groups (course_id, name, position, capacity)
values (:fixture_course_b_id, 'Fixture group B1', 1, 2) returning id as fixture_group_b1_id \gset

insert into public.course_students (course_id, student_id, group_id, status)
values
  (:fixture_course_a_id, 'f3000000-0000-4000-8000-000000000003', :fixture_group_a1_id, 'active'),
  (:fixture_course_a_id, 'f4000000-0000-4000-8000-000000000004', null, 'active');

insert into public.point_transactions (authorized_student_id, points, reason, created_by)
select id, 3, 'Synthetic fixture points', 'f1000000-0000-4000-8000-000000000001'
from public.authorized_students
where course_id = :fixture_course_a_id and email = 'fixture-student-a@example.test';
