-- Academic access uses the current, provider-verified Auth identity and a
-- live authorization. Existing inconsistent rows stay available to their owner
-- for review but cannot grant student access.
create schema if not exists academic_access;
revoke all on schema academic_access from public;
grant usage on schema academic_access to authenticated;

create function academic_access.verified_google_email(target_user_id uuid)
returns text
language sql stable security definer set search_path = ''
as $$
  select lower(trim(u.email))
  from auth.users u
  where u.id = target_user_id
    and nullif(trim(u.email), '') is not null
    and u.email_confirmed_at is not null
    and u.is_anonymous is not true
    and exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider = 'google'
        and i.identity_data -> 'email_verified' = 'true'::jsonb
        and lower(trim(i.identity_data ->> 'email')) = lower(trim(u.email))
    )
    and not exists (
      select 1 from auth.identities i
      where i.user_id = u.id and i.provider not in ('google', 'email', 'phone')
    );
$$;

create function academic_access.current_email()
returns text
language sql stable security definer set search_path = ''
as $$
  select academic_access.verified_google_email(auth.uid())
  where auth.jwt() -> 'amr' @> '[{"method":"oauth"}]'::jsonb;
$$;

create function public.has_academic_identity()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select academic_access.current_email() is not null;
$$;

revoke all on function public.has_academic_identity() from public, anon;
grant execute on function public.has_academic_identity() to authenticated;
revoke all on function academic_access.verified_google_email(uuid) from public;
revoke all on function academic_access.current_email() from public;

create or replace function public.is_teacher()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.has_academic_identity() and exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'teacher'
  );
$$;

create function academic_access.owns_active_authorization(candidate_email text, candidate_status public.enrollment_status)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select candidate_status = 'active'
    and lower(trim(candidate_email)) = academic_access.current_email();
$$;

create function academic_access.can_read_enrollment(target_course_id bigint,
  target_group_id bigint default null, target_enrollment_id bigint default null,
  target_authorization_id bigint default null)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.course_students cs
    join public.authorized_students a
      on a.id = cs.authorized_student_id and a.course_id = cs.course_id
    where cs.student_id = auth.uid() and cs.status = 'active'
      and academic_access.owns_active_authorization(a.email, a.status)
      and (target_course_id is null or cs.course_id = target_course_id)
      and (target_group_id is null or cs.group_id = target_group_id)
      and (target_enrollment_id is null or cs.id = target_enrollment_id)
      and (target_authorization_id is null or a.id = target_authorization_id)
  );
$$;

create function academic_access.can_read_period(target_period_id bigint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.courses c
    where c.period_id = target_period_id
      and academic_access.can_read_enrollment(c.id)
  );
$$;

revoke all on function academic_access.owns_active_authorization(text, public.enrollment_status) from public;
revoke all on function academic_access.can_read_enrollment(bigint, bigint, bigint, bigint) from public;
revoke all on function academic_access.can_read_period(bigint) from public;
grant execute on function academic_access.owns_active_authorization(text, public.enrollment_status) to authenticated;
grant execute on function academic_access.can_read_enrollment(bigint, bigint, bigint, bigint) to authenticated;
grant execute on function academic_access.can_read_period(bigint) to authenticated;

alter policy "teachers read their courses" on public.courses
  using (public.is_teacher() and teacher_id = auth.uid());
alter policy "teachers update their courses" on public.courses
  with check (
    public.is_teacher() and teacher_id = auth.uid()
    and exists (
      select 1 from public.academic_periods p
      where p.id = courses.period_id and p.status in ('upcoming', 'current')
    )
  );

alter policy "students verify own authorization" on public.authorized_students
  using (academic_access.owns_active_authorization(authorized_students.email, authorized_students.status));
alter policy "students read their courses" on public.courses
  using (academic_access.can_read_enrollment(courses.id));
alter policy "students read their group" on public.groups
  using (academic_access.can_read_enrollment(groups.course_id, groups.id));
alter policy "students read own enrollment" on public.course_students
  using (academic_access.can_read_enrollment(course_students.course_id, null, course_students.id));
