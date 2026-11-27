\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

select max(valid_from) as move_at, max(valid_from) - interval '1 microsecond' as before_move
from academic_access.group_membership_history where enrollment_id = :enrollment_s1_id \gset
select set_config('qa.before_move', :'before_move', true), set_config('qa.move_at', :'move_at', true) \g /dev/null
select set_config('qa.a1_public', public_id::text, true) from public.groups where id = :group_a1_id \g /dev/null
select set_config('qa.a2_public', public_id::text, true) from public.groups where id = :group_a2_id \g /dev/null
select set_config('qa.t1_public', public_id::text, true) from public.course_evaluations where id = :eval_a_t1_id \g /dev/null
select set_config('qa.t2_public', public_id::text, true) from public.course_evaluations where id = :eval_a_t2_id \g /dev/null

insert into public.course_evaluations (course_id, name, position)
values (:course_a_id, 'Legacy', 4) returning id as legacy_id \gset
insert into public.course_evaluations (course_id, name, position)
values (:course_a_id, 'Before history', 5) returning id as unknown_id \gset
insert into public.group_grades(group_id, evaluation_id, grade) values (:group_a1_id, :legacy_id, 16);
-- Replace the legacy fixture for T1 through the normal teacher write path below.
delete from public.group_grades where evaluation_id = :eval_a_t1_id;
insert into public.point_transactions(authorized_student_id, points, reason, created_by)
values (:auth_s2_id, 40, 'Other student', :teacher_a), (:auth_s4_id, 50, 'Other course', :teacher_b);

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true),
       set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.set_activity_performed_at(:course_a_id, :eval_a_t1_id, :'before_move') \g /dev/null
select public.set_activity_performed_at(:course_a_id, :eval_a_t2_id, :'move_at') \g /dev/null
select public.set_activity_performed_at(:course_a_id, :legacy_id, :'before_move') \g /dev/null
select public.set_activity_performed_at(:course_a_id, :unknown_id, '2000-01-01 UTC') \g /dev/null
select * from public.save_group_grade(:course_a_id, :eval_a_t1_id, :group_a1_id, 0, 0) \g /dev/null
select public.void_point_transaction(:point_s1_neg_id) \g /dev/null
select set_config('request.jwt.claim.sub', :teacher_b, true) \g /dev/null
select public.set_activity_performed_at(:course_b_id, :eval_b_t1_id, :'move_at') \g /dev/null
select * from public.save_group_grade(:course_b_id, :eval_b_t1_id, :group_b1_id, 19, 0) \g /dev/null
reset role;

-- A student who joins the original group after the recorded activity.
insert into public.authorized_students(course_id, email)
values (:course_a_id, 'qa-student-3@example.test') returning id as auth_s3_id \gset
insert into public.course_students(course_id, student_id, authorized_student_id, group_id, status)
values (:course_a_id, :student_3, :auth_s3_id, :group_a1_id, 'active');

set local role authenticated;
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
declare
  course bigint := current_setting('qa.course_a_id')::bigint;
  actual record;
begin
  if (select count(*) from public.list_student_group_grades(course)) <> 2 then
    raise exception 'FAIL: expected exactly historical T1 and pending T2, with legacy, unknown and undated omitted';
  end if;
  select * into strict actual from public.list_student_group_grades(course)
    where evaluation_public_id = current_setting('qa.t1_public')::uuid;
  if actual.grade is distinct from 0 or actual.group_public_id is distinct from current_setting('qa.a1_public')::uuid
    or actual.evaluation_name is distinct from 'T1' or actual.group_name is distinct from 'QA A1'
    or actual.performed_at is distinct from current_setting('qa.before_move')::timestamptz then
    raise exception 'FAIL: zero lost or T1 reassigned after transfer';
  end if;
  select * into strict actual from public.list_student_group_grades(course)
    where evaluation_public_id = current_setting('qa.t2_public')::uuid;
  if actual.grade is not null or actual.group_public_id is distinct from current_setting('qa.a2_public')::uuid
    or actual.performed_at is distinct from current_setting('qa.move_at')::timestamptz then
    raise exception 'FAIL: no-row pending or exact transfer boundary lost';
  end if;
  if exists (select 1 from public.list_student_group_grades(current_setting('qa.course_b_id')::bigint))
    or exists (select 1 from public.list_student_group_grades(null))
    or exists (select 1 from public.group_grades where evaluation_id = current_setting('qa.eval_a_t1_id')::bigint) then
    raise exception 'FAIL: foreign course, missing course, or direct table access returned data';
  end if;
  if (select count(*) from public.point_transactions) <> 2
    or exists (select 1 from public.point_transactions where authorized_student_id <> current_setting('qa.auth_s1_id')::bigint)
    or (select sum(points) from public.point_transactions where not is_voided) is distinct from 3::bigint
    or not exists (select 1 from public.point_transactions where id = current_setting('qa.point_s1_neg_id')::bigint and is_voided) then
    raise exception 'FAIL: own points, foreign movement isolation, or active balance changed';
  end if;
  if has_table_privilege('academic_access.group_grade_participants', 'SELECT')
    or has_table_privilege('academic_access.group_membership_history', 'SELECT')
    or has_table_privilege('academic_access.group_grade_corrections', 'SELECT') then
    raise exception 'FAIL: private academic tables are exposed';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
