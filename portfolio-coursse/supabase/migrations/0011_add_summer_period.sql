-- Summer is a valid institutional period represented by semester 0.
alter table public.academic_periods
  drop constraint academic_periods_semester_check,
  add constraint academic_periods_semester_check check (semester in (0, 1, 2));

-- PostgreSQL requires recreating a generated column to change its expression.
alter table public.academic_periods
  drop column code;

alter table public.academic_periods
  add column code text generated always as (
    academic_year::text || '-' || case semester
      when 0 then '0'
      when 1 then 'I'
      else 'II'
    end
  ) stored unique;
