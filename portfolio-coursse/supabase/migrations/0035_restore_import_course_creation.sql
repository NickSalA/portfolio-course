-- Restore course creation without changing the row-result RPC contract.
create or replace function public.import_period_students(target_period_id bigint, students jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  item jsonb;
  idx bigint;
  v_course_id bigint;
  course_name text;
  v_email text;
  full_name text;
  student_number text;
  reason text;
  result_status text;
  inserted_id bigint;
  seen text[] := array[]::text[];
  identity_key text;
  results jsonb := '[]'::jsonb;
begin
  if not public.is_teacher() then raise exception 'not_teacher'; end if;
  perform 1 from public.academic_periods p
  where p.id = target_period_id and p.status in ('upcoming', 'current')
  for share;
  if not found then
    raise exception 'period_not_available';
  end if;
  if students is null or jsonb_typeof(students) is distinct from 'array' then
    raise exception 'invalid_students_payload';
  end if;

  for item, idx in select value, ordinality - 1 from jsonb_array_elements(students) with ordinality loop
    reason := null;
    result_status := 'invalid';
    v_course_id := null;
    if jsonb_typeof(item) <> 'object' then
      reason := 'row_must_be_object';
    elsif jsonb_typeof(item->'course_name') is distinct from 'string'
       or jsonb_typeof(item->'email') is distinct from 'string'
       or (item ? 'full_name' and jsonb_typeof(item->'full_name') not in ('string', 'null'))
       or (item ? 'student_number' and jsonb_typeof(item->'student_number') not in ('string', 'null')) then
      reason := 'invalid_field_type';
    else
      course_name := btrim(item->>'course_name');
      v_email := lower(btrim(item->>'email'));
      full_name := nullif(btrim(item->>'full_name'), '');
      student_number := nullif(btrim(item->>'student_number'), '');
      if course_name = '' then
        reason := 'course_required';
      elsif v_email = '' then
        reason := 'email_required';
      elsif v_email !~ '^[A-Za-z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?(\.[A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?)+$'
         or v_email like '.%' or split_part(v_email, '@', 1) like '%.' or v_email like '%..%' then
        reason := 'invalid_email';
      else
        insert into public.courses (teacher_id, period_id, name)
        values (auth.uid(), target_period_id, course_name)
        on conflict (teacher_id, period_id, name) do nothing;

        select c.id into v_course_id from public.courses c
        where c.teacher_id = auth.uid() and c.period_id = target_period_id
          and c.name = course_name and c.active
        for share;
        if v_course_id is null then
          reason := 'course_not_available';
        else
          identity_key := v_course_id::text || ':' || v_email;
          if identity_key = any(seen) then
            result_status := 'duplicate';
            reason := 'duplicate_in_payload';
          else
            seen := array_append(seen, identity_key);
            inserted_id := null;
            insert into public.authorized_students (course_id, email, full_name, student_number, status)
            values (v_course_id, v_email, full_name, student_number, 'active')
            on conflict (course_id, lower(trim(email))) do nothing
            returning id into inserted_id;
            if inserted_id is null then
              result_status := 'existing';
              reason := 'already_authorized';
            else
              result_status := 'imported';
            end if;
          end if;
        end if;
      end if;
    end if;
    results := results || jsonb_build_array(jsonb_build_object('index', idx, 'status', result_status, 'reason', reason));
  end loop;
  return results;
end;
$$;

revoke all on function public.import_period_students(bigint, jsonb) from public;
grant execute on function public.import_period_students(bigint, jsonb) to authenticated;
