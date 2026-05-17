-- 045_mail_tracking.sql
-- Mail-Tracking-Feature: Send + Track für admin-only initial, später public.
-- Multi-tenant (user_id pro Campaign) — also für End-User-Use vorbereitet.

-- ============================================
-- 1) Campaigns — ein Mailing pro User
-- ============================================
create table if not exists public.mail_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null,
  body_html text not null,
  body_text text,
  from_email text not null default 'david@spurig.com',
  from_name text default 'David',
  reply_to text,
  status text not null default 'draft' check (status in ('draft','sending','sent','failed')),
  sent_at timestamptz,
  recipient_count int default 0,
  open_count int default 0,
  human_open_count int default 0,
  click_count int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================
-- 2) Recipients — Pro Empfänger ein Eintrag
-- ============================================
create table if not exists public.mail_recipients (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.mail_campaigns(id) on delete cascade,
  email text not null,
  name text,
  pixel_token text unique not null,
  sent_at timestamptz,
  first_open_at timestamptz,
  last_open_at timestamptz,
  open_count int default 0,
  human_open_count int default 0,
  first_click_at timestamptz,
  click_count int default 0,
  last_user_agent text,
  last_ip_hash text,
  bounce_type text,
  status text not null default 'queued' check (status in ('queued','sent','bounced','delivered','failed')),
  created_at timestamptz default now()
);

-- ============================================
-- 3) Links — pro Link im Body ein Eintrag, alle umgeschrieben
-- ============================================
create table if not exists public.mail_links (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.mail_campaigns(id) on delete cascade,
  original_url text not null,
  click_token text unique not null,
  click_count int default 0,
  unique_click_count int default 0,
  created_at timestamptz default now()
);

-- ============================================
-- 4) Clicks — pro Klick-Event ein Eintrag
-- ============================================
create table if not exists public.mail_clicks (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.mail_recipients(id) on delete cascade,
  link_id uuid not null references public.mail_links(id) on delete cascade,
  clicked_at timestamptz default now(),
  user_agent text,
  ip_hash text,
  is_bot boolean default false
);

-- ============================================
-- 5) Opens — pro Open-Event ein Eintrag (für Apple-MPP-Detail-Analyse)
-- ============================================
create table if not exists public.mail_opens (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.mail_recipients(id) on delete cascade,
  opened_at timestamptz default now(),
  user_agent text,
  ip_hash text,
  is_apple_proxy boolean default false,
  is_bot boolean default false
);

-- ============================================
-- Indizes für Performance
-- ============================================
create index if not exists mail_campaigns_user_idx on public.mail_campaigns(user_id, created_at desc);
create index if not exists mail_recipients_campaign_idx on public.mail_recipients(campaign_id);
create index if not exists mail_recipients_pixel_token_idx on public.mail_recipients(pixel_token);
create index if not exists mail_links_campaign_idx on public.mail_links(campaign_id);
create index if not exists mail_links_click_token_idx on public.mail_links(click_token);
create index if not exists mail_clicks_recipient_idx on public.mail_clicks(recipient_id, clicked_at desc);
create index if not exists mail_opens_recipient_idx on public.mail_opens(recipient_id, opened_at desc);

-- ============================================
-- RLS — Alle Tables mit Service-Role-Only-Access
-- (UI nutzt Service-Role-Client für admin-Zugriff)
-- ============================================
alter table public.mail_campaigns enable row level security;
alter table public.mail_recipients enable row level security;
alter table public.mail_links enable row level security;
alter table public.mail_clicks enable row level security;
alter table public.mail_opens enable row level security;

-- Owner-Read-Policy für Campaigns (Multi-Tenant-Ready)
drop policy if exists "Users can read their own mail campaigns" on public.mail_campaigns;
create policy "Users can read their own mail campaigns"
  on public.mail_campaigns
  for select
  using (auth.uid() = user_id);

-- Updated-At-Trigger
create or replace function public.set_updated_at_mail()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists mail_campaigns_set_updated_at on public.mail_campaigns;
create trigger mail_campaigns_set_updated_at
  before update on public.mail_campaigns
  for each row execute function public.set_updated_at_mail();
