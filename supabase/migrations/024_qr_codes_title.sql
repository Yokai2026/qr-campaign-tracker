-- 024_qr_codes_title.sql
--
-- Eigener Titel pro QR-Code (z.B. "Tischaufsteller Eingangsbereich").
-- Bislang konnten User QRs nur am short_code unterscheiden — bei vielen
-- QRs unbrauchbar.

set search_path = public;

alter table public.qr_codes
  add column if not exists title text;

comment on column public.qr_codes.title is
  'Optionaler User-Titel zur Wiedererkennung im UI (z.B. "Tischaufsteller Café Mitte").';
