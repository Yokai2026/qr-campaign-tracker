-- Scan Alerts: notify users when scan metrics exceed a threshold
create table if not exists scan_alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  email text not null,
  campaign_id uuid references campaigns(id) on delete cascade,
  metric text not null default 'total_scans' check (metric in ('total_scans', 'unique_visitors')),
  threshold integer not null check (threshold > 0),
  cooldown_hours integer not null default 24,
  active boolean not null default true,
  last_triggered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table scan_alerts enable row level security;

create policy "Users can view own scan alerts"
  on scan_alerts for select
  using (auth.uid() = user_id);

create policy "Users can insert own scan alerts"
  on scan_alerts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own scan alerts"
  on scan_alerts for update
  using (auth.uid() = user_id);

create policy "Users can delete own scan alerts"
  on scan_alerts for delete
  using (auth.uid() = user_id);

-- Index for cron query
create index idx_scan_alerts_active on scan_alerts (active) where active = true;
