-- Points are academic records for an authorization, not proof that a student logged in.
alter table public.point_transactions
  add column if not exists authorized_student_id bigint references public.authorized_students(id) on delete restrict;

update public.point_transactions point_transaction
set authorized_student_id = authorized_student.id
from public.course_students enrollment
join public.profiles student on student.id = enrollment.student_id
join public.authorized_students authorized_student
  on authorized_student.course_id = enrollment.course_id
 and lower(trim(authorized_student.email)) = lower(trim(student.email))
where point_transaction.course_student_id = enrollment.id;

do $$
begin
  if exists (
    select 1 from public.point_transactions
    where authorized_student_id is null
  ) then
    raise exception 'point_transaction_without_authorization';
  end if;
end;
$$;

drop policy if exists "teachers read points" on public.point_transactions;
drop policy if exists "students read own points" on public.point_transactions;
drop policy if exists "teachers create points" on public.point_transactions;

alter table public.point_transactions
  alter column authorized_student_id set not null,
  drop constraint point_transactions_course_student_id_fkey,
  drop column course_student_id;

create index if not exists point_transactions_authorized_student_idx
  on public.point_transactions(authorized_student_id, created_at desc);

create policy "teachers read points"
on public.point_transactions for select to authenticated
using (exists (
  select 1 from public.authorized_students authorized_student
  where authorized_student.id = authorized_student_id
    and public.is_teacher_of_course(authorized_student.course_id)
));

create policy "students read own points"
on public.point_transactions for select to authenticated
using (exists (
  select 1
  from public.authorized_students authorized_student
  join public.profiles profile
    on lower(trim(profile.email)) = lower(trim(authorized_student.email))
  where authorized_student.id = authorized_student_id
    and profile.id = auth.uid()
    and authorized_student.status = 'active'
));

create policy "teachers create points"
on public.point_transactions for insert to authenticated
with check (
  created_by = auth.uid()
  and exists (
    select 1 from public.authorized_students authorized_student
    where authorized_student.id = authorized_student_id
      and authorized_student.status = 'active'
      and public.is_teacher_of_course(authorized_student.course_id)
  )
);
