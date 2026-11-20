\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

-- Use exact recorded boundaries, not sleeps or the grade's save time.
select set_config('qa.move_at', max(valid_from)::text, true),
       set_config('qa.first_at', min(valid_from)::text, true)
from academic_access.group_membership_history where enrollment_id = :enrollment_s1_id \g /dev/null
select id as eval_a_t3_id from public.course_evaluations where course_id = :course_a_id and name = 'T3' \gset
select set_config('qa.eval_a_t3_id', :'eval_a_t3_id', true) \g /dev/null
insert into public.authorized_students (course_id, email)
values (:course_a_id, 'qa-not-enrolled@example.test') returning id as unlinked_auth_id \gset
select set_config('qa.unlinked_auth_id', :'unlinked_auth_id', true) \g /dev/null

-- Existing and seeded activities are not assigned invented dates.
do $$
begin
  if exists (select 1 from public.course_evaluations
      where course_id in (current_setting('qa.course_a_id')::bigint, current_setting('qa.course_b_id')::bigint)
        and performed_at is not null) then
    raise exception 'FAIL: seed or existing activity has a date';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null

do $$
declare
  course bigint := current_setting('qa.course_a_id')::bigint;
  t1 bigint := current_setting('qa.eval_a_t1_id')::bigint;
  t2 bigint := current_setting('qa.eval_a_t2_id')::bigint;
  t3 bigint := current_setting('qa.eval_a_t3_id')::bigint;
  move_at timestamptz := current_setting('qa.move_at')::timestamptz;
  s1 bigint := current_setting('qa.enrollment_s1_id')::bigint;
begin
  begin
    perform * from public.resolve_activity_participants(course, t1);
    raise exception 'FAIL: missing time accepted';
  exception when null_value_not_allowed then null; end;
  begin
    update public.course_evaluations set performed_at = move_at where id = t1;
    raise exception 'FAIL: direct date write accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.course_evaluations (course_id, name, performed_at) values (course, 'Direct date', move_at);
    raise exception 'FAIL: direct dated insert accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.set_activity_performed_at(course, t1, null);
    raise exception 'FAIL: null accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.set_activity_performed_at(course, t1, 'infinity'::timestamptz);
    raise exception 'FAIL: infinity accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.set_activity_performed_at(course, t1, statement_timestamp() + interval '1 day');
    raise exception 'FAIL: future date accepted';
  exception when invalid_parameter_value then null; end;
  begin
    perform public.set_activity_performed_at(course, current_setting('qa.eval_b_t1_id')::bigint, move_at);
    raise exception 'FAIL: cross-course activity accepted';
  exception when no_data_found then null; end;

  perform public.set_activity_performed_at(course, t1, move_at - interval '1 microsecond');
  perform public.set_activity_performed_at(course, t1, move_at - interval '1 microsecond');
  perform public.set_activity_performed_at(course, t2, move_at);
  perform public.set_activity_performed_at(course, t3, current_setting('qa.first_at')::timestamptz - interval '1 microsecond');
  if not exists (select 1 from public.resolve_activity_participants(course, t1)
      where enrollment_id = s1 and membership_state = 'grouped' and group_id = current_setting('qa.group_a1_id')::bigint)
    or not exists (select 1 from public.resolve_activity_participants(course, t2)
      where enrollment_id = s1 and membership_state = 'grouped' and group_id = current_setting('qa.group_a2_id')::bigint)
    or not exists (select 1 from public.resolve_activity_participants(course, t3)
      where enrollment_id = s1 and membership_state = 'unknown' and group_id is null)
    or not exists (select 1 from public.resolve_activity_participants(course, t1)
      where authorization_id = current_setting('qa.unlinked_auth_id')::bigint and enrollment_id is null and membership_state = 'unknown')
    or (select count(*) from public.resolve_activity_participants(course, t1)) <> 3 then
    raise exception 'FAIL: activity participants, boundary, unknown or course scope';
  end if;
  begin
    perform public.set_activity_performed_at(course, t1, move_at);
    raise exception 'FAIL: RPC changed dated activity';
  exception when check_violation then null; end;
  begin
    update public.course_evaluations set performed_at = null where id = t1;
    raise exception 'FAIL: direct date clearing accepted';
  exception when check_violation then null; end;
  begin
    delete from public.course_evaluations where id = t1;
    raise exception 'FAIL: dated activity deleted';
  exception when check_violation then null; end;
