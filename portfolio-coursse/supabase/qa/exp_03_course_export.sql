\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

select max(valid_from) as move_at, max(valid_from) - interval '1 microsecond' as before_move
from academic_access.group_membership_history where enrollment_id = :enrollment_s1_id \gset
select set_config('qa.before_move', :'before_move', true), set_config('qa.move_at', :'move_at', true) \g /dev/null
select set_config('qa.auth_s2_id', :'auth_s2_id', true), set_config('qa.student_1', :student_1, true),
       set_config('qa.student_3', :student_3, true), set_config('qa.student_4', :student_4, true) \g /dev/null

-- Replace legacy fixture T1 with teacher-confirmed historical grades,
-- and add a legacy unverified evaluation (revision = 0) to prove it is excluded.
insert into public.course_evaluations (course_id, name, position)
values (:course_a_id, 'Legacy', 4) returning id as legacy_id \gset
select set_config('qa.legacy_id', :'legacy_id', true) \g /dev/null
insert into public.group_grades(group_id, evaluation_id, grade) values (:group_a1_id, :legacy_id, 16);
delete from public.group_grades where evaluation_id = :eval_a_t1_id;

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true),
       set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.set_activity_performed_at(:course_a_id, :eval_a_t1_id, :'before_move') \g /dev/null
select public.set_activity_performed_at(:course_a_id, :eval_a_t2_id, :'move_at') \g /dev/null
select public.set_activity_performed_at(:course_a_id, :legacy_id, :'before_move') \g /dev/null

-- Confirm explicit zero on A1/T1 (S1 and S2 were in A1 before S1 moved to A2)
-- and grade A2/T2 as 12.25 (S1 is in A2 at move_at; A1/T2 stays pending).
select * from public.save_group_grade(:course_a_id, :eval_a_t1_id, :group_a1_id, 0, 0) \g /dev/null
select * from public.save_group_grade(:course_a_id, :eval_a_t2_id, :group_a2_id, 12.25, 0) \g /dev/null
reset role;

-- Student S3 joins A1 AFTER T1: must NOT inherit A1's T1 grade via current group_id.
insert into public.authorized_students(course_id, email, full_name)
values (:course_a_id, 'qa-student-3@example.test', 'QA Student 3') returning id as auth_s3_id \gset
insert into public.course_students(course_id, student_id, authorized_student_id, group_id, status)
values (:course_a_id, :student_3, :auth_s3_id, :group_a1_id, 'active');
select set_config('qa.auth_s3_id', :'auth_s3_id', true) \g /dev/null

-- Snapshot points count and sum before export lookups to verify zero mutations.
select count(*) as pts_before_count, coalesce(sum(points) filter (where not is_voided), 0) as pts_before_sum
from public.point_transactions where authorized_student_id = :auth_s1_id \gset
select set_config('qa.pts_before_count', :'pts_before_count', true),
       set_config('qa.pts_before_sum', :'pts_before_sum', true) \g /dev/null

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true),
       set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
declare
  course_a bigint := current_setting('qa.course_a_id')::bigint;
  t1 bigint := current_setting('qa.eval_a_t1_id')::bigint;
  t2 bigint := current_setting('qa.eval_a_t2_id')::bigint;
  legacy bigint := current_setting('qa.legacy_id')::bigint;
  a1 bigint := current_setting('qa.group_a1_id')::bigint;
  a2 bigint := current_setting('qa.group_a2_id')::bigint;
  s1 bigint := current_setting('qa.auth_s1_id')::bigint;
  s2 bigint := current_setting('qa.auth_s2_id')::bigint;
  s3 bigint := current_setting('qa.auth_s3_id')::bigint;
  first_run jsonb;
  second_run jsonb;
