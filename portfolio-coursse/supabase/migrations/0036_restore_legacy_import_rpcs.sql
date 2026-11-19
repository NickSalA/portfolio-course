-- Repair installations that applied the original unpublished 0034/0035.
-- Only the incompatible JSON-returning variant must be dropped; a fresh
-- installation already has the published table-returning function.
do $$
begin
  if exists (select 1 from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.oid = pg_catalog.to_regprocedure('public.import_period_students(bigint,jsonb)')
      and p.prorettype = 'pg_catalog.jsonb'::pg_catalog.regtype) then
    drop function public.import_period_students(bigint, jsonb);
  end if;
end $$;

-- The normalized-email unique index is an expression index, so the conflict
-- target must use the same expression.
create or replace function public.import_period_students(
  target_period_id bigint,
  students jsonb
)
returns table (imported_students integer, created_courses integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_teacher_id uuid := auth.uid();
  imported_count integer;
  created_count integer;
begin
  if not public.is_teacher() then raise exception 'not_teacher'; end if;
  if not exists (select 1 from public.academic_periods where id = target_period_id and status in ('upcoming', 'current')) then raise exception 'period_not_available'; end if;
  if jsonb_typeof(students) <> 'array' then raise exception 'invalid_students_payload'; end if;
  if exists (select 1 from jsonb_to_recordset(students) as row(course_name text, email text) where nullif(trim(row.course_name), '') is null or nullif(trim(row.email), '') is null) then raise exception 'course_and_email_required'; end if;

  with distinct_courses as (
    select distinct trim(row.course_name) as name
    from jsonb_to_recordset(students) as row(course_name text, email text)
  ), inserted_courses as (
    insert into public.courses (teacher_id, period_id, name)
    select current_teacher_id, target_period_id, name from distinct_courses
    on conflict (teacher_id, period_id, name) do nothing
    returning id
  ) select count(*)::integer into created_count from inserted_courses;

  insert into public.authorized_students (course_id, email, full_name, student_number, status)
  select course.id, lower(trim(row.email)), nullif(trim(row.full_name), ''), nullif(trim(row.student_number), ''), 'active'
  from jsonb_to_recordset(students) as row(course_name text, full_name text, email text, student_number text)
  join public.courses course on course.teacher_id = current_teacher_id and course.period_id = target_period_id and course.name = trim(row.course_name)
  on conflict (course_id, lower(trim(email))) do update
    set full_name = coalesce(excluded.full_name, public.authorized_students.full_name),
        student_number = coalesce(excluded.student_number, public.authorized_students.student_number),
        status = 'active';

  get diagnostics imported_count = row_count;
  return query select imported_count, created_count;
end;
$$;

revoke all on function public.import_period_students(bigint, jsonb) from public;
grant execute on function public.import_period_students(bigint, jsonb) to authenticated;

-- Imports a validated CSV batch as course authorizations in one transaction.
create or replace function public.import_authorized_students(
  target_course_id bigint,
  students jsonb
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  imported_count integer;
begin
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'not_course_teacher';
  end if;

  if jsonb_typeof(students) <> 'array' then
    raise exception 'invalid_students_payload';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(students) as row(full_name text, email text, student_number text)
    where nullif(trim(row.email), '') is null
  ) then
    raise exception 'student_email_required';
  end if;

  insert into public.authorized_students (
    course_id,
    email,
    full_name,
    student_number,
    status
  )
  select
    target_course_id,
    lower(trim(row.email)),
    nullif(trim(row.full_name), ''),
    nullif(trim(row.student_number), ''),
    'active'
  from jsonb_to_recordset(students) as row(full_name text, email text, student_number text)
  on conflict (course_id, lower(trim(email))) do update
    set full_name = coalesce(excluded.full_name, public.authorized_students.full_name),
        student_number = coalesce(excluded.student_number, public.authorized_students.student_number),
        status = 'active';

  get diagnostics imported_count = row_count;
  return imported_count;
end;
$$;

revoke all on function public.import_authorized_students(bigint, jsonb) from public;
grant execute on function public.import_authorized_students(bigint, jsonb) to authenticated;

-- Row-level results are a separate API; the published batch RPC remains intact.
create or replace function public.import_period_students_v2(target_period_id bigint, students jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  results jsonb;
begin
  if not public.is_teacher() then raise exception 'not_teacher'; end if;
  perform 1 from public.academic_periods p
    where p.id = target_period_id and p.status in ('upcoming', 'current') for share;
  if not found then raise exception 'period_not_available'; end if;
  if students is null or jsonb_typeof(students) is distinct from 'array' then
    raise exception 'invalid_students_payload';
  end if;

  -- Create only courses referenced by valid rows, in a consistent lock order.
  insert into public.courses (teacher_id, period_id, name)
  select distinct auth.uid(), target_period_id, btrim(x.item->>'course_name')
  from jsonb_array_elements(students) x(item)
  where jsonb_typeof(x.item) = 'object'
    and jsonb_typeof(x.item->'course_name') = 'string'
    and jsonb_typeof(x.item->'email') = 'string'
    and (not (x.item ? 'full_name') or jsonb_typeof(x.item->'full_name') in ('string', 'null'))
    and (not (x.item ? 'student_number') or jsonb_typeof(x.item->'student_number') in ('string', 'null'))
    and btrim(x.item->>'course_name') <> ''
    and lower(btrim(x.item->>'email')) ~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$'
    and lower(btrim(x.item->>'email')) not like '.%'
    and split_part(lower(btrim(x.item->>'email')), '@', 1) not like '%.'
    and lower(btrim(x.item->>'email')) not like '%..%'
  order by 1, 2, 3
  on conflict (teacher_id, period_id, name) do nothing;

  -- Lock owned active courses against concurrent archival before writing students.
  perform c.id from public.courses c
  where c.teacher_id = auth.uid() and c.period_id = target_period_id and c.active
    and c.name in (select btrim(x.item->>'course_name') from jsonb_array_elements(students) x(item))
  order by c.id for share;

  with input as (
    select x.ordinality - 1 as idx, x.item,
      btrim(x.item->>'course_name') as course_name,
      lower(btrim(x.item->>'email')) as email,
      nullif(btrim(x.item->>'full_name'), '') as full_name,
      nullif(btrim(x.item->>'student_number'), '') as student_number
    from jsonb_array_elements(students) with ordinality x(item, ordinality)
  ), validated as (
    select i.*, case
      when jsonb_typeof(item) <> 'object' then 'row_must_be_object'
      when jsonb_typeof(item->'course_name') is distinct from 'string'
        or jsonb_typeof(item->'email') is distinct from 'string'
        or (item ? 'full_name' and jsonb_typeof(item->'full_name') not in ('string', 'null'))
        or (item ? 'student_number' and jsonb_typeof(item->'student_number') not in ('string', 'null')) then 'invalid_field_type'
      when course_name = '' then 'course_required'
      when email = '' then 'email_required'
      when email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$'
        or email like '.%' or split_part(email, '@', 1) like '%.' or email like '%..%' then 'invalid_email'
      else null end as reason
    from input i
  ), resolved as (
    select v.*, c.id as course_id
    from validated v left join public.courses c
      on v.reason is null and c.teacher_id = auth.uid() and c.period_id = target_period_id
      and c.name = v.course_name and c.active
  ), ranked as (
    select r.*, row_number() over (partition by course_id, email order by idx) as occurrence
    from resolved r
  ), inserted as (
    insert into public.authorized_students (course_id, email, full_name, student_number, status)
    select course_id, email, full_name, student_number, 'active' from ranked
    where reason is null and course_id is not null and occurrence = 1
    order by course_id, email
    on conflict (course_id, lower(trim(email))) do nothing
    returning course_id, lower(trim(email)) as email
  )
  select coalesce(jsonb_agg(jsonb_build_object('index', r.idx,
    'status', case when r.reason is not null or r.course_id is null then 'invalid'
      when r.occurrence > 1 then 'duplicate'
      when ins.course_id is null then 'existing' else 'imported' end,
    'reason', case when r.reason is not null then r.reason
      when r.course_id is null then 'course_not_available'
      when r.occurrence > 1 then 'duplicate_in_payload'
      when ins.course_id is null then 'already_authorized' else null end) order by r.idx), '[]'::jsonb)
  into results from ranked r left join inserted ins on ins.course_id = r.course_id and ins.email = r.email;
  return results;
end;
$$;
revoke all on function public.import_period_students_v2(bigint, jsonb) from public;
grant execute on function public.import_period_students_v2(bigint, jsonb) to authenticated;
