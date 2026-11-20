begin;

-- GRP-06 UI contract:
-- performed_at is an instant (send ISO 8601 with an explicit offset); NULL means
-- not yet defined, including all existing and automatically seeded evaluations.
-- set_activity_performed_at(course, evaluation, instant) is teacher-only,
-- accepts a finite non-future instant, and is idempotent for the same instant.
-- Once set it cannot be changed, cleared, moved to another course or deleted.
-- A correction requires a separately designed, audited administrative workflow.
-- resolve_activity_participants(course, evaluation) is teacher-only and returns
-- one row per currently retained enrollment, plus each authorization without an
-- enrollment. grouped is the only state identifying a participant/group;
-- ungrouped and inactive are known non-participation states, unknown is not.
-- A missing activity instant raises activity_time_required, not an empty result.
-- Intervals are [from, until): at an exact change the new state applies. Unknown
-- includes before the 0039 cutover, gaps and authorizations without enrollment;
-- it must never be replaced with the current group. No row is evidence that the
-- historically complete roster is known: deleted/never-recorded people cannot be
-- inferred. Resolve unknowns and roster completeness before attributing results.
-- This interface grants no student access to grades or history (EVA-04 #27).

alter table public.course_evaluations add column performed_at timestamptz;

create function academic_access.guard_activity_time()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.performed_at is not null then
      raise exception 'dated_activity_cannot_be_deleted' using errcode = '23514';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    if new.performed_at is not null then
      raise exception 'activity_time_requires_rpc' using errcode = '42501';
    end if;
    return new;
  end if;

  if old.performed_at is not null and (
    new.performed_at is distinct from old.performed_at
    or new.course_id is distinct from old.course_id
  ) then
    raise exception 'activity_time_is_immutable' using errcode = '23514';
  end if;

  if new.performed_at is distinct from old.performed_at then
    -- The RPC executes as the table owner; a direct client write does not.
    if not pg_catalog.pg_has_role(current_user, (select relowner from pg_catalog.pg_class where oid = tg_relid), 'USAGE') then
      raise exception 'activity_time_requires_rpc' using errcode = '42501';
    end if;
    if new.performed_at is null or not pg_catalog.isfinite(new.performed_at)
       or new.performed_at > pg_catalog.statement_timestamp() then
      raise exception 'invalid_activity_time' using errcode = '22023';
    end if;
  end if;
  return new;
end;
$$;
revoke all on function academic_access.guard_activity_time() from public, anon, authenticated;

create trigger guard_activity_time
before insert or update or delete on public.course_evaluations
for each row execute function academic_access.guard_activity_time();

create function public.set_activity_performed_at(
  target_course_id bigint, target_evaluation_id bigint, activity_at timestamptz
)
returns timestamptz
language plpgsql security definer set search_path = ''
as $$
declare existing_at timestamptz;
begin
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'activity_access_denied' using errcode = '42501';
  end if;
  if activity_at is null or not pg_catalog.isfinite(activity_at)
     or activity_at > pg_catalog.statement_timestamp() then
    raise exception 'invalid_activity_time' using errcode = '22023';
  end if;
  select e.performed_at into existing_at
  from public.course_evaluations e
  where e.id = target_evaluation_id and e.course_id = target_course_id
  for update;
  if not found then
    raise exception 'activity_not_found' using errcode = 'P0002';
  end if;
  if existing_at is not null and existing_at is distinct from activity_at then
    raise exception 'activity_time_is_immutable' using errcode = '23514';
  end if;
  if existing_at is null then
    update public.course_evaluations set performed_at = activity_at
    where id = target_evaluation_id;
  end if;
  return activity_at;
end;
$$;
revoke all on function public.set_activity_performed_at(bigint, bigint, timestamptz) from public, anon;
grant execute on function public.set_activity_performed_at(bigint, bigint, timestamptz) to authenticated;

create function public.resolve_activity_participants(target_course_id bigint, target_evaluation_id bigint)
returns table (enrollment_id bigint, authorization_id bigint, student_id uuid, membership_state text, group_id bigint)
language plpgsql stable security definer set search_path = ''
as $$
declare activity_at timestamptz;
begin
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'activity_access_denied' using errcode = '42501';
  end if;
  select e.performed_at into activity_at from public.course_evaluations e
  where e.id = target_evaluation_id and e.course_id = target_course_id;
  if not found then
    raise exception 'activity_not_found' using errcode = 'P0002';
  end if;
  if activity_at is null then
    raise exception 'activity_time_required' using errcode = '22004';
  end if;

  return query
  select cs.id, cs.authorized_student_id, cs.student_id,
         coalesce(h.membership_state, 'unknown'::text), h.group_id
  from public.course_students cs
  left join academic_access.group_membership_history h
    on h.enrollment_id = cs.id
   and pg_catalog.tstzrange(h.valid_from, h.valid_until, '[)') @> activity_at
  where cs.course_id = target_course_id
  union all
  select null::bigint, a.id, null::uuid, 'unknown'::text, null::bigint
  from public.authorized_students a
  where a.course_id = target_course_id
    and not exists (select 1 from public.course_students cs where cs.authorized_student_id = a.id);
end;
$$;
revoke all on function public.resolve_activity_participants(bigint, bigint) from public, anon;
grant execute on function public.resolve_activity_participants(bigint, bigint) to authenticated;

comment on column public.course_evaluations.performed_at is
  'Instant of activity; NULL means unknown. Set once with set_activity_performed_at; see GRP-06 migration for UI contract.';
comment on function public.resolve_activity_participants(bigint, bigint) is
  'Teacher-only current retained roster resolved against historical intervals; unknown is not non-participation. See GRP-06 migration for completeness limits.';

commit;
