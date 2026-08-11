-- Academic periods always follow the institutional format YYYY-I or YYYY-II.
-- Store their real parts and generate the display code instead of duplicating data.
alter table public.academic_periods
  add column academic_year smallint,
  add column semester smallint;

update public.academic_periods
set
  academic_year = substring(code from '^(\d{4})-')::smallint,
  semester = case substring(code from '-(I|II)$')
    when 'I' then 1
    when 'II' then 2
  end;

alter table public.academic_periods
  alter column academic_year set not null,
  alter column semester set not null,
  add constraint academic_periods_year_check check (academic_year >= 2000),
  add constraint academic_periods_semester_check check (semester in (1, 2)),
  add constraint academic_periods_year_semester_unique unique (academic_year, semester);

alter table public.academic_periods
  drop constraint academic_periods_code_key,
  drop column code,
  drop column name;

alter table public.academic_periods
  add column code text generated always as (
    academic_year::text || '-' || case semester when 1 then 'I' else 'II' end
  ) stored unique;
