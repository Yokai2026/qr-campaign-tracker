-- ============================================
-- MRR Snapshots: tägliche Aufzeichnung der Business-Metriken
-- ============================================
-- Ermöglicht Trend-Charts (MRR-Verlauf, New/Churned MRR pro Tag) im Admin.
-- Wird von /api/cron/mrr-snapshot jede Nacht um 00:05 UTC befüllt.

create table public.mrr_snapshots (
  id uuid primary key default gen_random_uuid(),
  snapshot_date date not null unique,
  -- Aktueller Zustand
  mrr_total_eur numeric(10, 2) not null default 0,
  arr_total_eur numeric(10, 2) not null default 0,
  paying_count int not null default 0,
  monthly_count int not null default 0,
  yearly_count int not null default 0,
  manual_count int not null default 0,
  trial_active_count int not null default 0,
  total_users int not null default 0,
  -- Delta seit gestern
  new_subs_count int not null default 0,
  new_mrr_eur numeric(10, 2) not null default 0,
  churned_subs_count int not null default 0,
  churned_mrr_eur numeric(10, 2) not null default 0,
  -- Hilfsdaten
  created_at timestamptz not null default now()
);

create index idx_mrr_snapshots_date on public.mrr_snapshots(snapshot_date desc);

-- RLS: nur Admins via Service Role
alter table public.mrr_snapshots enable row level security;

-- Kein Policy für authenticated → Service Role bypasst RLS, Endpoint /api/admin/* prüft role='admin'.

comment on table public.mrr_snapshots is
  'Daily snapshot of business metrics (MRR, paying users, churn). Written by /api/cron/mrr-snapshot.';
