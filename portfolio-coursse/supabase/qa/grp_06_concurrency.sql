\set ON_ERROR_STOP on
\set QUIET on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql
create table public.qa_concurrency (course_id bigint, evaluation_id bigint, teacher_id uuid, review_a uuid, review_b uuid);
insert into public.qa_concurrency (course_id, evaluation_id, teacher_id) values (:course_a_id, :eval_a_t1_id, :teacher_a);
grant usage on schema public, auth to authenticated;
grant execute on all functions in schema public, auth to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select public.set_activity_performed_at(:course_a_id, :eval_a_t1_id, '2020-01-01 UTC');
reset role;
commit;

select extensions.dblink_connect('a', 'dbname=' || current_database() || ' application_name=grp06_qa_a');
select extensions.dblink_connect('b', 'dbname=' || current_database() || ' application_name=grp06_qa_b');
select extensions.dblink_exec('a', 'set role authenticated');
select extensions.dblink_exec('b', 'set role authenticated');
select extensions.dblink_exec('a', 'set statement_timeout = ''30s''');
select extensions.dblink_exec('b', 'set statement_timeout = ''30s''');
select extensions.dblink_exec('a', format('set request.jwt.claim.sub = %L', teacher_id::text)) from public.qa_concurrency;
select extensions.dblink_exec('b', format('set request.jwt.claim.sub = %L', teacher_id::text)) from public.qa_concurrency;
select extensions.dblink_exec('a', $$set request.jwt.claims = '{"amr":[{"method":"oauth"}]}'$$);
select extensions.dblink_exec('b', $$set request.jwt.claims = '{"amr":[{"method":"oauth"}]}'$$);
update public.qa_concurrency set review_a = r.id from lateral extensions.dblink('a',
  (select format('select review_id from public.review_activity_date_correction(%s,%s,%L,%L)', course_id, evaluation_id, '2020-01-02 UTC', 'concurrent A') from public.qa_concurrency)) as r(id uuid);
update public.qa_concurrency set review_b = r.id from lateral extensions.dblink('b',
  (select format('select review_id from public.review_activity_date_correction(%s,%s,%L,%L)', course_id, evaluation_id, '2020-01-03 UTC', 'concurrent B') from public.qa_concurrency)) as r(id uuid);
select extensions.dblink_exec('a', 'begin');
select * from extensions.dblink('a', (select format('select public.confirm_activity_date_correction(%s,%s,%L)', course_id, evaluation_id, review_a) from public.qa_concurrency)) as t(confirmed timestamptz);
select extensions.dblink_send_query('b', (select format('select public.confirm_activity_date_correction(%s,%s,%L)', course_id, evaluation_id, review_b) from public.qa_concurrency));
-- Observe the actual wait graph, bounded by a deadline; no timing assumption is used as proof.
do $$
declare deadline timestamptz := clock_timestamp() + interval '10 seconds'; a_pid int; b_pid int;
begin
  loop
    select pid into a_pid from pg_stat_activity where application_name = 'grp06_qa_a' and datname = current_database();
    select pid into b_pid from pg_stat_activity where application_name = 'grp06_qa_b' and datname = current_database();
    exit when a_pid = any(pg_blocking_pids(b_pid));
    if clock_timestamp() > deadline then raise exception 'FAIL: session B did not block on session A'; end if;
    perform pg_sleep(0.02);
  end loop;
end $$;
select extensions.dblink_exec('a', 'commit');
do $$
begin
  begin
    perform * from extensions.dblink_get_result('b') as t(confirmed timestamptz);
    raise exception 'FAIL: stale concurrent review confirmed';
  exception when serialization_failure then
    if sqlerrm not like '%activity_review_stale%' then raise; end if;
  end;
end $$;
do $$
begin
  if (select performed_at from public.course_evaluations e join public.qa_concurrency q on e.id = q.evaluation_id) <> '2020-01-02 UTC'::timestamptz
    or (select count(*) from academic_access.activity_date_corrections c join public.qa_concurrency q on c.review_id in (q.review_a, q.review_b)) <> 1
    or not exists (select 1 from academic_access.activity_date_corrections c join public.qa_concurrency q on c.review_id = q.review_a) then
    raise exception 'FAIL: wrong final date or audit rows';
  end if;
end $$;
\echo 'PASS GRP-06: two sessions, observed blocking, stale 40001, one correction'

-- The writer uses the database owner because this isolated schema-only restore does
-- not reproduce original grants. The RPC still runs as the authenticated teacher.
select extensions.dblink_disconnect('b');
select extensions.dblink_connect('b', 'dbname=' || current_database() || ' application_name=grp06_qa_b');
select extensions.dblink_exec('b', 'set statement_timeout = ''30s''');

