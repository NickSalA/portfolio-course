-- Characterization of capabilities that already exist (BASE-03/06, EVA-01/02, GRP-05).
-- Expected to pass today. Stops at the first failure. All fixtures are rolled back.
\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

set local role anon;
do $$
begin
  if exists (select 1 from public.courses) or exists (select 1 from public.academic_periods) then
    raise exception 'FAIL: academic rows are visible without a session';
  end if;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null

-- BASE-03: an authenticated but unauthorized student sees no academic data.
select set_config('request.jwt.claim.sub', 'f5000000-0000-4000-8000-000000000005', true);
do $$
begin
  if public.sync_authorized_student() then raise exception 'FAIL: unauthorized student got an enrollment'; end if;
  if (select count(*) from public.courses) <> 0 then raise exception 'FAIL: unauthorized student reads courses'; end if;
  if (select count(*) from public.groups) <> 0 then raise exception 'FAIL: unauthorized student reads groups'; end if;
  if (select count(*) from public.course_students) <> 0 then raise exception 'FAIL: unauthorized student reads enrollments'; end if;
  if (select count(*) from public.point_transactions) <> 0 then raise exception 'FAIL: unauthorized student reads points'; end if;
end $$;
\echo 'PASS BASE-03: unauthorized student has no academic data'

-- BASE-03: no session (authenticated role without a user id) cannot void points.
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  perform public.void_point_transaction(current_setting('qa.point_s1_neg_id')::bigint);
  raise exception 'FAIL: void without session succeeded';
exception when others then
  if sqlerrm like 'FAIL:%' then raise; end if;
end $$;
\echo 'PASS BASE-03: no session cannot void points'

-- BASE-03/04: teacher B cannot read or change course A.
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_b'), true);
do $$
declare affected integer;
begin
  if exists (select 1 from public.courses where id = current_setting('qa.course_a_id')::bigint) then
    raise exception 'FAIL: teacher B reads course A';
  end if;
  update public.courses set name = 'hijacked' where id = current_setting('qa.course_a_id')::bigint;
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: teacher B renamed course A'; end if;
  if (select count(*) from public.authorized_students where course_id = current_setting('qa.course_a_id')::bigint) <> 0 then
    raise exception 'FAIL: teacher B reads course A roster';
  end if;
end $$;
\echo 'PASS BASE-03/04: teacher B cannot read or change course A'

-- EVA-02: teacher B cannot void a point movement of course A.
do $$
begin
  perform public.void_point_transaction(current_setting('qa.point_s1_neg_id')::bigint);
  raise exception 'FAIL: teacher B voided a course A movement';
exception when others then
  if sqlerrm <> 'not_course_teacher' then raise; end if;
end $$;
\echo 'PASS EVA-02: foreign teacher cannot void points'

select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
select set_config('request.jwt.claims', '{"amr":[{"method":"password"}]}', true) \g /dev/null
do $$
begin
  if public.is_teacher_of_course(current_setting('qa.course_a_id')::bigint)
     or exists (select 1 from public.authorized_students)
     or exists (select 1 from public.group_grades)
     or exists (select 1 from public.point_transactions) then
    raise exception 'FAIL: a teacher session outside the academic identity flow has academic access';
  end if;
end $$;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
\echo 'PASS BASE-03: teacher course scope also requires academic identity'

-- BASE-06: repeating the sync keeps one enrollment and the chosen group.
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true);
do $$
begin
  perform public.sync_authorized_student();
  perform public.sync_authorized_student();
  if (select count(*) from public.course_students) <> 1 then raise exception 'FAIL: repeated sync duplicated the enrollment'; end if;
  if (select group_id from public.course_students where id = current_setting('qa.enrollment_s1_id')::bigint)
       is distinct from current_setting('qa.group_a2_id')::bigint then
    raise exception 'FAIL: repeated sync dropped the selected group';
  end if;
end $$;
\echo 'PASS BASE-06: repeated sync keeps one enrollment and the selected group'

