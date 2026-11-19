-- Periods are shared institutional data, not owned by individual teachers.
-- Until an institutional authority is defined, authenticated users may only read them.
drop policy if exists "teachers create periods" on public.academic_periods;
drop policy if exists "teachers update periods" on public.academic_periods;

revoke execute on function public.promote_academic_period(bigint) from authenticated;
