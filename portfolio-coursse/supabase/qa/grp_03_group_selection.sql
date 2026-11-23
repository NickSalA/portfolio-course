\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

-- Open selection window on course A so student group selection paths can be exercised.
set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.configure_course_group_selection(
  :course_a_id,
  (now() at time zone 'America/Lima')::date - 1, '00:00',
  (now() at time zone 'America/Lima')::date + 1, '23:59'
);
reset role;

-- 1. Direct client bypass (teacher or student writing course_students.group_id directly) is blocked.
set local role authenticated;
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
do $$
declare affected integer;
begin
  update public.course_students
  set group_id = current_setting('qa.group_a1_id')::bigint
  where id = current_setting('qa.enrollment_s1_id')::bigint;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'FAIL GRP-03: teacher bypassed group selection via direct UPDATE';
  end if;
exception when insufficient_privilege then null;
end $$;

select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
do $$
declare affected integer;
begin
  update public.course_students
  set group_id = current_setting('qa.group_a2_id')::bigint
  where id = current_setting('qa.enrollment_s2_id')::bigint;
  get diagnostics affected = row_count;
  if affected <> 0 then
    raise exception 'FAIL GRP-03: student bypassed group selection via direct UPDATE';
  end if;
exception when insufficient_privilege then null;
end $$;
\echo 'PASS GRP-03: direct teacher/student group_id bypass blocked'

-- 2. Student changes group via RPC: preserves membership history, enforces capacity, and is idempotent.
select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
select public.select_course_group(:enrollment_s2_id, :group_a2_id);
-- Idempotent repetition on same group must succeed without adding duplicate history.
select public.select_course_group(:enrollment_s2_id, :group_a2_id);

reset role;
do $$
declare
  enrollment bigint := current_setting('qa.enrollment_s2_id')::bigint;
  open_rows integer;
  total_rows integer;
begin
  select count(*)::integer into total_rows
  from academic_access.group_membership_history
  where enrollment_id = enrollment;
  select count(*)::integer into open_rows
  from academic_access.group_membership_history
  where enrollment_id = enrollment and valid_until is null;

  if total_rows <> 2 or open_rows <> 1 then
    raise exception 'FAIL GRP-03: expected 2 non-duplicated history rows and 1 open interval, got total=%, open=%', total_rows, open_rows;
  end if;
end $$;

-- Capacity is now full on A2 (S1 + S2, capacity = 2); S3 cannot take a 3rd seat.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '00000000-0000-0000-0000-000000000000', 'f8000000-0000-4000-8000-000000000008',
  'authenticated', 'authenticated', 'qa-student-grp03@example.test', '',
  now(), '{"provider":"google","providers":["google"]}', '{}', now(), now()
);
insert into auth.identities (provider_id, user_id, identity_data, provider)
values (
  'f8000000-0000-4000-8000-000000000008', 'f8000000-0000-4000-8000-000000000008',
  '{"email":"qa-student-grp03@example.test","email_verified":true}', 'google'
);
insert into public.authorized_students (course_id, email, full_name, group_id)
values (:course_a_id, 'qa-student-grp03@example.test', 'QA Student GRP03', :group_a2_id)
returning id as auth_grp03_id \gset
select set_config('qa.auth_grp03_id', :'auth_grp03_id', true) \g /dev/null

set local role authenticated;
select set_config('request.jwt.claim.sub', 'f8000000-0000-4000-8000-000000000008', true) \g /dev/null
do $$
declare
  new_enrollment bigint;
begin
  -- Preassignment to full A2 must NOT exceed capacity; student enrolls ungrouped.
  if not public.sync_authorized_student() then
    raise exception 'FAIL GRP-03: preassigned student sync failed';
  end if;
  select id into new_enrollment from public.course_students
  where authorized_student_id = current_setting('qa.auth_grp03_id')::bigint;
  if exists (
    select 1 from public.course_students
    where id = new_enrollment and group_id is not null
  ) then
    raise exception 'FAIL GRP-03: preassignment overflowed full group A2';
  end if;

  begin
    perform public.select_course_group(new_enrollment, current_setting('qa.group_a2_id')::bigint);
    raise exception 'FAIL GRP-03: full group accepted a 3rd student';
  exception when others then
    if sqlerrm <> 'group_full' then raise; end if;
  end;

  -- Foreign group in course B must be rejected.
  begin
    perform public.select_course_group(new_enrollment, current_setting('qa.group_b1_id')::bigint);
    raise exception 'FAIL GRP-03: foreign group accepted';
  exception when others then
    if sqlerrm <> 'group_not_available' then raise; end if;
  end;
end $$;

-- 3. Subsequent resynchronization preserves S2's chosen group even if authorized_students.group_id points elsewhere.
reset role;
update public.authorized_students set group_id = :group_a1_id where id = :auth_s2_id;
set local role authenticated;
select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
do $$
begin
  perform public.sync_authorized_student();
  if (select group_id from public.course_students where id = current_setting('qa.enrollment_s2_id')::bigint)
       is distinct from current_setting('qa.group_a2_id')::bigint then
    raise exception 'FAIL GRP-03: resync overwrote student-selected group';
  end if;
end $$;

-- 4. Closed window prevents changing groups, including repeating/changing.
select set_config('request.jwt.claim.sub', :teacher_a, true) \g /dev/null
select public.configure_course_group_selection(
  :course_a_id,
  (now() at time zone 'America/Lima')::date - 3, '00:00',
  (now() at time zone 'America/Lima')::date - 1, '00:00'
);
select set_config('request.jwt.claim.sub', :student_2, true) \g /dev/null
do $$
begin
  perform public.select_course_group(current_setting('qa.enrollment_s2_id')::bigint, current_setting('qa.group_a1_id')::bigint);
  raise exception 'FAIL GRP-03: selection succeeded after window closed';
exception when others then
  if sqlerrm <> 'group_selection_closed' then raise; end if;
end $$;
reset role;

\echo 'PASS GRP-03: history preservation, idempotency, preassignment capacity guard, and bypass prevention'
rollback;
