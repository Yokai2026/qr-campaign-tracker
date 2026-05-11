-- 023_fix_redirect_events_rls.sql
--
-- Bugfix: freistehende QR-Codes (ohne Placement -> ohne campaign_id) sind in
-- der Analytics fuer ihre eigenen Owner UNSICHTBAR, weil die SELECT-Policy
-- auf redirect_events nur ueber campaign_id ODER short_link_id matched.
--
-- Symptom: User scannt einen QR ohne Kampagnen-Verknuepfung, der Scan landet
-- korrekt in redirect_events (Insert-Policy ist offen), aber die Analytics-
-- Page zeigt 0 Aufrufe, weil die SELECT-Policy keinen passenden Owner-Pfad
-- ueber qr_codes hat.
--
-- Fix: dritte Bedingung anhaengen — qr_code_id gehoert dem Aufrufer.

set search_path = public;

drop policy if exists "redirect_events_select" on public.redirect_events;

create policy "redirect_events_select"
  on public.redirect_events
  for select
  using (
    (campaign_id in (
      select id from public.campaigns where owner_id = auth.uid()
    ))
    or
    (short_link_id in (
      select id from public.short_links where created_by = auth.uid()
    ))
    or
    (qr_code_id in (
      select id from public.qr_codes where created_by = auth.uid()
    ))
  );
