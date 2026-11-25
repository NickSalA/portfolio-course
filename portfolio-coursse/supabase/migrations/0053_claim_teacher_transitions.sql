-- REC-03 (#33): Teacher-only ordered claim transitions (pending -> in_review -> responded),
-- final motivated response without academic mutations, and teacher claim listing for REC-05.
begin;

create function public.start_claim_review(
  target_claim_public_id uuid
)
returns table (
  claim_public_id uuid,
  status text,
  transitioned boolean,
  in_review_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target_claim public.claims%rowtype;
  updated_claim public.claims%rowtype;
begin
  if caller_id is null or not public.has_academic_identity() then
    raise exception 'claim_auth_required' using errcode = '42501';
  end if;

  if target_claim_public_id is null then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  select c.*
    into target_claim
  from public.claims c
  where c.public_id = target_claim_public_id
  for update;

  if not found then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  if not public.is_teacher_of_course(target_claim.course_id) then
    raise exception 'claim_teacher_access_denied' using errcode = '42501';
  end if;

  if target_claim.status = 'responded' then
    raise exception 'claim_response_is_final' using errcode = '23514';
  end if;

  if target_claim.status = 'in_review' then
    return query
    select
      target_claim.public_id,
      target_claim.status,
      false,
      target_claim.in_review_at;
    return;
  end if;

  update public.claims c
  set status = 'in_review',
      reviewed_by = caller_id,
      in_review_at = pg_catalog.clock_timestamp()
  where c.id = target_claim.id
  returning * into updated_claim;

  return query
  select
    updated_claim.public_id,
    updated_claim.status,
    true,
    updated_claim.in_review_at;
end;
$$;

revoke all on function public.start_claim_review(uuid) from public, anon;
grant execute on function public.start_claim_review(uuid) to authenticated;

create function public.respond_to_claim(
  target_claim_public_id uuid,
  response_text text
)
returns table (
  claim_public_id uuid,
  status text,
  teacher_response text,
  responded_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  trimmed_response text := nullif(trim(coalesce(response_text, '')), '');
  target_claim public.claims%rowtype;
  updated_claim public.claims%rowtype;
begin
  if caller_id is null or not public.has_academic_identity() then
    raise exception 'claim_auth_required' using errcode = '42501';
  end if;

  if trimmed_response is null or char_length(trimmed_response) > 2000 then
    raise exception 'claim_response_invalid' using errcode = '22023';
  end if;

  if target_claim_public_id is null then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  select c.*
    into target_claim
  from public.claims c
  where c.public_id = target_claim_public_id
  for update;

  if not found then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  if not public.is_teacher_of_course(target_claim.course_id) then
    raise exception 'claim_teacher_access_denied' using errcode = '42501';
  end if;

  if target_claim.status = 'responded' then
    raise exception 'claim_response_is_final' using errcode = '23514';
  end if;

  if target_claim.status <> 'in_review' then
    raise exception 'claim_must_be_in_review' using errcode = '23514';
  end if;

  update public.claims c
  set status = 'responded',
      teacher_response = trimmed_response,
      reviewed_by = caller_id,
      responded_at = pg_catalog.clock_timestamp()
  where c.id = target_claim.id
  returning * into updated_claim;

  return query
  select
    updated_claim.public_id,
    updated_claim.status,
    updated_claim.teacher_response,
    updated_claim.responded_at;
end;
$$;

revoke all on function public.respond_to_claim(uuid, text) from public, anon;
grant execute on function public.respond_to_claim(uuid, text) to authenticated;

create function public.list_teacher_claims(
  target_course_id bigint default null
)
returns table (
  claim_public_id uuid,
  course_id bigint,
  course_public_id uuid,
  course_name text,
  period_code text,
  claim_type text,
  status text,
  group_public_id uuid,
  group_name text,
  evaluation_public_id uuid,
  evaluation_name text,
  evaluation_performed_at timestamptz,
  group_grade numeric,
  point_transaction_id bigint,
  point_amount integer,
  point_reason text,
  point_is_voided boolean,
  point_created_at timestamptz,
  submitted_by_name text,
  submitted_by_email text,
  reason text,
  teacher_response text,
  reviewed_by_name text,
  created_at timestamptz,
  in_review_at timestamptz,
  responded_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_teacher() then
    raise exception 'claim_teacher_access_denied' using errcode = '42501';
  end if;

  if target_course_id is not null and not public.is_teacher_of_course(target_course_id) then
    raise exception 'claim_teacher_access_denied' using errcode = '42501';
  end if;

  return query
  select
    c.public_id,
    c.course_id,
    co.public_id,
    co.name,
    ap.code,
    c.claim_type,
    c.status,
    g.public_id,
    g.name,
    e.public_id,
    e.name,
    e.performed_at,
    gg.grade,
    c.point_transaction_id,
    pt.points,
    pt.reason,
    pt.is_voided,
    pt.created_at,
    coalesce(
      nullif(trim(sub_auth.full_name), ''),
      nullif(trim(sub_profile.full_name), ''),
      sub_auth.email,
      'Alumno'
    ) as submitted_by_name,
    coalesce(sub_auth.email, sub_profile.email, '') as submitted_by_email,
    c.reason,
    c.teacher_response,
    nullif(trim(rev_profile.full_name), '') as reviewed_by_name,
    c.created_at,
    c.in_review_at,
    c.responded_at
  from public.claims c
  join public.courses co
    on co.id = c.course_id
   and public.is_teacher_of_course(co.id)
  left join public.academic_periods ap
    on ap.id = co.period_id
  left join public.groups g
    on g.id = c.group_id
   and g.course_id = c.course_id
  left join public.course_evaluations e
    on e.id = c.evaluation_id
   and e.course_id = c.course_id
  left join public.group_grades gg
    on gg.group_id = c.group_id
   and gg.evaluation_id = c.evaluation_id
   and gg.revision > 0
  left join public.point_transactions pt
    on pt.id = c.point_transaction_id
   and pt.authorized_student_id = c.authorized_student_id
  left join public.course_students sub_cs
    on sub_cs.id = c.submitted_by_enrollment_id
   and sub_cs.course_id = c.course_id
  left join public.authorized_students sub_auth
    on sub_auth.id = sub_cs.authorized_student_id
   and sub_auth.course_id = c.course_id
  left join public.profiles sub_profile
    on sub_profile.id = c.submitted_by_student_id
  left join public.profiles rev_profile
    on rev_profile.id = c.reviewed_by
  where (target_course_id is null or c.course_id = target_course_id)
  order by
    case c.status
      when 'pending' then 1
      when 'in_review' then 2
      else 3
    end,
    c.created_at desc,
    c.id desc;
end;
$$;

revoke all on function public.list_teacher_claims(bigint) from public, anon;
grant execute on function public.list_teacher_claims(bigint) to authenticated;

comment on function public.start_claim_review(uuid) is
  'Responsible teacher transitions a pending claim to in_review (idempotent when already in_review; rejects responded) (REC-03).';
comment on function public.respond_to_claim(uuid, text) is
  'Responsible teacher emits final motivated response from in_review -> responded without mutating grades or points (REC-03).';
comment on function public.list_teacher_claims(bigint) is
  'Read-only teacher inbox lookup returning claims across authorized courses with historical grade/point context (REC-03/REC-05).';

commit;

