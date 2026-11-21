-- Project the optional roster number onto the enrollment. An absent number
-- does not erase a value already stored on an existing enrollment.
create or replace function public.sync_authorized_student()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  student_account_id uuid := auth.uid();
  verified_email text := academic_access.current_email();
  locked_authorization_ids bigint[];
begin
  if student_account_id is null or verified_email is null then
    return false;
  end if;

  -- Lock in authorization order, before touching any enrollment. This keeps
  -- synchronization in the same lock order as roster revocation.
  locked_authorization_ids := array(
    select a.id from public.authorized_students a
    where lower(trim(a.email)) = verified_email
    order by a.id
    for update
  );

  if academic_access.current_email() is distinct from verified_email then
    return false;
  end if;

  insert into public.course_students as enrollment
    (course_id, student_id, authorized_student_id, group_id, status, student_number)
  select a.course_id, student_account_id, a.id, a.group_id, 'active', a.student_number
  from public.authorized_students a
  where a.id = any(locked_authorization_ids)
    and a.status = 'active'
    and not exists (
      select 1 from public.course_students linked
      where linked.authorized_student_id = a.id
        and (linked.course_id <> a.course_id or linked.student_id <> student_account_id)
    )
  order by a.id
  on conflict (course_id, student_id) do update
    set authorized_student_id = excluded.authorized_student_id,
        status = excluded.status,
        student_number = coalesce(excluded.student_number, enrollment.student_number)
    where (enrollment.authorized_student_id is null
        or enrollment.authorized_student_id = excluded.authorized_student_id)
      and (enrollment.authorized_student_id is distinct from excluded.authorized_student_id
        or enrollment.status is distinct from excluded.status
        or (excluded.student_number is not null
          and enrollment.student_number is distinct from excluded.student_number));

  -- Contradictory legacy links remain stored for review. They grant no access.
  update public.course_students enrollment
  set status = 'inactive'
  where enrollment.student_id = student_account_id
    and enrollment.status = 'active'
    and not exists (
      select 1 from public.authorized_students a
      where a.id = enrollment.authorized_student_id
        and a.course_id = enrollment.course_id
        and a.status = 'active'
        and lower(trim(a.email)) = verified_email
    );

  return academic_access.can_read_enrollment(null);
end;
$$;
