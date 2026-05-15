-- Live-Presence-Tracking: alle Website-Besucher (anonym + eingeloggt).
-- Heartbeat-Client pingt alle 30s wenn Tab im Vordergrund. Eintraege
-- aelter als 5 Min werden via Index-Query schnell ausgefiltert.

create table if not exists public.visitor_heartbeats (
  visitor_id text primary key,
  user_id uuid references public.profiles(id) on delete set null,
  last_seen_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  page text,
  updated_at timestamptz not null default now()
);

comment on table public.visitor_heartbeats is
  'Live-Presence pro Browser-Tab (visitor_id = localStorage-UUID). user_id ist optional gesetzt fuer eingeloggte User.';

create index if not exists visitor_heartbeats_last_seen_idx
  on public.visitor_heartbeats (last_seen_at desc);
create index if not exists visitor_heartbeats_user_idx
  on public.visitor_heartbeats (user_id)
  where user_id is not null;

-- updated_at-Trigger
create or replace function public.set_visitor_heartbeats_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_visitor_heartbeats_updated_at on public.visitor_heartbeats;
create trigger trg_visitor_heartbeats_updated_at
  before update on public.visitor_heartbeats
  for each row execute function public.set_visitor_heartbeats_updated_at();

-- RLS: kein Lesezugriff von Clients (Admin liest via Service Role).
-- Inserts/Updates erfolgen ueber Server-Endpoint mit Service Role.
alter table public.visitor_heartbeats enable row level security;
-- (kein public read-policy = kein Zugriff)

-- Periodische Bereinigung: loesche Eintraege aelter als 30 Min.
-- (Wird ueber pg_cron oder externem Cron getriggert. Falls vorhanden:
--  scheduled job extern. Hier nur die Funktion als Helper.)
create or replace function public.cleanup_visitor_heartbeats()
returns void language sql as $$
  delete from public.visitor_heartbeats
  where last_seen_at < now() - interval '30 minutes';
$$;
