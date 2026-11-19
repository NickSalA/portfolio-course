-- BASE-05 (#14): synthetic direct-RPC checks, rolled back; not UI acceptance.
\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql
select set_config('qa.period_id', :'period_id', true) \g /dev/null
insert into public.courses (teacher_id, period_id, name, active)
values (:teacher_a, :period_id, 'QA archived', false);
update public.authorized_students set status = 'inactive'
where id = :auth_s1_id;
create temporary table qa_authorizations_before on commit drop as select * from public.authorized_students;
create temporary table qa_courses_before on commit drop as select * from public.courses;
create temporary table qa_enrollments_before on commit drop as select * from public.course_students;

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true) \g /dev/null

do $$
declare
  payload jsonb := '[
    {"course_name":" QA course A ","email":" New@Example.Test ","full_name":" New Student ","student_number":" 123 "},
    {"course_name":"QA course A","email":"new@example.test"},
    {"course_name":"QA course A","email":"QA-STUDENT-1@example.test","full_name":"changed"},
    {"course_name":"QA course A","email":"bad-email"},
    {"course_name":"QA course B","email":"foreign@example.test"},
    {"course_name":"QA archived","email":"archived@example.test"},
    {"course_name":"missing","email":"missing@example.test"},
    null,
    {"course_name":"QA course A","email":42},
    {"course_name":"","email":"a@example.test"},
    {"course_name":"QA course A","email":""},
    {"course_name":"invalid-only","email":"not-an-email"},
    {"course_name":" missing ","email":"MISSING@example.test"}
  ]'::jsonb;
  actual jsonb;
  expected jsonb := '[
    {"index":0,"status":"imported","reason":null},
    {"index":1,"status":"duplicate","reason":"duplicate_in_payload"},
    {"index":2,"status":"existing","reason":"already_authorized"},
    {"index":3,"status":"invalid","reason":"invalid_email"},
    {"index":4,"status":"imported","reason":null},
    {"index":5,"status":"invalid","reason":"course_not_available"},
    {"index":6,"status":"imported","reason":null},
    {"index":7,"status":"invalid","reason":"row_must_be_object"},
    {"index":8,"status":"invalid","reason":"invalid_field_type"},
    {"index":9,"status":"invalid","reason":"course_required"},
    {"index":10,"status":"invalid","reason":"email_required"},
    {"index":11,"status":"invalid","reason":"invalid_email"},
    {"index":12,"status":"duplicate","reason":"duplicate_in_payload"}
  ]'::jsonb;
begin
  actual := public.import_period_students_v2(target_period_id => current_setting('qa.period_id')::bigint, students => payload);
  if actual <> expected then raise exception 'FAIL BASE-05: unexpected result %', actual; end if;
  actual := public.import_period_students_v2(current_setting('qa.period_id')::bigint, payload);
  expected := jsonb_set(jsonb_set(expected, '{0,status}', '"existing"'), '{0,reason}', '"already_authorized"');
  expected := jsonb_set(jsonb_set(expected, '{4,status}', '"existing"'), '{4,reason}', '"already_authorized"');
  expected := jsonb_set(jsonb_set(expected, '{6,status}', '"existing"'), '{6,reason}', '"already_authorized"');
  if actual <> expected then raise exception 'FAIL BASE-05: repeat result %', actual; end if;
  if public.import_period_students_v2(current_setting('qa.period_id')::bigint, '[]') <> '[]'::jsonb then
    raise exception 'FAIL BASE-05: empty payload';
  end if;
  begin
    perform public.import_period_students_v2(current_setting('qa.period_id')::bigint, null);
    raise exception 'FAIL BASE-05: null payload accepted';
  exception when raise_exception then if sqlerrm <> 'invalid_students_payload' then raise; end if; end;
  begin
    perform public.import_period_students_v2(-1, '[]');
    raise exception 'FAIL BASE-05: missing period accepted';
  exception when raise_exception then if sqlerrm <> 'period_not_available' then raise; end if; end;
  if to_regprocedure('public.import_authorized_students(bigint,jsonb)') is null then
    raise exception 'FAIL BASE-05: legacy RPC missing';
  end if;
end $$;

select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true) \g /dev/null
do $$
begin
  begin
    perform public.import_period_students_v2(current_setting('qa.period_id')::bigint, '[]');
    raise exception 'FAIL BASE-05: student accepted';
  exception when raise_exception then if sqlerrm <> 'not_teacher' then raise; end if; end;
  perform set_config('request.jwt.claim.sub', '', true);
  begin
    perform public.import_period_students_v2(current_setting('qa.period_id')::bigint, '[]');
    raise exception 'FAIL BASE-05: anonymous identity accepted';
  exception when raise_exception then if sqlerrm <> 'not_teacher' then raise; end if; end;
