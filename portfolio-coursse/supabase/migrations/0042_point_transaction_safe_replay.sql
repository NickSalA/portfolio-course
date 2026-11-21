-- Preserve caller RLS for both insertion and replay; a collision is successful
-- only if the currently authorized caller can see the identical original.
create or replace function public.register_point_transaction_in_context(
  target_authorization_id bigint, target_course uuid, target_period uuid,
  transaction_public_id uuid, transaction_points integer, transaction_reason text
) returns boolean
language plpgsql security invoker set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if transaction_public_id is null or transaction_points is null or transaction_points = 0 then
    return false;
  end if;

  insert into public.point_transactions (public_id, authorized_student_id, points, reason, created_by)
  select transaction_public_id, a.id, transaction_points, nullif(trim(transaction_reason), ''), auth.uid()
  from public.authorized_students a
  join public.courses c on c.id = a.course_id
  join public.academic_periods p on p.id = c.period_id
  where a.id = target_authorization_id and a.status = 'active'
    and c.public_id = target_course and p.public_id = target_period
    and public.is_teacher_of_course(c.id)
  on conflict (public_id) do nothing;
  if found then return true; end if;

  return exists (
    select 1 from public.point_transactions t
    join public.authorized_students a on a.id = t.authorized_student_id
    join public.courses c on c.id = a.course_id
    join public.academic_periods p on p.id = c.period_id
    where t.public_id = transaction_public_id
      and t.authorized_student_id = target_authorization_id
      and t.points = transaction_points
      and t.reason is not distinct from nullif(trim(transaction_reason), '')
      and t.created_by = auth.uid()
      and a.status = 'active'
      and c.public_id = target_course and p.public_id = target_period
      and public.is_teacher_of_course(c.id)
  );
end;
$$;
