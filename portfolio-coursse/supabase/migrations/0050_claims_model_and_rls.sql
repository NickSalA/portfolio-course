-- REC-01: claims schema, historical/owner authorization (RLS), and permanent uniqueness.
begin;

alter table public.course_evaluations
  add constraint course_evaluations_course_id_id_key unique (course_id, id);

alter table public.authorized_students
  add constraint authorized_students_course_id_id_key unique (course_id, id);

alter table public.point_transactions
  add constraint point_transactions_id_authorized_key unique (id, authorized_student_id);

create table public.claims (
  id bigint generated always as identity primary key,
  public_id uuid not null default gen_random_uuid() unique,
  course_id bigint not null references public.courses(id) on delete restrict,
  claim_type text not null check (claim_type in ('group_grade', 'point_transaction')),
  status text not null default 'pending' check (status in ('pending', 'in_review', 'responded')),
  group_id bigint,
  evaluation_id bigint,
  point_transaction_id bigint,
  authorized_student_id bigint,
  submitted_by_enrollment_id bigint not null,
  submitted_by_student_id uuid not null references public.profiles(id) on delete restrict,
  reason text not null check (char_length(trim(reason)) between 1 and 2000),
  teacher_response text check (teacher_response is null or char_length(trim(teacher_response)) between 1 and 2000),
  reviewed_by uuid references public.profiles(id) on delete restrict,
  in_review_at timestamptz,
  responded_at timestamptz,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  foreign key (course_id, group_id)
    references public.groups(course_id, id) on delete restrict,
  foreign key (course_id, evaluation_id)
    references public.course_evaluations(course_id, id) on delete restrict,
  foreign key (course_id, authorized_student_id)
    references public.authorized_students(course_id, id) on delete restrict,
  foreign key (point_transaction_id, authorized_student_id)
    references public.point_transactions(id, authorized_student_id) on delete restrict,
  foreign key (submitted_by_enrollment_id, course_id, submitted_by_student_id)
    references public.course_students(id, course_id, student_id) on delete restrict,
  constraint claims_type_targets_check check (
    (claim_type = 'group_grade'
      and group_id is not null
      and evaluation_id is not null
      and point_transaction_id is null
      and authorized_student_id is null)
    or (claim_type = 'point_transaction'
      and point_transaction_id is not null
      and authorized_student_id is not null
      and group_id is null
      and evaluation_id is null)
  ),
  constraint claims_status_fields_check check (
    (status = 'pending'
      and teacher_response is null
      and reviewed_by is null
      and in_review_at is null
      and responded_at is null)
    or (status = 'in_review'
      and teacher_response is null
      and reviewed_by is not null
      and in_review_at is not null
      and responded_at is null)
    or (status = 'responded'
      and teacher_response is not null
      and reviewed_by is not null
      and responded_at is not null)
  )
);

-- Permanent uniqueness across the full lifetime of a claim, including responded rows.
create unique index claims_group_evaluation_unique_idx
  on public.claims (group_id, evaluation_id)
  where claim_type = 'group_grade';

create unique index claims_point_transaction_unique_idx
  on public.claims (point_transaction_id)
  where claim_type = 'point_transaction';

create index claims_course_status_created_idx
  on public.claims (course_id, status, created_at desc);

create index claims_submitter_idx
  on public.claims (submitted_by_student_id, created_at desc);

create function academic_access.is_historical_group_participant(
  target_course_id bigint,
  target_group_id bigint,
  target_evaluation_id bigint,
  target_enrollment_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_students cs
    join public.profiles student
      on student.id = cs.student_id
     and student.role is distinct from 'teacher'
    join public.course_evaluations e
      on e.id = target_evaluation_id
     and e.course_id = cs.course_id
    where cs.id = target_enrollment_id
      and cs.course_id = target_course_id
      and cs.student_id = auth.uid()
      and academic_access.can_read_enrollment(cs.course_id, null, cs.id)
      and (
        exists (
          select 1
          from public.group_grades gg
          join academic_access.group_grade_participants p
            on p.group_id = gg.group_id
           and p.evaluation_id = gg.evaluation_id
          where gg.group_id = target_group_id
            and gg.evaluation_id = target_evaluation_id
            and gg.revision > 0
            and p.enrollment_id = cs.id
        )
        or (
          e.performed_at is not null
          and not exists (
            select 1
            from public.group_grades gg
            where gg.group_id = target_group_id
              and gg.evaluation_id = target_evaluation_id
              and gg.grade is not null
          )
          and exists (
            select 1
            from academic_access.group_membership_history h
            where h.enrollment_id = cs.id
              and h.course_id = cs.course_id
              and h.membership_state = 'grouped'
              and h.group_id = target_group_id
              and pg_catalog.tstzrange(h.valid_from, h.valid_until, '[)') @> e.performed_at
          )
        )
      )
  );
$$;

