-- The legacy RPC continues to allow voids without a reason.
create or replace function public.void_point_transaction_in_context(
  target_transaction_id bigint, target_course uuid, target_period uuid, void_reason_input text
) returns boolean language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if target_course is null or target_period is null then raise exception 'invalid_context'; end if;
  if nullif(btrim(void_reason_input, E' \t\n\r\f' || chr(11)), '') is null then
    raise exception 'invalid_void_reason';
  end if;
  return academic_access.void_point_transaction_internal(
    target_transaction_id, target_course, target_period, btrim(void_reason_input, E' \t\n\r\f' || chr(11)));
end;
$$;
