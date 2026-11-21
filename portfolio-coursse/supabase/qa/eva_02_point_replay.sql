\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql
select set_config('qa.course_public', (select public_id::text from public.courses where id = :course_a_id), true),
       set_config('qa.period_public', (select public_id::text from public.academic_periods where id = :period_id), true),
       set_config('qa.auth_s2_id', :'auth_s2_id', true) \g /dev/null
set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true) \g /dev/null
do $$
declare
  a bigint := current_setting('qa.auth_s1_id')::bigint;
  b bigint := current_setting('qa.auth_s2_id')::bigint;
  c uuid := current_setting('qa.course_public')::uuid;
  p uuid := current_setting('qa.period_public')::uuid;
  k uuid := 'a2000000-0000-4000-8000-000000000001';
begin
  if not public.register_point_transaction_in_context(a,c,p,k,2,' test ')
     or not public.register_point_transaction_in_context(a,c,p,k,2,'test') then
    raise exception 'identical replay failed';
  end if;
  if public.register_point_transaction_in_context(a,c,p,k,3,'test')
     or public.register_point_transaction_in_context(a,c,p,k,2,'other')
     or public.register_point_transaction_in_context(b,c,p,k,2,'test')
     or public.register_point_transaction_in_context(a,gen_random_uuid(),p,k,2,'test')
     or public.register_point_transaction_in_context(a,c,gen_random_uuid(),k,2,'test') then
    raise exception 'mismatched replay accepted';
  end if;
  if (select count(*) from public.point_transactions where public_id = k) <> 1 then
    raise exception 'replay duplicated movement';
  end if;
end $$;
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_b'), true) \g /dev/null
do $$
begin
  if public.register_point_transaction_in_context(current_setting('qa.auth_s1_id')::bigint,
       current_setting('qa.course_public')::uuid, current_setting('qa.period_public')::uuid,
       'a2000000-0000-4000-8000-000000000001',2,'test') then
    raise exception 'other teacher replay accepted';
  end if;
end $$;
rollback;
