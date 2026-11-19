-- Solo datos sintéticos para desarrollo local; no es el calendario institucional.
-- No sobrescribir periodos existentes ni introducir otro periodo actual.
insert into public.academic_periods (academic_year, semester, status)
select 2026, 2, 'current'
where not exists (select 1 from public.academic_periods)
on conflict (academic_year, semester) do nothing;
