-- Characterization of capabilities that already exist (BASE-03/06, EVA-01/02, GRP-05).
-- Expected to pass today. Stops at the first failure. All fixtures are rolled back.
\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

set local role authenticated;

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
  if (to_jsonb(voided_movement) - 'is_voided') is distinct from
     (to_jsonb(original_movement) - 'is_voided') then
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

rollback;
\echo 'PASS: all synthetic fixtures rolled back'
