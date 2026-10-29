-- Run with psql against the local Supabase database. All fixtures are rolled back.
\set ON_ERROR_STOP on
begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', 'a1000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'rls-teacher-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a2000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'rls-teacher-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', 'a3000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'rls-student@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

update public.profiles set role = 'teacher'
where id in ('a1000000-0000-4000-8000-000000000001', 'a2000000-0000-4000-8000-000000000002');

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

insert into public.course_students (course_id, student_id, group_id, status)
values (:course_a_id, 'a3000000-0000-4000-8000-000000000003', :group_a_id, 'active');

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
declare affected integer;
begin
  if (select count(*) from public.group_grades) <> 1 then
    raise exception 'FAIL: teacher A cannot read exactly their own course grade';
  end if;

  update public.group_grades set grade = 16
  where group_id = current_setting('test.group_a_id')::bigint
    and evaluation_id = current_setting('test.evaluation_a_id')::bigint;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'FAIL: teacher A cannot update their own course grade';
  end if;

  begin
    insert into public.group_grades (group_id, evaluation_id, grade)
    values (
          current_setting('test.group_a_id')::bigint,
          current_setting('test.evaluation_b_id')::bigint,
          18
        );
    raise exception 'FAIL: cross-course group/evaluation grade insert unexpectedly succeeded';
  exception when insufficient_privilege then
    null;
  end;
end;
$$;
\echo 'PASS: teacher A can read/update own course and cannot insert cross-course grade'

select set_config('request.jwt.claim.sub', 'a2000000-0000-4000-8000-000000000002', true);
do $$
declare affected integer;
begin
  if (select count(*) from public.group_grades) <> 1 then
    raise exception 'FAIL: teacher B can read grades outside their own course';
  end if;

  update public.group_grades set grade = 19
  where group_id = current_setting('test.group_a_id')::bigint
    and evaluation_id = current_setting('test.evaluation_a_id')::bigint;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'FAIL: teacher B unexpectedly updated teacher A grade';
  end if;

  update public.group_grades set grade = 17
  where group_id = current_setting('test.group_b_id')::bigint
    and evaluation_id = current_setting('test.evaluation_b_id')::bigint;
  get diagnostics affected = row_count;
  if affected <> 1 then
    raise exception 'FAIL: teacher B cannot update their own course grade';
  end if;
end;
$$;
\echo 'PASS: teacher B can read/update own course but cannot read/update teacher A grade'

rollback;
\echo 'PASS: all synthetic fixtures rolled back'