-- BASE-03: verify the allowed set as well as the denied set.
do $$
begin
  if (select array_agg(id) from public.courses) is distinct from array[current_setting('qa.course_a_id')::bigint]
     or (select array_agg(id) from public.groups) is distinct from array[current_setting('qa.group_a2_id')::bigint]
     or (select count(*) from public.course_evaluations) <> 3
     or (select count(*) from public.point_transactions) <> 2 then
    raise exception 'FAIL: academic access is not restricted to the authorized student resources';
  end if;
  if exists (
    select 1 from public.available_course_group_details(current_setting('qa.enrollment_s1_id')::bigint)
    where members <> '[]'::jsonb
  ) then
    raise exception 'FAIL: group names are visible outside the selection window';
  end if;
end $$;

select set_config('request.jwt.claims', '{"amr":[{"method":"password"}]}', true) \g /dev/null
do $$
begin
  if public.has_academic_identity() or exists (select 1 from public.courses) then
    raise exception 'FAIL: session outside the academic identity flow granted access';
  end if;
end $$;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null
\echo 'PASS BASE-03: authorized resources only and academic identity required'

select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000004', true);
do $$
begin
  if not exists (select 1 from public.courses where id = current_setting('qa.course_a_id')::bigint)
     or exists (select 1 from public.point_transactions) then
    raise exception 'FAIL: a classmate can see private point movements';
  end if;
end $$;
\echo 'PASS BASE-03: an enrolled classmate cannot read another student’s points'

-- Revocation and restoration apply to an existing session without resynchronizing.
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
update public.authorized_students set status = 'inactive' where id = current_setting('qa.auth_s1_id')::bigint;
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true);
do $$
begin
  if exists (select 1 from public.courses) or exists (select 1 from public.course_students)
     or exists (select 1 from public.course_evaluations) or exists (select 1 from public.point_transactions) then
    raise exception 'FAIL: academic data still available to a revoked student';
  end if;
end $$;
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
update public.authorized_students set status = 'active' where id = current_setting('qa.auth_s1_id')::bigint;
update public.courses set group_selection_opens_at = now() - interval '1 minute',
  group_selection_closes_at = now() + interval '1 minute'
where id = current_setting('qa.course_a_id')::bigint;
select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true);
do $$
declare
  enrollment_id bigint := current_setting('qa.enrollment_s1_id')::bigint;
begin
  if not exists (select 1 from public.course_students
    where id = enrollment_id and group_id = current_setting('qa.group_a2_id')::bigint) then
    raise exception 'FAIL: restoration did not preserve the enrollment and group';
  end if;
  if (select count(*) from public.available_course_groups(enrollment_id)) <> 2
    or not exists (select 1 from public.available_course_group_details(enrollment_id) where members <> '[]'::jsonb)
    or exists (select 1 from public.available_course_group_details(enrollment_id) g
      cross join lateral jsonb_array_elements(g.members) m
      where m ? 'email' or nullif(m ->> 'full_name', '') is null) then
    raise exception 'FAIL: group choices do not honor the name and capacity contract';
  end if;
end $$;
\echo 'PASS BASE-03: revocation, restoration and group privacy'
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
update public.courses set group_selection_opens_at = null, group_selection_closes_at = null
where id = current_setting('qa.course_a_id')::bigint;

-- EVA-01: grade range 0..20, pending is not zero, one grade per group and evaluation.
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
do $$
declare
  a1 bigint := current_setting('qa.group_a1_id')::bigint;
  t1 bigint := current_setting('qa.eval_a_t1_id')::bigint;
  t2 bigint := current_setting('qa.eval_a_t2_id')::bigint;
