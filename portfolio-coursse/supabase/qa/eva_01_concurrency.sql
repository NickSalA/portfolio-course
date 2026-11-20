\set ON_ERROR_STOP on
-- Invoked by the GRP-06 runner in its disposable schema-only database.
begin;
create temp table qa_grade_race as
select q.course_id, q.teacher_id, e.id evaluation_id, g.id group_id,
       max(h.valid_from) after_move, max(h.valid_from) - interval '1 microsecond' before_move,
       null::uuid review_id
from public.qa_concurrency q
join public.course_evaluations e on e.course_id = q.course_id and e.name = 'T2'
join public.groups g on g.course_id = q.course_id and g.position = 1
join academic_access.group_membership_history h on h.course_id = q.course_id
group by q.course_id, q.teacher_id, e.id, g.id;
delete from public.authorized_students where email in ('qa-concurrent-stale@example.test', 'qa-concurrent-blocked@example.test');
select set_config('request.jwt.claim.sub', (select teacher_id::text from qa_grade_race), true),
       set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select public.set_activity_performed_at(course_id, evaluation_id, before_move) from qa_grade_race;
update qa_grade_race set review_id = (
  select r.review_id from public.review_activity_date_correction(course_id, evaluation_id, after_move, 'After transfer') r
);
commit;

select extensions.dblink_connect(id, 'dbname=' || current_database() || ' application_name=eva01_qa_' || id)
from unnest(array['a','b']) id;
select extensions.dblink_exec(id, 'set role authenticated; set statement_timeout = ''30s''')
from unnest(array['a','b']) id;
select extensions.dblink_exec(id, format('set request.jwt.claim.sub = %L; set request.jwt.claims = %L',
  teacher_id::text, '{"amr":[{"method":"oauth"}]}'))
from qa_grade_race cross join unnest(array['a','b']) id;

create function pg_temp.expect_grade_wait() returns void language plpgsql as $$
declare deadline timestamptz := clock_timestamp() + interval '10 seconds';
begin
  loop
    exit when exists (
      select 1 from pg_stat_activity a, pg_stat_activity b
      where a.application_name = 'eva01_qa_a' and b.application_name = 'eva01_qa_b'
        and a.pid = any(pg_blocking_pids(b.pid))
    );
    if clock_timestamp() > deadline then raise exception 'FAIL: grade operation did not wait on evaluation'; end if;
    perform pg_sleep(0.02);
  end loop;
end;
$$;

select extensions.dblink_exec('a', 'begin');
select * from extensions.dblink('a', (
  select format('select revision from public.save_group_grade(%s,%s,%s,0,0)', course_id, evaluation_id, group_id) from qa_grade_race
)) as t(revision integer);
select extensions.dblink_send_query('b', (
  select format('select public.confirm_activity_date_correction(%s,%s,%L)', course_id, evaluation_id, review_id) from qa_grade_race
));
select pg_temp.expect_grade_wait();
select extensions.dblink_exec('a', 'commit');
do $$
begin
  perform * from extensions.dblink_get_result('b') as t(confirmed timestamptz);
  raise exception 'FAIL: waiting date correction changed graded participants';
exception when check_violation then
  if sqlerrm <> 'activity_date_changes_graded_participants' then raise; end if;
end;
$$;
select * from extensions.dblink_get_result('b', false) as t(confirmed timestamptz);

select extensions.dblink_exec('a', 'begin');
select * from extensions.dblink('a', (
  select format('select revision from public.save_group_grade(%s,%s,%s,13.25,1,%L)', course_id, evaluation_id, group_id, 'First correction') from qa_grade_race
)) as t(revision integer);
select extensions.dblink_send_query('b', (
  select format('select revision from public.save_group_grade(%s,%s,%s,17,1,%L)', course_id, evaluation_id, group_id, 'Stale correction') from qa_grade_race
));
select pg_temp.expect_grade_wait();
select extensions.dblink_exec('a', 'commit');
do $$
declare saved public.group_grades%rowtype;
begin
  begin
    perform * from extensions.dblink_get_result('b') as t(revision integer);
    raise exception 'FAIL: waiting grade correction overwrote a newer revision';
  exception when serialization_failure then
    if sqlerrm <> 'group_grade_conflict' then raise; end if;
  end;
  select g.* into strict saved from public.group_grades g
  join qa_grade_race q using (group_id, evaluation_id);
  if (saved.grade, saved.revision) is distinct from (13.25::numeric, 2)
    or (select count(*) from academic_access.group_grade_corrections where grade_id = saved.id) <> 1
    or (select count(*) from academic_access.group_grade_participants where evaluation_id = saved.evaluation_id) <> 2 then
    raise exception 'FAIL: concurrent operations did not preserve grade, audit and participants';
  end if;
end;
$$;
select extensions.dblink_disconnect('a'), extensions.dblink_disconnect('b');
\echo 'PASS EVA-01 concurrency: observed blocking, historical date protected, stale grade rejected'
