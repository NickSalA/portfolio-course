-- Academic dates are flexible; lifecycle status controls what can be operated.
create type public.academic_period_status as enum (
  'draft',
  'upcoming',
  'current',
  'closed'
);

alter table public.academic_periods
  add column status public.academic_period_status not null default 'upcoming';

-- Preserve the intent of the previous active flag for any existing records.
update public.academic_periods
set status = case
  when active then 'upcoming'::public.academic_period_status
  else 'closed'::public.academic_period_status
end;

-- Remove the old policy before removing the column it reads.
drop policy if exists "authenticated users read active periods" on public.academic_periods;

alter table public.academic_periods
  drop column active;

-- Students can see non-draft periods attached to their courses. Teachers can
-- also see drafts while preparing a future academic period.
create policy "users read visible periods"
on public.academic_periods for select to authenticated
using (status <> 'draft' or public.is_teacher());

-- Courses may only be created or moved into a current or upcoming period.
drop policy if exists "teachers create their courses" on public.courses;
drop policy if exists "teachers update their courses" on public.courses;

create policy "teachers create their courses"
on public.courses for insert to authenticated
with check (
  public.is_teacher()
  and teacher_id = auth.uid()
  and exists (
    select 1 from public.academic_periods p
    where p.id = period_id and p.status in ('upcoming', 'current')
  )
);

create policy "teachers update their courses"
on public.courses for update to authenticated
using (public.is_teacher_of_course(id))
with check (
  public.is_teacher_of_course(id)
  and exists (
    select 1 from public.academic_periods p
    where p.id = period_id and p.status in ('upcoming', 'current')
  )
);
