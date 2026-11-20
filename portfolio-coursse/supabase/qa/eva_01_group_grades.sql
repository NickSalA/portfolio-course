\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

select set_config('qa.before_move', (max(valid_from) - interval '1 microsecond')::text, true),
       set_config('qa.after_move', max(valid_from)::text, true)
from academic_access.group_membership_history where enrollment_id = :enrollment_s1_id \g /dev/null
update public.group_grades set feedback = 'Keep this comment'
where group_id = :group_a1_id and evaluation_id = :eval_a_t2_id;

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true),
       set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null

do $$
declare
  course bigint := current_setting('qa.course_a_id')::bigint;
  old_evaluation bigint := current_setting('qa.eval_a_t1_id')::bigint;
  evaluation bigint := current_setting('qa.eval_a_t2_id')::bigint;
  a1 bigint := current_setting('qa.group_a1_id')::bigint;
  a2 bigint := current_setting('qa.group_a2_id')::bigint;
  result record;
  review record;
  invalid numeric;
begin
  begin
    perform public.save_group_grade(course, old_evaluation, a1, 16, 0);
    raise exception 'FAIL: legacy grade edited';
  exception when check_violation then
    if sqlerrm <> 'group_grade_legacy_unverified' then raise; end if;
  end;
  begin
    delete from public.course_evaluations where id = old_evaluation;
    raise exception 'FAIL: undated evaluation with confirmed grades deleted';
  exception when check_violation then
    if sqlerrm <> 'graded_activity_cannot_be_deleted' then raise; end if;
  end;
  begin
    perform public.save_group_grade(course, evaluation, a1, 0, 0);
    raise exception 'FAIL: undated activity graded';
  exception when null_value_not_allowed then null; end;

  perform public.set_activity_performed_at(course, evaluation, current_setting('qa.before_move')::timestamptz);
  begin
    perform public.save_group_grade(course, evaluation, a2, 5, 0);
    raise exception 'FAIL: empty historical group graded';
  exception when check_violation then
    if sqlerrm <> 'group_grade_participants_empty' then raise; end if;
  end;

  foreach invalid in array array[-0.01, 20.01, 12.345, 'NaN'::numeric, 'Infinity'::numeric, null] loop
    begin
      perform public.save_group_grade(course, evaluation, a1, invalid, 0);
      raise exception 'FAIL: invalid grade accepted: %', invalid;
    exception when invalid_parameter_value then null; end;
  end loop;
  if not exists (select 1 from public.group_grades where group_id = a1 and evaluation_id = evaluation and grade is null) then
    raise exception 'FAIL: pending row changed';
  end if;

  select * into strict result from public.save_group_grade(course, evaluation, a1, 0, 0);
  if (result.grade, result.revision) is distinct from (0::numeric, 1) then
    raise exception 'FAIL: first save did not return zero and revision one';
  end if;
  begin
    perform public.save_group_grade(course, evaluation, a1, 20, 1, E'\t\n');
    raise exception 'FAIL: correction without reason accepted';
  exception when invalid_parameter_value then null; end;
  select * into strict result from public.save_group_grade(course, evaluation, a1, 20, 1, '  Corrected score  ');
  if (result.grade, result.revision) is distinct from (20::numeric, 2) then
    raise exception 'FAIL: correction did not return 20 and revision two';
  end if;
  select * into strict result from public.save_group_grade(course, evaluation, a1, 20.00, 1, 'Corrected score');
  if result.revision <> 2 then raise exception 'FAIL: same value duplicated the correction'; end if;

  begin
    perform public.save_group_grade(course, evaluation, a1, 18.25, 1, 'Stale correction');
    raise exception 'FAIL: stale revision overwrote the grade';
  exception when serialization_failure then null; end;
  begin
    perform public.save_group_grade(course, evaluation, current_setting('qa.group_b1_id')::bigint, 12, 0);
    raise exception 'FAIL: foreign group accepted';
  exception when no_data_found then null; end;
  begin
    perform public.save_group_grade(course, current_setting('qa.eval_b_t1_id')::bigint, a1, 12, 0);
    raise exception 'FAIL: foreign evaluation accepted';
  exception when no_data_found then null; end;

  select * into strict review from public.review_activity_date_correction(
    course, evaluation, current_setting('qa.after_move')::timestamptz, 'Wrong group after move');
  begin
    perform public.confirm_activity_date_correction(course, evaluation, review.review_id);
    raise exception 'FAIL: date correction moved a graded participant';
  exception when check_violation then
    if sqlerrm <> 'activity_date_changes_graded_participants' then raise; end if;
  end;

  select * into strict review from public.review_activity_date_correction(
    course, evaluation, current_setting('qa.after_move')::timestamptz - interval '2 microseconds', 'Same participants');
  perform public.confirm_activity_date_correction(course, evaluation, review.review_id);
