-- ============================================
-- SQL-basierter Lead-Status-Sync + taeglicher pg_cron-Job
-- ============================================
-- Backup-Logik fuer den TS-Endpoint /api/admin/outbound/sync-lead-status:
-- selbst wenn ein Click/Webhook-Handler den Lead-Update vergisst, bringt
-- der taegliche Cron die Stati wieder in den korrekten Zustand.
--
-- Priority (strongest wins):
--   1) complained_at oder bounced_at  -> do_not_contact
--   2) replied_at                     -> replied
--   3) clicked_at                     -> engaged  (nur wenn aktuell new/queued/contacted)
--   4) sent_at                        -> contacted (nur wenn aktuell new/queued)
-- Bestehende 'converted' wird NIE heruntergesetzt.

create or replace function public.sync_outbound_lead_status()
returns table(set_dnc int, set_replied int, set_engaged int, set_contacted int, total_leads int)
language plpgsql
as $$
declare
  v_set_dnc int := 0;
  v_set_replied int := 0;
  v_set_engaged int := 0;
  v_set_contacted int := 0;
  v_total int := 0;
begin
  -- 1) Bounced/Complained -> do_not_contact (ueberschreibt alles ausser 'converted' + bereits-DNC)
  with affected as (
    update public.outbound_leads l
    set status = 'do_not_contact'
    from (
      select distinct m.lead_id
      from public.outbound_messages m
      where m.bounced_at is not null or m.complained_at is not null
    ) src
    where l.id = src.lead_id
      and l.status not in ('do_not_contact', 'converted')
    returning l.id
  )
  select count(*) into v_set_dnc from affected;

  -- 2) Replied -> replied (nur wenn aktuell weicher)
  with affected as (
    update public.outbound_leads l
    set status = 'replied'
    from (
      select distinct m.lead_id
      from public.outbound_messages m
      where m.replied_at is not null
    ) src
    where l.id = src.lead_id
      and l.status in ('new','queued','contacted','engaged')
    returning l.id
  )
  select count(*) into v_set_replied from affected;

  -- 3) Clicked -> engaged
  with affected as (
    update public.outbound_leads l
    set status = 'engaged'
    from (
      select distinct m.lead_id
      from public.outbound_messages m
      where m.clicked_at is not null
    ) src
    where l.id = src.lead_id
      and l.status in ('new','queued','contacted')
    returning l.id
  )
  select count(*) into v_set_engaged from affected;

  -- 4) Sent -> contacted
  with affected as (
    update public.outbound_leads l
    set status = 'contacted'
    from (
      select distinct m.lead_id
      from public.outbound_messages m
      where m.sent_at is not null
    ) src
    where l.id = src.lead_id
      and l.status in ('new','queued')
    returning l.id
  )
  select count(*) into v_set_contacted from affected;

  select count(distinct lead_id) into v_total
  from public.outbound_messages
  where lead_id is not null;

  set_dnc := v_set_dnc;
  set_replied := v_set_replied;
  set_engaged := v_set_engaged;
  set_contacted := v_set_contacted;
  total_leads := v_total;
  return next;
end;
$$;

comment on function public.sync_outbound_lead_status() is
  'Backfill-Funktion fuer outbound_leads.status aus outbound_messages-Evidenz. Idempotent. Wird via pg_cron taeglich 03:45 UTC ausgefuehrt.';

-- Job falls bereits gescheduled — entplanen (idempotent)
do $$
declare
  jid bigint;
begin
  select jobid into jid from cron.job where jobname = 'sync-outbound-lead-status';
  if jid is not null then
    perform cron.unschedule(jid);
  end if;
end $$;

-- Schedule daily 03:45 UTC — nach allen anderen Cleanup-Jobs (03:00/03:15/03:30).
select cron.schedule(
  'sync-outbound-lead-status',
  '45 3 * * *',
  $job$ select public.sync_outbound_lead_status(); $job$
);
