\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

select set_config('qa.student_1', :student_1, true),
       set_config('qa.student_2', :student_2, true) \g /dev/null

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true),
       set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null

-- 1. Creating a claim automatically creates a single pending notification row.
select claim_public_id as claim_id
from public.submit_point_transaction_claim(:point_s1_neg_id, 'Consulta por puntaje') \gset
select set_config('qa.claim_id', :'claim_id', true) \g /dev/null

do $$
declare
  cid uuid := current_setting('qa.claim_id')::uuid;
  prep1 record;
  prep2 record;
  rec1 record;
begin
  -- Student cannot read claim_notifications directly via RLS.
  if exists (select 1 from public.claim_notifications) then
    raise exception 'FAIL REC-06: student read claim_notifications directly';
  end if;

  -- First automatic dispatch prepares send to teacher_a email.
  select * into strict prep1 from public.prepare_claim_email_dispatch(cid);
  if not prep1.should_send or prep1.teacher_email <> 'qa-teacher-a@example.test' or prep1.attempt_count <> 1 then
    raise exception 'FAIL REC-06: initial dispatch did not resolve teacher_a';
  end if;

  -- Record a simulated SMTP failure: claim persists, notification becomes failed.
  select * into strict rec1 from public.record_claim_email_outcome(cid, false, 'MAIL_SEND_FAILED', null);
  if rec1.status <> 'failed' or rec1.last_error_code <> 'MAIL_SEND_FAILED' then
    raise exception 'FAIL REC-06: failed outcome was not recorded';
  end if;

  -- Student cannot trigger a second retry after attempt_count > 0.
  select * into strict prep2 from public.prepare_claim_email_dispatch(cid);
  if prep2.should_send or prep2.teacher_email is not null then
    raise exception 'FAIL REC-06: student triggered duplicate dispatch attempt';
  end if;

  -- Claim itself remains persisted in pending state despite email failure.
  if not exists (select 1 from public.list_student_claims(current_setting('qa.course_a_id')::bigint) where claim_public_id = cid and status = 'pending') then
    raise exception 'FAIL REC-06: claim did not persist after email failure';
  end if;
end;
$$;

-- 2. Foreign teacher B and other student S2 are denied notification dispatch/read.
select set_config('request.jwt.claim.sub', :teacher_b, true) \g /dev/null
do $$
declare
  cid uuid := current_setting('qa.claim_id')::uuid;
begin
  if exists (select 1 from public.list_teacher_claim_notifications(null)) then
    raise exception 'FAIL REC-06: foreign teacher B saw course A claim notifications';
  end if;
  begin
    perform * from public.prepare_claim_email_dispatch(cid);
    raise exception 'FAIL REC-06: foreign teacher B prepared dispatch for course A';
  exception when insufficient_privilege then null;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
do $$
begin
  begin
    perform * from public.prepare_claim_email_dispatch(current_setting('qa.claim_id')::uuid);
    raise exception 'FAIL REC-06: non-submitter student S2 accessed dispatch RPC';
  exception when insufficient_privilege then null;
  end;
end;
$$;

-- 3. Responsible teacher A sees the failed notice, retries successfully, and cannot send twice after sent.
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
declare
  cid uuid := current_setting('qa.claim_id')::uuid;
  course_a bigint := current_setting('qa.course_a_id')::bigint;
  retry_prep record;
  sent_rec record;
  after_sent record;
begin
  if not exists (
    select 1 from public.list_teacher_claim_notifications(course_a) n
    where n.claim_public_id = cid and n.status = 'failed' and n.last_error_code = 'MAIL_SEND_FAILED'
  ) then
    raise exception 'FAIL REC-06: teacher A did not see failed notification status';
  end if;

  select * into strict retry_prep from public.prepare_claim_email_dispatch(cid);
  if not retry_prep.should_send or retry_prep.attempt_count <> 2 then
    raise exception 'FAIL REC-06: teacher A retry did not prepare dispatch';
  end if;

  select * into strict sent_rec from public.record_claim_email_outcome(cid, true, null, '<msg-1@example.test>');
  if sent_rec.status <> 'sent' or sent_rec.last_error_code is not null or sent_rec.sent_at is null then
    raise exception 'FAIL REC-06: sent outcome was not recorded';
  end if;

  -- Subsequent prepare after sent must return should_send = false (no duplicate notice).
  select * into strict after_sent from public.prepare_claim_email_dispatch(cid);
  if after_sent.should_send or after_sent.attempt_count <> 2 then
    raise exception 'FAIL REC-06: already-sent notification allowed another dispatch';
  end if;
end;
$$;
reset role;

set local role anon;
do $$
begin
  begin
    perform * from public.prepare_claim_email_dispatch(current_setting('qa.claim_id')::uuid);
    raise exception 'FAIL REC-06: anon executed prepare_claim_email_dispatch';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

rollback;
\echo 'PASS REC-06: automatic notification tracking, failure persistence, teacher retry, and duplicate prevention'

