-- ============================================
-- 028_last_seen_at: Online-User-Tracking
-- ============================================
-- Heartbeat von /api/heartbeat aktualisiert diese Spalte alle 30s.
-- "Online" gilt als last_seen_at > NOW() - interval '2 minutes'.

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

-- Index fuer Online-Count-Query (WHERE last_seen_at > NOW() - 2m)
create index if not exists idx_profiles_last_seen_at
  on public.profiles(last_seen_at desc)
  where last_seen_at is not null;

-- RLS: User darf eigene last_seen_at updaten (fuer Heartbeat).
-- Service-Role kann alle lesen (fuer Admin-Stats).
-- Bestehende profiles_update_own Policy deckt das schon ab — kein neuer Policy noetig.
