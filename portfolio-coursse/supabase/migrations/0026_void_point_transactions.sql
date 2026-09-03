alter table public.point_transactions
  add column if not exists is_voided boolean not null default false;

create index if not exists point_transactions_active_authorization_idx
  on public.point_transactions (authorized_student_id, created_at desc)
  where is_voided = false;