-- A reviews; B commits a roster addition; A must reject the unchanged-date review.
update public.qa_concurrency set review_a = r.id from lateral extensions.dblink('a',
  (select format('select review_id from public.review_activity_date_correction(%s,%s,%L,%L)', course_id, evaluation_id, '2020-01-04 UTC', 'stale roster') from public.qa_concurrency)) as r(id uuid);
select extensions.dblink_exec('b', (select format('insert into public.authorized_students (course_id, email) values (%s, %L)', course_id, 'qa-concurrent-stale@example.test') from public.qa_concurrency));
do $$
declare q public.qa_concurrency%rowtype;
begin
  select * into strict q from public.qa_concurrency;
  begin
    perform * from extensions.dblink('a', format('select public.confirm_activity_date_correction(%s,%s,%L)', q.course_id, q.evaluation_id, q.review_a)) as t(confirmed timestamptz);
    raise exception 'FAIL: review accepted after concurrent roster change';
  exception when serialization_failure then
    if sqlerrm not like '%activity_review_stale%' then raise; end if;
  end;
  if (select performed_at from public.course_evaluations where id = q.evaluation_id) <> '2020-01-02 UTC'::timestamptz
    or exists (select 1 from academic_access.activity_date_corrections where review_id = q.review_a)
    or not exists (select 1 from public.authorized_students where course_id = q.course_id and email = 'qa-concurrent-stale@example.test') then
    raise exception 'FAIL: stale roster confirmation changed date, audit or roster';
  end if;
end $$;
\echo 'PASS GRP-06: committed roster change makes review stale without correction'

-- A confirms under a transaction and retains SHARE locks; B's roster insert
-- must actually wait for A before completing. Its result must survive the commit.
update public.qa_concurrency set review_a = r.id from lateral extensions.dblink('a',
  (select format('select review_id from public.review_activity_date_correction(%s,%s,%L,%L)', course_id, evaluation_id, '2020-01-05 UTC', 'concurrent roster writer') from public.qa_concurrency)) as r(id uuid);
select extensions.dblink_exec('a', 'begin');
select * from extensions.dblink('a', (select format('select public.confirm_activity_date_correction(%s,%s,%L)', course_id, evaluation_id, review_a) from public.qa_concurrency)) as t(confirmed timestamptz);
select extensions.dblink_send_query('b', (select format('insert into public.authorized_students (course_id, email) values (%s, %L) returning id', course_id, 'qa-concurrent-blocked@example.test') from public.qa_concurrency));
do $$
declare deadline timestamptz := clock_timestamp() + interval '10 seconds'; a_pid int; b_pid int;
begin
  loop
    select pid into a_pid from pg_stat_activity where application_name = 'grp06_qa_a' and datname = current_database();
    select pid into b_pid from pg_stat_activity where application_name = 'grp06_qa_b' and datname = current_database();
    exit when a_pid = any(pg_blocking_pids(b_pid)) and exists (
      select 1 from pg_locks where pid = b_pid and relation = 'public.authorized_students'::regclass
        and mode = 'RowExclusiveLock' and not granted
    ) and exists (
      select 1 from pg_locks where pid = a_pid and relation = 'public.authorized_students'::regclass
        and mode = 'ShareLock' and granted
    );
    if clock_timestamp() > deadline then raise exception 'FAIL: roster writer did not wait for confirmation SHARE lock'; end if;
    perform pg_sleep(0.02);
  end loop;
end $$;
select extensions.dblink_exec('a', 'commit');
select * from extensions.dblink_get_result('b') as t(id bigint);
select * from extensions.dblink_get_result('b') as t(id bigint);
do $$
declare q public.qa_concurrency%rowtype;
begin
  select * into strict q from public.qa_concurrency;
  if (select performed_at from public.course_evaluations where id = q.evaluation_id) <> '2020-01-05 UTC'::timestamptz
    or (select count(*) from academic_access.activity_date_corrections where review_id = q.review_a) <> 1
    or (select count(*) from public.authorized_students where course_id = q.course_id and email in
      ('qa-concurrent-stale@example.test', 'qa-concurrent-blocked@example.test')) <> 2
    or not exists (select 1 from academic_access.activity_date_reviews r
      where r.id = q.review_a and exists (
        select 1 from jsonb_array_elements(r.impact) x join public.authorized_students s
          on s.id = (x->>'authorization_id')::bigint
        where s.course_id = q.course_id and s.email = 'qa-concurrent-stale@example.test')
      and not exists (
        select 1 from jsonb_array_elements(r.impact) x join public.authorized_students s
          on s.id = (x->>'authorization_id')::bigint
        where s.course_id = q.course_id and s.email = 'qa-concurrent-blocked@example.test')) then
    raise exception 'FAIL: correction, audit snapshot or roster write lost';
  end if;
