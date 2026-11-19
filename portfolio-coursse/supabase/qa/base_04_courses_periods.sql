-- BASE-04 (#13): course isolation and restricted global-period management.
-- Direct database checks only; not UI acceptance.
\set ON_ERROR_STOP on
begin;
create temporary table qa_fixture_transaction () on commit drop;
\ir fixtures.sql

insert into public.academic_periods (academic_year, semester, status)
values (2099, 2, 'upcoming') returning id as next_period_id \gset
select set_config('qa.next_period_id', :'next_period_id', true) \g /dev/null

-- Preserve complete period rows to detect changes to any column, not only status.
create temporary table qa_period_before on commit drop as
select * from public.academic_periods
where id in (:period_id, :next_period_id);

set local role authenticated;
select set_config('request.jwt.claims', '{"amr":[{"method":"oauth"}]}', true) \g /dev/null

-- Test both directions and a positive own-course mutation: denial for everyone
-- must not be mistaken for course isolation.
do $$
declare
  actor uuid;
  own_id bigint;
  foreign_id bigint;
  affected integer;
begin
  for actor, own_id, foreign_id in
    select current_setting('qa.teacher_a')::uuid, current_setting('qa.course_a_id')::bigint, current_setting('qa.course_b_id')::bigint
    union all
    select current_setting('qa.teacher_b')::uuid, current_setting('qa.course_b_id')::bigint, current_setting('qa.course_a_id')::bigint
  loop
    perform set_config('request.jwt.claim.sub', actor::text, true);
    if not exists (select 1 from public.courses where id = own_id)
       or exists (select 1 from public.courses where id = foreign_id) then
      raise exception 'FAIL BASE-04: incorrect course visibility for %', actor;
    end if;
    update public.courses set name = name || ' renamed' where id = own_id;
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception 'FAIL BASE-04: own rename affected % rows', affected; end if;
    update public.courses set active = false where id = own_id;
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception 'FAIL BASE-04: own archive affected % rows', affected; end if;
    update public.courses set active = true where id = own_id;
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception 'FAIL BASE-04: own restore affected % rows', affected; end if;
    update public.courses set name = 'hijacked', active = false where id = foreign_id;
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception 'FAIL BASE-04: foreign update affected % rows', affected; end if;
    begin
      insert into public.courses (teacher_id, period_id, name)
      values (case when actor = current_setting('qa.teacher_a')::uuid then current_setting('qa.teacher_b')::uuid else current_setting('qa.teacher_a')::uuid end,
              current_setting('qa.next_period_id')::bigint, 'QA forged owner');
      raise exception 'FAIL BASE-04: forged course owner accepted';
    exception when insufficient_privilege then null;
    end;
    insert into public.courses (teacher_id, period_id, name)
    values (actor, current_setting('qa.next_period_id')::bigint, 'QA own upcoming course');
  end loop;
end $$;
\echo 'PASS BASE-04: both teachers can manage own courses but not read or update foreign courses'

-- Both teachers are denied direct global-period writes, including promotion.
-- UPDATE without an RLS policy normally affects zero rows rather than erroring.
do $$
declare
  actor uuid;
  affected integer;
begin
  foreach actor in array array[current_setting('qa.teacher_a')::uuid, current_setting('qa.teacher_b')::uuid] loop
    perform set_config('request.jwt.claim.sub', actor::text, true);
    begin
      insert into public.academic_periods (academic_year, semester, status)
      values (2098, 1, 'upcoming');
      raise exception 'FAIL BASE-04: teacher % inserted a global period', actor;
    exception when insufficient_privilege then null;
    end;
    update public.academic_periods set status = 'closed'
    where id in (select period_id from public.courses where teacher_id = actor);
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception 'FAIL BASE-04: teacher % updated % global periods', actor, affected; end if;
    begin
      perform public.promote_academic_period(current_setting('qa.next_period_id')::bigint);
      raise exception 'FAIL BASE-04: teacher % promoted a global period', actor;
    exception when insufficient_privilege then null;
    end;
  end loop;
end $$;

select set_config('request.jwt.claim.sub', 'f3000000-0000-4000-8000-000000000003', true) \g /dev/null
do $$
begin
  begin
    perform public.promote_academic_period(current_setting('qa.next_period_id')::bigint);
    raise exception 'FAIL BASE-04: student promoted a global period';
  exception when insufficient_privilege then null;
  end;
end $$;

-- Compare as fixture owner to avoid RLS concealing a modified or deleted row.
reset role;
do $$
begin
  if exists (
    (select * from qa_period_before except all
     select p.* from public.academic_periods p join qa_period_before b on b.id = p.id)
    union all
    (select p.* from public.academic_periods p join qa_period_before b on b.id = p.id
     except all select * from qa_period_before)
  ) then
    raise exception 'FAIL BASE-04: shared period changed after denied operations';
  end if;
end $$;

-- The other teacher can still operate their course after the denied attempts.
set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('qa.teacher_b'), true) \g /dev/null
do $$
declare affected integer;
begin
  update public.courses set name = 'QA still operable' where id = current_setting('qa.course_b_id')::bigint;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'FAIL BASE-04: foreign teacher course no longer operable'; end if;
end $$;
\echo 'PASS BASE-04: global period writes denied, shared periods preserved and own course remains operable'
rollback;
