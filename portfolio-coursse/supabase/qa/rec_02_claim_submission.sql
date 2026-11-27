\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

select max(valid_from) - interval '1 microsecond' as before_move,
       max(valid_from) as move_at
from academic_access.group_membership_history
where enrollment_id = :enrollment_s1_id \gset
select set_config('qa.before_move', :'before_move', true),
       set_config('qa.move_at', :'move_at', true),
       set_config('qa.student_1', :student_1, true),
       set_config('qa.student_2', :student_2, true),
       set_config('qa.student_3', :student_3, true),
       set_config('qa.student_4', :student_4, true) \g /dev/null
select set_config('qa.a1_public', public_id::text, true) from public.groups where id = :group_a1_id \g /dev/null
select set_config('qa.t1_public', public_id::text, true) from public.course_evaluations where id = :eval_a_t1_id \g /dev/null

delete from public.group_grades where evaluation_id = :eval_a_t1_id;

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true),
       set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.set_activity_performed_at(:course_a_id, :eval_a_t1_id, :'before_move') \g /dev/null
select * from public.save_group_grade(:course_a_id, :eval_a_t1_id, :group_a1_id, 14, 0) \g /dev/null
reset role;

-- S3 joins A1 AFTER T1: current member, NOT historical participant.
insert into public.authorized_students (course_id, email, full_name)
values (:course_a_id, 'qa-student-3@example.test', 'QA Student 3') returning id as auth_s3_id \gset
insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
values (:course_a_id, :student_3, :auth_s3_id, :group_a1_id, 'active');

-- 1. Historical participant S1 (now in A2) submits group claim + idempotent retry + point claim + idempotent retry.
set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true),
       set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
declare
  a1_pub uuid := current_setting('qa.a1_public')::uuid;
  t1_pub uuid := current_setting('qa.t1_public')::uuid;
  pt_id bigint := current_setting('qa.point_s1_neg_id')::bigint;
  first_group record;
  retry_group record;
  first_point record;
  retry_point record;
begin
  select * into strict first_group
  from public.submit_group_grade_claim(a1_pub, t1_pub, '  Revisar puntaje de la rúbrica  ');
  if not first_group.created or first_group.status <> 'pending' or first_group.claim_type <> 'group_grade' then
    raise exception 'FAIL REC-02: group claim was not created in pending status';
  end if;

  -- Idempotent retry by same submitter with same trimmed reason must converge without duplicating.
  select * into strict retry_group
  from public.submit_group_grade_claim(a1_pub, t1_pub, 'Revisar puntaje de la rúbrica');
  if retry_group.created or retry_group.claim_public_id <> first_group.claim_public_id then
    raise exception 'FAIL REC-02: group claim retry created a duplicate or mismatched id';
  end if;

  -- Different reason by same submitter on same target must be rejected as duplicate.
  begin
    perform * from public.submit_group_grade_claim(a1_pub, t1_pub, 'Otro motivo distinto');
    raise exception 'FAIL REC-02: second distinct group claim accepted';
  exception when unique_violation then null;
  end;

  -- Individual point claim + idempotent retry
  select * into strict first_point
  from public.submit_point_transaction_claim(pt_id, 'El descuento corresponde a otro grupo');
  if not first_point.created or first_point.status <> 'pending' or first_point.claim_type <> 'point_transaction' then
    raise exception 'FAIL REC-02: point claim was not created in pending status';
  end if;

  select * into strict retry_point
  from public.submit_point_transaction_claim(pt_id, '  El descuento corresponde a otro grupo  ');
  if retry_point.created or retry_point.claim_public_id <> first_point.claim_public_id then
    raise exception 'FAIL REC-02: point claim retry created a duplicate';
  end if;

  -- Blank reason must be rejected
  begin
    perform * from public.submit_point_transaction_claim(pt_id, '   ');
    raise exception 'FAIL REC-02: blank claim reason was accepted';
  exception when invalid_parameter_value then null;
  end;

  if (select count(*) from public.list_student_claims(current_setting('qa.course_a_id')::bigint)) <> 2 then
    raise exception 'FAIL REC-02: S1 did not list both own claims';
  end if;
end;
$$;

-- 2. Fellow historical participant S2 can see the group claim, cannot duplicate it, and cannot see or submit S1's point claim.
select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
do $$
declare
  a1_pub uuid := current_setting('qa.a1_public')::uuid;
  t1_pub uuid := current_setting('qa.t1_public')::uuid;
  pt_id bigint := current_setting('qa.point_s1_neg_id')::bigint;
  course_a bigint := current_setting('qa.course_a_id')::bigint;
begin
  if (select count(*) from public.list_student_claims(course_a)) <> 1
     or not exists (
       select 1 from public.list_student_claims(course_a) c
       where c.claim_type = 'group_grade' and not c.is_submitted_by_me and c.submitted_by_name = 'QA Student 1'
     ) then
    raise exception 'FAIL REC-02: fellow participant S2 did not see group claim exclusively';
  end if;

  begin
    perform * from public.submit_group_grade_claim(a1_pub, t1_pub, 'Segundo reclamo de S2');
    raise exception 'FAIL REC-02: fellow participant S2 created duplicate group claim';
  exception when unique_violation then null;
  end;

  begin
    perform * from public.submit_point_transaction_claim(pt_id, 'Reclamo ajeno');
    raise exception 'FAIL REC-02: S2 submitted claim on S1 point transaction';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- 3. Late joiner S3, outsider S4, teachers, and non-OAuth sessions are denied.
do $$
declare
  a1_pub uuid := current_setting('qa.a1_public')::uuid;
  t1_pub uuid := current_setting('qa.t1_public')::uuid;
  pt_id bigint := current_setting('qa.point_s1_neg_id')::bigint;
  actor text;
begin
  foreach actor in array array[
    current_setting('qa.student_3'),
    current_setting('qa.student_4'),
    current_setting('qa.teacher_a'),
    current_setting('qa.teacher_b'),
    ''
  ] loop
    perform set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true);
    perform set_config('request.jwt.claim.sub', actor, true);
    begin
      perform * from public.submit_group_grade_claim(a1_pub, t1_pub, 'No autorizado');
      raise exception 'FAIL REC-02: unauthorized actor % submitted group claim', actor;
    exception when insufficient_privilege then null;
    end;
    begin
      perform * from public.submit_point_transaction_claim(pt_id, 'No autorizado');
      raise exception 'FAIL REC-02: unauthorized actor % submitted point claim', actor;
    exception when insufficient_privilege then null;
    end;
  end loop;
end;
$$;
reset role;

-- 4. Submitting claims never mutates group grades or point balances.
do $$
begin
  if (select grade from public.group_grades where group_id = current_setting('qa.group_a1_id')::bigint and evaluation_id = current_setting('qa.eval_a_t1_id')::bigint) <> 14 then
    raise exception 'FAIL REC-02: group grade changed after claim submission';
  end if;
  if (select sum(points) from public.point_transactions where authorized_student_id = current_setting('qa.auth_s1_id')::bigint and not is_voided) <> 2 then
    raise exception 'FAIL REC-02: point balance changed after claim submission';
  end if;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform * from public.submit_group_grade_claim(current_setting('qa.a1_public')::uuid, current_setting('qa.t1_public')::uuid, 'anon');
    raise exception 'FAIL REC-02: anon executed submit_group_grade_claim';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.submit_point_transaction_claim(current_setting('qa.point_s1_neg_id')::bigint, 'anon');
    raise exception 'FAIL REC-02: anon executed submit_point_transaction_claim';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;
\echo 'PASS REC-02: group and point claim submission, idempotent retry, privacy, and non-mutation'

