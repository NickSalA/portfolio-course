-- Fail on existing duplicates rather than choosing which period to close.
-- PostgreSQL's unique index also arbitrates concurrent inserts and updates.
create unique index academic_periods_single_current_idx
on public.academic_periods (status)
where status = 'current';
