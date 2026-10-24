-- Shared synthetic dataset (BASE-02). Include with \ir inside a transaction that ends in rollback.
-- No real people or production data: every identity uses example.test.
--
-- Teacher A owns course A (groups A1, A2); teacher B owns course B (group B1).
-- Student S1: authorized in A, did T1 with A1 and later moved to A2.
-- Student S2: authorized in A, stays in A1.
-- Student S3: authenticated but not authorized anywhere.
-- Student S4: authorized in B only.
-- Grades in A: A1/T1 = 15, A1/T2 pending (null), A2/T1 = 0 (explicit zero).
-- Points: S1 has +3 and -1 (the -1 is the one used for void tests).

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
select '00000000-0000-0000-0000-000000000000', u.id::uuid, 'authenticated', 'authenticated', u.email, '',
  now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()
from (values
  ('f1000000-0000-4000-8000-000000000001', 'qa-teacher-a@example.test'),
  ('f2000000-0000-4000-8000-000000000002', 'qa-teacher-b@example.test'),
  ('f3000000-0000-4000-8000-000000000003', 'qa-student-1@example.test'),
  ('f4000000-0000-4000-8000-000000000004', 'qa-student-2@example.test'),
  ('f5000000-0000-4000-8000-000000000005', 'qa-student-3@example.test'),
  ('f6000000-0000-4000-8000-000000000006', 'qa-student-4@example.test')
) as u(id, email);

\set teacher_a '''f1000000-0000-4000-8000-000000000001'''
\set teacher_b '''f2000000-0000-4000-8000-000000000002'''
\set student_1 '''f3000000-0000-4000-8000-000000000003'''
\set student_2 '''f4000000-0000-4000-8000-000000000004'''
\set student_3 '''f5000000-0000-4000-8000-000000000005'''
\set student_4 '''f6000000-0000-4000-8000-000000000006'''

update public.profiles set role = 'teacher' where id in (:teacher_a, :teacher_b);

insert into public.academic_periods (academic_year, semester, status)
values (2099, 1, 'current') returning id as period_id \gset

insert into public.courses (teacher_id, period_id, name)
values (:teacher_a, :period_id, 'QA course A') returning id as course_a_id \gset
insert into public.courses (teacher_id, period_id, name)
values (:teacher_b, :period_id, 'QA course B') returning id as course_b_id \gset

insert into public.groups (course_id, name, position, capacity)
values (:course_a_id, 'QA A1', 1, 2) returning id as group_a1_id \gset
insert into public.groups (course_id, name, position, capacity)
values (:course_a_id, 'QA A2', 2, 2) returning id as group_a2_id \gset
insert into public.groups (course_id, name, position, capacity)
values (:course_b_id, 'QA B1', 1, 2) returning id as group_b1_id \gset

-- Courses seed T1..T3 on insert; reuse them instead of creating evaluations.
select id as eval_a_t1_id from public.course_evaluations where course_id = :course_a_id and name = 'T1' \gset
select id as eval_a_t2_id from public.course_evaluations where course_id = :course_a_id and name = 'T2' \gset
select id as eval_b_t1_id from public.course_evaluations where course_id = :course_b_id and name = 'T1' \gset

insert into public.authorized_students (course_id, email, full_name)
values (:course_a_id, 'qa-student-1@example.test', 'QA Student 1') returning id as auth_s1_id \gset
insert into public.authorized_students (course_id, email, full_name)
values (:course_a_id, 'qa-student-2@example.test', 'QA Student 2') returning id as auth_s2_id \gset
insert into public.authorized_students (course_id, email, full_name)
values (:course_b_id, 'qa-student-4@example.test', 'QA Student 4') returning id as auth_s4_id \gset

insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
values (:course_a_id, :student_1, :auth_s1_id, :group_a1_id, 'active') returning id as enrollment_s1_id \gset
insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
values (:course_a_id, :student_2, :auth_s2_id, :group_a1_id, 'active') returning id as enrollment_s2_id \gset
insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
values (:course_b_id, :student_4, :auth_s4_id, :group_b1_id, 'active') returning id as enrollment_s4_id \gset

insert into public.group_grades (group_id, evaluation_id, grade)
values (:group_a1_id, :eval_a_t1_id, 15), (:group_a1_id, :eval_a_t2_id, null), (:group_a2_id, :eval_a_t1_id, 0);

-- S1 did T1 with A1; afterwards moves to A2 (today the schema keeps only the current group).
update public.course_students set group_id = :group_a2_id where id = :enrollment_s1_id;

insert into public.point_transactions (authorized_student_id, points, reason, created_by)
values (:auth_s1_id, 3, 'QA bonus', :teacher_a);
insert into public.point_transactions (authorized_student_id, points, reason, created_by)
values (:auth_s1_id, -1, 'QA penalty', :teacher_a) returning id as point_s1_neg_id \gset

-- DO blocks cannot read psql variables; expose ids as transaction-local settings.
select set_config('qa.teacher_a', :teacher_a, true), set_config('qa.teacher_b', :teacher_b, true),
  set_config('qa.course_a_id', :'course_a_id', true), set_config('qa.course_b_id', :'course_b_id', true),
  set_config('qa.group_a1_id', :'group_a1_id', true), set_config('qa.group_a2_id', :'group_a2_id', true),
  set_config('qa.group_b1_id', :'group_b1_id', true),
  set_config('qa.eval_a_t1_id', :'eval_a_t1_id', true), set_config('qa.eval_a_t2_id', :'eval_a_t2_id', true),
  set_config('qa.eval_b_t1_id', :'eval_b_t1_id', true),
  set_config('qa.auth_s1_id', :'auth_s1_id', true),
  set_config('qa.enrollment_s1_id', :'enrollment_s1_id', true),
  set_config('qa.enrollment_s2_id', :'enrollment_s2_id', true),
  set_config('qa.point_s1_neg_id', :'point_s1_neg_id', true) \g /dev/null
