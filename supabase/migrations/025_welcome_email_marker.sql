-- Welcome-Email-Versand Marker auf profiles.
-- Wird vom Auth-Callback nach erstem Email-Confirm gesetzt,
-- damit die Welcome-Mail genau einmal pro User rausgeht
-- (idempotent — egal wie oft /auth/callback feuert).

alter table public.profiles
  add column if not exists welcome_sent_at timestamptz;

comment on column public.profiles.welcome_sent_at is
  'Zeitpunkt, an dem die Welcome-Email versendet wurde. NULL = noch nicht versendet.';
