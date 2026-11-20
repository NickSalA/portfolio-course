-- Run with psql after migrations 0037; synthetic fixtures are rolled back.
\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

-- Ensure the other student has an actual movement to protect.
insert into public.point_transactions (authorized_student_id, points, reason, created_by)
values (:auth_s2_id, 4, 'Other student baseline', :teacher_a);
create temporary table qa_eva02_grades_before on commit drop as select * from public.group_grades;
create temporary table qa_eva02_points_before on commit drop as select * from public.point_transactions;

insert into public.academic_periods (academic_year, semester, status)
values (2098, 2, 'closed') returning id as other_period_id \gset
insert into public.courses (teacher_id, period_id, name)
values (:teacher_a, :period_id, 'QA second course') returning id as other_course_id \gset

do $$
begin
  if has_function_privilege('anon', 'public.void_point_transaction(bigint)', 'EXECUTE')
     or has_function_privilege('anon', 'public.void_point_transaction_in_context(bigint,uuid,uuid,text)', 'EXECUTE')
     or has_function_privilege('anon', 'public.register_point_transaction_in_context(bigint,uuid,uuid,uuid,integer,text)', 'EXECUTE')
     or has_function_privilege('authenticated', 'academic_access.void_point_transaction_internal(bigint,uuid,uuid,text)', 'EXECUTE') then
    raise exception 'unexpected RPC execute privilege';
  end if;
end $$;
select set_config('qa.course_public', (select public_id::text from public.courses where id = :course_a_id), true),
       set_config('qa.other_course_public', (select public_id::text from public.courses where id = :other_course_id), true),
       set_config('qa.period_public', (select public_id::text from public.academic_periods where id = :period_id), true),
       set_config('qa.other_period_public', (select public_id::text from public.academic_periods where id = :other_period_id), true) \g /dev/null

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true) \g /dev/null

do $$
declare
  a bigint := current_setting('qa.auth_s1_id')::bigint;
  t bigint := current_setting('qa.point_s1_neg_id')::bigint;
  c uuid := current_setting('qa.course_public')::uuid;
  p uuid := current_setting('qa.period_public')::uuid;
  original public.point_transactions%rowtype;
  changed public.point_transactions%rowtype;
  grades_before jsonb;
  other_before jsonb;
begin
  select jsonb_agg(to_jsonb(g) order by g.id) into grades_before from public.group_grades g;
  select jsonb_agg(to_jsonb(x) order by x.id) into other_before
    from public.point_transactions x where x.id <> t;
  select * into strict original from public.point_transactions where id = t;
  update public.point_transactions set points = 99 where id = t;
  if found then raise exception 'direct update bypassed audit'; end if;
  delete from public.point_transactions where id = t;
  if found then raise exception 'direct delete bypassed audit'; end if;

  if public.register_point_transaction_in_context(a, current_setting('qa.other_course_public')::uuid, p, gen_random_uuid(), 2, null)
     or public.register_point_transaction_in_context(a, c, current_setting('qa.other_period_public')::uuid, gen_random_uuid(), 2, null) then
    raise exception 'wrong context registered points';
  end if;
  begin
    perform public.void_point_transaction_in_context(t, current_setting('qa.other_course_public')::uuid, p, 'wrong course');
    raise exception 'wrong course voided points';
  exception when raise_exception then
    if sqlerrm <> 'invalid_context' then raise; end if;
  end;
  begin
    perform public.void_point_transaction_in_context(t, c, current_setting('qa.other_period_public')::uuid, 'wrong period');
    raise exception 'wrong period voided points';
  exception when raise_exception then
    if sqlerrm <> 'invalid_context' then raise; end if;
  end;
  begin
    perform public.void_point_transaction_in_context(t, null, null, null);
    raise exception 'null context accepted';
  exception when raise_exception then
    if sqlerrm <> 'invalid_context' then raise; end if;
  end;
  begin
    perform academic_access.void_point_transaction_internal(t, null, null, null);
    raise exception 'internal void callable directly';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.point_transactions (authorized_student_id, points, created_by, is_voided, voided_by, voided_at)
    values (a, 2, auth.uid(), true, auth.uid(), now());
    raise exception 'forged audit accepted';
  exception when insufficient_privilege then null;
  end;

  if not public.void_point_transaction_in_context(t, c, p, '  correction  ') then
    raise exception 'owner could not void';
  end if;
  if public.void_point_transaction_in_context(t, c, p, 'again') then
    raise exception 'repeated void changed a movement';
  end if;
  select * into strict changed from public.point_transactions where id = t;
  if not changed.is_voided or changed.voided_by is distinct from auth.uid()
     or changed.voided_at is null or changed.void_reason is distinct from 'correction'
     or (to_jsonb(changed) - array['is_voided','voided_by','voided_at','void_reason'])
        is distinct from (to_jsonb(original) - array['is_voided','voided_by','voided_at','void_reason']) then
    raise exception 'void did not preserve movement and audit';
  end if;
  if (select sum(points) from public.point_transactions where authorized_student_id = a and not is_voided) is distinct from 3 then
    raise exception 'incorrect balance';
  end if;
  if (select jsonb_agg(to_jsonb(g) order by g.id) from public.group_grades g) is distinct from grades_before
     or (select jsonb_agg(to_jsonb(x) order by x.id) from public.point_transactions x where x.id <> t) is distinct from other_before then
    raise exception 'void changed grades or other movements';
  end if;
  if not public.register_point_transaction_in_context(a, c, p, 'a1000000-0000-4000-8000-000000000001', 2, 'replacement') then
    raise exception 'correct context did not register points';
  end if;
  if (select jsonb_agg(to_jsonb(g) order by g.id) from public.group_grades g) is distinct from grades_before then
    raise exception 'registration changed grades';
  end if;