alter policy "students read own points" on public.point_transactions
  using (academic_access.can_read_enrollment(null, null, null, point_transactions.authorized_student_id));
alter policy "students read course evaluations" on public.course_evaluations
  using (academic_access.can_read_enrollment(course_evaluations.course_id));
alter policy "users read visible periods" on public.academic_periods
  using (public.is_teacher() or (status <> 'draft' and academic_access.can_read_period(academic_periods.id)));

create function academic_access.validate_enrollment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.authorized_student_id is not distinct from old.authorized_student_id
     and new.course_id = old.course_id and new.student_id = old.student_id then
    -- Preserve legacy rows. Allow a status-only revocation even when the
    -- identity is invalid, but validate changes of group or reactivation.
    if new.group_id is not distinct from old.group_id
       and (new.status = old.status or new.status = 'inactive') then
      return new;
    end if;
  end if;

  -- Keep an authorization stable while adding or changing its enrollment
  -- link. Status-only and group updates do not acquire a new row lock.
  if tg_op = 'INSERT' or new.authorized_student_id is distinct from old.authorized_student_id then
    perform 1 from public.authorized_students a
    where a.id = new.authorized_student_id
    for share;
  end if;

  if not exists (
    select 1 from public.authorized_students a
    where a.id = new.authorized_student_id and a.course_id = new.course_id
      and lower(trim(a.email)) = academic_access.verified_google_email(new.student_id)
      and (new.status <> 'active' or a.status = 'active')
  ) then
    raise exception 'invalid_enrollment_authorization' using errcode = '23514';
  end if;
  return new;
end;
$$;

create function academic_access.protect_authorization_link()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if (new.course_id is distinct from old.course_id
      or lower(trim(new.email)) is distinct from lower(trim(old.email)))
     and (exists (select 1 from public.course_students cs where cs.authorized_student_id = old.id)
       or exists (select 1 from public.point_transactions p where p.authorized_student_id = old.id)) then
    raise exception 'linked_authorization_identity' using errcode = '23514';
  end if;
  return new;
end;
$$;

create function academic_access.sync_enrollment_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.course_students cs set status = new.status
  where cs.authorized_student_id = new.id
    and cs.course_id = new.course_id
    and cs.status is distinct from new.status
    and (new.status = 'inactive'
      or academic_access.verified_google_email(cs.student_id) = lower(trim(new.email)));
  return new;
end;
$$;

revoke all on function academic_access.validate_enrollment() from public;
revoke all on function academic_access.protect_authorization_link() from public;
revoke all on function academic_access.sync_enrollment_status() from public;

create trigger guard_enrollment_authorization
before insert or update on public.course_students
for each row execute function academic_access.validate_enrollment();

create trigger protect_authorization_link
before update of course_id, email on public.authorized_students
for each row execute function academic_access.protect_authorization_link();

create trigger synchronize_authorized_enrollment_status
after update of status on public.authorized_students
for each row when (old.status is distinct from new.status)
execute function academic_access.sync_enrollment_status();

-- Keep the enrollment synchronization contract and require a trusted identity.
create or replace function public.sync_authorized_student()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_email text;
  enrollment_created boolean := false;
begin
  if auth.uid() is null then return false; end if;
  current_email := academic_access.current_email();
  if current_email is null then return false; end if;

  -- Serialize synchronization with revocation in the same lock order as
  -- the authorization trigger (authorization before enrollment).
  perform 1 from public.authorized_students a
  where lower(trim(a.email)) = current_email
  order by a.id
  for share;

  insert into public.course_students (course_id, student_id, authorized_student_id, group_id, status)
  select a.course_id, auth.uid(), a.id, a.group_id, a.status
  from public.authorized_students a
  where lower(trim(a.email)) = current_email
  on conflict (course_id, student_id) do update
    set authorized_student_id = excluded.authorized_student_id,
        group_id = coalesce(excluded.group_id, course_students.group_id),
        status = excluded.status;

  update public.course_students cs
  set status = 'inactive'
  where cs.student_id = auth.uid()
    and not exists (
      select 1 from public.authorized_students a
      where a.id = cs.authorized_student_id
        and a.course_id = cs.course_id
        and a.status = 'active'
        and lower(trim(a.email)) = current_email
    );

  select exists (
    select 1 from public.course_students cs
    where cs.student_id = auth.uid() and cs.status = 'active'
  ) into enrollment_created;
  return enrollment_created;
