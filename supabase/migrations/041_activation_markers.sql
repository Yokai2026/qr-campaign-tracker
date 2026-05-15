-- ============================================
-- Trial-Activation Sequenz (Day 1 / Day 2 / Day 3)
-- ============================================
-- Aktivierungs-Mails laufen PARALLEL zur Upsell-Sequenz (033).
-- Upsell = Trial → Paid Conversion. Activation = Account → erster Scan (Aha-Moment).
-- Skip-Logic: pro Stage wird gesendet wenn der jeweilige Activation-Step NICHT erreicht ist.
--   d1 (Tag 1): bevor 1. QR-Code erstellt — "in 60 Sek dein erster QR"
--   d2 (Tag 2): wenn QR existiert aber 0 Scans — "scann dich selbst"
--   d3 (Tag 3): wenn 1+ Scans existieren — "Setup pro Platzierung / Print-Tipps"

alter table public.profiles
  add column if not exists activation_d1_sent_at timestamptz,
  add column if not exists activation_d2_sent_at timestamptz,
  add column if not exists activation_d3_sent_at timestamptz;

comment on column public.profiles.activation_d1_sent_at is 'Day-1 Activation-Mail (erster QR-Code, 60 Sek Guide) versandt.';
comment on column public.profiles.activation_d2_sent_at is 'Day-2 Activation-Mail (Test-Scan / Sample-Data) versandt.';
comment on column public.profiles.activation_d3_sent_at is 'Day-3 Activation-Mail (Print/Setup-Tipps) versandt.';

create index if not exists profiles_activation_d1_pending_idx
  on public.profiles (created_at)
  where activation_d1_sent_at is null;

create index if not exists profiles_activation_d2_pending_idx
  on public.profiles (created_at)
  where activation_d2_sent_at is null;

create index if not exists profiles_activation_d3_pending_idx
  on public.profiles (created_at)
  where activation_d3_sent_at is null;
