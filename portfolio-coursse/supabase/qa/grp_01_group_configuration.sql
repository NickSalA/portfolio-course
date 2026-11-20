\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

select id as period_id from public.academic_periods where status = 'current' \gset

-- Empty active course owned by teacher A + archived course owned by teacher A.
insert into public.courses (teacher_id, period_id, name, active)
values (:teacher_a, :period_id, 'QA Empty Course', true) returning id as empty_course_id \gset
insert into public.courses (teacher_id, period_id, name, active)
values (:teacher_a, :period_id, 'QA Archived Course', false) returning id as archived_course_id \gset

-- Additional student in A1 so A1 has 2 active members (S2 + S5).
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', 'f7000000-0000-4000-8000-000000000007',
  'authenticated', 'authenticated', 'qa-student-5@example.test', '',
  now(), '{"provider":"google","providers":["google"]}', '{}', now(), now()
);
insert into auth.identities (provider_id, user_id, identity_data, provider)
values (
  'f7000000-0000-4000-8000-000000000007', 'f7000000-0000-4000-8000-000000000007',
  '{"email":"qa-student-5@example.test","email_verified":true}', 'google'
);
insert into public.authorized_students (course_id, email, full_name)
values (:course_a_id, 'qa-student-5@example.test', 'QA Student 5') returning id as auth_s5_id \gset
insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
values (:course_a_id, 'f7000000-0000-4000-8000-000000000007', :auth_s5_id, :group_a1_id, 'active');

-- Configure a closed window on course B so we can assert course A reopening never touches course B.
set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select set_config('request.jwt.claim.sub', :teacher_b, true) \g /dev/null
select public.configure_course_group_selection(
  :course_b_id,
  (now() at time zone 'America/Lima')::date - 3, '00:00',
  (now() at time zone 'America/Lima')::date - 1, '00:00'
);
reset role;

select set_config('qa.empty_course_id', :'empty_course_id', true),
       set_config('qa.archived_course_id', :'archived_course_id', true),
       set_config('qa.course_b_opens_before', group_selection_opens_at::text, true),
       set_config('qa.course_b_closes_before', group_selection_closes_at::text, true)
from public.courses where id = :course_b_id \g /dev/null

-- 1. Explicit group count with 0 authorized students + explicit count with existing students.
set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null

do $$
declare
  empty_c bigint := current_setting('qa.empty_course_id')::bigint;
  course_a bigint := current_setting('qa.course_a_id')::bigint;
  req integer;
  gen integer;
  cnt integer;
begin
  select required_groups, generated_groups into req, gen
  from public.synchronize_course_groups(empty_c, 4, 3);
  select count(*)::integer into cnt from public.groups where course_id = empty_c;
  if req <> 3 or gen <> 3 or cnt <> 3 then
    raise exception 'FAIL GRP-01: expected 3 groups for empty course, got req=%, gen=%, cnt=%', req, gen, cnt;
  end if;

  -- Course A has 3 active authorizations (auto at cap=3 would be 1), request explicit 4 groups.
  select required_groups, generated_groups into req, gen
  from public.synchronize_course_groups(course_a, 3, 4);
  select count(*)::integer into cnt from public.groups where course_id = course_a;
  if req <> 4 or cnt <> 4 then
    raise exception 'FAIL GRP-01: expected 4 explicit groups in course A, got req=%, cnt=%', req, cnt;
  end if;
end $$;
reset role;

-- 2. Reduction preserves groups with grades/history and deletes unreferenced surplus.
-- Group 3 gets a grade (must be preserved); Group 4 stays unreferenced (must be deleted).
insert into public.group_grades (group_id, evaluation_id, grade)
select g.id, current_setting('qa.eval_a_t1_id')::bigint, 14
from public.groups g
where g.course_id = current_setting('qa.course_a_id')::bigint and g.position = 3;

select set_config('qa.group_a3_id', id::text, true)
from public.groups where course_id = current_setting('qa.course_a_id')::bigint and position = 3 \g /dev/null
select set_config('qa.group_a4_id', id::text, true)
from public.groups where course_id = current_setting('qa.course_a_id')::bigint and position = 4 \g /dev/null

set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select * from public.synchronize_course_groups(:course_a_id, 3, 1);
reset role;

do $$
begin
  if exists (select 1 from public.groups where id = current_setting('qa.group_a4_id')::bigint) then
    raise exception 'FAIL GRP-01: unreferenced group 4 should have been removed';
  end if;
  if not exists (select 1 from public.groups where id = current_setting('qa.group_a3_id')::bigint) then
    raise exception 'FAIL GRP-01: graded group 3 should have been preserved';
  end if;
end $$;
\echo 'PASS GRP-01: explicit group counts with/without students and safe reduction'

-- 3. Validations, rejections, archived course, and teacher isolation.
set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
declare
  course_a bigint := current_setting('qa.course_a_id')::bigint;
  archived bigint := current_setting('qa.archived_course_id')::bigint;
