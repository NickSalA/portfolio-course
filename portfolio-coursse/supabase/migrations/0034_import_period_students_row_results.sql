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