end $$;

-- Check the complete tables as fixture owner, not the actor's RLS-filtered view.
reset role;
do $$
begin
  if exists ((select * from public.group_grades except all select * from qa_eva02_grades_before)
             union all (select * from qa_eva02_grades_before except all select * from public.group_grades)) then
    raise exception 'grades changed';
  end if;
  if exists ((select * from public.point_transactions
              where id <> current_setting('qa.point_s1_neg_id')::bigint
                and public_id <> 'a1000000-0000-4000-8000-000000000001'
              except all select * from qa_eva02_points_before
              where id <> current_setting('qa.point_s1_neg_id')::bigint)
             union all (select * from qa_eva02_points_before
                        where id <> current_setting('qa.point_s1_neg_id')::bigint
                        except all select * from public.point_transactions
                        where id <> current_setting('qa.point_s1_neg_id')::bigint
                          and public_id <> 'a1000000-0000-4000-8000-000000000001')) then
    raise exception 'another movement changed';
  end if;
end $$;
set local role authenticated;
select set_config('qa.replacement_id', (select id::text from public.point_transactions
  where public_id = 'a1000000-0000-4000-8000-000000000001'), true) \g /dev/null
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_b'), true) \g /dev/null
do $$
begin
  begin
    perform public.void_point_transaction_in_context(current_setting('qa.replacement_id')::bigint,
      current_setting('qa.course_public')::uuid, current_setting('qa.period_public')::uuid, null);
    raise exception 'foreign teacher voided points';
  exception when raise_exception then
    if sqlerrm <> 'not_course_teacher' then raise; end if;
  end;
  if public.register_point_transaction_in_context(current_setting('qa.auth_s1_id')::bigint,
    current_setting('qa.course_public')::uuid, current_setting('qa.period_public')::uuid,
    gen_random_uuid(), 2, null) then
    raise exception 'foreign teacher registered points';
  end if;
end $$;

-- A student cannot use either mutation RPC, even for their own movement.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true) \g /dev/null
do $$
begin
  begin
    perform public.void_point_transaction_in_context(current_setting('qa.replacement_id')::bigint,
      current_setting('qa.course_public')::uuid, current_setting('qa.period_public')::uuid, null);
    raise exception 'student voided points';
  exception when raise_exception then
    if sqlerrm <> 'not_course_teacher' then raise; end if;
  end;
  if public.register_point_transaction_in_context(current_setting('qa.auth_s1_id')::bigint,
    current_setting('qa.course_public')::uuid, current_setting('qa.period_public')::uuid,
    gen_random_uuid(), 2, null) then
    raise exception 'student registered points';
  end if;
end $$;

-- Legacy RPC remains callable by the owner and creates audit fields without a reason.
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true) \g /dev/null
do $$
declare movement public.point_transactions%rowtype;
begin
  if not public.void_point_transaction(current_setting('qa.replacement_id')::bigint) then
    raise exception 'legacy void failed';
  end if;
  select * into strict movement from public.point_transactions where id = current_setting('qa.replacement_id')::bigint;
  if not movement.is_voided or movement.voided_by is distinct from auth.uid()
     or movement.voided_at is null or movement.void_reason is not null then
    raise exception 'legacy void audit incorrect';
  end if;
end $$;

select set_config('request.jwt.claim.sub', '', true) \g /dev/null
do $$
begin
  begin
    perform public.void_point_transaction_in_context(current_setting('qa.point_s1_neg_id')::bigint,
      current_setting('qa.course_public')::uuid, current_setting('qa.period_public')::uuid, null);
    raise exception 'no-session void succeeded';
  exception when raise_exception then
    if sqlerrm <> 'not_authenticated' then raise; end if;
  end;
  begin
    perform public.register_point_transaction_in_context(current_setting('qa.auth_s1_id')::bigint,
      current_setting('qa.course_public')::uuid, current_setting('qa.period_public')::uuid,
      gen_random_uuid(), 2, null);
    raise exception 'no-session registration succeeded';
  exception when raise_exception then
    if sqlerrm <> 'not_authenticated' then raise; end if;
  end;
end $$;
rollback;
\echo 'PASS EVA-02 audit and context'
