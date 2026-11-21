\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

-- The fixture already records S1's move from A1 to A2 via an enrollment write.
-- Capture exact times without relying on wall-clock sleeps.
select set_config('qa.a1_from', min(valid_from)::text, true),
       set_config('qa.a2_from', max(valid_from)::text, true)
from academic_access.group_membership_history where enrollment_id = :enrollment_s1_id \g /dev/null

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
declare
  enrollment bigint := current_setting('qa.enrollment_s1_id')::bigint;
  initial_from timestamptz := current_setting('qa.a1_from')::timestamptz;
  move_at timestamptz := current_setting('qa.a2_from')::timestamptz;
begin
  if not exists (select 1 from public.student_group_membership_at(enrollment, initial_from - interval '1 microsecond')
      where membership_state = 'unknown' and group_id is null)
    or not exists (select 1 from public.student_group_membership_at(enrollment, move_at - interval '1 microsecond')
      where membership_state = 'grouped' and group_id = current_setting('qa.group_a1_id')::bigint)
    or not exists (select 1 from public.student_group_membership_at(enrollment, move_at)
      where membership_state = 'grouped' and group_id = current_setting('qa.group_a2_id')::bigint)
    or not exists (select 1 from public.student_group_membership_at(enrollment, statement_timestamp() + interval '1 day')
      where membership_state = 'unknown' and group_id is null) then
    raise exception 'FAIL: membership interval boundary or unknown state';
  end if;
  begin
    perform public.student_group_membership_at(enrollment, null);
    raise exception 'FAIL: null timestamp accepted';
  exception when null_value_not_allowed then null;
  end;
  begin
    perform 1 from academic_access.group_membership_history;
    raise exception 'FAIL: authenticated actor can read private history directly';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', :teacher_b, true) \g /dev/null
do $$
begin
  perform public.student_group_membership_at(current_setting('qa.enrollment_s1_id')::bigint, statement_timestamp());
  raise exception 'FAIL: foreign teacher can read history';
exception when insufficient_privilege then null;
end $$;
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
begin
  perform public.student_group_membership_at(current_setting('qa.enrollment_s1_id')::bigint, statement_timestamp());
  raise exception 'FAIL: student can access the teacher history interface';
exception when insufficient_privilege then null;
end $$;
reset role;
set local role anon;
do $$
begin
  perform public.student_group_membership_at(current_setting('qa.enrollment_s1_id')::bigint, statement_timestamp());
  raise exception 'FAIL: anonymous role can read history';
exception when insufficient_privilege then null;
end $$;
reset role;
\echo 'PASS GRP-02: exact boundaries, unknown dates and course-scoped access'

-- A repeated write and a repeat login keep the existing history.
set local role authenticated;
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
select public.sync_authorized_student() \g /dev/null
select public.sync_authorized_student() \g /dev/null
reset role;
update public.course_students set group_id = group_id where id = :enrollment_s1_id;
do $$
begin
  if (select count(*) from academic_access.group_membership_history
      where enrollment_id = current_setting('qa.enrollment_s1_id')::bigint) <> 2 then
    raise exception 'FAIL: a no-op created history';
  end if;
end $$;

savepoint rollback_member_change;
update public.course_students set group_id = null where id = :enrollment_s1_id;
rollback to rollback_member_change;
do $$
begin
  if not exists (select 1 from academic_access.group_membership_history
      where enrollment_id = current_setting('qa.enrollment_s1_id')::bigint
      and valid_from = current_setting('qa.a2_from')::timestamptz and valid_until is null)
    or (select group_id from public.course_students where id = current_setting('qa.enrollment_s1_id')::bigint)
      is distinct from current_setting('qa.group_a2_id')::bigint then
    raise exception 'FAIL: rollback did not restore both enrollment and history';
  end if;
end $$;

update public.course_students set group_id = null where id = :enrollment_s1_id;
select set_config('qa.ungrouped_at', max(valid_from)::text, true)
from academic_access.group_membership_history where enrollment_id = :enrollment_s1_id \g /dev/null
update public.authorized_students set status = 'inactive' where id = :auth_s1_id;
select set_config('qa.inactive_at', max(valid_from)::text, true)
from academic_access.group_membership_history where enrollment_id = :enrollment_s1_id \g /dev/null
update public.authorized_students set status = 'active' where id = :auth_s1_id;
select set_config('qa.restored_at', max(valid_from)::text, true)
from academic_access.group_membership_history where enrollment_id = :enrollment_s1_id \g /dev/null