end $$;
\echo 'PASS GRP-06: roster write waited for confirmation and both changes persisted'

-- Modify the earliest synthetic historical interval so the reviewed instant
-- changes from unknown to grouped; this is a privileged test-only repair.
update public.qa_concurrency set review_a = r.id from lateral extensions.dblink('a',
  (select format('select review_id from public.review_activity_date_correction(%s,%s,%L,%L)', course_id, evaluation_id, '2020-01-06 UTC', 'stale history') from public.qa_concurrency)) as r(id uuid);
select extensions.dblink_exec('b', (select format($cmd$update academic_access.group_membership_history set valid_from = '2019-01-01 UTC' where (enrollment_id, valid_from) = (select enrollment_id, valid_from from academic_access.group_membership_history where course_id = %s order by valid_from limit 1)$cmd$, course_id) from public.qa_concurrency));
do $$
declare q public.qa_concurrency%rowtype;
begin
  select * into strict q from public.qa_concurrency;
  begin
    perform * from extensions.dblink('a', format('select public.confirm_activity_date_correction(%s,%s,%L)', q.course_id, q.evaluation_id, q.review_a)) as t(confirmed timestamptz);
    raise exception 'FAIL: review accepted after concurrent history change';
  exception when serialization_failure then
    if sqlerrm not like '%activity_review_stale%' then raise; end if;
  end;
  if (select performed_at from public.course_evaluations where id = q.evaluation_id) <> '2020-01-05 UTC'::timestamptz
    or exists (select 1 from academic_access.activity_date_corrections where review_id = q.review_a)
    or not exists (select 1 from academic_access.group_membership_history where course_id = q.course_id and valid_from = '2019-01-01 UTC') then
    raise exception 'FAIL: stale history confirmation changed date, audit or history';
  end if;
end $$;
\echo 'PASS GRP-06: committed history change makes review stale without correction'

update public.qa_concurrency set review_a = r.id from lateral extensions.dblink('a',
  (select format('select review_id from public.review_activity_date_correction(%s,%s,%L,%L)', course_id, evaluation_id, '2020-01-07 UTC', 'concurrent history writer') from public.qa_concurrency)) as r(id uuid);
select extensions.dblink_exec('a', 'begin');
select * from extensions.dblink('a', (select format('select public.confirm_activity_date_correction(%s,%s,%L)', course_id, evaluation_id, review_a) from public.qa_concurrency)) as t(confirmed timestamptz);
select extensions.dblink_send_query('b', (select format($cmd$update academic_access.group_membership_history set valid_from = '2018-01-01 UTC' where course_id = %s and valid_from = '2019-01-01 UTC' returning enrollment_id$cmd$, course_id) from public.qa_concurrency));
do $$
declare deadline timestamptz := clock_timestamp() + interval '10 seconds'; a_pid int; b_pid int;
begin
  loop
    select pid into a_pid from pg_stat_activity where application_name = 'grp06_qa_a' and datname = current_database();
    select pid into b_pid from pg_stat_activity where application_name = 'grp06_qa_b' and datname = current_database();
    exit when a_pid = any(pg_blocking_pids(b_pid)) and exists (
      select 1 from pg_locks where pid = b_pid and relation = 'academic_access.group_membership_history'::regclass
        and mode = 'RowExclusiveLock' and not granted
    ) and exists (
      select 1 from pg_locks where pid = a_pid and relation = 'academic_access.group_membership_history'::regclass
        and mode = 'ShareLock' and granted
    );
    if clock_timestamp() > deadline then raise exception 'FAIL: history writer did not wait for confirmation SHARE lock'; end if;
    perform pg_sleep(0.02);
  end loop;
end $$;
select extensions.dblink_exec('a', 'commit');
select * from extensions.dblink_get_result('b') as t(enrollment_id bigint);
select * from extensions.dblink_get_result('b') as t(enrollment_id bigint);
do $$
declare q public.qa_concurrency%rowtype;
begin
  select * into strict q from public.qa_concurrency;
  if (select performed_at from public.course_evaluations where id = q.evaluation_id) <> '2020-01-07 UTC'::timestamptz
    or (select count(*) from academic_access.activity_date_corrections where review_id = q.review_a) <> 1
    or (select count(*) from academic_access.group_membership_history where course_id = q.course_id and valid_from = '2018-01-01 UTC') <> 1
    or exists (select 1 from academic_access.group_membership_history where course_id = q.course_id and valid_from = '2019-01-01 UTC') then
    raise exception 'FAIL: history write, date or correction lost';
  end if;
end $$;
select extensions.dblink_disconnect('a'), extensions.dblink_disconnect('b');
\echo 'PASS GRP-06: history write waited for confirmation and both changes persisted'
