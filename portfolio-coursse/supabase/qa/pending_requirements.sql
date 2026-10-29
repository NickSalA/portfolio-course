-- Red acceptance checks for EVA-04 (#27) and GRP-02 (#19).
-- Run with psql as the fixture owner; every failed/NULL result raises an error.
-- Requires qa/fixtures.sql and its qa_participation expected-truth table.

-- BASE-01 contrasted with migrations 0021/0028/0029, student/get-dashboard.ts
-- and teacher/grades/actions.ts: student grades and production history have no
-- supported interface yet. These adapters are deliberately BLOCKED, not table
-- reads claiming EVA-04 compliance. No UI/navigation/usability validation here.
\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

create temporary table qa_result (
  issue text, scenario text, passed boolean, detail text
) on commit drop;

-- ADAPTER CONTRACT, to be implemented here after EVA-04 owner (@MathiMomos)
-- defines the production interface (including its production history setup).
-- Invoke that interface as the current authenticated JWT subject, with no
-- privileged fallback or caller-supplied student identity. Return ALL visible
-- course A results (including pending rows), normalized to these columns.
-- Never read qa_participation, synthesize rows, or infer history from current
-- group_id. SECURITY INVOKER must preserve production authorization behavior.
create function pg_temp.qa_student_results(target_course_id bigint)
returns table (enrollment_id bigint, student_id uuid, group_id bigint,
               evaluation_id bigint, grade numeric)
language plpgsql security invoker as $$
begin
  raise exception 'BLOCKED EVA-04 #27: owner must define student results interface';
end;
$$;

-- ADAPTER CONTRACT for GRP-02/GRP-06 production participation records/resolver.
-- Run as fixture owner and normalize actual persisted/resolved participation
-- for course A. It must use production records created by supported fixture
-- operations BEFORE S1 moves, never qa_participation (the oracle only).
create function pg_temp.qa_recorded_participation(target_course_id bigint)
returns table (enrollment_id bigint, student_id uuid, group_id bigint,
               evaluation_id bigint)
language plpgsql security invoker as $$
begin
  raise exception 'BLOCKED GRP-02 #19 / GRP-06 #23: production history adapter undefined';
end;
$$;

-- Materialize only expected results as owner. The adapters do not consume this.
-- EXCEPT ALL below detects missing/extra rows, duplicates, changed grades and
-- NULL versus zero; positive and negative checks cannot pass independently.
create temporary table qa_expected_results on commit drop as
select p.*, g.grade
from qa_participation p
join public.group_grades g using (group_id, evaluation_id);

create temporary table qa_observed_results (
  enrollment_id bigint, student_id uuid, group_id bigint,
  evaluation_id bigint, grade numeric
) on commit drop;
grant select on qa_expected_results to authenticated;
grant select, insert, truncate on qa_observed_results to authenticated;
grant insert on qa_result to authenticated;

-- S1: exactly historical A1/T1=15, NOT new group's A2/T1=0 or A1/T2.
-- S2: exactly A1/T1=15 and A1/T2=NULL (a row, not absent or zero).
-- S4: course B student must see no course A rows.
set local role authenticated;
do $$
declare
  subject uuid;
  matches boolean;
begin
  foreach subject in array array[
    'f3000000-0000-4000-8000-000000000003'::uuid,
    'f4000000-0000-4000-8000-000000000004'::uuid,
    'f6000000-0000-4000-8000-000000000006'::uuid
  ] loop
    perform set_config('request.jwt.claim.sub', subject::text, true);
    begin
      truncate qa_observed_results;
      insert into qa_observed_results
        select * from pg_temp.qa_student_results(current_setting('qa.course_a_id')::bigint);
      select not exists (
        (select * from qa_observed_results
         except all select * from qa_expected_results where student_id = subject)
        union all
        (select * from qa_expected_results where student_id = subject
         except all select * from qa_observed_results)
      ) into matches;
      insert into qa_result values ('EVA-04', 'exact allowed and forbidden results: ' || subject, matches, null);
    exception when others then
      insert into qa_result values ('EVA-04', 'exact allowed and forbidden results: ' || subject, false, sqlerrm);
    end;
  end loop;
end;
$$;
reset role;

-- A denial for everyone must never produce a passing isolation scenario.
-- Report the authorized reads and cross-course denial as one access-control case.
with cases as (
  delete from qa_result where issue = 'EVA-04' returning passed, scenario, detail
)
insert into qa_result
select 'EVA-04', 'historical and current authorized reads plus cross-course isolation',
  bool_and(passed is true),
  string_agg(scenario || ': ' || coalesce(detail, case when passed then 'matched' else 'mismatch' end), '; ')
from cases;

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
  insert into qa_result values ('GRP-02', 'recorded participation survives S1 move', matches, null);
exception when others then
  insert into qa_result values ('GRP-02', 'recorded participation survives S1 move', false, sqlerrm);
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
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
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
    raise exception 'Pending requirements failed or blocked; see qa_result output (EVA-04 #27, GRP-02 #19, GRP-06 #23)';
  end if;
end;
$$;
rollback;
