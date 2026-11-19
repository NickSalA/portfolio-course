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
    {"course_name":"QA course A","email":""}
  ]'::jsonb;
  actual jsonb;
  expected jsonb := '[
    {"index":0,"status":"imported","reason":null},
    {"index":1,"status":"duplicate","reason":"duplicate_in_payload"},
    {"index":2,"status":"existing","reason":"already_authorized"},
    {"index":3,"status":"invalid","reason":"invalid_email"},
    {"index":4,"status":"invalid","reason":"course_not_available"},
    {"index":5,"status":"invalid","reason":"course_not_available"},
    {"index":6,"status":"invalid","reason":"course_not_available"},
    {"index":7,"status":"invalid","reason":"row_must_be_object"},
    {"index":8,"status":"invalid","reason":"invalid_field_type"},
    {"index":9,"status":"invalid","reason":"course_required"},
    {"index":10,"status":"invalid","reason":"email_required"}
  ]'::jsonb;
begin
  actual := public.import_period_students(target_period_id => current_setting('qa.period_id')::bigint, students => payload);
  if actual <> expected then raise exception 'FAIL BASE-05: unexpected result %', actual; end if;
  actual := public.import_period_students(current_setting('qa.period_id')::bigint, payload);
  expected := jsonb_set(jsonb_set(expected, '{0,status}', '"existing"'), '{0,reason}', '"already_authorized"');
  if actual <> expected then raise exception 'FAIL BASE-05: repeat result %', actual; end if;
  if public.import_period_students(current_setting('qa.period_id')::bigint, '[]') <> '[]'::jsonb then
    raise exception 'FAIL BASE-05: empty payload';
  end if;
  begin
    perform public.import_period_students(current_setting('qa.period_id')::bigint, null);
    raise exception 'FAIL BASE-05: null payload accepted';
  exception when raise_exception then if sqlerrm <> 'invalid_students_payload' then raise; end if; end;
  begin
    perform public.import_period_students(-1, '[]');
    raise exception 'FAIL BASE-05: missing period accepted';
  exception when raise_exception then if sqlerrm <> 'period_not_available' then raise; end if; end;
  if to_regprocedure('public.import_authorized_students(bigint,jsonb)') is not null then
    raise exception 'FAIL BASE-05: legacy RPC remains';
  end if;
end $$;

select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true) \g /dev/null
do $$
begin
  begin
    perform public.import_period_students(current_setting('qa.period_id')::bigint, '[]');
    raise exception 'FAIL BASE-05: student accepted';
  exception when raise_exception then if sqlerrm <> 'not_teacher' then raise; end if; end;
  perform set_config('request.jwt.claim.sub', '', true);
  begin
    perform public.import_period_students(current_setting('qa.period_id')::bigint, '[]');
    raise exception 'FAIL BASE-05: anonymous identity accepted';
  exception when raise_exception then if sqlerrm <> 'not_teacher' then raise; end if; end;
end $$;
reset role;
do $$
begin
  if exists ((select * from qa_authorizations_before except all select * from public.authorized_students)) then
    raise exception 'FAIL BASE-05: existing authorization changed';
  end if;
  if (select count(*) from public.authorized_students) <> (select count(*) + 1 from qa_authorizations_before)
     or not exists (select 1 from public.authorized_students where course_id = current_setting('qa.course_a_id')::bigint and email = 'new@example.test' and full_name = 'New Student' and student_number = '123') then
    raise exception 'FAIL BASE-05: incorrect inserted authorization';
  end if;
  if exists ((select * from qa_courses_before except all select * from public.courses) union all (select * from public.courses except all select * from qa_courses_before)) then
    raise exception 'FAIL BASE-05: courses changed';
  end if;
  if exists ((select * from qa_enrollments_before except all select * from public.course_students) union all (select * from public.course_students except all select * from qa_enrollments_before)) then
    raise exception 'FAIL BASE-05: enrollments changed';
  end if;
end $$;
\echo 'PASS BASE-05: row outcomes, isolation, idempotency and existing data'
rollback;