create function academic_access.can_read_historical_group_claim(
  target_course_id bigint,
  target_group_id bigint,
  target_evaluation_id bigint
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.course_students cs
    where cs.course_id = target_course_id
      and cs.student_id = auth.uid()
      and academic_access.is_historical_group_participant(
        target_course_id,
        target_group_id,
        target_evaluation_id,
        cs.id
      )
  );
$$;

revoke all on function academic_access.is_historical_group_participant(bigint, bigint, bigint, bigint) from public, anon;
grant execute on function academic_access.is_historical_group_participant(bigint, bigint, bigint, bigint) to authenticated;

revoke all on function academic_access.can_read_historical_group_claim(bigint, bigint, bigint) from public, anon;
grant execute on function academic_access.can_read_historical_group_claim(bigint, bigint, bigint) to authenticated;

create function academic_access.validate_claim_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'claims_cannot_be_deleted' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'pending' then
      raise exception 'claim_must_start_pending' using errcode = '22023';
    end if;

    if not exists (
      select 1 from public.courses c
      where c.id = new.course_id and c.active = true
    ) then
      raise exception 'course_not_active' using errcode = '23514';
    end if;

    if auth.uid() is not null and new.submitted_by_student_id is distinct from auth.uid() then
      raise exception 'claim_submitter_mismatch' using errcode = '42501';
    end if;

    if new.claim_type = 'group_grade' then
      if auth.uid() is not null and not academic_access.is_historical_group_participant(
        new.course_id,
        new.group_id,
        new.evaluation_id,
        new.submitted_by_enrollment_id
      ) then
        raise exception 'claim_group_access_denied' using errcode = '42501';
      end if;
    elsif new.claim_type = 'point_transaction' then
      if auth.uid() is not null and not academic_access.can_read_enrollment(
        new.course_id,
        null,
        new.submitted_by_enrollment_id,
        new.authorized_student_id
      ) then
        raise exception 'claim_point_access_denied' using errcode = '42501';
      end if;
    end if;

    return new;
  end if;

  -- Preserve immutable identity and prevent reopening/editing responded claims.
  if new.course_id is distinct from old.course_id
     or new.claim_type is distinct from old.claim_type
     or new.group_id is distinct from old.group_id
     or new.evaluation_id is distinct from old.evaluation_id
     or new.point_transaction_id is distinct from old.point_transaction_id
     or new.authorized_student_id is distinct from old.authorized_student_id
     or new.submitted_by_enrollment_id is distinct from old.submitted_by_enrollment_id
     or new.submitted_by_student_id is distinct from old.submitted_by_student_id
     or new.reason is distinct from old.reason
     or new.created_at is distinct from old.created_at then
    raise exception 'claim_identity_is_immutable' using errcode = '23514';
  end if;

  if old.status = 'responded' then
    raise exception 'claim_response_is_final' using errcode = '23514';
  end if;

  if old.status = 'pending' and new.status not in ('pending', 'in_review', 'responded') then
    raise exception 'invalid_claim_transition' using errcode = '22023';
  end if;

  if old.status = 'in_review' and new.status not in ('in_review', 'responded') then
    raise exception 'invalid_claim_transition' using errcode = '22023';
  end if;

  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$$;

revoke all on function academic_access.validate_claim_mutation() from public, anon, authenticated;

create trigger guard_claim_mutation
before insert or update or delete on public.claims
for each row execute function academic_access.validate_claim_mutation();

alter table public.claims enable row level security;

revoke all on table public.claims from public, anon;
grant select, insert on table public.claims to authenticated;

create policy "teachers read course claims"
on public.claims for select to authenticated
using (public.is_teacher_of_course(course_id));

create policy "students read historical group claims"
on public.claims for select to authenticated
using (
  claim_type = 'group_grade'
  and academic_access.can_read_historical_group_claim(course_id, group_id, evaluation_id)
);

create policy "students read own point claims"
on public.claims for select to authenticated
using (
  claim_type = 'point_transaction'
  and academic_access.can_read_enrollment(course_id, null, null, authorized_student_id)
);

create policy "students submit historical group claims"
on public.claims for insert to authenticated
with check (
  claim_type = 'group_grade'
  and status = 'pending'
  and submitted_by_student_id = auth.uid()
  and academic_access.is_historical_group_participant(
    course_id,
    group_id,
    evaluation_id,
    submitted_by_enrollment_id
  )
);

create policy "students submit own point claims"
on public.claims for insert to authenticated
with check (
  claim_type = 'point_transaction'
  and status = 'pending'
  and submitted_by_student_id = auth.uid()
  and academic_access.can_read_enrollment(
    course_id,
    null,
    submitted_by_enrollment_id,
    authorized_student_id
  )
);

comment on table public.claims is
  'Group grade and individual point claims (REC-01). Permanent uniqueness per target; historical participant/owner/teacher visibility via RLS.';

commit;
