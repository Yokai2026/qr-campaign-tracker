-- 047_mail_recipients_resend_link.sql
-- Verbindet mail_recipients mit Resend-Webhook-Events:
--   resend_message_id  → vom Resend-Send-Response, erlaubt Webhook-Lookup
--   delivered_at       → Bounce-Webhook fuellt das
--   complained_at      → Spam-Beschwerde-Tracking
--   bounce_type wird auf transient/permanent gesetzt
--   bounce_message     → Resend-Bounce-Message (z.B. "550 5.1.1 unknown user")

alter table public.mail_recipients
  add column if not exists resend_message_id text,
  add column if not exists delivered_at timestamptz,
  add column if not exists complained_at timestamptz,
  add column if not exists bounce_message text;

create index if not exists mail_recipients_resend_message_id_idx
  on public.mail_recipients (resend_message_id)
  where resend_message_id is not null;

-- Status-Check-Constraint erweitern: 'complained' war noch nicht erlaubt
alter table public.mail_recipients
  drop constraint if exists mail_recipients_status_check;
alter table public.mail_recipients
  add constraint mail_recipients_status_check
  check (status in ('queued','sent','delivered','bounced','complained','failed'));
