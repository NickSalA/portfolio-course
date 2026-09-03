-- Let an enrolled student see only the capacity summary needed to choose a group.
create or replace function public.available_course_groups(enrollment_id bigint)
returns table (
  id bigint,
  group_position integer,
  capacity integer,
  active_members integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  enrollment_course_id bigint;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated';
  end if;

  select cs.course_id into enrollment_course_id
  from public.course_students cs
  where cs.id = enrollment_id
    and cs.student_id = auth.uid()
    and cs.status = 'active';

  if enrollment_course_id is null then
    raise exception 'enrollment_not_found';
  end if;

  return query
  select g.id, g.position as group_position, g.capacity, count(cs.id)::integer
  from public.groups g
  left join public.course_students cs
    on cs.group_id = g.id
    and cs.status = 'active'
  where g.course_id = enrollment_course_id
    and g.active = true
  group by g.id, g.position, g.capacity
  order by g.position;
end;
$$;

revoke all on function public.available_course_groups(bigint) from public;
grant execute on function public.available_course_groups(bigint) to authenticated;
