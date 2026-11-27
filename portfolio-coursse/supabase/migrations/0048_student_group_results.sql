begin;

create function public.list_student_group_grades(target_course_id bigint)
returns table (
  evaluation_public_id uuid,
  evaluation_name text,
  group_public_id uuid,
  group_name text,
  performed_at timestamptz,
  grade numeric
)
language sql stable security definer set search_path = ''
as $$
  select e.public_id, e.name, g.public_id, g.name, e.performed_at, gg.grade
  from public.course_students cs
  -- Student onboarding also permits profiles whose role has not been set.
  join public.profiles student on student.id = cs.student_id and student.role is distinct from 'teacher'
  join public.course_evaluations e on e.course_id = cs.course_id and e.performed_at is not null
  left join academic_access.group_grade_participants recipient
    on recipient.evaluation_id = e.id and recipient.enrollment_id = cs.id
  left join academic_access.group_membership_history history
    on recipient.enrollment_id is null
    and history.enrollment_id = cs.id and history.course_id = cs.course_id
    and history.membership_state = 'grouped'
    and pg_catalog.tstzrange(history.valid_from, history.valid_until, '[)') @> e.performed_at
  join public.groups g on g.id = coalesce(recipient.group_id, history.group_id)
    and g.course_id = cs.course_id
  left join public.group_grades gg on gg.group_id = g.id and gg.evaluation_id = e.id
  where cs.course_id = target_course_id and cs.student_id = auth.uid()
    and academic_access.can_read_enrollment(cs.course_id, null, cs.id)
    -- Historical intervals can establish a pending entry. Confirmed grades require a frozen recipient.
    and ((recipient.enrollment_id is not null and gg.revision > 0)
      or (recipient.enrollment_id is null and gg.grade is null))
  order by e.position, e.id;
$$;

revoke all on function public.list_student_group_grades(bigint) from public, anon;
grant execute on function public.list_student_group_grades(bigint) to authenticated;

comment on function public.list_student_group_grades(bigint) is
  'Own group grades for an actively authorized student. A dated activity with verified historical membership can return a pending NULL grade.';

commit;