end $$;

select set_config('request.jwt.claim.sub', :teacher_b, true) \g /dev/null
do $$
begin
  begin
    perform * from public.resolve_activity_participants(current_setting('qa.course_a_id')::bigint, current_setting('qa.eval_a_t1_id')::bigint);
    raise exception 'FAIL: foreign teacher read participants';
  exception when insufficient_privilege then null; end;
  begin
    perform public.set_activity_performed_at(current_setting('qa.course_a_id')::bigint, current_setting('qa.eval_a_t1_id')::bigint, statement_timestamp());
    raise exception 'FAIL: foreign teacher set date';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
begin
  begin
    perform * from public.resolve_activity_participants(current_setting('qa.course_a_id')::bigint, current_setting('qa.eval_a_t1_id')::bigint);
    raise exception 'FAIL: student read participants';
  exception when insufficient_privilege then null; end;
  begin
    perform public.set_activity_performed_at(current_setting('qa.course_a_id')::bigint, current_setting('qa.eval_a_t1_id')::bigint, statement_timestamp());
    raise exception 'FAIL: student set date';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
set local role anon;
do $$
begin
  begin
    perform * from public.resolve_activity_participants(current_setting('qa.course_a_id')::bigint, current_setting('qa.eval_a_t1_id')::bigint);
    raise exception 'FAIL: anonymous read participants';
  exception when insufficient_privilege then null; end;
  begin
    perform public.set_activity_performed_at(current_setting('qa.course_a_id')::bigint, current_setting('qa.eval_a_t1_id')::bigint, statement_timestamp());
    raise exception 'FAIL: anonymous set date';
  exception when insufficient_privilege then null; end;
end $$;
reset role;

-- Known ungrouped and inactive intervals remain distinct from unknown.
insert into public.course_evaluations (course_id, name)
values (:course_a_id, 'Ungrouped activity') returning id as eval_ungrouped \gset
insert into public.course_evaluations (course_id, name)
values (:course_a_id, 'Inactive activity') returning id as eval_inactive \gset
select set_config('qa.eval_ungrouped', :'eval_ungrouped', true),
       set_config('qa.eval_inactive', :'eval_inactive', true) \g /dev/null
update public.course_students set group_id = null where id = :enrollment_s1_id;
select set_config('qa.ungrouped_at', max(valid_from)::text, true)
from academic_access.group_membership_history where enrollment_id = :enrollment_s1_id \g /dev/null
update public.authorized_students set status = 'inactive' where id = :auth_s1_id;
select set_config('qa.inactive_at', max(valid_from)::text, true)
from academic_access.group_membership_history where enrollment_id = :enrollment_s1_id \g /dev/null
set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
declare course bigint := current_setting('qa.course_a_id')::bigint;
  s1 bigint := current_setting('qa.enrollment_s1_id')::bigint;
begin
  perform public.set_activity_performed_at(course, current_setting('qa.eval_ungrouped')::bigint, current_setting('qa.ungrouped_at')::timestamptz);
  perform public.set_activity_performed_at(course, current_setting('qa.eval_inactive')::bigint, current_setting('qa.inactive_at')::timestamptz);
  if not exists (select 1 from public.resolve_activity_participants(course, current_setting('qa.eval_ungrouped')::bigint)
      where enrollment_id = s1 and membership_state = 'ungrouped' and group_id is null)
    or not exists (select 1 from public.resolve_activity_participants(course, current_setting('qa.eval_inactive')::bigint)
      where enrollment_id = s1 and membership_state = 'inactive' and group_id is null) then
    raise exception 'FAIL: ungrouped or inactive historical state';
  end if;
