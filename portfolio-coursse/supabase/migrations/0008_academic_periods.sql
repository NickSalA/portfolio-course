-- Academic periods scope courses without duplicating period metadata.
create table public.academic_periods (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  code text not null unique,
  name text,
  starts_at date,
  ends_at date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

alter table public.courses
  add column period_id bigint not null references public.academic_periods(id) on delete restrict;

alter table public.courses
  add constraint courses_teacher_period_name_unique
  unique (teacher_id, period_id, name);

create index courses_period_id_idx on public.courses(period_id);

drop policy if exists "teachers create their courses" on public.courses;
drop policy if exists "teachers update their courses" on public.courses;

create policy "teachers create their courses"
on public.courses for insert to authenticated
with check (public.is_teacher() and teacher_id = auth.uid() and period_id is not null);

create policy "teachers update their courses"
on public.courses for update to authenticated
using (public.is_teacher_of_course(id))
with check (public.is_teacher_of_course(id) and period_id is not null);

alter table public.academic_periods enable row level security;

create policy "authenticated users read active periods"
on public.academic_periods for select to authenticated
using (active = true or public.is_teacher());

create policy "teachers create periods"
on public.academic_periods for insert to authenticated
with check (public.is_teacher());

create policy "teachers update periods"
on public.academic_periods for update to authenticated
using (public.is_teacher())
with check (public.is_teacher());
