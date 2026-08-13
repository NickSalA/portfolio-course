-- Promoting a period is one atomic lifecycle transition.
create or replace function public.promote_academic_period(target_period_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_teacher() then
    raise exception 'not_teacher';
  end if;

  if not exists (
    select 1
    from public.academic_periods
    where id = target_period_id
      and status = 'upcoming'
  ) then
    raise exception 'period_not_upcoming';
  end if;

  update public.academic_periods
  set status = 'closed'
  where status = 'current';

  update public.academic_periods
  set status = 'current'
  where id = target_period_id;
end;
$$;

revoke all on function public.promote_academic_period(bigint) from public;
grant execute on function public.promote_academic_period(bigint) to authenticated;