end;
$$;

-- Keep the existing window and capacity rules for selection.
create or replace function public.select_course_group(
  enrollment_id bigint,
  selected_group_id bigint
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  enrollment_course_id bigint;
  selection_opens_at timestamptz;
  selection_closes_at timestamptz;
  group_course_id bigint;
  group_capacity integer;
  active_members integer;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select cs.course_id
  into enrollment_course_id
  from public.course_students cs
  where cs.id = enrollment_id
    and cs.student_id = auth.uid()
    and academic_access.can_read_enrollment(cs.course_id, null, cs.id)
  for update;

  if enrollment_course_id is null then
    raise exception 'enrollment_not_found';
  end if;

  select c.group_selection_opens_at, c.group_selection_closes_at
  into selection_opens_at, selection_closes_at
  from public.courses c
  where c.id = enrollment_course_id
    and c.active = true;

  if selection_opens_at is null or selection_closes_at is null
     or now() < selection_opens_at
     or now() >= selection_closes_at then
    raise exception 'group_selection_closed';
  end if;

  select g.course_id, g.capacity
  into group_course_id, group_capacity
  from public.groups g
  where g.id = selected_group_id
    and g.active = true;

  if group_course_id is null or group_course_id <> enrollment_course_id then
    raise exception 'group_not_available';
  end if;

  -- Serialize selections for the same group so the last available seat
  -- cannot be assigned twice by concurrent requests.
  perform pg_advisory_xact_lock(selected_group_id);

  select count(*)::integer
  into active_members
  from public.course_students cs
  where cs.group_id = selected_group_id
    and cs.status = 'active'
    and cs.id <> enrollment_id;

  if active_members >= group_capacity then
    raise exception 'group_full';
  end if;

  update public.course_students
  set group_id = selected_group_id
  where id = enrollment_id and student_id = auth.uid();
end;
$$;

create or replace function public.available_course_group_details(enrollment_id bigint)
returns table (
  id bigint, group_position integer, capacity integer, active_members integer, members jsonb
)
language plpgsql stable security definer set search_path = ''
as $$
declare
  enrollment_course_id bigint;
  show_names boolean;
begin
  if enrollment_id is null or not academic_access.can_read_enrollment(null, null, enrollment_id) then
    raise exception 'enrollment_not_found';
  end if;

  select c.id, now() >= c.group_selection_opens_at and now() < c.group_selection_closes_at
  into enrollment_course_id, show_names
  from public.course_students cs
  join public.courses c on c.id = cs.course_id
  where cs.id = enrollment_id and c.active;

  return query
  select g.id, g.position, g.capacity, count(cs.id)::integer,
    coalesce(jsonb_agg(jsonb_build_object('full_name', a.full_name) order by a.full_name)
      filter (where show_names and nullif(trim(a.full_name), '') is not null), '[]'::jsonb)
  from public.groups g
  left join public.course_students cs on cs.group_id = g.id and cs.status = 'active'
  left join public.authorized_students a on a.id = cs.authorized_student_id
    and a.course_id = cs.course_id and a.status = 'active'
    and lower(trim(a.email)) = academic_access.verified_google_email(cs.student_id)
  where g.course_id = enrollment_course_id and g.active
  group by g.id, g.position, g.capacity
  order by g.position;
end;
$$;

create or replace function public.available_course_groups(enrollment_id bigint)
returns table (id bigint, group_position integer, capacity integer, active_members integer)
language sql stable security definer set search_path = ''
as $$
  select g.id, g.group_position, g.capacity, g.active_members
  from public.available_course_group_details(enrollment_id) g;
$$;