begin
  begin
    perform public.synchronize_course_groups(course_a, 0, 2);
    raise exception 'FAIL GRP-01: zero capacity accepted';
  exception when others then
    if sqlerrm <> 'invalid_group_capacity' then raise; end if;
  end;

  begin
    perform public.synchronize_course_groups(course_a, 3, 0);
    raise exception 'FAIL GRP-01: zero group count accepted';
  exception when others then
    if sqlerrm <> 'invalid_group_count' then raise; end if;
  end;

  -- Group A1 has 2 active members (S2 + S5), so capacity=1 must fail.
  begin
    perform public.synchronize_course_groups(course_a, 1, 3);
    raise exception 'FAIL GRP-01: capacity below active members accepted';
  exception when others then
    if sqlerrm <> 'capacity_below_existing_members' then raise; end if;
  end;

  begin
    perform public.configure_course_group_selection(course_a, '2026-11-20', '12:00', '2026-11-20', '12:00');
    raise exception 'FAIL GRP-01: non-increasing window accepted';
  exception when others then
    if sqlerrm <> 'invalid_selection_window' then raise; end if;
  end;

  begin
    perform public.synchronize_course_groups(archived, 4, 2);
    raise exception 'FAIL GRP-01: archived course groups accepted';
  exception when others then
    if sqlerrm <> 'course_not_active' then raise; end if;
  end;

  begin
    perform public.configure_course_group_selection(archived, '2026-11-20', '08:00', '2026-11-21', '23:59');
    raise exception 'FAIL GRP-01: archived course window accepted';
  exception when others then
    if sqlerrm <> 'course_not_active' then raise; end if;
  end;
end $$;

-- Teacher B cannot modify course A.
select set_config('request.jwt.claim.sub', :teacher_b, true) \g /dev/null
do $$
declare
  course_a bigint := current_setting('qa.course_a_id')::bigint;
begin
  begin
    perform public.synchronize_course_groups(course_a, 4, 2);
    raise exception 'FAIL GRP-01: foreign teacher synchronized course A';
  exception when others then
    if sqlerrm <> 'not_course_teacher' then raise; end if;
  end;

  begin
    perform public.configure_course_group_selection(course_a, '2026-11-20', '08:00', '2026-11-21', '23:59');
    raise exception 'FAIL GRP-01: foreign teacher configured course A window';
  exception when others then
    if sqlerrm <> 'not_course_teacher' then raise; end if;
  end;
end $$;
\echo 'PASS GRP-01: validation rejections, archived course guard, and teacher isolation'

-- 4. Reopening applies to all students of course A and never touches course B.
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.configure_course_group_selection(
  :course_a_id,
  (now() at time zone 'America/Lima')::date - 3, '00:00',
  (now() at time zone 'America/Lima')::date - 1, '00:00'
);

-- Student S2 fails while window is closed.
select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
do $$
begin
  perform public.select_course_group(current_setting('qa.enrollment_s2_id')::bigint, current_setting('qa.group_a2_id')::bigint);
  raise exception 'FAIL GRP-01: selection succeeded while closed';
exception when others then
  if sqlerrm <> 'group_selection_closed' then raise; end if;
end $$;

-- Teacher A reopens window for the whole course (also supports 23:59).
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.configure_course_group_selection(
  :course_a_id,
  (now() at time zone 'America/Lima')::date - 1, '00:00',
  (now() at time zone 'America/Lima')::date + 1, '23:59'
);

-- Backward compatibility: 2-arg call still works unambiguously.
select * from public.synchronize_course_groups(:course_a_id, 3);

-- Student S2 in course A can now move to A2; Student S4 in course B remains closed.
select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
select public.select_course_group(:enrollment_s2_id, :group_a2_id);

select set_config('request.jwt.claim.sub', :student_4, true) \g /dev/null
do $$
begin
  perform public.select_course_group(
    (select id from public.course_students where student_id = 'f6000000-0000-4000-8000-000000000006'),
    current_setting('qa.group_b1_id')::bigint
  );
  raise exception 'FAIL GRP-01: course B selection opened after course A reopen';
exception when others then
  if sqlerrm <> 'group_selection_closed' then raise; end if;
end $$;
reset role;

do $$
declare
  opens_after text;
  closes_after text;
begin
  select group_selection_opens_at::text, group_selection_closes_at::text
  into opens_after, closes_after
  from public.courses where id = current_setting('qa.course_b_id')::bigint;

  if opens_after is distinct from current_setting('qa.course_b_opens_before')
     or closes_after is distinct from current_setting('qa.course_b_closes_before') then
    raise exception 'FAIL GRP-01: course B window changed after reopening course A';
  end if;
end $$;
\echo 'PASS GRP-01: course-wide reopening, 2-arg compatibility, and cross-course isolation'

rollback;