begin
  -- Expect exactly 3 confirmed historical attributions: (S1,T1=0 in A1), (S1,T2=12.25 in A2), (S2,T1=0 in A1).
  if (select count(*) from public.list_course_export_grade_attributions(course_a)) <> 3 then
    raise exception 'FAIL EXP-03: unexpected confirmed historical attribution count';
  end if;

  if not exists (
    select 1 from public.list_course_export_grade_attributions(course_a) r
    where r.authorized_student_id = s1 and r.evaluation_id = t1 and r.group_id = a1 and r.grade = 0 and r.revision = 1
  ) then
    raise exception 'FAIL EXP-03: S1 lost historical A1/T1 explicit zero after moving to A2';
  end if;

  if not exists (
    select 1 from public.list_course_export_grade_attributions(course_a) r
    where r.authorized_student_id = s1 and r.evaluation_id = t2 and r.group_id = a2 and r.grade = 12.25 and r.revision = 1
  ) then
    raise exception 'FAIL EXP-03: S1 missing historical A2/T2 confirmed grade';
  end if;

  if not exists (
    select 1 from public.list_course_export_grade_attributions(course_a) r
    where r.authorized_student_id = s2 and r.evaluation_id = t1 and r.group_id = a1 and r.grade = 0 and r.revision = 1
  ) then
    raise exception 'FAIL EXP-03: S2 missing historical A1/T1 grade';
  end if;

  if exists (
    select 1 from public.list_course_export_grade_attributions(course_a) r
    where r.authorized_student_id = s3 or r.evaluation_id = legacy
  ) then
    raise exception 'FAIL EXP-03: post-activity joiner or legacy unverified grade leaked into export';
  end if;

  -- Repeatability without mutation
  select jsonb_agg(to_jsonb(r)) into first_run from public.list_course_export_grade_attributions(course_a) r;
  select jsonb_agg(to_jsonb(r)) into second_run from public.list_course_export_grade_attributions(course_a) r;
  if first_run is distinct from second_run then
    raise exception 'FAIL EXP-03: repeated export lookups diverged';
  end if;
end;
$$;

-- Correct A1/T1 from 0 to 18.50: both S1 (now in A2) and S2 must receive 18.50 at revision 2.
select * from public.save_group_grade(:course_a_id, :eval_a_t1_id, :group_a1_id, 18.50, 1, 'EXP-03 correction') \g /dev/null
do $$
declare
  course_a bigint := current_setting('qa.course_a_id')::bigint;
  t1 bigint := current_setting('qa.eval_a_t1_id')::bigint;
  s1 bigint := current_setting('qa.auth_s1_id')::bigint;
  s2 bigint := current_setting('qa.auth_s2_id')::bigint;
begin
  if (
    select count(*) from public.list_course_export_grade_attributions(course_a) r
    where r.evaluation_id = t1 and r.authorized_student_id in (s1, s2) and r.grade = 18.50 and r.revision = 2
  ) <> 2 then
    raise exception 'FAIL EXP-03: correction did not propagate to original historical participants';
  end if;
end;
$$;

-- Verify point transactions remain completely untouched.
reset role;
do $$
declare
  s1 bigint := current_setting('qa.auth_s1_id')::bigint;
begin
  if (select count(*) from public.point_transactions where authorized_student_id = s1)
      <> current_setting('qa.pts_before_count')::bigint
    or (select coalesce(sum(points) filter (where not is_voided), 0) from public.point_transactions where authorized_student_id = s1)
      <> current_setting('qa.pts_before_sum')::bigint then
    raise exception 'FAIL EXP-03: export lookup modified point transactions';
  end if;
end;
$$;

-- Unauthorized actors (other teacher, students, absent sub, non-OAuth session, null course) must be denied.
set local role authenticated;
do $$
declare
  course_a bigint := current_setting('qa.course_a_id')::bigint;
  actor text;
begin
  foreach actor in array array[
    current_setting('qa.teacher_b'),
    current_setting('qa.student_1'),
    current_setting('qa.student_3'),
    current_setting('qa.student_4'),
    ''
  ] loop
    perform set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true);
    perform set_config('request.jwt.claim.sub', actor, true);
    begin
      perform * from public.list_course_export_grade_attributions(course_a);
      raise exception 'FAIL EXP-03: unauthorized actor % accessed course export attributions', actor;
    exception when insufficient_privilege then null;
    end;
  end loop;

  perform set_config('request.jwt.claims', '{"amr":[{"method":"password"}]}', true);
  perform set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
  begin
    perform * from public.list_course_export_grade_attributions(course_a);
    raise exception 'FAIL EXP-03: non-OAuth session accessed course export attributions';
  exception when insufficient_privilege then null;
  end;

  perform set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true);
  perform set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
  begin
    perform * from public.list_course_export_grade_attributions(null);
    raise exception 'FAIL EXP-03: null course id was not rejected';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

set local role anon;
do $$
begin
  perform * from public.list_course_export_grade_attributions(current_setting('qa.course_a_id')::bigint);
  raise exception 'FAIL EXP-03: anon role executed export RPC';
exception when insufficient_privilege then null;
end;
$$;
reset role;

rollback;
\echo 'PASS EXP-03: historical export attributions, zero/pending/corrections, repeatability, and access control'

