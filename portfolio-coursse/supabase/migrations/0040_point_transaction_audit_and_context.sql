-- Existing voided rows have no recoverable author or timestamp; leave them null.
alter table public.point_transactions
  add column voided_by uuid references public.profiles(id) on delete restrict,
  add column voided_at timestamptz,
  add column void_reason text,
  add constraint point_transactions_void_audit_consistent check (
    (voided_by is null and voided_at is null and void_reason is null)
    or (is_voided and voided_by is not null and voided_at is not null
        and (void_reason is null or length(trim(void_reason)) > 0))
  );

-- Direct inserts cannot forge a void or its audit fields. Existing read policies
-- and the absence of direct update/delete policies are preserved.
alter policy "teachers create points" on public.point_transactions
  with check (
    created_by = auth.uid()
    and not is_voided and voided_by is null and voided_at is null and void_reason is null
    and exists (
      select 1 from public.authorized_students authorized_student
      where authorized_student.id = authorized_student_id
        and authorized_student.status = 'active'
        and public.is_teacher_of_course(authorized_student.course_id)
    )
  );

-- The insert remains subject to the caller's RLS; the context and insert are
-- checked in the same statement, not against client-provided course ownership.
create function public.register_point_transaction_in_context(
  target_authorization_id bigint, target_course uuid, target_period uuid,
  transaction_public_id uuid, transaction_points integer, transaction_reason text
) returns boolean
language plpgsql security invoker set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  insert into public.point_transactions (public_id, authorized_student_id, points, reason, created_by)
  select transaction_public_id, a.id, transaction_points, nullif(trim(transaction_reason), ''), auth.uid()
  from public.authorized_students a
  join public.courses c on c.id = a.course_id
  join public.academic_periods p on p.id = c.period_id
  where a.id = target_authorization_id and a.status = 'active'
    and c.public_id = target_course and p.public_id = target_period
    and public.is_teacher_of_course(c.id);
  return found;
end;
$$;

create function academic_access.void_point_transaction_internal(
  target_transaction_id bigint, target_course uuid, target_period uuid, void_reason_input text
) returns boolean
language plpgsql security definer set search_path = ''
as $$
declare
  target_course_id bigint;
  actual_course uuid;
  actual_period uuid;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if (target_course is null) <> (target_period is null) then
    raise exception 'invalid_context';
  end if;

  select c.id, c.public_id, p.public_id
  into target_course_id, actual_course, actual_period
  from public.point_transactions t
  join public.authorized_students a on a.id = t.authorized_student_id
  join public.courses c on c.id = a.course_id
  join public.academic_periods p on p.id = c.period_id
  where t.id = target_transaction_id and not t.is_voided
  for update of t for share of c, a;

  if target_course_id is null then return false; end if;
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'not_course_teacher';
  end if;
  if target_course is not null and
     (target_course <> actual_course or target_period <> actual_period) then
    raise exception 'invalid_context';
  end if;

  update public.point_transactions
  set is_voided = true, voided_by = auth.uid(), voided_at = now(),
      void_reason = nullif(trim(void_reason_input), '')
  where id = target_transaction_id and not is_voided;
  return found;
end;
$$;

-- Only the legacy wrapper may omit context. The internal function is not an API.
revoke all on function academic_access.void_point_transaction_internal(bigint, uuid, uuid, text) from public, anon, authenticated;

create function public.void_point_transaction_in_context(
  target_transaction_id bigint, target_course uuid, target_period uuid, void_reason_input text
) returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if target_course is null or target_period is null then raise exception 'invalid_context'; end if;
  return academic_access.void_point_transaction_internal(
    target_transaction_id, target_course, target_period, void_reason_input);
end;
$$;

-- Keep existing clients working; they do not supply navigation context or reason.
create or replace function public.void_point_transaction(target_transaction_id bigint)
returns boolean language sql security definer set search_path = ''
as $$
  select academic_access.void_point_transaction_internal(target_transaction_id, null, null, null);
$$;

revoke all on function public.register_point_transaction_in_context(bigint, uuid, uuid, uuid, integer, text) from public, anon;
revoke all on function public.void_point_transaction_in_context(bigint, uuid, uuid, text) from public, anon;
revoke all on function public.void_point_transaction(bigint) from public, anon;
grant execute on function public.register_point_transaction_in_context(bigint, uuid, uuid, uuid, integer, text) to authenticated;
grant execute on function public.void_point_transaction_in_context(bigint, uuid, uuid, text) to authenticated;
grant execute on function public.void_point_transaction(bigint) to authenticated;