set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
declare enrollment bigint := current_setting('qa.enrollment_s1_id')::bigint;
begin
  if (select membership_state from public.student_group_membership_at(enrollment, current_setting('qa.ungrouped_at')::timestamptz))
      is distinct from 'ungrouped'
    or (select membership_state from public.student_group_membership_at(enrollment, current_setting('qa.inactive_at')::timestamptz))
      is distinct from 'inactive'
    or (select membership_state from public.student_group_membership_at(enrollment, current_setting('qa.restored_at')::timestamptz))
      is distinct from 'ungrouped' then
    raise exception 'FAIL: wrong group-less, inactive or restored state';
  end if;
end $$;
reset role;

do $$
declare
  enrollment bigint := current_setting('qa.enrollment_s1_id')::bigint;
begin
  begin
    insert into academic_access.group_membership_history
      (enrollment_id, course_id, student_id, membership_state, valid_from)
    select id, course_id, student_id, 'ungrouped', clock_timestamp() + interval '1 day'
      from public.course_students where id = enrollment;
    raise exception 'FAIL: overlapping intervals accepted';
  exception when exclusion_violation then null;
  end;
  begin
    insert into academic_access.group_membership_history
      (enrollment_id, course_id, student_id, membership_state, group_id, valid_from, valid_until)
    select id, course_id, student_id, 'grouped', current_setting('qa.group_b1_id')::bigint,
      clock_timestamp() - interval '2 days', clock_timestamp() - interval '1 day'
      from public.course_students where id = enrollment;
    raise exception 'FAIL: history accepted a group from a different course';
  exception when foreign_key_violation then null;
  end;
end $$;
\echo 'PASS GRP-02: lifecycle, idempotency, rollback and history constraints'

-- A separate course isolates the group-reduction configuration.
insert into public.courses (teacher_id, period_id, name)
values (:teacher_a, :period_id, 'GRP-02 protected groups') returning id as history_course_id \gset
insert into public.groups (course_id, name, position, capacity)
values (:history_course_id, 'Notes only', 1, 2) returning id as notes_group \gset
insert into public.groups (course_id, name, position, capacity)
values (:history_course_id, 'Unreferenced', 2, 2) returning id as free_group \gset
insert into public.groups (course_id, name, position, capacity)
values (:history_course_id, 'History only', 3, 2) returning id as history_group \gset
insert into public.authorized_students (course_id, email)
values (:history_course_id, 'qa-student-4@example.test') returning id as history_auth_id \gset
insert into public.course_students (course_id, student_id, authorized_student_id, group_id)
values (:history_course_id, :student_4, :history_auth_id, :history_group) returning id as history_enrollment_id \gset
update public.course_students set group_id = null where id = :history_enrollment_id;
insert into public.group_grades (group_id, evaluation_id, grade)
select :notes_group, id, 13 from public.course_evaluations where course_id = :history_course_id and name = 'T1';

select set_config('qa.notes_group', :'notes_group', true),
       set_config('qa.free_group', :'free_group', true),
       set_config('qa.history_group', :'history_group', true) \g /dev/null

do $$
begin
  begin
    delete from public.groups where id = current_setting('qa.notes_group')::bigint;
    raise exception 'FAIL: deleting a group would cascade its notes';
  exception when foreign_key_violation then null;
  end;
  begin
    delete from public.groups where id = current_setting('qa.history_group')::bigint;
    raise exception 'FAIL: a group referenced only by history was deleted';
  exception when foreign_key_violation then null;
  end;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select * from public.synchronize_course_groups(:history_course_id, 2);
reset role;
do $$
begin
  if exists (select 1 from public.groups where id = current_setting('qa.free_group')::bigint)
    or not exists (select 1 from public.groups where id = current_setting('qa.history_group')::bigint)
    or not exists (select 1 from public.group_grades where group_id = current_setting('qa.notes_group')::bigint and grade = 13) then
    raise exception 'FAIL: adjustment did not preserve referenced groups and remove the unreferenced group';
  end if;
end $$;
\echo 'PASS GRP-02: automatic reduction preserves groups with history or notes'
rollback;
