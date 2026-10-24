-- TDD (red) checks for agreed rules not implemented yet (EVA-04, GRP-02).
-- Every case runs and prints PASS or FAIL; FAIL here is expected until the owner issue lands.
-- Student reads use the table directly; adapt the query if the owner exposes an RPC instead.
-- All fixtures are rolled back.
\set ON_ERROR_STOP on
begin;
\ir fixtures.sql

create temporary table qa_result (issue text, scenario text, passed boolean) on commit drop;
grant insert on qa_result to authenticated;

set local role authenticated;

-- EVA-04 (#27): S1 did T1 with A1 and then moved to A2.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true);
insert into qa_result select 'EVA-04', 'moved student reads the T1 grade of the group they did it with',
  exists (select 1 from public.group_grades
          where group_id = current_setting('qa.group_a1_id')::bigint
            and evaluation_id = current_setting('qa.eval_a_t1_id')::bigint);
insert into qa_result select 'EVA-04', 'moved student does not read T1 of the group they joined later',
  not exists (select 1 from public.group_grades
              where group_id = current_setting('qa.group_a2_id')::bigint
                and evaluation_id = current_setting('qa.eval_a_t1_id')::bigint);

-- EVA-04: S2 has always been in A1.
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000004', true);
insert into qa_result select 'EVA-04', 'current participant reads their group grade',
  exists (select 1 from public.group_grades
          where group_id = current_setting('qa.group_a1_id')::bigint
            and evaluation_id = current_setting('qa.eval_a_t1_id')::bigint);
insert into qa_result select 'EVA-04', 'pending grade is shown as pending, not zero',
  (select grade from public.group_grades
   where group_id = current_setting('qa.group_a1_id')::bigint
     and evaluation_id = current_setting('qa.eval_a_t2_id')::bigint) is null
  and exists (select 1 from public.group_grades
              where group_id = current_setting('qa.group_a1_id')::bigint
                and evaluation_id = current_setting('qa.eval_a_t2_id')::bigint);

-- EVA-04: S4 belongs to course B only.
select set_config('request.jwt.claim.sub', 'f6000000-0000-4000-8000-000000000006', true);
insert into qa_result select 'EVA-04', 'student of another course reads no course A grade',
  not exists (select 1 from public.group_grades g join public.groups gr on gr.id = g.group_id
              where gr.course_id = current_setting('qa.course_a_id')::bigint);

-- GRP-02 (#19): a graded group with no current members must survive group resynchronization.
reset role;
insert into public.groups (course_id, name, position, capacity)
values (current_setting('qa.course_a_id')::bigint, 'QA A3', 3, 2) returning id as group_a3_id \gset
insert into public.group_grades (group_id, evaluation_id, grade)
values (:group_a3_id, current_setting('qa.eval_a_t1_id')::bigint, 12);
select set_config('qa.group_a3_id', :'group_a3_id', true);

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
select public.synchronize_course_groups(current_setting('qa.course_a_id')::bigint, 2) \g /dev/null
reset role;
insert into qa_result select 'GRP-02', 'resync keeps an emptied group that explains past grades',
  exists (select 1 from public.group_grades where group_id = current_setting('qa.group_a3_id')::bigint);

select issue, case when passed then 'PASS' else 'FAIL' end as result, scenario
from qa_result order by issue, scenario;

rollback;
