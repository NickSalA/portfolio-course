\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select set_config('request.jwt.claim.sub', :student_3, true) \g /dev/null
do $$
begin
  if public.sync_authorized_student() or exists (select 1 from public.course_students) then
    raise exception 'FAIL: account without a roster authorization obtained an enrollment';
  end if;
end $$;

-- The actual roster entry point creates an authorization for an existing account.
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.import_period_students_v2(:period_id,
  '[{"course_name":"QA course A","email":" QA-STUDENT-3@example.test ","student_number":" 00123 "}]') \g /dev/null
do $$
begin
  if (select count(*) from public.course_students where course_id = current_setting('qa.course_a_id')::bigint) <> 2 then
    raise exception 'FAIL: roster import created an enrollment directly';
  end if;
end $$;

select set_config('request.jwt.claim.sub', :student_3, true) \g /dev/null
do $$
begin
  if not public.sync_authorized_student() then
    raise exception 'FAIL: authorization added after first sign-in was not picked up';
  end if;
  if not public.sync_authorized_student()
     or (select count(*) from public.course_students) <> 1
     or not exists (select 1 from public.course_students
      where course_id = current_setting('qa.course_a_id')::bigint and student_number = '00123') then
    raise exception 'FAIL: repeated sync changed the late authorization scope';
  end if;
end $$;
\echo 'PASS BASE-06: authorization after a first sign-in, using the BASE-05 import'

reset role;
insert into public.authorized_students (course_id, email, group_id)
values (:course_b_id, 'qa-student-first@example.test', :group_b1_id)
returning id as auth_first_id \gset
insert into auth.users (id, email, email_confirmed_at)
values ('fa000000-0000-4000-8000-000000000001', 'qa-student-first@example.test', now());
insert into auth.identities (provider_id, user_id, provider, identity_data)
values ('base06-first', 'fa000000-0000-4000-8000-000000000001', 'google',
  '{"email":"qa-student-first@example.test","email_verified":true}');
select set_config('qa.auth_first_id', :'auth_first_id', true) \g /dev/null
set local role authenticated;
select set_config('request.jwt.claim.sub', 'fa000000-0000-4000-8000-000000000001', true) \g /dev/null
do $$
begin
  if exists (select 1 from public.course_students) or not public.sync_authorized_student() then
    raise exception 'FAIL: a pre-authorized student did not enroll at first synchronization';
  end if;
  if not exists (select 1 from public.course_students
      where authorized_student_id = current_setting('qa.auth_first_id')::bigint
      and course_id = current_setting('qa.course_b_id')::bigint
      and group_id = current_setting('qa.group_b1_id')::bigint) then
    raise exception 'FAIL: initial enrollment did not keep the valid preassignment';
  end if;
end $$;
\echo 'PASS BASE-06: authorization before first sign-in preserves initial assignment'

select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
update public.authorized_students set group_id = :group_a1_id, student_number = '00456' where id = :auth_s1_id;
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
begin
  if not public.sync_authorized_student() or not public.sync_authorized_student() then
    raise exception 'FAIL: current enrollment did not synchronize';
  end if;
  if (select count(*) from public.course_students) <> 1
    or not exists (select 1 from public.course_students
      where id = current_setting('qa.enrollment_s1_id')::bigint
      and group_id = current_setting('qa.group_a2_id')::bigint and student_number = '00456') then
    raise exception 'FAIL: repeat sync changed the group or did not update the roster number';
  end if;
end $$;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
update public.authorized_students set status = 'inactive' where id = :auth_s1_id;
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
begin
  if public.sync_authorized_student() or exists (select 1 from public.course_students) then
    raise exception 'FAIL: sync restored a revoked authorization';
  end if;
end $$;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
update public.authorized_students set status = 'active', group_id = null, student_number = null where id = :auth_s1_id;
select set_config('request.jwt.claim.sub', :student_1, true) \g /dev/null
do $$
begin
  if not public.sync_authorized_student() then
    raise exception 'FAIL: explicitly restored enrollment is unavailable';
  end if;
  if not exists (select 1 from public.course_students
      where id = current_setting('qa.enrollment_s1_id')::bigint
      and group_id = current_setting('qa.group_a2_id')::bigint and student_number = '00456') then
    raise exception 'FAIL: restoration changed the enrollment, group or existing student number';
  end if;
end $$;
\echo 'PASS BASE-06: group and optional roster number preserved across synchronization and restoration'

-- Prepare historical records which the current write guard correctly rejects.
-- The fixture is isolated in this transaction and restores the guard before testing.
reset role;
update public.authorized_students set group_id = :group_a1_id
where course_id = :course_a_id and email = 'qa-student-2@example.test'
returning id as auth_s2_id \gset
insert into public.authorized_students (course_id, email)
values (:course_b_id, 'qa-student-2@example.test') returning id as auth_conflict_id \gset
alter table public.course_students disable trigger guard_enrollment_authorization;
update public.course_students set authorized_student_id = null, group_id = null
where id = :enrollment_s2_id;
insert into public.course_students (course_id, student_id, authorized_student_id, status)
values (:course_b_id, :student_3, :auth_conflict_id, 'active')
returning id as legacy_conflict_id \gset
alter table public.course_students enable trigger guard_enrollment_authorization;
select set_config('qa.auth_s2_id', :'auth_s2_id', true) \g /dev/null

set local role authenticated;
select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
do $$
begin
  if not public.sync_authorized_student() then
    raise exception 'FAIL: one conflict interrupted another eligible course';
  end if;
  if (select count(*) from public.course_students) <> 1
    or not exists (select 1 from public.course_students
      where id = current_setting('qa.enrollment_s2_id')::bigint
      and authorized_student_id = current_setting('qa.auth_s2_id')::bigint and group_id is null) then
    raise exception 'FAIL: an unambiguous legacy link was not repaired in place';
  end if;
end $$;
select set_config('request.jwt.claim.sub', :student_3, true) \g /dev/null
do $$
begin
  if not public.sync_authorized_student() then
    raise exception 'FAIL: a legacy conflict interrupted the valid enrollment';
  end if;
  if exists (select 1 from public.course_students where course_id = current_setting('qa.course_b_id')::bigint) then
    raise exception 'FAIL: contradictory legacy link granted access';
  end if;
end $$;
reset role;
select set_config('qa.legacy_conflict_id', :'legacy_conflict_id', true) \g /dev/null
select set_config('qa.auth_conflict_id', :'auth_conflict_id', true) \g /dev/null
do $$
begin
  if not exists (select 1 from public.course_students
      where id = current_setting('qa.legacy_conflict_id')::bigint
      and authorized_student_id = current_setting('qa.auth_conflict_id')::bigint and status = 'inactive') then
    raise exception 'FAIL: the contradictory legacy row was changed or left active';
  end if;
end $$;
\echo 'PASS BASE-06: legacy records preserved, conflicts isolated and null group retained'

rollback;
