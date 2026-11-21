begin;

-- Reviews are private, immutable evidence; confirmation appends a separate audit row.
create table academic_access.activity_date_reviews (
  id uuid primary key default gen_random_uuid(),
  course_id bigint not null references public.courses(id) on delete restrict,
  evaluation_id bigint not null references public.course_evaluations(id) on delete restrict,
  actor_id uuid not null,
  old_at timestamptz not null,
  new_at timestamptz not null,
  reason text not null check (length(trim(reason)) > 0),
  impact jsonb not null,
  created_at timestamptz not null default clock_timestamp()
);
create table academic_access.activity_date_corrections (
  review_id uuid primary key references academic_access.activity_date_reviews(id) on delete restrict,
  transaction_id bigint not null,
  corrected_at timestamptz not null default clock_timestamp()
);
revoke all on academic_access.activity_date_reviews, academic_access.activity_date_corrections from public, anon, authenticated;
alter table academic_access.activity_date_reviews enable row level security;
alter table academic_access.activity_date_corrections enable row level security;

-- Materialize both complete retained rosters, not just changed rows: unknown is
-- preserved and clients can see unchanged rows and roster-completeness limits.
create function academic_access.activity_date_impact(target_course bigint, old_time timestamptz, new_time timestamptz)
returns jsonb language sql stable set search_path = '' as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'enrollment_id', r.enrollment_id, 'authorization_id', r.authorization_id,
    'student_id', r.student_id,
    'old_state', coalesce(o.membership_state, 'unknown'), 'old_group_id', o.group_id,
    'new_state', coalesce(n.membership_state, 'unknown'), 'new_group_id', n.group_id
  ) order by r.enrollment_id nulls last, r.authorization_id), '[]'::jsonb)
  from (
    select cs.id enrollment_id, cs.authorized_student_id authorization_id, cs.student_id
    from public.course_students cs where cs.course_id = target_course
    union all
    select null::bigint, a.id, null::uuid from public.authorized_students a
    where a.course_id = target_course and not exists
      (select 1 from public.course_students cs where cs.authorized_student_id = a.id)
  ) r
  left join academic_access.group_membership_history o on o.enrollment_id = r.enrollment_id
    and pg_catalog.tstzrange(o.valid_from, o.valid_until, '[)') @> old_time
  left join academic_access.group_membership_history n on n.enrollment_id = r.enrollment_id
    and pg_catalog.tstzrange(n.valid_from, n.valid_until, '[)') @> new_time;
$$;
revoke all on function academic_access.activity_date_impact(bigint,timestamptz,timestamptz) from public, anon, authenticated;

create function public.review_activity_date_correction(target_course_id bigint, target_evaluation_id bigint, proposed_at timestamptz, correction_reason text)
returns table (review_id uuid, old_at timestamptz, new_at timestamptz, impact jsonb)
language plpgsql security definer set search_path = '' as $$
declare current_at timestamptz; snapshot jsonb; rid uuid;
begin
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'activity_correction_requires_read_committed' using errcode = '25001';
  end if;
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'activity_access_denied' using errcode = '42501';
  end if;
  if proposed_at is null or not pg_catalog.isfinite(proposed_at) or proposed_at > statement_timestamp()
     or correction_reason is null or length(trim(correction_reason)) = 0 then
    raise exception 'invalid_activity_correction' using errcode = '22023';
  end if;
  select e.performed_at into current_at from public.course_evaluations e
    where e.id = target_evaluation_id and e.course_id = target_course_id for update;
  if not found then raise exception 'activity_not_found' using errcode = 'P0002'; end if;
  if current_at is null then raise exception 'activity_time_required' using errcode = '22004'; end if;
  if current_at = proposed_at then raise exception 'activity_time_unchanged' using errcode = '22023'; end if;
  lock table public.authorized_students, public.course_students, academic_access.group_membership_history in share mode;
  snapshot := academic_access.activity_date_impact(target_course_id, current_at, proposed_at);
  insert into academic_access.activity_date_reviews(course_id, evaluation_id, actor_id, old_at, new_at, reason, impact)
    values (target_course_id, target_evaluation_id, auth.uid(), current_at, proposed_at, trim(correction_reason), snapshot)
    returning id into rid;
  return query select rid, current_at, proposed_at, snapshot;
