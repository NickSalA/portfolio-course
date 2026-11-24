\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

select max(valid_from) - interval '1 microsecond' as before_move
from academic_access.group_membership_history
where enrollment_id = :enrollment_s1_id \gset
select set_config('qa.before_move', :'before_move', true),
       set_config('qa.student_1', :student_1, true),
       set_config('qa.student_2', :student_2, true) \g /dev/null
select set_config('qa.a1_public', public_id::text, true) from public.groups where id = :group_a1_id \g /dev/null
select set_config('qa.t1_public', public_id::text, true) from public.course_evaluations where id = :eval_a_t1_id \g /dev/null

delete from public.group_grades where evaluation_id = :eval_a_t1_id;

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true),
       set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.set_activity_performed_at(:course_a_id, :eval_a_t1_id, :'before_move') \g /dev/null
select * from public.save_group_grade(:course_a_id, :eval_a_t1_id, :group_a1_id, 14, 0) \g /dev/null

-- S1 submits both claim types via REC-02 RPCs.
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
select claim_public_id as group_claim_id
from public.submit_group_grade_claim(
  current_setting('qa.a1_public')::uuid,
  current_setting('qa.t1_public')::uuid,
  'Revisar criterio de evaluación grupal'
) \gset
select claim_public_id as point_claim_id
from public.submit_point_transaction_claim(
  :point_s1_neg_id,
  'Revisar descuento individual'
) \gset
select set_config('qa.group_claim_id', :'group_claim_id', true),
       set_config('qa.point_claim_id', :'point_claim_id', true) \g /dev/null

-- 1. Unauthorized actors (foreign teacher B, students) cannot start review or respond.
do $$
declare
  g_claim uuid := current_setting('qa.group_claim_id')::uuid;
  actor text;
begin
  foreach actor in array array[
    current_setting('qa.teacher_b'),
    current_setting('qa.student_1'),
    current_setting('qa.student_2'),
    ''
  ] loop
    perform set_config('request.jwt.claim.sub', actor, true);
    begin
      perform * from public.start_claim_review(g_claim);
      raise exception 'FAIL REC-03: unauthorized actor % started review', actor;
    exception when insufficient_privilege then null;
    end;
    begin
      perform * from public.respond_to_claim(g_claim, 'Respuesta ajena');
      raise exception 'FAIL REC-03: unauthorized actor % responded to claim', actor;
    exception when insufficient_privilege then null;
    end;
  end loop;
end;
$$;

-- 2. Responsible teacher A enforces strict order: pending -> in_review -> responded.
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
declare
  g_claim uuid := current_setting('qa.group_claim_id')::uuid;
  p_claim uuid := current_setting('qa.point_claim_id')::uuid;
  course_a bigint := current_setting('qa.course_a_id')::bigint;
  rev1 record;
  rev2 record;
  resp record;
begin
  -- Cannot skip directly from pending to responded.
  begin
    perform * from public.respond_to_claim(g_claim, 'Intento de salto directo');
    raise exception 'FAIL REC-03: allowed pending -> responded without in_review';
  exception when check_violation then null;
  end;

  -- Start review (pending -> in_review) and verify idempotent second call.
  select * into strict rev1 from public.start_claim_review(g_claim);
  if rev1.status <> 'in_review' or not rev1.transitioned or rev1.in_review_at is null then
    raise exception 'FAIL REC-03: pending -> in_review transition failed';
  end if;

  select * into strict rev2 from public.start_claim_review(g_claim);
  if rev2.status <> 'in_review' or rev2.transitioned or rev2.in_review_at <> rev1.in_review_at then
    raise exception 'FAIL REC-03: repeated start_claim_review was not idempotent';
  end if;

  -- Blank response is rejected.
  begin
    perform * from public.respond_to_claim(g_claim, '   ');
    raise exception 'FAIL REC-03: accepted blank teacher response';
  exception when invalid_parameter_value then null;
  end;

  -- Valid final response (in_review -> responded).
  select * into strict resp from public.respond_to_claim(g_claim, 'Se revisó la rúbrica; se aplicará corrección en Notas por separado.');
  if resp.status <> 'responded' or resp.responded_at is null then
    raise exception 'FAIL REC-03: in_review -> responded transition failed';
  end if;

  -- Responded is final: cannot re-review or re-respond.
  begin
    perform * from public.start_claim_review(g_claim);
    raise exception 'FAIL REC-03: reopened responded claim via start_claim_review';
  exception when check_violation then null;
  end;
  begin
    perform * from public.respond_to_claim(g_claim, 'Segunda respuesta');
    raise exception 'FAIL REC-03: modified responded claim via respond_to_claim';
  exception when check_violation then null;
  end;

  -- Also complete point claim flow.
  perform * from public.start_claim_review(p_claim);
  perform * from public.respond_to_claim(p_claim, 'Descuento confirmado según registro de asistencia.');

  if (select count(*) from public.list_teacher_claims(course_a) where status = 'responded') <> 2 then
    raise exception 'FAIL REC-03: teacher inbox did not show both responded claims';
  end if;
end;
$$;

-- 3. After responded, student cannot submit a second claim on the same target.
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
begin
  begin
    perform * from public.submit_group_grade_claim(
      current_setting('qa.a1_public')::uuid,
      current_setting('qa.t1_public')::uuid,
      'Nuevo reclamo tras respuesta'
    );
    raise exception 'FAIL REC-03: second claim allowed after responded';
  exception when unique_violation then null;
  end;
end;
$$;
reset role;

-- 4. Responding never mutates grades or point transactions automatically.
do $$
begin
  if (select grade from public.group_grades where group_id = current_setting('qa.group_a1_id')::bigint and evaluation_id = current_setting('qa.eval_a_t1_id')::bigint) <> 14 then
    raise exception 'FAIL REC-03: responding mutated group grade';
  end if;
  if (select sum(points) from public.point_transactions where authorized_student_id = current_setting('qa.auth_s1_id')::bigint and not is_voided) <> 2 then
    raise exception 'FAIL REC-03: responding mutated point balance';
  end if;
end;
$$;

set local role anon;
do $$
begin
  begin
    perform * from public.start_claim_review(current_setting('qa.group_claim_id')::uuid);
    raise exception 'FAIL REC-03: anon executed start_claim_review';
  exception when insufficient_privilege then null;
  end;
  begin
    perform * from public.respond_to_claim(current_setting('qa.group_claim_id')::uuid, 'anon');
    raise exception 'FAIL REC-03: anon executed respond_to_claim';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;
\echo 'PASS REC-03: ordered teacher transitions, final response, non-reopening, and academic separation'

