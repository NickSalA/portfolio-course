-- The period importer upserts courses by teacher, period and course name.
-- Restore the supporting uniqueness constraint for databases created before it existed.
do $$
begin
  if exists (
    select 1
    from public.courses
    group by teacher_id, period_id, name
    having count(*) > 1
  ) then
    raise exception 'duplicate_courses_for_teacher_period';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.courses'::regclass
      and contype = 'u'
      and conkey = array[
        (select attnum from pg_attribute where attrelid = 'public.courses'::regclass and attname = 'teacher_id'),
        (select attnum from pg_attribute where attrelid = 'public.courses'::regclass and attname = 'period_id'),
        (select attnum from pg_attribute where attrelid = 'public.courses'::regclass and attname = 'name')
      ]
  ) then
    alter table public.courses
      add constraint courses_teacher_period_name_unique
      unique (teacher_id, period_id, name);
  end if;
end;
$$;
