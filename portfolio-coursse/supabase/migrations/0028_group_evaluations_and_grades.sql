-- Group evaluations and grades

create table public.course_evaluations (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  course_id bigint not null references public.courses(id) on delete cascade,
  name text not null,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  unique (course_id, name)
);

create table public.group_grades (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  group_id bigint not null references public.groups(id) on delete cascade,
  evaluation_id bigint not null references public.course_evaluations(id) on delete cascade,
  grade numeric(4,2) check (grade >= 0 and grade <= 20),
  feedback text,
  updated_at timestamptz not null default now(),
  unique (group_id, evaluation_id)
);

create index course_evaluations_course_idx on public.course_evaluations(course_id, position);
create index group_grades_group_idx on public.group_grades(group_id);
create index group_grades_evaluation_idx on public.group_grades(evaluation_id);

-- Enable RLS
alter table public.course_evaluations enable row level security;
alter table public.group_grades enable row level security;

-- Policies for course_evaluations
create policy "teachers read their course evaluations"
on public.course_evaluations for select to authenticated
using (public.is_teacher_of_course(course_id));

create policy "teachers create course evaluations"
on public.course_evaluations for insert to authenticated
with check (public.is_teacher_of_course(course_id));

create policy "teachers update course evaluations"
on public.course_evaluations for update to authenticated
using (public.is_teacher_of_course(course_id))
with check (public.is_teacher_of_course(course_id));

create policy "teachers delete course evaluations"
on public.course_evaluations for delete to authenticated
using (public.is_teacher_of_course(course_id));

create policy "students read course evaluations"
on public.course_evaluations for select to authenticated
using (exists (
  select 1 from public.course_students cs
  where cs.course_id = course_evaluations.course_id
    and cs.student_id = auth.uid()
    and cs.status = 'active'
));

-- Policies for group_grades
create policy "teachers read group grades"
on public.group_grades for select to authenticated
using (exists (
  select 1 from public.groups g
  where g.id = group_grades.group_id
    and public.is_teacher_of_course(g.course_id)
));

create policy "teachers insert group grades"
on public.group_grades for insert to authenticated
with check (exists (
  select 1 from public.groups g
  where g.id = group_grades.group_id
    and public.is_teacher_of_course(g.course_id)
));

create policy "teachers update group grades"
on public.group_grades for update to authenticated
using (exists (
  select 1 from public.groups g
  where g.id = group_grades.group_id
    and public.is_teacher_of_course(g.course_id)
))
with check (exists (
  select 1 from public.groups g
  where g.id = group_grades.group_id
    and public.is_teacher_of_course(g.course_id)
));

create policy "teachers delete group grades"
on public.group_grades for delete to authenticated
using (exists (
  select 1 from public.groups g
  where g.id = group_grades.group_id
    and public.is_teacher_of_course(g.course_id)
));

create policy "students read group grades"
on public.group_grades for select to authenticated
using (exists (
  select 1 from public.course_students cs
  where cs.group_id = group_grades.group_id
    and cs.student_id = auth.uid()
    and cs.status = 'active'
));

-- Function to seed default evaluations (T1, T2, T3) for existing or new courses
create or replace function public.ensure_default_evaluations(target_course_id bigint)
returns setof public.course_evaluations
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'not_course_teacher';
  end if;

  if not exists (select 1 from public.course_evaluations where course_id = target_course_id) then
    insert into public.course_evaluations (course_id, name, position)
    values
      (target_course_id, 'T1', 1),
      (target_course_id, 'T2', 2),
      (target_course_id, 'T3', 3);
  end if;

  return query
  select * from public.course_evaluations
  where course_id = target_course_id
  order by position, id;
end;
$$;

revoke all on function public.ensure_default_evaluations(bigint) from public;
grant execute on function public.ensure_default_evaluations(bigint) to authenticated;

-- Trigger to seed T1, T2, T3 when a course is created
create or replace function public.seed_course_default_evaluations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.course_evaluations (course_id, name, position)
  values
    (new.id, 'T1', 1),
    (new.id, 'T2', 2),
    (new.id, 'T3', 3);
  return new;
end;
$$;

create trigger tr_seed_course_evaluations
after insert on public.courses
for each row
execute function public.seed_course_default_evaluations();
