-- ============================================
-- Custom Short Domains
-- ============================================
-- Users can register custom hostnames (e.g. kurz.example.com)
-- that will serve the QR/Link redirects instead of the default app host.

create table public.custom_domains (
  id uuid primary key default gen_random_uuid(),
  host text not null,
  verification_token text not null default replace(gen_random_uuid()::text, '-', ''),
  verified boolean not null default false,
  verified_at timestamptz,
  is_primary boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Normalize hosts to lowercase
create unique index idx_custom_domains_host on public.custom_domains (lower(host));
create index idx_custom_domains_verified on public.custom_domains (verified) where verified = true;

-- Only one primary domain at a time (among verified ones)
create unique index idx_custom_domains_primary on public.custom_domains (is_primary) where is_primary = true;

-- Trigger: updated_at
create trigger set_updated_at before update on public.custom_domains
  for each row execute function public.handle_updated_at();

-- ============================================
-- RLS
-- ============================================
alter table public.custom_domains enable row level security;

create policy "custom_domains_select" on public.custom_domains
  for select using (true);

create policy "custom_domains_insert" on public.custom_domains
  for insert with check (auth.role() = 'authenticated');

create policy "custom_domains_update" on public.custom_domains
  for update using (auth.role() = 'authenticated');

create policy "custom_domains_delete" on public.custom_domains
  for delete using (auth.role() = 'authenticated');
