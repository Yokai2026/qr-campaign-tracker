-- ============================================
-- QR Campaign Tracker - Initial Schema
-- ============================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================
-- PROFILES (extends Supabase auth.users)
-- ============================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_profiles_email on public.profiles(email);
create index idx_profiles_role on public.profiles(role);

-- ============================================
-- CAMPAIGNS
-- ============================================
create table public.campaigns (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  description text,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'completed', 'archived')),
  start_date date,
  end_date date,
  owner_id uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_campaigns_slug on public.campaigns(slug);
create index idx_campaigns_status on public.campaigns(status);
create index idx_campaigns_owner on public.campaigns(owner_id);
create index idx_campaigns_dates on public.campaigns(start_date, end_date);

-- ============================================
-- CAMPAIGN TAGS
-- ============================================
create table public.campaign_tags (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  tag text not null,
  created_at timestamptz not null default now()
);

create index idx_campaign_tags_campaign on public.campaign_tags(campaign_id);
create index idx_campaign_tags_tag on public.campaign_tags(tag);
create unique index idx_campaign_tags_unique on public.campaign_tags(campaign_id, tag);

-- ============================================
-- LOCATIONS
-- ============================================
create table public.locations (
  id uuid primary key default uuid_generate_v4(),
  district text,
  venue_name text not null,
  address text,
  location_type text not null default 'other' check (location_type in (
    'library', 'school', 'youth_center', 'community_center',
    'public_board', 'event_space', 'office', 'shop', 'other'
  )),
  notes text,
  active boolean not null default true,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_locations_district on public.locations(district);
create index idx_locations_type on public.locations(location_type);
create index idx_locations_active on public.locations(active);

-- ============================================
-- PLACEMENTS
-- ============================================
create table public.placements (
  id uuid primary key default uuid_generate_v4(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  name text not null,
  placement_code text not null unique,
  placement_type text not null default 'poster' check (placement_type in (
    'poster', 'flyer', 'sticker', 'banner', 'digital_screen', 'handout', 'other'
  )),
  poster_version text,
  flyer_version text,
  notes text,
  status text not null default 'planned' check (status in (
    'planned', 'installed', 'active', 'paused', 'removed', 'archived'
  )),
  installed_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_placements_campaign on public.placements(campaign_id);
create index idx_placements_location on public.placements(location_id);
create index idx_placements_code on public.placements(placement_code);
create index idx_placements_status on public.placements(status);
create index idx_placements_type on public.placements(placement_type);

-- ============================================
-- QR CODES
-- ============================================
create table public.qr_codes (
  id uuid primary key default uuid_generate_v4(),
  placement_id uuid not null references public.placements(id) on delete cascade,
  short_code text not null unique,
  target_url text not null,
  active boolean not null default true,
  valid_from timestamptz,
  valid_until timestamptz,
  note text,
  created_by uuid references public.profiles(id),
  qr_png_url text,
  qr_svg_url text,
  -- UTM configuration
  utm_source text default 'offline_qr',
  utm_medium text default 'qr_code',
  utm_campaign text,
  utm_content text,
  utm_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index idx_qr_codes_short_code on public.qr_codes(short_code);
create index idx_qr_codes_placement on public.qr_codes(placement_id);
create index idx_qr_codes_active on public.qr_codes(active);
create index idx_qr_codes_valid on public.qr_codes(valid_from, valid_until);
create index idx_qr_codes_created_by on public.qr_codes(created_by);

-- ============================================
-- QR STATUS HISTORY (audit trail)
-- ============================================
create table public.qr_status_history (
  id uuid primary key default uuid_generate_v4(),
  qr_code_id uuid not null references public.qr_codes(id) on delete cascade,
  action text not null check (action in (
    'created', 'activated', 'deactivated', 'paused',
    'expired', 'replaced', 'target_changed', 'note_added',
    'archived', 'downloaded'
  )),
  changed_by uuid references public.profiles(id),
  old_value text,
  new_value text,
  note text,
  created_at timestamptz not null default now()
);

create index idx_qr_history_qr_code on public.qr_status_history(qr_code_id);
create index idx_qr_history_action on public.qr_status_history(action);
create index idx_qr_history_created on public.qr_status_history(created_at);

-- ============================================
-- REDIRECT EVENTS
-- ============================================
create table public.redirect_events (
  id uuid primary key default uuid_generate_v4(),
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  placement_id uuid references public.placements(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  short_code text not null,
  event_type text not null default 'qr_open' check (event_type in (
    'qr_open', 'qr_blocked_inactive', 'qr_expired',
    'link_open', 'link_expired', 'link_blocked_inactive'
  )),
  referrer text,
  user_agent text,
  device_type text,
  ip_hash text,
  destination_url text,
  country text,
  created_at timestamptz not null default now()
);

create index idx_redirect_events_qr_code on public.redirect_events(qr_code_id);
create index idx_redirect_events_placement on public.redirect_events(placement_id);
create index idx_redirect_events_campaign on public.redirect_events(campaign_id);
create index idx_redirect_events_short_code on public.redirect_events(short_code);
create index idx_redirect_events_type on public.redirect_events(event_type);
create index idx_redirect_events_created on public.redirect_events(created_at);
create index idx_redirect_events_campaign_date on public.redirect_events(campaign_id, created_at);
create index idx_redirect_events_placement_date on public.redirect_events(placement_id, created_at);

-- ============================================
-- PAGE EVENTS (landing page tracking)
-- ============================================
create table public.page_events (
  id uuid primary key default uuid_generate_v4(),
  event_type text not null check (event_type in (
    'landing_page_view', 'cta_click', 'form_start',
    'form_submit', 'file_download'
  )),
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  placement_id uuid references public.placements(id) on delete set null,
  campaign_id uuid references public.campaigns(id) on delete set null,
  session_id text,
  page_url text,
  metadata jsonb,
  referrer text,
  user_agent text,
  device_type text,
  ip_hash text,
  created_at timestamptz not null default now()
);

create index idx_page_events_type on public.page_events(event_type);
create index idx_page_events_qr_code on public.page_events(qr_code_id);
create index idx_page_events_placement on public.page_events(placement_id);
create index idx_page_events_campaign on public.page_events(campaign_id);
create index idx_page_events_session on public.page_events(session_id);
create index idx_page_events_created on public.page_events(created_at);
create index idx_page_events_campaign_date on public.page_events(campaign_id, created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table public.profiles enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_tags enable row level security;
alter table public.locations enable row level security;
alter table public.placements enable row level security;
alter table public.qr_codes enable row level security;
alter table public.qr_status_history enable row level security;
alter table public.redirect_events enable row level security;
alter table public.page_events enable row level security;

-- Profiles: users can read all, update own
create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

-- All authenticated users can read campaigns, locations, placements, qr_codes
create policy "campaigns_select" on public.campaigns for select using (true);
create policy "campaigns_insert" on public.campaigns for insert with check (auth.role() = 'authenticated');
create policy "campaigns_update" on public.campaigns for update using (auth.role() = 'authenticated');
create policy "campaigns_delete" on public.campaigns for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "campaign_tags_select" on public.campaign_tags for select using (true);
create policy "campaign_tags_insert" on public.campaign_tags for insert with check (auth.role() = 'authenticated');
create policy "campaign_tags_delete" on public.campaign_tags for delete using (auth.role() = 'authenticated');

create policy "locations_select" on public.locations for select using (true);
create policy "locations_insert" on public.locations for insert with check (auth.role() = 'authenticated');
create policy "locations_update" on public.locations for update using (auth.role() = 'authenticated');
create policy "locations_delete" on public.locations for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "placements_select" on public.placements for select using (true);
create policy "placements_insert" on public.placements for insert with check (auth.role() = 'authenticated');
create policy "placements_update" on public.placements for update using (auth.role() = 'authenticated');
create policy "placements_delete" on public.placements for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "qr_codes_select" on public.qr_codes for select using (true);
create policy "qr_codes_insert" on public.qr_codes for insert with check (auth.role() = 'authenticated');
create policy "qr_codes_update" on public.qr_codes for update using (auth.role() = 'authenticated');
create policy "qr_codes_delete" on public.qr_codes for delete using (
  exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

create policy "qr_history_select" on public.qr_status_history for select using (true);
create policy "qr_history_insert" on public.qr_status_history for insert with check (auth.role() = 'authenticated');

-- Redirect events: public insert (from redirect handler), authenticated read
create policy "redirect_events_select" on public.redirect_events for select using (auth.role() = 'authenticated');
create policy "redirect_events_insert" on public.redirect_events for insert with check (true);

-- Page events: public insert (from tracking script), authenticated read
create policy "page_events_select" on public.page_events for select using (auth.role() = 'authenticated');
create policy "page_events_insert" on public.page_events for insert with check (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.campaigns
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.locations
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.placements
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.qr_codes
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'editor')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- VIEWS for analytics
-- ============================================

create or replace view public.campaign_stats as
select
  c.id as campaign_id,
  c.name as campaign_name,
  c.status as campaign_status,
  count(distinct p.id) as placement_count,
  count(distinct qr.id) as qr_code_count,
  count(distinct re.id) as total_opens,
  count(distinct pe.id) filter (where pe.event_type = 'cta_click') as cta_clicks,
  count(distinct pe.id) filter (where pe.event_type = 'form_submit') as form_submits
from public.campaigns c
left join public.placements p on p.campaign_id = c.id
left join public.qr_codes qr on qr.placement_id = p.id
left join public.redirect_events re on re.campaign_id = c.id and re.event_type = 'qr_open'
left join public.page_events pe on pe.campaign_id = c.id
group by c.id, c.name, c.status;
