-- Webhook-Diagnostik: Singleton-Style-Tabelle, eine Row pro Service.
-- Wird vom Webhook-Handler bei jedem signaturen-verifizierten Eingang
-- aktualisiert. Damit kann der Admin-Banner zuverlaessig anzeigen,
-- ob der Webhook tatsaechlich Events empfaengt — unabhaengig davon,
-- ob die Events einer bestehenden outbound_message zugeordnet werden konnten.

create table if not exists public.webhook_diagnostics (
  service text primary key,
  last_received_at timestamptz,
  last_event_type text,
  total_received bigint not null default 0,
  updated_at timestamptz not null default now()
);

comment on table public.webhook_diagnostics is
  'Singleton-Diagnostik: trackt letzten Webhook-Eingang je Service (resend, stripe, ...). Eine Row pro service-key.';

-- Initiale Rows fuer die bekannten Services anlegen, damit Lookups nicht null returnen.
insert into public.webhook_diagnostics (service) values ('resend')
  on conflict (service) do nothing;
insert into public.webhook_diagnostics (service) values ('stripe')
  on conflict (service) do nothing;

-- RLS: nur Admins koennen lesen (Service-Role-Writes bleiben unberuehrt).
alter table public.webhook_diagnostics enable row level security;

drop policy if exists "Admins can read webhook diagnostics" on public.webhook_diagnostics;
create policy "Admins can read webhook diagnostics"
  on public.webhook_diagnostics
  for select
  to authenticated
  using ((select role from public.profiles where id = auth.uid()) = 'admin');

-- updated_at automatisch aktualisieren
create or replace function public.set_webhook_diagnostics_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_webhook_diagnostics_updated_at on public.webhook_diagnostics;
create trigger trg_webhook_diagnostics_updated_at
  before update on public.webhook_diagnostics
  for each row execute function public.set_webhook_diagnostics_updated_at();