begin
  update public.group_grades set grade = 20 where group_id = a1 and evaluation_id = t1;
  if (select grade from public.group_grades where group_id = a1 and evaluation_id = t1) is distinct from 20 then
    raise exception 'FAIL: maximum grade 20 not stored';
  end if;
  update public.group_grades set grade = 0 where group_id = a1 and evaluation_id = t1;
  if (select grade from public.group_grades where group_id = a1 and evaluation_id = t1) is distinct from 0 then
    raise exception 'FAIL: explicit zero not stored';
  end if;
  if not exists (select 1 from public.group_grades where group_id = a1 and evaluation_id = t2 and grade is null) then
    raise exception 'FAIL: pending grade missing or not null';
  end if;

  begin
    update public.group_grades set grade = 20.01 where group_id = a1 and evaluation_id = t1;
    raise exception 'FAIL: grade 20.01 accepted';
  exception when check_violation then null;
  end;
  begin
    update public.group_grades set grade = -0.01 where group_id = a1 and evaluation_id = t1;
    raise exception 'FAIL: grade -0.01 accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.group_grades (group_id, evaluation_id, grade) values (a1, t1, 10);
    raise exception 'FAIL: second grade for the same group and evaluation accepted';
  exception when unique_violation then null;
  end;
  begin
    insert into public.group_grades (group_id, evaluation_id, grade)
    values (a1, current_setting('qa.eval_b_t1_id')::bigint, 10);
    raise exception 'FAIL: cross-course grade accepted';
  exception when insufficient_privilege then null;
  end;
end $$;
\echo 'PASS EVA-01: 0/20 bounds, pending != 0, unique and same-course grades'

-- EVA-02: voiding keeps the movement, is idempotent and zero points are rejected.
do $$
declare
  point_id bigint := current_setting('qa.point_s1_neg_id')::bigint;
  original_movement public.point_transactions%rowtype;
  voided_movement public.point_transactions%rowtype;
begin
  select * into strict original_movement from public.point_transactions where id = point_id;
  if original_movement.is_voided is distinct from false then
    raise exception 'FAIL: original movement is already voided';
  end if;
  if not public.void_point_transaction(point_id) then raise exception 'FAIL: owner teacher cannot void'; end if;
  if public.void_point_transaction(point_id) then raise exception 'FAIL: second void reported a change'; end if;
  select * into strict voided_movement from public.point_transactions where id = point_id;
  if voided_movement.is_voided is distinct from true then
    raise exception 'FAIL: voided movement was not kept';
  end if;
  if (to_jsonb(voided_movement) - array['is_voided', 'voided_by', 'voided_at', 'void_reason']) is distinct from
     (to_jsonb(original_movement) - array['is_voided', 'voided_by', 'voided_at', 'void_reason']) then
    raise exception 'FAIL: void changed original movement fields';
  end if;
  if (select sum(points) from public.point_transactions
      where authorized_student_id = current_setting('qa.auth_s1_id')::bigint and not is_voided) is distinct from 3 then
    raise exception 'FAIL: active balance is not 3 after void';
  end if;
  begin
    insert into public.point_transactions (authorized_student_id, points, reason, created_by)
    values (current_setting('qa.auth_s1_id')::bigint, 0, 'zero', current_setting('qa.teacher_a')::uuid);
    raise exception 'FAIL: zero points accepted';
  exception when check_violation then null;
  end;
end $$;
\echo 'PASS EVA-02: void is non-destructive and idempotent; zero points rejected'

-- EVA-02: snapshot all grades and existing movements as fixture owner, not through
-- the actor's RLS-filtered view. Include another student's nonempty balance.
reset role;
insert into public.point_transactions (authorized_student_id, points, reason, created_by)
values (:auth_s2_id, 4, 'QA classmate baseline', :teacher_a);
insert into public.authorized_students (course_id, email, full_name)
values (:course_a_id, 'qa-before-login@example.test', 'QA Before Login')
returning id as auth_before_login_id \gset
select set_config('qa.auth_before_login_id', :'auth_before_login_id', true),
       set_config('qa.auth_s4_id', :'auth_s4_id', true) \g /dev/null
create temporary table qa_grades_before on commit drop as select * from public.group_grades;
create temporary table qa_points_before on commit drop as select * from public.point_transactions;

do $$
begin
  if exists (select 1 from auth.users where email = 'qa-before-login@example.test')
     or exists (select 1 from public.course_students
                where authorized_student_id = current_setting('qa.auth_before_login_id')::bigint) then
    raise exception 'FAIL: before-login recipient already has a user or enrollment';
  end if;
