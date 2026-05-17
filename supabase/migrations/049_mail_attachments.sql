-- 049_mail_attachments.sql
-- Erlaubt Datei-Anhänge an Mail-Kampagnen (PDFs, Flyer, Word, Bilder).
-- Speicherung als JSONB-Array auf mail_campaigns. Files leben im
-- 'mail-attachments' Storage-Bucket (private, nur Service-Role kann lesen).
--
-- attachments JSONB-Format:
-- [
--   {
--     "path": "user_id/timestamp-id.pdf",
--     "filename": "Flyer-Mai.pdf",
--     "size": 2456789,
--     "content_type": "application/pdf"
--   }
-- ]

alter table public.mail_campaigns
  add column if not exists attachments jsonb not null default '[]'::jsonb;

-- Constraint: max 10 Anhänge pro Mail (Resend-Limit + UX-Schutz)
alter table public.mail_campaigns
  drop constraint if exists mail_campaigns_attachments_max;
alter table public.mail_campaigns
  add constraint mail_campaigns_attachments_max
  check (jsonb_array_length(attachments) <= 10);
