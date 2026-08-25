-- Keep groups with assigned students, but remove surplus empty groups when capacity changes.
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
  removable_group_id bigint;
  current_group record;
  created_groups integer := 0;
begin
  if not public.is_teacher_of_course(target_course_id) then raise exception 'not_course_teacher'; end if;
  if target_capacity < 1 then raise exception 'invalid_group_capacity'; end if;

  select count(*)::integer into active_authorizations
  from public.authorized_students
  where course_id = target_course_id and status = 'active';
  needed_groups := ceil(active_authorizations::numeric / target_capacity)::integer;

  for current_group in
    select g.id, count(cs.id)::integer as active_members
    from public.groups g left join public.course_students cs on cs.group_id = g.id and cs.status = 'active'
    where g.course_id = target_course_id group by g.id
  loop
    if current_group.active_members > target_capacity then raise exception 'capacity_below_existing_members'; end if;
  end loop;

  update public.courses set group_capacity = target_capacity where id = target_course_id;
  update public.groups set capacity = target_capacity, name = 'Grupo ' || position where course_id = target_course_id;

  loop
    select count(*)::integer into existing_groups from public.groups where course_id = target_course_id;
    exit when existing_groups <= needed_groups;
    select g.id into removable_group_id
    from public.groups g
    where g.course_id = target_course_id
      and not exists (select 1 from public.course_students cs where cs.group_id = g.id and cs.status = 'active')
    order by g.position desc
    limit 1;
    exit when removable_group_id is null;
    delete from public.groups where id = removable_group_id;
  end loop;

  select count(*)::integer, coalesce(max(position), 0)::integer into existing_groups, next_position
  from public.groups where course_id = target_course_id;
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
