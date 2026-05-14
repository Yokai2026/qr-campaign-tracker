-- Outbound Acquisition Pipeline
-- Speichert gescrapte ICP-Leads (Google Places API) + Cold-Mail-Versand-History.
-- Admin-only Zugriff via service_role (kein RLS-Lesezugriff für User).

create table if not exists public.outbound_leads (
  id uuid primary key default gen_random_uuid(),

  -- Source tracking
  source text not null default 'google_places',         -- 'google_places' | 'manual' | 'import'
  source_id text,                                       -- Place-ID bei Google
  segment text not null,                                -- 'marketing_agency' | 'gastronomy' | 'crafts_sme' | 'events_tourism'
  query text,                                           -- Originaler Suchquery z.B. "Marketing Agentur Berlin"

  -- Business data
  name text not null,
  industry text,                                        -- Place-Type z.B. "marketing_agency"
  address text,
  city text,
  region text,
  country text default 'DE',
  phone text,
  website text,
  rating numeric(3, 2),                                 -- Google-Rating 0.00 - 5.00
  rating_count integer,

  -- Email Discovery (Phase 2)
  email text,
  email_status text default 'unknown',                  -- 'unknown' | 'discovered' | 'verified' | 'risky' | 'invalid'
  email_source text,                                    -- 'website_mailto' | 'contact_page' | 'hunter' | 'manual'

  -- Outreach State
  status text not null default 'new',                   -- 'new' | 'queued' | 'contacted' | 'replied' | 'bounced' | 'uninterested' | 'converted' | 'do_not_contact'
  notes text,

  -- Tracking
  scraped_at timestamptz not null default now(),
  contacted_at timestamptz,
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.outbound_leads
  add constraint outbound_leads_source_id_uniq unique (source, source_id);

create index if not exists outbound_leads_status_idx on public.outbound_leads (status);
create index if not exists outbound_leads_segment_idx on public.outbound_leads (segment);
create index if not exists outbound_leads_scraped_at_idx on public.outbound_leads (scraped_at desc);
create index if not exists outbound_leads_email_status_idx on public.outbound_leads (email_status);

-- Outbound Messages: jede gesendete Cold-Mail mit Tracking-State
create table if not exists public.outbound_messages (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.outbound_leads(id) on delete cascade,

  -- Template + Personalisierung
  template_key text not null,                           -- 'cold_v1_dsgvo' | 'cold_v1_price' | 'cold_v1_print' etc.
  subject text not null,
  body_html text not null,
  body_text text,
  personalization_hook text,                            -- Claude-generierter Hook für Debugging

  -- Resend Integration
  resend_message_id text,                               -- Resend-Message-ID für Webhook-Tracking
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  complained_at timestamptz,
  replied_at timestamptz,

  open_count integer default 0,
  click_count integer default 0,

  -- Error tracking
  status text not null default 'pending',               -- 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'replied' | 'failed'
  error text,

  created_at timestamptz not null default now()
);

create index if not exists outbound_messages_lead_id_idx on public.outbound_messages (lead_id);
create index if not exists outbound_messages_status_idx on public.outbound_messages (status);
create index if not exists outbound_messages_sent_at_idx on public.outbound_messages (sent_at desc);
create index if not exists outbound_messages_resend_id_idx on public.outbound_messages (resend_message_id);

-- Updated-At Trigger
create or replace function public.touch_outbound_leads_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists outbound_leads_touch on public.outbound_leads;
create trigger outbound_leads_touch
  before update on public.outbound_leads
  for each row
  execute function public.touch_outbound_leads_updated_at();

-- RLS: nur Service-Role, kein User-Zugriff
alter table public.outbound_leads enable row level security;
alter table public.outbound_messages enable row level security;

-- Keine SELECT/INSERT/UPDATE-Policies für authenticated/anon → defaults to deny.
-- service_role bypassed RLS, ist also der einzige Zugriffspfad.

comment on table public.outbound_leads is 'Outbound acquisition leads scraped from Google Places + manual sources. Admin/service-role only.';
comment on table public.outbound_messages is 'Cold-mail messages sent to outbound_leads. Tracks open/click/reply via Resend webhooks.';