end $$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
do $$
begin
  insert into public.point_transactions (authorized_student_id, points, reason, created_by)
  values (current_setting('qa.auth_before_login_id')::bigint, 2, 'QA before login', auth.uid());
  if (select count(*) from public.point_transactions
      where authorized_student_id = current_setting('qa.auth_before_login_id')::bigint
        and points = 2 and reason = 'QA before login' and created_by = auth.uid() and not is_voided) <> 1 then
    raise exception 'FAIL: teacher cannot read the individual movement registered before login';
  end if;
  begin
    insert into public.point_transactions (authorized_student_id, points, reason, created_by)
    values (current_setting('qa.auth_s4_id')::bigint, 2, 'QA foreign course', auth.uid());
    raise exception 'FAIL: teacher registered points in another course';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.point_transactions (authorized_student_id, points, reason, created_by)
    values (current_setting('qa.auth_s1_id')::bigint, 2, 'QA forged author', current_setting('qa.teacher_b')::uuid);
    raise exception 'FAIL: teacher registered points with a forged author';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_b'), true);
do $$
begin
  begin
    insert into public.point_transactions (authorized_student_id, points, reason, created_by)
    values (current_setting('qa.auth_before_login_id')::bigint, 2, 'QA foreign teacher', auth.uid());
    raise exception 'FAIL: foreign teacher registered points';
  exception when insufficient_privilege then null;
  end;
end $$;
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000004', true);
do $$
begin
  begin
    insert into public.point_transactions (authorized_student_id, points, reason, created_by)
    values (current_setting('qa.auth_s1_id')::bigint, 2, 'QA student insert', auth.uid());
    raise exception 'FAIL: student registered points';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
do $$
begin
  if exists ((select * from public.group_grades except all select * from qa_grades_before)
             union all (select * from qa_grades_before except all select * from public.group_grades)) then
    raise exception 'FAIL: registering points changed group grades';
  end if;
  if exists ((select * from public.point_transactions
              where authorized_student_id <> current_setting('qa.auth_before_login_id')::bigint
              except all select * from qa_points_before)
             union all (select * from qa_points_before except all
                        select * from public.point_transactions
                        where authorized_student_id <> current_setting('qa.auth_before_login_id')::bigint))
     or (select count(*) from public.point_transactions
         where authorized_student_id = current_setting('qa.auth_before_login_id')::bigint) <> 1 then
    raise exception 'FAIL: individual registration changed other students movements or created extra movements';
  end if;
end $$;
\echo 'PASS EVA-02: individual points before first login; grades and other movements unchanged; unauthorized inserts denied'
set local role authenticated;

-- GRP-05: closed window, full group, foreign group, reopened window.
select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000004', true);
do $$
begin
  perform public.select_course_group(current_setting('qa.enrollment_s2_id')::bigint, current_setting('qa.group_a2_id')::bigint);
  raise exception 'FAIL: selection accepted without a window';
exception when others then
  if sqlerrm <> 'group_selection_closed' then raise; end if;
end $$;

-- A window that already ended stays closed.
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
select public.configure_course_group_selection(
  current_setting('qa.course_a_id')::bigint,
  (now() at time zone 'America/Lima')::date - 3, '00:00',
  (now() at time zone 'America/Lima')::date - 1, '00:00');

select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000004', true);
do $$
begin
  perform public.select_course_group(current_setting('qa.enrollment_s2_id')::bigint, current_setting('qa.group_a2_id')::bigint);
  raise exception 'FAIL: selection accepted after the window closed';
exception when others then
  if sqlerrm <> 'group_selection_closed' then raise; end if;
end $$;

-- Reopening applies to the whole course.
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
select public.configure_course_group_selection(
  current_setting('qa.course_a_id')::bigint,
  (now() at time zone 'America/Lima')::date - 1, '00:00',
  (now() at time zone 'America/Lima')::date + 1, '00:00');
