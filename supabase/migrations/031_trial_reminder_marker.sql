-- ============================================
-- Trial Reminder Marker
-- ============================================
-- Verhindert dass ein User mehrere Reminder-Mails am gleichen Trial-Tag bekommt.
-- Wird vom /api/cron/trial-reminders-Cron gesetzt nach erfolgreichem Webhook-Call.

alter table public.profiles
  add column if not exists trial_reminder_sent_at timestamptz;

comment on column public.profiles.trial_reminder_sent_at is
  'Wann der „Trial endet bald"-Reminder zuletzt an diesen User versandt wurde.';
