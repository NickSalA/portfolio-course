-- Run with psql against the local Supabase database. All fixtures are rolled back.
\set ON_ERROR_STOP on
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-teacher-a@example.test', '', now(), '{"provider":"google","providers":["google"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a2000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'rls-teacher-b@example.test', '', now(), '{"provider":"google","providers":["google"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a3000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'rls-student@example.test', '', now(), '{"provider":"google","providers":["google"]}', '{}', now(), now());

-- Model the provider-verified identities for these synthetic OAuth actors.
insert into auth.identities (provider_id, user_id, identity_data, provider)
select u.id::text, u.id, jsonb_build_object('email', u.email, 'email_verified', true), 'google'
from auth.users u where u.id in (
  'a1000000-0000-4000-8000-000000000001',
  'a2000000-0000-4000-8000-000000000002',
  'a3000000-0000-4000-8000-000000000003'
);

update public.profiles set role = 'teacher'
where id in ('a1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000002');

-- The transaction restores the original period on rollback.
update public.academic_periods set status = 'closed' where status = 'current';
insert into public.academic_periods (academic_year, semester, status)
values (2099, 2, 'current') returning id as period_id \gset

insert into public.courses (teacher_id, period_id, name)
values ('a1000000-0000-4000-8000-000000000001', :period_id, 'RLS test course A')
returning id as course_a_id \gset
insert into public.courses (teacher_id, period_id, name)
values ('a2000000-0000-4000-8000-000000000002', :period_id, 'RLS test course B')
returning id as course_b_id \gset

insert into public.groups (course_id, name, position, capacity)
values (:course_a_id, 'RLS test group A', 1, 10) returning id as group_a_id \gset
insert into public.groups (course_id, name, position, capacity)
values (:course_b_id, 'RLS test group B', 1, 10) returning id as group_b_id \gset

insert into public.authorized_students (course_id, email)
values (:course_a_id, 'rls-student@example.test') returning id as student_auth_id \gset
insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
values (:course_a_id, 'a3000000-0000-4000-8000-000000000003', :student_auth_id, :group_a_id, 'active');

insert into public.course_evaluations (course_id, name, position)
values (:course_a_id, 'RLS test evaluation A', 1) returning id as evaluation_a_id \gset
insert into public.course_evaluations (course_id, name, position)
values (:course_b_id, 'RLS test evaluation B', 1) returning id as evaluation_b_id \gset
select set_config('test.group_a_id', :'group_a_id', true);
select set_config('test.group_b_id', :'group_b_id', true);
select set_config('test.evaluation_a_id', :'evaluation_a_id', true);
select set_config('test.evaluation_b_id', :'evaluation_b_id', true);

insert into public.group_grades (group_id, evaluation_id, grade)
values (:group_a_id, :evaluation_a_id, 12), (:group_b_id, :evaluation_b_id, 14);

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select set_config('request.jwt.claim.sub', 'a3000000-0000-4000-8000-000000000003', true);
do $$
begin
  if (select count(*) from public.group_grades) <> 0 then
    raise exception 'FAIL: student can read group grades';
  end if;
end;
$$;
\echo 'PASS: student cannot read group grades'

select set_config('request.jwt.claim.sub', 'a1000000-0000-4000-8000-000000000001', true);
do $$
begin
  if (select count(*) from public.group_grades) <> 1 then
    raise exception 'FAIL: teacher A cannot read exactly their own course grade';
  end if;
  if has_table_privilege('public.group_grades', 'INSERT')
    or has_table_privilege('public.group_grades', 'UPDATE')
    or has_table_privilege('public.group_grades', 'DELETE')
    or has_column_privilege('public.group_grades', 'grade', 'UPDATE') then
    raise exception 'FAIL: authenticated still has direct write privileges';
  end if;
end;
$$;
\echo 'PASS: teacher A can read own course and cannot write directly'

select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000002', true);
do $$
begin
  if (select count(*) from public.group_grades) <> 1
    or exists (select 1 from public.group_grades where group_id = current_setting('test.group_a_id')::bigint) then
    raise exception 'FAIL: teacher B can read grades outside their own course';
  end if;
end;
$$;
\echo 'PASS: teacher B can only read their own course grades'

rollback;
\echo 'PASS: all synthetic fixtures rolled back'
