\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

-- Record exact transfer timestamp so T1 belongs to S1 in A1 (alongside S2).
select max(valid_from) - interval '1 microsecond' as before_move,
       max(valid_from) as move_at
from academic_access.group_membership_history
where enrollment_id = :enrollment_s1_id \gset
select set_config('qa.before_move', :'before_move', true),
       set_config('qa.move_at', :'move_at', true),
       set_config('qa.student_1', :student_1, true),
       set_config('qa.student_2', :student_2, true),
       set_config('qa.student_3', :student_3, true) \g /dev/null

delete from public.group_grades where evaluation_id = :eval_a_t1_id;

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true),
       set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.set_activity_performed_at(:course_a_id, :eval_a_t1_id, :'before_move') \g /dev/null
select * from public.save_group_grade(:course_a_id, :eval_a_t1_id, :group_a1_id, 14, 0) \g /dev/null
reset role;

-- S3 joins A1 AFTER T1 so S3 is a current A1 member, NOT a historical participant of T1.
insert into public.authorized_students (course_id, email)
values (:course_a_id, 'qa-student-3@example.test') returning id as auth_s3_id \gset
insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
values (:course_a_id, :student_3, :auth_s3_id, :group_a1_id, 'active')
returning id as enrollment_s3_id \gset
select set_config('qa.enrollment_s3_id', :'enrollment_s3_id', true) \g /dev/null

-- 1. Historical participant S1 (now in A2) submits a group claim on (A1, T1).
set local role authenticated;
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
insert into public.claims (
  course_id, claim_type, group_id, evaluation_id,
  submitted_by_enrollment_id, submitted_by_student_id, reason
) values (
  :course_a_id, 'group_grade', :group_a1_id, :eval_a_t1_id,
  :enrollment_s1_id, :student_1, 'Faltó considerar la sección 2 del informe'
);

-- S1 also submits an individual claim on their own point movement.
insert into public.claims (
  course_id, claim_type, point_transaction_id, authorized_student_id,
  submitted_by_enrollment_id, submitted_by_student_id, reason
) values (
  :course_a_id, 'point_transaction', :point_s1_neg_id, :auth_s1_id,
  :enrollment_s1_id, :student_1, 'El descuento no corresponde a esta semana'
);

do $$
begin
  if (select count(*) from public.claims) <> 2 then
    raise exception 'FAIL REC-01: S1 could not read both own claims after transfer';
  end if;
end $$;

-- 2. Second historical participant S2 can read the group claim, cannot duplicate it, and cannot read S1's point claim.
select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
do $$
begin
  if (select count(*) from public.claims where claim_type = 'group_grade') <> 1 then
    raise exception 'FAIL REC-01: fellow historical participant S2 cannot read group claim';
  end if;
  if exists (select 1 from public.claims where claim_type = 'point_transaction') then
    raise exception 'FAIL REC-01: classmate S2 read S1 private point claim';
  end if;
  begin
    insert into public.claims (
      course_id, claim_type, group_id, evaluation_id,
      submitted_by_enrollment_id, submitted_by_student_id, reason
    ) values (
      current_setting('qa.course_a_id')::bigint, 'group_grade',
      current_setting('qa.group_a1_id')::bigint, current_setting('qa.eval_a_t1_id')::bigint,
      current_setting('qa.enrollment_s2_id')::bigint, current_setting('qa.student_2')::uuid,
      'Segundo reclamo sobre el mismo grupo/evaluación'
    );
    raise exception 'FAIL REC-01: duplicate group claim accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.claims (
      course_id, claim_type, point_transaction_id, authorized_student_id,
      submitted_by_enrollment_id, submitted_by_student_id, reason
    ) values (
      current_setting('qa.course_a_id')::bigint, 'point_transaction',
      current_setting('qa.point_s1_neg_id')::bigint, current_setting('qa.auth_s1_id')::bigint,
      current_setting('qa.enrollment_s2_id')::bigint, current_setting('qa.student_2')::uuid,
      'Intento de reclamar movimiento ajeno'
    );
    raise exception 'FAIL REC-01: S2 submitted claim for S1 point transaction';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
end $$;

-- 3. Post-activity member S3 (now in A1) and outsider S4 / Teacher B cannot read or submit course A claims.
select set_config('request.jwt.claim.sub', :student_3, true) \g /dev/null
do $$
begin
  if exists (select 1 from public.claims) then
    raise exception 'FAIL REC-01: late joiner S3 read historical group claim';
  end if;
  begin
    insert into public.claims (
      course_id, claim_type, group_id, evaluation_id,
      submitted_by_enrollment_id, submitted_by_student_id, reason
    ) values (
      current_setting('qa.course_a_id')::bigint, 'group_grade',
      current_setting('qa.group_a1_id')::bigint, current_setting('qa.eval_a_t1_id')::bigint,
      current_setting('qa.enrollment_s3_id')::bigint, current_setting('qa.student_3')::uuid,
      'No participé en T1'
    );
    raise exception 'FAIL REC-01: late joiner S3 submitted historical claim';
  exception when others then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
end $$;

select set_config('request.jwt.claim.sub', :teacher_b, true) \g /dev/null
do $$
begin
  if exists (select 1 from public.claims where course_id = current_setting('qa.course_a_id')::bigint) then
    raise exception 'FAIL REC-01: foreign teacher B read course A claims';
  end if;
end $$;

select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
begin
  if (select count(*) from public.claims where course_id = current_setting('qa.course_a_id')::bigint) <> 2 then
    raise exception 'FAIL REC-01: responsible teacher A did not see both claims';
  end if;
end $$;

-- 4. Direct UPDATE/DELETE by authenticated users is blocked; responded claims remain permanently unique and immutable.
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
begin
  begin
    delete from public.claims;
    raise exception 'FAIL REC-01: student deleted claims';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.claims set status = 'responded';
    raise exception 'FAIL REC-01: student updated claims';
  exception when insufficient_privilege then null;
  end;
end $$;

reset role;
update public.claims
set status = 'responded',
    teacher_response = 'Revisado y confirmado.',
    reviewed_by = :teacher_a,
    responded_at = pg_catalog.clock_timestamp()
where claim_type = 'point_transaction'
  and point_transaction_id = :point_s1_neg_id;

do $$
begin
  begin
    update public.claims set status = 'pending', teacher_response = null, reviewed_by = null, responded_at = null
    where claim_type = 'point_transaction' and point_transaction_id = current_setting('qa.point_s1_neg_id')::bigint;
    raise exception 'FAIL REC-01: responded claim was reopened';
  exception when raise_exception then
    if sqlerrm <> 'claim_response_is_final' then raise; end if;
  end;

  begin
    insert into public.claims (
      course_id, claim_type, point_transaction_id, authorized_student_id,
      submitted_by_enrollment_id, submitted_by_student_id, reason
    ) values (
      current_setting('qa.course_a_id')::bigint, 'point_transaction',
      current_setting('qa.point_s1_neg_id')::bigint, current_setting('qa.auth_s1_id')::bigint,
      current_setting('qa.enrollment_s1_id')::bigint, current_setting('qa.student_1')::uuid,
      'Segundo reclamo tras respuesta'
    );
    raise exception 'FAIL REC-01: duplicate claim accepted after responded';
  exception when unique_violation then null;
  end;
end $$;

set local role anon;
do $$
begin
  begin
    perform 1 from public.claims;
    raise exception 'FAIL REC-01: anon read claims';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

\echo 'PASS REC-01: schema constraints, historical/owner RLS, permanent uniqueness, and immutability'
rollback;