end;
$$;

select set_config('request.jwt.claim.sub', :teacher_b, true) \g /dev/null
do $$
begin
  perform public.save_group_grade(current_setting('qa.course_a_id')::bigint, current_setting('qa.eval_a_t2_id')::bigint,
    current_setting('qa.group_a1_id')::bigint, 18, 2, 'Unauthorized');
  raise exception 'FAIL: foreign teacher could write';
exception when insufficient_privilege then null;
end;
$$;

select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
begin
  perform public.save_group_grade(current_setting('qa.course_a_id')::bigint, current_setting('qa.eval_a_t2_id')::bigint,
    current_setting('qa.group_a1_id')::bigint, 18, 2, 'Unauthorized');
  raise exception 'FAIL: student could write';
exception when insufficient_privilege then null;
end;
$$;

reset role;
do $$
declare
  saved public.group_grades%rowtype;
  event academic_access.group_grade_corrections%rowtype;
begin
  select * into strict saved from public.group_grades
    where group_id = current_setting('qa.group_a1_id')::bigint and evaluation_id = current_setting('qa.eval_a_t2_id')::bigint;
  select * into strict event from academic_access.group_grade_corrections where grade_id = saved.id;
  if saved.feedback is distinct from 'Keep this comment' or saved.grade is distinct from 20
    or event.previous_grade <> 0 or event.new_grade <> 20 or event.revision <> 2
    or event.actor_id <> current_setting('qa.teacher_a')::uuid or event.reason <> 'Corrected score'
    or event.corrected_at is null or saved.participants_at <> current_setting('qa.before_move')::timestamptz then
    raise exception 'FAIL: correction or feedback lost';
  end if;
  if (select array_agg(p.enrollment_id order by p.enrollment_id)
      from academic_access.group_grade_participants p where p.group_id = saved.group_id and p.evaluation_id = saved.evaluation_id)
    is distinct from array[current_setting('qa.enrollment_s1_id')::bigint, current_setting('qa.enrollment_s2_id')::bigint] then
    raise exception 'FAIL: historical participants changed';
  end if;
  if has_function_privilege('anon', 'public.save_group_grade(bigint,bigint,bigint,numeric,integer,text)', 'EXECUTE') then
    raise exception 'FAIL: anonymous can execute the grade RPC';
  end if;
end;
$$;
select set_config('qa.eval_a_t3_id', id::text, true) from public.course_evaluations
where course_id = :course_a_id and name = 'T3' \g /dev/null
insert into public.authorized_students(course_id, email) values (:course_a_id, 'qa-unlinked-grade@example.test');
set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
declare
  course bigint := current_setting('qa.course_a_id')::bigint;
  evaluation bigint := current_setting('qa.eval_a_t3_id')::bigint;
begin
  perform public.set_activity_performed_at(course, evaluation, current_setting('qa.before_move')::timestamptz);
  begin
    perform public.save_group_grade(course, evaluation, current_setting('qa.group_a1_id')::bigint, 14, 0);
    raise exception 'FAIL: unresolved authorization silently skipped';
  exception when check_violation then
    if sqlerrm <> 'group_grade_participants_unknown' then raise; end if;
  end;
  if exists (select 1 from public.group_grades where evaluation_id = evaluation) then
    raise exception 'FAIL: unknown roster left a grade behind';
  end if;
end;
$$;
reset role;

rollback;
\echo 'PASS EVA-01: grade validation, permissions, history, corrections and date impact'
