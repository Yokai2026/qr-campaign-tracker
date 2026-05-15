-- ============================================
-- Trial-Upsell Sequenz (Day 3 / Day 7 / Day 12)
-- ============================================
-- Idempotenz-Marker pro Stage. Cron prueft "ist column NULL und Trial-Tag erreicht"
-- bevor die Mail rausgeht. Setzt den Timestamp nach erfolgreichem Send.
-- trial_reminder_sent_at (031) bleibt als Day-13 "endet morgen"-Marker bestehen.

alter table public.profiles
  add column if not exists trial_upsell_d3_sent_at  timestamptz,
  add column if not exists trial_upsell_d7_sent_at  timestamptz,
  add column if not exists trial_upsell_d12_sent_at timestamptz;

comment on column public.profiles.trial_upsell_d3_sent_at  is 'Day-3 Upsell-Mail (Value+Feature-Tipp) versandt.';
comment on column public.profiles.trial_upsell_d7_sent_at  is 'Day-7 Upsell-Mail (Case-Study+Social-Proof) versandt.';
comment on column public.profiles.trial_upsell_d12_sent_at is 'Day-12 Upsell-Mail (Letzter Tag + Discount) versandt.';

-- Partial-Index fuer schnelle Eligibility-Scans
create index if not exists profiles_trial_upsell_d3_pending_idx
  on public.profiles (created_at)
  where trial_upsell_d3_sent_at is null;

create index if not exists profiles_trial_upsell_d7_pending_idx
  on public.profiles (created_at)
  where trial_upsell_d7_sent_at is null;

create index if not exists profiles_trial_upsell_d12_pending_idx
  on public.profiles (created_at)
  where trial_upsell_d12_sent_at is null;