do $$
begin
  if (select count(*) from public.list_student_group_grades(current_setting('qa.course_a_id')::bigint)) <> 2
    or not exists (
      select 1 from public.list_student_group_grades(current_setting('qa.course_a_id')::bigint) g
      where g.evaluation_public_id = current_setting('qa.t2_public')::uuid
        and g.group_public_id = current_setting('qa.a1_public')::uuid and g.grade is null
    ) then
    raise exception 'FAIL: stored pending grade or second historical recipient missing';
  end if;
end;
$$;

select set_config('qa.student_3', :student_3, true), set_config('qa.student_4', :student_4, true) \g /dev/null
do $$
declare actor text;
begin
  foreach actor in array array[current_setting('qa.student_3'), current_setting('qa.student_4'),
    current_setting('qa.teacher_a'), current_setting('qa.teacher_b'), ''] loop
    perform set_config('request.jwt.claim.sub', actor, true);
    if exists (select 1 from public.list_student_group_grades(current_setting('qa.course_a_id')::bigint)) then
      raise exception 'FAIL: new member, outsider, teacher or absent session received student results';
    end if;
  end loop;
end;
$$;

select set_config('request.jwt.claim.sub', :student_4, true) \g /dev/null
do $$
begin
  if (select count(*) from public.list_student_group_grades(current_setting('qa.course_b_id')::bigint) where grade = 19) <> 1 then
    raise exception 'FAIL: foreign course isolation test lacked a visible control result';
  end if;
end;
$$;

select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select * from public.save_group_grade(:course_a_id, :eval_a_t1_id, :group_a1_id, 17.25, 1, 'QA correction') \g /dev/null
do $$
begin
  if not exists (
    select 1 from public.list_group_grades_with_participants(current_setting('qa.course_a_id')::bigint)
    where evaluation_id = current_setting('qa.eval_a_t1_id')::bigint and grade = 17.25
  ) then
    raise exception 'FAIL: responsible teacher lost access';
  end if;
end;
$$;
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
begin
  if not exists (
    select 1 from public.list_student_group_grades(current_setting('qa.course_a_id')::bigint)
    where evaluation_public_id = current_setting('qa.t1_public')::uuid
      and group_public_id = current_setting('qa.a1_public')::uuid and grade = 17.25
  ) then
    raise exception 'FAIL: correction not visible immediately to the historical recipient';
  end if;
end;
$$;

select set_config('request.jwt.claims', '{"amr":[{"method":"password"}]}', true) \g /dev/null
do $$
begin
  if exists (select 1 from public.list_student_group_grades(current_setting('qa.course_a_id')::bigint))
    or exists (select 1 from public.point_transactions) then
    raise exception 'FAIL: same subject without verified OAuth accessed results';
  end if;
end;
$$;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
reset role;
update public.authorized_students set status = 'inactive' where id = :auth_s1_id;
set local role authenticated;
do $$
begin
  if exists (select 1 from public.list_student_group_grades(current_setting('qa.course_a_id')::bigint))
    or exists (select 1 from public.point_transactions) then
    raise exception 'FAIL: revoked authorization still visible with prior session';
  end if;
end;
$$;
reset role;

-- The role check is material even for a teacher with a valid linked enrollment.
insert into public.authorized_students(course_id, email)
values (:course_a_id, 'qa-teacher-a@example.test') returning id as auth_teacher_id \gset
insert into public.course_students(course_id, student_id, authorized_student_id, group_id, status)
values (:course_a_id, :teacher_a, :auth_teacher_id, :group_a1_id, 'active');
select id as undated_id from public.course_evaluations where course_id = :course_a_id and name = 'T3' \gset
set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.set_activity_performed_at(:course_a_id, :undated_id, statement_timestamp()) \g /dev/null
do $$
begin
  if exists (select 1 from public.list_student_group_grades(current_setting('qa.course_a_id')::bigint)) then
    raise exception 'FAIL: teacher with a linked active enrollment used the student RPC';
  end if;
end;
$$;
reset role;

set local role anon;
do $$
begin
  perform public.list_student_group_grades(current_setting('qa.course_a_id')::bigint);
  raise exception 'FAIL: anonymous role could execute the student RPC';
exception when insufficient_privilege then null;
end;
$$;
reset role;

rollback;
\echo 'PASS EVA-04: historical recipients, pending/zero, immediate correction, privacy and point ownership'
