insert into public.academic_periods (academic_year, semester, status)
values (2026, 2, 'current')
returning id, code, status;
