	create or replace function public.available_course_group_details(enrollment_id bigint)
	returns table (
	  id bigint,
	  group_position integer,
	  capacity integer,
	  active_members integer,
	  members jsonb
	)
	language plpgsql
	security definer
	set search_path = public
	as $$
	declare
	  enrollment_course_id bigint;
	begin
	  if auth.uid() is null then raise exception 'not_authenticated'; end if;
	  select cs.course_id into enrollment_course_id
	  from public.course_students cs
	  where cs.id = enrollment_id and cs.student_id = auth.uid() and cs.status = 'active';
	  if enrollment_course_id is null then raise exception 'enrollment_not_found'; end if;
	
	  return query
	  select g.id, g.position as group_position, g.capacity,
	    count(cs.id)::integer as active_members,
	    coalesce(jsonb_agg(jsonb_build_object('full_name', a.full_name, 'email', a.email) order by a.full_name) filter (where a.id is not null), '[]'::jsonb) as members
	  from public.groups g
	  left join public.course_students cs on cs.group_id = g.id and cs.status = 'active'
	  left join public.authorized_students a on a.id = cs.authorized_student_id
	  where g.course_id = enrollment_course_id and g.active = true
	  group by g.id, g.position, g.capacity
	  order by g.position;
	end;
	$$;
	
	revoke all on function public.available_course_group_details(bigint) from public;
	grant execute on function public.available_course_group_details(bigint) to authenticated;