end $$;
reset role;
do $$
begin
  if exists ((select * from qa_authorizations_before except all select * from public.authorized_students)) then
    raise exception 'FAIL BASE-05: existing authorization changed';
  end if;
  if (select count(*) from public.authorized_students) <> (select count(*) + 3 from qa_authorizations_before)
     or not exists (select 1 from public.authorized_students where course_id = current_setting('qa.course_a_id')::bigint and email = 'new@example.test' and full_name = 'New Student' and student_number = '123') then
    raise exception 'FAIL BASE-05: incorrect inserted authorization';
  end if;
  if exists (select * from qa_courses_before except all select * from public.courses)
     or (select count(*) from public.courses) <> (select count(*) + 2 from qa_courses_before)
     or (select count(*) from public.courses where teacher_id = current_setting('qa.teacher_a')::uuid and period_id = current_setting('qa.period_id')::bigint and name in ('missing', 'QA course B') and active) <> 2
     or exists (select 1 from public.courses where name = 'invalid-only')
     or not exists (select 1 from public.authorized_students a join public.courses c on c.id = a.course_id where c.teacher_id = current_setting('qa.teacher_a')::uuid and c.period_id = current_setting('qa.period_id')::bigint and c.name = 'QA course B' and a.email = 'foreign@example.test')
     or not exists (select 1 from public.authorized_students a join public.courses c on c.id = a.course_id where c.teacher_id = current_setting('qa.teacher_a')::uuid and c.period_id = current_setting('qa.period_id')::bigint and c.name = 'missing' and a.email = 'missing@example.test') then
    raise exception 'FAIL BASE-05: incorrect course creation or authorization';
  end if;
  if exists ((select * from qa_enrollments_before except all select * from public.course_students) union all (select * from public.course_students except all select * from qa_enrollments_before)) then
    raise exception 'FAIL BASE-05: enrollments changed';
  end if;
end $$;
-- Published APIs remain callable and retain their result shapes and upsert behavior.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true) \g /dev/null
do $$
declare n integer; counts record; result jsonb; payload jsonb;
begin
  select public.import_authorized_students(current_setting('qa.course_a_id')::bigint,
    '[{"email":" QA-STUDENT-1@example.test ","full_name":"Legacy update"}]') into n;
  if n <> 1 then raise exception 'FAIL BASE-05: legacy course count %', n; end if;
  if not exists (select 1 from public.authorized_students where course_id = current_setting('qa.course_a_id')::bigint
    and email = 'qa-student-1@example.test' and full_name = 'Legacy update' and status = 'active') then
    raise exception 'FAIL BASE-05: legacy normalized conflict upsert';
  end if;
  select * into counts from public.import_period_students(current_setting('qa.period_id')::bigint,
    '[{"course_name":"QA course A","email":"legacy-period@example.test"}]');
  if counts.imported_students <> 1 or counts.created_courses <> 0 then
    raise exception 'FAIL BASE-05: legacy period result %', counts;
  end if;
  begin
    perform public.import_authorized_students(current_setting('qa.course_b_id')::bigint, '[]');
    raise exception 'FAIL BASE-05: legacy foreign course accepted';
  exception when raise_exception then if sqlerrm <> 'not_course_teacher' then raise; end if; end;
  select jsonb_agg(jsonb_build_object('course_name', 'QA course A', 'email',
    'large-' || (i % 1000) || '@example.test') order by i) into payload from generate_series(1, 5000) i;
  result := public.import_period_students_v2(current_setting('qa.period_id')::bigint, payload);
  if jsonb_array_length(result) <> 5000
    or (select count(*) from jsonb_array_elements(result) x where x->>'status' = 'imported') <> 1000
    or (select count(*) from jsonb_array_elements(result) x where x->>'status' = 'duplicate') <> 4000
    or result->0->>'index' <> '0' or result->4999->>'index' <> '4999' then
    raise exception 'FAIL BASE-05: large ordered batch';
  end if;
end $$;
reset role;
do $$
begin
  if has_function_privilege('anon', 'public.import_period_students_v2(bigint,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.import_period_students(bigint,jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.import_authorized_students(bigint,jsonb)', 'EXECUTE') then
    raise exception 'FAIL BASE-05: anonymous RPC grant';
  end if;
end $$;
\echo 'PASS BASE-05: v2, legacy contracts, isolation and large batch'
rollback;
