-- Groups are generated from the active authorized enrollment and a capacity.
alter table public.courses
  add column group_capacity integer check (group_capacity > 0),
  add column group_selection_timezone text not null default 'America/Lima'
    check (group_selection_timezone = 'America/Lima');

alter table public.groups
  add column position integer;

with numbered_groups as (
  select id, row_number() over (partition by course_id order by created_at, id) as generated_position
  from public.groups
)
update public.groups g
set position = numbered_groups.generated_position
from numbered_groups
where g.id = numbered_groups.id;

alter table public.groups
  alter column position set not null,
  add constraint groups_course_position_unique unique (course_id, position);

update public.groups
set name = 'Grupo ' || position;

create or replace function public.synchronize_course_groups(
  target_course_id bigint,
  target_capacity integer
)
returns table (authorized_students integer, required_groups integer, generated_groups integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  active_authorizations integer;
  needed_groups integer;
  existing_groups integer;
  next_position integer;
  current_group record;
  created_groups integer := 0;
begin
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'not_course_teacher';
  end if;

  if target_capacity < 1 then
    raise exception 'invalid_group_capacity';
  end if;

  select count(*)::integer
  into active_authorizations
  from public.authorized_students
  where course_id = target_course_id
    and status = 'active';

  needed_groups := ceil(active_authorizations::numeric / target_capacity)::integer;

  for current_group in
    select g.id, count(cs.id)::integer as active_members
    from public.groups g
    left join public.course_students cs
      on cs.group_id = g.id and cs.status = 'active'
    where g.course_id = target_course_id
    group by g.id
  loop
    if current_group.active_members > target_capacity then
      raise exception 'capacity_below_existing_members';
    end if;
  end loop;

  update public.courses
  set group_capacity = target_capacity
  where id = target_course_id;

  update public.groups
  set capacity = target_capacity,
      name = 'Grupo ' || position
  where course_id = target_course_id;

  select count(*)::integer, coalesce(max(position), 0)::integer
  into existing_groups, next_position
  from public.groups
  where course_id = target_course_id;

  while existing_groups < needed_groups loop
    next_position := next_position + 1;
    insert into public.groups (course_id, name, position, capacity)
    values (target_course_id, 'Grupo ' || next_position, next_position, target_capacity);
    existing_groups := existing_groups + 1;
    created_groups := created_groups + 1;
  end loop;

  return query select active_authorizations, needed_groups, created_groups;
end;
$$;

create or replace function public.configure_course_group_selection(
  target_course_id bigint,
  opens_on date,
  opens_at time,
  closes_on date,
  closes_at time
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  opens_timestamp timestamptz;
  closes_timestamp timestamptz;
begin
  if not public.is_teacher_of_course(target_course_id) then
    raise exception 'not_course_teacher';
  end if;

  opens_timestamp := (opens_on + opens_at) at time zone 'America/Lima';
  closes_timestamp := (closes_on + closes_at) at time zone 'America/Lima';

  if closes_timestamp <= opens_timestamp then
    raise exception 'invalid_selection_window';
  end if;

  update public.courses
  set group_selection_opens_at = opens_timestamp,
      group_selection_closes_at = closes_timestamp,
      group_selection_timezone = 'America/Lima'
  where id = target_course_id;
end;
$$;

-- Teachers use the domain functions above; direct manual group writes are not allowed.
drop policy if exists "teachers create their groups" on public.groups;
drop policy if exists "teachers update their groups" on public.groups;

revoke all on function public.synchronize_course_groups(bigint, integer) from public;
revoke all on function public.configure_course_group_selection(bigint, date, time, date, time) from public;
grant execute on function public.synchronize_course_groups(bigint, integer) to authenticated;
grant execute on function public.configure_course_group_selection(bigint, date, time, date, time) to authenticated;
