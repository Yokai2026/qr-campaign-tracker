-- 022_stats_rpcs.sql
--
-- Performance-Migration: aggregierte Scan/Click-Stats pro Entität als RPCs.
--
-- Vor dieser Migration haben getCampaigns/getLocations/getPlacements/getQrCodes
-- und getShortLinks bis zu 100.000–200.000 Rohzeilen aus redirect_events
-- abgerufen und in JavaScript aggregiert. Bei jedem Tab-Klick.
--
-- Diese Funktionen erledigen die Aggregation per SQL in einem einzigen Roundtrip.
-- RLS wird respektiert: `security invoker` + `set search_path` schützt vor
-- search_path-Tricks. Die Funktion erbt damit die RLS-Policies des Aufrufers
-- auf `redirect_events`.
--
-- Idempotent: `create or replace` — kann jederzeit re-applied werden.

set search_path = public;

-- ---------------------------------------------------------------------------
-- Campaigns
-- ---------------------------------------------------------------------------
create or replace function public.get_campaign_stats()
returns table (
  campaign_id   uuid,
  scans_total   bigint,
  scans_7d      bigint,
  scans_prev_7d bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.campaign_id,
    count(*) as scans_total,
    count(*) filter (where e.created_at >= now() - interval '7 days') as scans_7d,
    count(*) filter (
      where e.created_at >= now() - interval '14 days'
        and e.created_at <  now() - interval '7 days'
    ) as scans_prev_7d
  from public.redirect_events e
  where e.event_type in ('qr_open', 'link_open')
    and e.is_bot = false
    and e.campaign_id is not null
  group by e.campaign_id;
$$;

grant execute on function public.get_campaign_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- Locations (aggregiert via Placement)
-- ---------------------------------------------------------------------------
create or replace function public.get_location_stats()
returns table (
  location_id   uuid,
  scans_total   bigint,
  scans_7d      bigint,
  scans_prev_7d bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.location_id,
    count(*) as scans_total,
    count(*) filter (where e.created_at >= now() - interval '7 days') as scans_7d,
    count(*) filter (
      where e.created_at >= now() - interval '14 days'
        and e.created_at <  now() - interval '7 days'
    ) as scans_prev_7d
  from public.redirect_events e
  join public.placements p on p.id = e.placement_id
  where e.event_type = 'qr_open'
    and e.is_bot = false
    and e.placement_id is not null
  group by p.location_id;
$$;

grant execute on function public.get_location_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- Placements
-- ---------------------------------------------------------------------------
create or replace function public.get_placement_stats()
returns table (
  placement_id  uuid,
  scans_total   bigint,
  scans_7d      bigint,
  scans_prev_7d bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.placement_id,
    count(*) as scans_total,
    count(*) filter (where e.created_at >= now() - interval '7 days') as scans_7d,
    count(*) filter (
      where e.created_at >= now() - interval '14 days'
        and e.created_at <  now() - interval '7 days'
    ) as scans_prev_7d
  from public.redirect_events e
  where e.event_type = 'qr_open'
    and e.is_bot = false
    and e.placement_id is not null
  group by e.placement_id;
$$;

grant execute on function public.get_placement_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- QR Codes
-- ---------------------------------------------------------------------------
create or replace function public.get_qr_code_stats()
returns table (
  qr_code_id    uuid,
  scans_total   bigint,
  scans_7d      bigint,
  scans_prev_7d bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.qr_code_id,
    count(*) as scans_total,
    count(*) filter (where e.created_at >= now() - interval '7 days') as scans_7d,
    count(*) filter (
      where e.created_at >= now() - interval '14 days'
        and e.created_at <  now() - interval '7 days'
    ) as scans_prev_7d
  from public.redirect_events e
  where e.event_type = 'qr_open'
    and e.is_bot = false
    and e.qr_code_id is not null
  group by e.qr_code_id;
$$;

grant execute on function public.get_qr_code_stats() to authenticated;

-- ---------------------------------------------------------------------------
-- Short Links (clicks_total + 7d + prev_7d + last_click_at)
-- ---------------------------------------------------------------------------
create or replace function public.get_short_link_stats()
returns table (
  short_link_id  uuid,
  clicks_total   bigint,
  clicks_7d      bigint,
  clicks_prev_7d bigint,
  last_click_at  timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    e.short_link_id,
    count(*) as clicks_total,
    count(*) filter (where e.created_at >= now() - interval '7 days') as clicks_7d,
    count(*) filter (
      where e.created_at >= now() - interval '14 days'
        and e.created_at <  now() - interval '7 days'
    ) as clicks_prev_7d,
    max(e.created_at) as last_click_at
  from public.redirect_events e
  where e.event_type = 'link_open'
    and e.is_bot = false
    and e.short_link_id is not null
  group by e.short_link_id;
$$;

grant execute on function public.get_short_link_stats() to authenticated;
