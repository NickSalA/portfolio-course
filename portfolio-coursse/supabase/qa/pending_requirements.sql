-- Pending GRP-06 adapter and GRP-02 grade-preservation checks.
-- EVA-04 results are exercised by eva_04_student_results.sql in the regular suite.
\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

create temporary table qa_result (
  issue text, scenario text, passed boolean, detail text
) on commit drop;
grant insert on qa_result to authenticated;

-- ADAPTER CONTRACT for the GRP-06 resolver built on GRP-02 membership history.
-- Run as fixture owner and normalize actual persisted/resolved participation
-- for course A. It must use production records created by supported fixture
-- operations BEFORE S1 moves, never qa_participation (the oracle only).
create function pg_temp.qa_recorded_participation(target_course_id bigint)
returns table (enrollment_id bigint, student_id uuid, group_id bigint,
               evaluation_id bigint)
language plpgsql security invoker as $$
begin
  raise exception 'BLOCKED GRP-06 #23: activity participant resolver undefined';
end;
$$;

-- Compare expected truth to production history AFTER the move, not to itself.
do $$
declare matches boolean;
begin
  with actual as materialized (
    select * from pg_temp.qa_recorded_participation(current_setting('qa.course_a_id')::bigint)
  )
  select not exists (
    (select * from actual except all select * from qa_participation)
    union all
    (select * from qa_participation except all select * from actual)
  ) into matches;
  insert into qa_result values ('GRP-06', 'recorded participation survives S1 move', matches, null);
exception when others then
  insert into qa_result values ('GRP-06', 'recorded participation survives S1 move', false, sqlerrm);
end;
$$;

-- Force real sync work: occupied A1 starts at capacity 1 and must become 2.
-- 0021 computes one required group from two authorizations, then removes excess
-- empty groups. A3 is deliberately empty and graded: its exact grade must survive.
update public.groups set capacity = 1 where id = current_setting('qa.group_a1_id')::bigint;
insert into public.groups (course_id, name, position, capacity)
values (current_setting('qa.course_a_id')::bigint, 'QA A3', 3, 2) returning id as group_a3_id \gset
insert into public.group_grades (group_id, evaluation_id, grade)
values (:group_a3_id, current_setting('qa.eval_a_t1_id')::bigint, 12);
select set_config('qa.group_a3_id', :'group_a3_id', true);

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true),
       set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true) \g /dev/null
do $$
begin
  perform public.synchronize_course_groups(current_setting('qa.course_a_id')::bigint, 2);
exception when others then
  insert into qa_result values ('GRP-02', 'sync executes successfully', false, sqlerrm);
end;
$$;
reset role;
insert into qa_result select 'GRP-02', 'sync performs capacity change and preserves exact historical grade 12',
  exists (select 1 from public.groups
          where id = current_setting('qa.group_a1_id')::bigint and capacity = 2)
  and exists (select 1 from public.groups
              where id = current_setting('qa.group_a3_id')::bigint)
  and exists (select 1 from public.group_grades
              where group_id = current_setting('qa.group_a3_id')::bigint
                and evaluation_id = current_setting('qa.eval_a_t1_id')::bigint and grade = 12),
  null;

select issue, case when passed is true then 'PASS' else 'FAIL' end as result, scenario, detail
from qa_result order by issue, scenario;

do $$
begin
  if exists (select 1 from qa_result where passed is not true) then
    raise exception 'Pending requirements failed or blocked; see qa_result output';
  end if;
end;
$$;
rollback;