-- RLS blocks direct group updates for authenticated users, so set up capacity as owner.
reset role;
update public.groups set capacity = 1 where id = current_setting('qa.group_a2_id')::bigint;
set local role authenticated;

select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000004', true);
do $$
declare enrollment bigint := current_setting('qa.enrollment_s2_id')::bigint;
begin
  begin
    perform public.select_course_group(enrollment, current_setting('qa.group_a2_id')::bigint);
    raise exception 'FAIL: full group accepted a member';
  exception when others then
    if sqlerrm <> 'group_full' then raise; end if;
  end;
  begin
    perform public.select_course_group(enrollment, current_setting('qa.group_b1_id')::bigint);
    raise exception 'FAIL: group of another course accepted';
  exception when others then
    if sqlerrm <> 'group_not_available' then raise; end if;
  end;
end $$;

reset role;
update public.groups set capacity = 2 where id = current_setting('qa.group_a2_id')::bigint;
set local role authenticated;

select set_config('request.jwt.claim.sub', 'f4000000-0000-4000-8000-000000000004', true);
do $$
begin
  perform public.select_course_group(current_setting('qa.enrollment_s2_id')::bigint, current_setting('qa.group_a2_id')::bigint);
  if (select group_id from public.course_students where id = current_setting('qa.enrollment_s2_id')::bigint)
     is distinct from current_setting('qa.group_a2_id')::bigint then
    raise exception 'FAIL: open window selection not applied';
  end if;
end $$;
\echo 'PASS GRP-05: no/ended window, full group and foreign group rejected; reopened window applies'

-- A stale enrollment stops consuming a seat if its holder no longer has a verified identity.
reset role;
update auth.identities set identity_data = jsonb_set(identity_data, '{email_verified}', 'false')
where user_id = 'f3000000-0000-4000-8000-000000000003' and provider = 'google';
update public.groups set capacity = 1 where id = current_setting('qa.group_a2_id')::bigint;
set local role authenticated;
do $$
declare
  enrollment bigint := current_setting('qa.enrollment_s2_id')::bigint;
  group_a2 bigint := current_setting('qa.group_a2_id')::bigint;
begin
  perform public.select_course_group(enrollment, current_setting('qa.group_a1_id')::bigint);
  if (select active_members from public.available_course_groups(enrollment) where id = group_a2)
     is distinct from 0 then
    raise exception 'FAIL: invalid enrollment counted in group occupancy';
  end if;
  perform public.select_course_group(enrollment, group_a2);
end $$;
\echo 'PASS BASE-03: occupancy and selection ignore invalid enrollments'

-- Authorization can precede account creation. Only the login sync creates the enrollment.
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_a'), true);
insert into public.authorized_students (course_id, email)
values (current_setting('qa.course_a_id')::bigint, 'qa-first-login@example.test');
do $$
begin
  begin
    update public.authorized_students set email = 'qa-other@example.test'
    where email = 'qa-first-login@example.test';
    raise exception 'FAIL: roster identity was changed in place';
  exception when check_violation then
    if sqlerrm <> 'authorization_identity_is_immutable' then raise; end if;
  end;
end $$;
reset role;
insert into auth.users (id, email, email_confirmed_at)
values ('f7000000-0000-4000-8000-000000000007', 'qa-first-login@example.test', now());
insert into auth.identities (provider_id, user_id, provider, identity_data)
values ('qa-first-login', 'f7000000-0000-4000-8000-000000000007', 'google',
        '{"email":"qa-first-login@example.test","email_verified":true}');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'f7000000-0000-4000-8000-000000000007', true);
do $$
begin
  if not exists (select 1 from public.profiles) or exists (select 1 from public.course_students) then
    raise exception 'FAIL: first account creation should provision only the profile';
  end if;
  if not public.sync_authorized_student() then
    raise exception 'FAIL: first login did not synchronize the prior authorization';
  end if;
end $$;
\echo 'PASS BASE-03: roster identity stays stable and pre-authorized users can sync on first login'

rollback;
\echo 'PASS: all synthetic fixtures rolled back'
