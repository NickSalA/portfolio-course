-- Academic platform foundation
-- Run this migration in Supabase SQL Editor or with Supabase CLI.

create type public.app_role as enum ('teacher', 'student');
create type public.enrollment_status as enum ('pending', 'active', 'inactive', 'blocked');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.courses (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.groups (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  course_id bigint not null references public.courses(id) on delete cascade,
  name text not null,
  capacity integer not null check (capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (course_id, name)
);

create table public.authorized_students (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  course_id bigint not null references public.courses(id) on delete cascade,
  email text not null,
  full_name text,
  student_number text,
  group_id bigint references public.groups(id) on delete restrict,
  status public.enrollment_status not null default 'active',
  created_at timestamptz not null default now(),
  unique (course_id, email)
);

create table public.course_students (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  course_id bigint not null references public.courses(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  group_id bigint references public.groups(id) on delete restrict,
  status public.enrollment_status not null default 'active',
  student_number text,
  created_at timestamptz not null default now(),
  unique (course_id, student_id)
);

create table public.point_transactions (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  course_student_id bigint not null references public.course_students(id) on delete cascade,
  points integer not null check (points <> 0),
  reason text,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

-- group_id is nullable because some courses do not use groups.
create index authorized_students_email_idx on public.authorized_students(email);
create index course_students_student_id_idx on public.course_students(student_id);
create index point_transactions_enrollment_idx on public.point_transactions(course_student_id);

-- New OAuth users get a profile, but remain without an academic role until
-- they are authorized by the institution/import process.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    lower(trim(new.email)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  )
  on conflict (id) do update set email = excluded.email;

  -- A CSV row authorizes the email before the first OAuth login. Once the
  -- profile exists, materialize every active authorization as a matricula.
  insert into public.course_students (course_id, student_id, group_id, status, student_number)
  select a.course_id, new.id, a.group_id, a.status, a.student_number
  from public.authorized_students a
  where lower(trim(a.email)) = lower(trim(new.email))
    and a.status = 'active'
  on conflict (course_id, student_id) do update
    set group_id = excluded.group_id,
        status = excluded.status,
        student_number = excluded.student_number;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.is_teacher_of_course(course bigint)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.courses
    where id = course and teacher_id = auth.uid()
  );
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.groups enable row level security;
alter table public.authorized_students enable row level security;
alter table public.course_students enable row level security;
alter table public.point_transactions enable row level security;

create policy "users read their profile"
on public.profiles for select to authenticated
using (id = auth.uid());

create policy "teachers manage their courses"
on public.courses for all to authenticated
using (teacher_id = auth.uid())
with check (teacher_id = auth.uid());

create policy "students read their courses"
on public.courses for select to authenticated
using (exists (
  select 1 from public.course_students cs
  where cs.course_id = id and cs.student_id = auth.uid()
));

create policy "teachers manage their groups"
on public.groups for all to authenticated
using (public.is_teacher_of_course(course_id))
with check (public.is_teacher_of_course(course_id));

create policy "students read their group"
on public.groups for select to authenticated
using (exists (
  select 1 from public.course_students cs
  where cs.group_id = id and cs.student_id = auth.uid()
));

create policy "teachers manage authorized students"
on public.authorized_students for all to authenticated
using (public.is_teacher_of_course(course_id))
with check (public.is_teacher_of_course(course_id));


create policy "teachers manage enrollments"
on public.course_students for all to authenticated
using (public.is_teacher_of_course(course_id))
with check (public.is_teacher_of_course(course_id));

create policy "students read own enrollment"
on public.course_students for select to authenticated
using (student_id = auth.uid());

create policy "teachers manage points"
on public.point_transactions for all to authenticated
using (exists (
  select 1 from public.course_students cs
  where cs.id = course_student_id
    and public.is_teacher_of_course(cs.course_id)
))
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.course_students cs
    where cs.id = course_student_id
      and public.is_teacher_of_course(cs.course_id)
  )
);

create policy "students read own points"
on public.point_transactions for select to authenticated
using (exists (
  select 1 from public.course_students cs
  where cs.id = course_student_id and cs.student_id = auth.uid()
));
