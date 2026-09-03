create or replace function public.void_point_transaction(target_transaction_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  target_course_id bigint;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;

  select authorized_student.course_id into target_course_id
  from public.point_transactions point_transaction
  join public.authorized_students authorized_student
    on authorized_student.id = point_transaction.authorized_student_id
  where point_transaction.id = target_transaction_id
    and point_transaction.is_voided = false;

  if target_course_id is null then return false; end if;
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'not_course_teacher';
  end if;

  update public.point_transactions
  set is_voided = true
  where id = target_transaction_id
    and is_voided = false;

  return found;
end;
$$;

revoke all on function public.void_point_transaction(bigint) from public;
grant execute on function public.void_point_transaction(bigint) to authenticated;
