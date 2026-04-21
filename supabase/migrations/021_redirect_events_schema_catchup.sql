-- ============================================
-- Schema-Catchup: redirect_events
-- ============================================
-- Der Redirect-Handler (/r/[code]/route.ts) schreibt seit längerem zwei
-- Spalten die nie als Migration deklariert wurden (sie wurden direkt gegen
-- die Prod-DB gebaut). Diese Migration schließt die Lücke idempotent, damit
-- fresh Envs (Staging, neue Dev-DBs) aus dem Repo allein bootbar sind.
--
-- Bekannte weitere Reproduzierbarkeits-Lücken außerhalb dieser Migration:
--   - Tabelle public.short_links existiert nur in Prod-DB, nicht im Repo
--   - Tabelle public.link_groups existiert nur in Prod-DB, nicht im Repo
--   - Tabelle public.report_schedules existiert nur in Prod-DB, nicht im Repo
-- Diese Gaps müssen separat via pg_dump --schema-only nachgezogen werden.

-- is_bot: Bot-Erkennung aus User-Agent (src/lib/tracking/events.ts::isBot).
-- Alle aktuellen Aggregations-Queries filtern auf is_bot=false, darum NOT NULL.
alter table public.redirect_events
  add column if not exists is_bot boolean not null default false;

-- short_link_id: FK-Soft-Reference zu short_links. Keine explizite FK-Constraint
-- weil die short_links-Tabelle im Repo noch fehlt — in Prod ist die Beziehung
-- bereits als FK vorhanden (via Supabase-MCP erstellt). Hier nur der Typ.
alter table public.redirect_events
  add column if not exists short_link_id uuid;

-- Indexes für die zwei häufigsten Filter-Pfade:
-- - is_bot: jede Count-Query filtert darauf
-- - short_link_id: Link-Aggregationen gruppieren darüber
create index if not exists idx_redirect_events_is_bot
  on public.redirect_events(is_bot);
create index if not exists idx_redirect_events_short_link
  on public.redirect_events(short_link_id)
  where short_link_id is not null;