end $$;
reset role;
-- Review is bound to the teacher, evaluation, old date and complete retained roster.
select set_config('qa.student_1', :student_1, true) \g /dev/null
set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
declare
  course bigint := current_setting('qa.course_a_id')::bigint;
  evaluation bigint := current_setting('qa.eval_a_t1_id')::bigint;
  proposal timestamptz := current_setting('qa.move_at')::timestamptz;
  review record; stale record; other_review record;
begin
  begin
    perform * from public.review_activity_date_correction(course, evaluation, proposal, ' ');
    raise exception 'FAIL: empty correction reason';
  exception when invalid_parameter_value then null; end;
  select * into review from public.review_activity_date_correction(course, evaluation, proposal, 'Correct the recorded date');
  if not exists (select 1 from jsonb_array_elements(review.impact) x
      where (x->>'enrollment_id')::bigint = current_setting('qa.enrollment_s1_id')::bigint
        and x->>'old_state' = 'grouped' and x->>'new_state' = 'grouped'
        and (x->>'old_group_id')::bigint = current_setting('qa.group_a1_id')::bigint
        and (x->>'new_group_id')::bigint = current_setting('qa.group_a2_id')::bigint)
    or not exists (select 1 from jsonb_array_elements(review.impact) x where x->>'new_state' = 'unknown') then
    raise exception 'FAIL: review omitted impact or unknown';
  end if;
  select * into stale from public.review_activity_date_correction(course, evaluation, proposal, 'Stale date');
  perform set_config('request.jwt.claim.sub', current_setting('qa.teacher_b'), true);
  begin
    perform public.confirm_activity_date_correction(course, evaluation, review.review_id);
    raise exception 'FAIL: foreign teacher confirmed';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub', current_setting('qa.student_1'), true);
  begin
    perform * from public.review_activity_date_correction(course, evaluation, proposal, 'Student');
    raise exception 'FAIL: student reviewed correction';
  exception when insufficient_privilege then null; end;
  begin
    perform public.confirm_activity_date_correction(course, evaluation, review.review_id);
    raise exception 'FAIL: student confirmed correction';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
  if public.confirm_activity_date_correction(course, evaluation, review.review_id) <> proposal then
    raise exception 'FAIL: correction did not return date';
  end if;
  begin
    perform public.confirm_activity_date_correction(course, evaluation, review.review_id);
    raise exception 'FAIL: review replay accepted';
  exception when unique_violation then null; end;
  begin
    perform public.confirm_activity_date_correction(course, evaluation, stale.review_id);
    raise exception 'FAIL: stale date accepted';
  exception when serialization_failure then null; end;
  select * into other_review from public.review_activity_date_correction(course, evaluation, review.old_at, 'Return date');
  perform set_config('qa.roster_review', other_review.review_id::text, true);
  perform set_config('qa.confirmed_review', review.review_id::text, true);
end $$;
reset role;
insert into public.authorized_students (course_id, email) values (:course_a_id, 'qa-new-roster@example.test');
set local role authenticated;
do $$
begin
  begin
    perform public.confirm_activity_date_correction(current_setting('qa.course_a_id')::bigint,
      current_setting('qa.eval_a_t1_id')::bigint, current_setting('qa.roster_review')::uuid);
    raise exception 'FAIL: stale roster accepted';
  exception when serialization_failure then null; end;
  begin
    perform * from academic_access.activity_date_reviews;
    raise exception 'FAIL: direct audit read accepted';
  exception when insufficient_privilege then null; end;
end $$;
reset role;
do $$
begin
  if not exists (select 1 from academic_access.activity_date_reviews r
      join academic_access.activity_date_corrections c on c.review_id = r.id
      where r.id = current_setting('qa.confirmed_review')::uuid
        and r.reason = 'Correct the recorded date' and r.actor_id = current_setting('qa.teacher_a')::uuid
        and jsonb_array_length(r.impact) > 0) then
    raise exception 'FAIL: correction audit missing';
  end if;
end $$;
\echo 'PASS GRP-06: dated activities, historical resolution, correction review and access controls'
rollback;
