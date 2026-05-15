-- ============================================
-- pg_cron: visitor_heartbeats Cleanup-Job (taeglich)
-- ============================================
-- Die Funktion cleanup_visitor_heartbeats() existierte schon, aber mit
-- 30-Minuten-Cutoff statt 30-Tage — das wuerde den Lifetime-Counter
-- 'Besuche gesamt' im Admin-Panel auf nahezu 0 reduzieren. Wir korrigieren
-- den Cutoff und schedulen den Job dann taeglich um 03:15 UTC (zwischen
-- den anderen beiden Cleanup-Jobs).

-- 1) Cutoff von 30 Min auf 30 Tage anheben — Lifetime-Counter bleibt intakt
create or replace function public.cleanup_visitor_heartbeats()
returns void
language sql
as $$
  delete from public.visitor_heartbeats
  where last_seen_at < now() - interval '30 days';
$$;

-- 2) Falls Job bereits gescheduled wurde — entplanen (idempotent)
do $$
declare
  jid bigint;
begin
  select jobid into jid from cron.job where jobname = 'cleanup-visitor-heartbeats';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end $$;

-- 3) Job taeglich um 03:15 UTC einplanen
select cron.schedule(
  'cleanup-visitor-heartbeats',
  '15 3 * * *',
  $job$ select public.cleanup_visitor_heartbeats(); $job$
);

comment on function public.cleanup_visitor_heartbeats() is
  'Loescht visitor_heartbeats-Rows aelter als 30 Tage. Wird taeglich via pg_cron (03:15 UTC) ausgefuehrt.';
