-- REC-02 (#32): Atomic, idempotent submission RPCs for group grade and point
-- transaction claims, plus student claim listing with public identifiers.
begin;

create function public.submit_group_grade_claim(
  target_group_public_id uuid,
  target_evaluation_public_id uuid,
  claim_reason text
)
returns table (
  claim_public_id uuid,
  claim_type text,
  status text,
  created boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  trimmed_reason text := nullif(trim(coalesce(claim_reason, '')), '');
  target_course_id bigint;
  target_group_id bigint;
  target_evaluation_id bigint;
  course_active boolean;
  caller_enrollment_id bigint;
  inserted_claim public.claims%rowtype;
  existing_claim public.claims%rowtype;
begin
  if caller_id is null or not public.has_academic_identity() then
    raise exception 'claim_auth_required' using errcode = '42501';
  end if;

  if trimmed_reason is null or char_length(trimmed_reason) > 2000 then
    raise exception 'claim_reason_invalid' using errcode = '22023';
  end if;

  if target_group_public_id is null or target_evaluation_public_id is null then
    raise exception 'claim_target_not_found' using errcode = 'P0002';
  end if;

  select g.id, g.course_id, e.id, c.active
    into target_group_id, target_course_id, target_evaluation_id, course_active
  from public.groups g
  join public.course_evaluations e
    on e.course_id = g.course_id
   and e.public_id = target_evaluation_public_id
  join public.courses c
    on c.id = g.course_id
  where g.public_id = target_group_public_id;

  if not found then
    raise exception 'claim_target_not_found' using errcode = 'P0002';
  end if;

  if not course_active then
    raise exception 'course_not_active' using errcode = '23514';
  end if;

  select cs.id
    into caller_enrollment_id
  from public.course_students cs
  where cs.course_id = target_course_id
    and cs.student_id = caller_id
    and academic_access.is_historical_group_participant(
      target_course_id,
      target_group_id,
      target_evaluation_id,
      cs.id
    )
  order by cs.id
  limit 1;

  if caller_enrollment_id is null then
    raise exception 'claim_group_access_denied' using errcode = '42501';
  end if;

  begin
    insert into public.claims (
      course_id,
      claim_type,
      status,
      group_id,
      evaluation_id,
      submitted_by_enrollment_id,
      submitted_by_student_id,
      reason
    ) values (
      target_course_id,
      'group_grade',
      'pending',
      target_group_id,
      target_evaluation_id,
      caller_enrollment_id,
      caller_id,
      trimmed_reason
    )
    returning * into inserted_claim;

    return query
    select
      inserted_claim.public_id,
      inserted_claim.claim_type,
      inserted_claim.status,
      true,
      inserted_claim.created_at;
    return;
  exception
    when unique_violation then
      select c.*
        into existing_claim
      from public.claims c
      where c.claim_type = 'group_grade'
        and c.group_id = target_group_id
        and c.evaluation_id = target_evaluation_id;

      if found
         and existing_claim.submitted_by_student_id = caller_id
         and existing_claim.status = 'pending'
         and trim(existing_claim.reason) = trimmed_reason then
        return query
        select
          existing_claim.public_id,
          existing_claim.claim_type,
          existing_claim.status,
          false,
          existing_claim.created_at;
        return;
      end if;

      raise exception 'claim_already_exists' using errcode = '23505';
  end;
end;
$$;

revoke all on function public.submit_group_grade_claim(uuid, uuid, text) from public, anon;
grant execute on function public.submit_group_grade_claim(uuid, uuid, text) to authenticated;

create function public.submit_point_transaction_claim(
  target_point_transaction_id bigint,
  claim_reason text
)
returns table (
  claim_public_id uuid,
  claim_type text,
  status text,
  created boolean,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  trimmed_reason text := nullif(trim(coalesce(claim_reason, '')), '');
  target_course_id bigint;
  target_authorized_student_id bigint;
  course_active boolean;
  caller_enrollment_id bigint;
  inserted_claim public.claims%rowtype;
  existing_claim public.claims%rowtype;
begin
  if caller_id is null or not public.has_academic_identity() then
    raise exception 'claim_auth_required' using errcode = '42501';
  end if;

  if trimmed_reason is null or char_length(trimmed_reason) > 2000 then
    raise exception 'claim_reason_invalid' using errcode = '22023';
  end if;

  if target_point_transaction_id is null or target_point_transaction_id <= 0 then
    raise exception 'claim_target_not_found' using errcode = 'P0002';
  end if;

  select a.course_id, pt.authorized_student_id, c.active
    into target_course_id, target_authorized_student_id, course_active
  from public.point_transactions pt
  join public.authorized_students a
    on a.id = pt.authorized_student_id
  join public.courses c
    on c.id = a.course_id
  where pt.id = target_point_transaction_id;

  if not found then
    raise exception 'claim_target_not_found' using errcode = 'P0002';
  end if;

  if not course_active then
    raise exception 'course_not_active' using errcode = '23514';
  end if;

  select cs.id
    into caller_enrollment_id
  from public.course_students cs
  join public.profiles student
    on student.id = cs.student_id
   and student.role is distinct from 'teacher'
  where cs.course_id = target_course_id
    and cs.student_id = caller_id
    and cs.authorized_student_id = target_authorized_student_id
    and academic_access.can_read_enrollment(
      target_course_id,
      null,
      cs.id,
      target_authorized_student_id
    )
  order by cs.id
  limit 1;

  if caller_enrollment_id is null then
    raise exception 'claim_point_access_denied' using errcode = '42501';
  end if;

  begin
    insert into public.claims (
      course_id,
      claim_type,
      status,
      point_transaction_id,
      authorized_student_id,
      submitted_by_enrollment_id,
      submitted_by_student_id,
      reason
    ) values (
      target_course_id,
      'point_transaction',
      'pending',
      target_point_transaction_id,
      target_authorized_student_id,
      caller_enrollment_id,
      caller_id,
      trimmed_reason
    )
    returning * into inserted_claim;

    return query
    select
      inserted_claim.public_id,
      inserted_claim.claim_type,
      inserted_claim.status,
      true,
      inserted_claim.created_at;
    return;
  exception
    when unique_violation then
      select c.*
        into existing_claim
      from public.claims c
      where c.claim_type = 'point_transaction'
        and c.point_transaction_id = target_point_transaction_id;

      if found
         and existing_claim.submitted_by_student_id = caller_id
         and existing_claim.status = 'pending'
         and trim(existing_claim.reason) = trimmed_reason then
        return query
        select
          existing_claim.public_id,
          existing_claim.claim_type,
          existing_claim.status,
          false,
          existing_claim.created_at;
        return;
      end if;

      raise exception 'claim_already_exists' using errcode = '23505';
  end;
end;
$$;

revoke all on function public.submit_point_transaction_claim(bigint, text) from public, anon;
grant execute on function public.submit_point_transaction_claim(bigint, text) to authenticated;

create function public.list_student_claims(
  target_course_id bigint default null
)
returns table (
  claim_public_id uuid,
  course_id bigint,
  claim_type text,
  status text,
  group_public_id uuid,
  group_name text,
  evaluation_public_id uuid,
  evaluation_name text,
  point_transaction_id bigint,
  submitted_by_name text,
  is_submitted_by_me boolean,
  reason text,
  teacher_response text,
  created_at timestamptz,
  in_review_at timestamptz,
  responded_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.public_id,
    c.course_id,
    c.claim_type,
    c.status,
    g.public_id,
    g.name,
    e.public_id,
    e.name,
    c.point_transaction_id,
    coalesce(
      nullif(trim(sub_auth.full_name), ''),
      nullif(trim(sub_profile.full_name), ''),
      'Participante'
    ) as submitted_by_name,
    (c.submitted_by_student_id = auth.uid()) as is_submitted_by_me,
    c.reason,
    c.teacher_response,
    c.created_at,
    c.in_review_at,
    c.responded_at
  from public.claims c
  join public.profiles caller_profile
    on caller_profile.id = auth.uid()
   and caller_profile.role is distinct from 'teacher'
  left join public.groups g
    on g.id = c.group_id
   and g.course_id = c.course_id
  left join public.course_evaluations e
    on e.id = c.evaluation_id
   and e.course_id = c.course_id
  left join public.course_students sub_cs
    on sub_cs.id = c.submitted_by_enrollment_id
   and sub_cs.course_id = c.course_id
  left join public.authorized_students sub_auth
    on sub_auth.id = sub_cs.authorized_student_id
   and sub_auth.course_id = c.course_id
  left join public.profiles sub_profile
    on sub_profile.id = c.submitted_by_student_id
  where (target_course_id is null or c.course_id = target_course_id)
    and (
      (
        c.claim_type = 'group_grade'
        and academic_access.can_read_historical_group_claim(
          c.course_id,
          c.group_id,
          c.evaluation_id
        )
      )
      or (
        c.claim_type = 'point_transaction'
        and academic_access.can_read_enrollment(
          c.course_id,
          null,
          null,
          c.authorized_student_id
        )
      )
    )
  order by c.created_at desc, c.id desc;
$$;

revoke all on function public.list_student_claims(bigint) from public, anon;
grant execute on function public.list_student_claims(bigint) to authenticated;

comment on function public.submit_group_grade_claim(uuid, uuid, text) is
  'Submits a pending group grade claim on behalf of historical participants with idempotent same-submitter retry and permanent uniqueness (REC-02).';
comment on function public.submit_point_transaction_claim(bigint, text) is
  'Submits a pending individual point claim for the owning student with idempotent same-submitter retry and permanent uniqueness (REC-02).';
comment on function public.list_student_claims(bigint) is
  'Lists claims visible to the authenticated student (historical group claims and own point claims) with public target identifiers.';

commit;

