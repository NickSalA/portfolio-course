-- REC-06 (#36): Technical tracking and recovery for teacher email notices on
-- new claims. One logical notification per claim, no academic data or secrets
-- stored, claim persistence independent of email failures.
begin;

create table public.claim_notifications (
  id bigint generated always as identity primary key,
  claim_id bigint not null unique references public.claims(id) on delete restrict,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_attempt_at timestamptz,
  sent_at timestamptz,
  last_error_code text check (
    last_error_code is null
    or last_error_code in (
      'MAIL_CONFIG_INCOMPLETE',
      'MAIL_RECIPIENT_MISSING',
      'MAIL_SEND_FAILED',
      'MAIL_DISPATCH_ERROR'
    )
  ),
  provider_message_id text check (
    provider_message_id is null
    or char_length(provider_message_id) <= 255
  ),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp()
);

create index claim_notifications_status_idx
  on public.claim_notifications (status, updated_at desc);

alter table public.claim_notifications enable row level security;

revoke all on table public.claim_notifications from public, anon, authenticated;
grant select on table public.claim_notifications to authenticated;

create policy "teachers read course claim notifications"
on public.claim_notifications for select to authenticated
using (exists (
  select 1
  from public.claims c
  where c.id = claim_notifications.claim_id
    and public.is_teacher_of_course(c.course_id)
));

-- Automatically create a pending notification record for every new claim.
create function academic_access.create_claim_notification()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.claim_notifications (claim_id, status)
  values (new.id, 'pending')
  on conflict (claim_id) do nothing;
  return new;
end;
$$;

revoke all on function academic_access.create_claim_notification() from public, anon, authenticated;

create trigger tr_create_claim_notification
after insert on public.claims
for each row execute function academic_access.create_claim_notification();

-- Backfill any pre-existing claims created before 0054.
insert into public.claim_notifications (claim_id, status)
select c.id, 'pending'
from public.claims c
on conflict (claim_id) do nothing;

-- Prepares a single technical send attempt (initial dispatch by submitter or
-- recovery retry by responsible teacher) without ever allowing duplicate sends
-- once marked `sent`.
create function public.prepare_claim_email_dispatch(
  target_claim_public_id uuid
)
returns table (
  should_send boolean,
  teacher_email text,
  claim_public_id uuid,
  status text,
  attempt_count integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target_claim public.claims%rowtype;
  notif public.claim_notifications%rowtype;
  is_course_teacher boolean;
  is_submitter boolean;
  resolved_teacher_email text;
begin
  if caller_id is null or not public.has_academic_identity() then
    raise exception 'claim_notification_access_denied' using errcode = '42501';
  end if;

  if target_claim_public_id is null then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  select c.*
    into target_claim
  from public.claims c
  where c.public_id = target_claim_public_id;

  if not found then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  is_course_teacher := public.is_teacher_of_course(target_claim.course_id);
  is_submitter := (target_claim.submitted_by_student_id = caller_id);

  if not is_course_teacher and not is_submitter then
    raise exception 'claim_notification_access_denied' using errcode = '42501';
  end if;

  insert into public.claim_notifications (claim_id, status)
  values (target_claim.id, 'pending')
  on conflict (claim_id) do nothing;

  select n.*
    into notif
  from public.claim_notifications n
  where n.claim_id = target_claim.id
  for update;

  -- Never send a second logical notice once technically sent.
  if notif.status = 'sent' then
    return query
    select false, null::text, target_claim.public_id, notif.status, notif.attempt_count;
    return;
  end if;

  -- Students may only trigger the very first automatic dispatch (attempt_count = 0).
  -- Recovery retries belong exclusively to the responsible teacher.
  if not is_course_teacher and notif.attempt_count > 0 then
    return query
    select false, null::text, target_claim.public_id, notif.status, notif.attempt_count;
    return;
  end if;

  select coalesce(nullif(trim(u.email), ''), nullif(trim(p.email), ''))
    into resolved_teacher_email
  from public.courses co
  left join auth.users u on u.id = co.teacher_id
  left join public.profiles p on p.id = co.teacher_id
  where co.id = target_claim.course_id;

  update public.claim_notifications n
  set attempt_count = n.attempt_count + 1,
      last_attempt_at = pg_catalog.clock_timestamp(),
      updated_at = pg_catalog.clock_timestamp()
  where n.id = notif.id
  returning * into notif;

  return query
  select true, resolved_teacher_email, target_claim.public_id, notif.status, notif.attempt_count;
end;
$$;

revoke all on function public.prepare_claim_email_dispatch(uuid) from public, anon;
grant execute on function public.prepare_claim_email_dispatch(uuid) to authenticated;

create function public.record_claim_email_outcome(
  target_claim_public_id uuid,
  did_send boolean,
  error_code text default null,
  smtp_message_id text default null
)
returns table (
  claim_public_id uuid,
  status text,
  attempt_count integer,
  last_error_code text,
  sent_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  target_claim public.claims%rowtype;
  notif public.claim_notifications%rowtype;
  safe_error_code text;
  safe_message_id text;
begin
  if caller_id is null or not public.has_academic_identity() then
    raise exception 'claim_notification_access_denied' using errcode = '42501';
  end if;

  if target_claim_public_id is null then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  select c.*
    into target_claim
  from public.claims c
  where c.public_id = target_claim_public_id;

  if not found then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  if not public.is_teacher_of_course(target_claim.course_id)
     and target_claim.submitted_by_student_id is distinct from caller_id then
    raise exception 'claim_notification_access_denied' using errcode = '42501';
  end if;

  select n.*
    into notif
  from public.claim_notifications n
  where n.claim_id = target_claim.id
  for update;

  if not found then
    raise exception 'claim_not_found' using errcode = 'P0002';
  end if;

  if notif.status = 'sent' then
    return query
    select target_claim.public_id, notif.status, notif.attempt_count, notif.last_error_code, notif.sent_at;
    return;
  end if;

  if did_send then
    safe_message_id := left(nullif(trim(coalesce(smtp_message_id, '')), ''), 255);
    update public.claim_notifications n
    set status = 'sent',
        sent_at = pg_catalog.clock_timestamp(),
        last_error_code = null,
        provider_message_id = safe_message_id,
        updated_at = pg_catalog.clock_timestamp()
    where n.id = notif.id
    returning * into notif;
  else
    safe_error_code := case
      when error_code in (
        'MAIL_CONFIG_INCOMPLETE',
        'MAIL_RECIPIENT_MISSING',
        'MAIL_SEND_FAILED',
        'MAIL_DISPATCH_ERROR'
      ) then error_code
      else 'MAIL_SEND_FAILED'
    end;
    update public.claim_notifications n
    set status = 'failed',
        last_error_code = safe_error_code,
        updated_at = pg_catalog.clock_timestamp()
    where n.id = notif.id
    returning * into notif;
  end if;

  return query
  select target_claim.public_id, notif.status, notif.attempt_count, notif.last_error_code, notif.sent_at;
end;
$$;

revoke all on function public.record_claim_email_outcome(uuid, boolean, text, text) from public, anon;
grant execute on function public.record_claim_email_outcome(uuid, boolean, text, text) to authenticated;

create function public.list_teacher_claim_notifications(
  target_course_id bigint default null
)
returns table (
  claim_public_id uuid,
  status text,
  attempt_count integer,
  last_error_code text,
  last_attempt_at timestamptz,
  sent_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not public.is_teacher() then
    raise exception 'claim_notification_access_denied' using errcode = '42501';
  end if;

  if target_course_id is not null and not public.is_teacher_of_course(target_course_id) then
    raise exception 'claim_notification_access_denied' using errcode = '42501';
  end if;

  return query
  select
    c.public_id,
    n.status,
    n.attempt_count,
    n.last_error_code,
    n.last_attempt_at,
    n.sent_at
  from public.claim_notifications n
  join public.claims c on c.id = n.claim_id
  where public.is_teacher_of_course(c.course_id)
    and (target_course_id is null or c.course_id = target_course_id);
end;
$$;

revoke all on function public.list_teacher_claim_notifications(bigint) from public, anon;
grant execute on function public.list_teacher_claim_notifications(bigint) to authenticated;

comment on table public.claim_notifications is
  'Technical status of teacher email notices per claim (REC-06). Status sent reflects SMTP acceptance only, not delivery or reading.';

commit;