end;
$$;
revoke all on function public.review_activity_date_correction(bigint,bigint,timestamptz,text) from public, anon;
grant execute on function public.review_activity_date_correction(bigint,bigint,timestamptz,text) to authenticated;

-- Only an audited correction inserted in this transaction can cross the guard.
create or replace function academic_access.guard_activity_time()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'DELETE' then
    if old.performed_at is not null then raise exception 'dated_activity_cannot_be_deleted' using errcode = '23514'; end if;
    return old;
  end if;
  if tg_op = 'INSERT' then
    if new.performed_at is not null then raise exception 'activity_time_requires_rpc' using errcode = '42501'; end if;
    return new;
  end if;
  if old.performed_at is not null and new.course_id is distinct from old.course_id then
    raise exception 'activity_time_is_immutable' using errcode = '23514';
  end if;
  if new.performed_at is distinct from old.performed_at then
    if not pg_catalog.pg_has_role(current_user, (select relowner from pg_catalog.pg_class where oid = tg_relid), 'USAGE') then
      if old.performed_at is not null then raise exception 'activity_time_is_immutable' using errcode = '23514'; end if;
      raise exception 'activity_time_requires_rpc' using errcode = '42501';
    end if;
    if new.performed_at is null or not pg_catalog.isfinite(new.performed_at) or new.performed_at > statement_timestamp() then
      raise exception 'invalid_activity_time' using errcode = '22023';
    end if;
    if old.performed_at is not null and not exists (
      select 1 from academic_access.activity_date_corrections c
      join academic_access.activity_date_reviews r on r.id = c.review_id
      where c.transaction_id = pg_catalog.txid_current() and r.evaluation_id = old.id
        and r.course_id = old.course_id and r.old_at = old.performed_at and r.new_at = new.performed_at
        and r.actor_id = auth.uid()
    ) then raise exception 'activity_time_is_immutable' using errcode = '23514'; end if;
  end if;
  return new;
end;
$$;

create function public.confirm_activity_date_correction(target_course_id bigint, target_evaluation_id bigint, reviewed_id uuid)
returns timestamptz language plpgsql security definer set search_path = '' as $$
declare r academic_access.activity_date_reviews%rowtype; current_at timestamptz;
begin
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'activity_correction_requires_read_committed' using errcode = '25001';
  end if;
  if not public.is_teacher_of_course(target_course_id) then raise exception 'activity_access_denied' using errcode = '42501'; end if;
  select e.performed_at into current_at from public.course_evaluations e
    where e.id = target_evaluation_id and e.course_id = target_course_id for update;
  if not found then raise exception 'activity_not_found' using errcode = 'P0002'; end if;
  select * into r from academic_access.activity_date_reviews where id = reviewed_id
    and course_id = target_course_id and evaluation_id = target_evaluation_id and actor_id = auth.uid();
  if not found then raise exception 'activity_review_not_found' using errcode = 'P0002'; end if;
  if exists (select 1 from academic_access.activity_date_corrections where review_id = reviewed_id) then
    raise exception 'activity_review_already_used' using errcode = '23505';
  end if;
  lock table public.authorized_students, public.course_students, academic_access.group_membership_history in share mode;
  if current_at is distinct from r.old_at or
     academic_access.activity_date_impact(target_course_id, r.old_at, r.new_at) is distinct from r.impact then
    raise exception 'activity_review_stale' using errcode = '40001';
  end if;
  insert into academic_access.activity_date_corrections(review_id, transaction_id) values (r.id, pg_catalog.txid_current());
  update public.course_evaluations set performed_at = r.new_at where id = target_evaluation_id;
  return r.new_at;
end;
$$;
revoke all on function public.confirm_activity_date_correction(bigint,bigint,uuid) from public, anon;
grant execute on function public.confirm_activity_date_correction(bigint,bigint,uuid) to authenticated;

comment on column public.course_evaluations.performed_at is 'Instant of activity; initial setting and audited corrections require their respective RPCs.';
commit;
