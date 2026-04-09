-- Conditional redirect rules for QR codes and short links
-- Allows different target URLs based on device, OS, browser, country, time, day of week

create table public.redirect_rules (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid references public.qr_codes(id) on delete cascade,
  short_link_id uuid references public.short_links(id) on delete cascade,
  condition_type text not null check (condition_type in ('device', 'os', 'browser', 'country', 'time_range', 'day_of_week')),
  condition_value jsonb not null,
  target_url text not null,
  label text,
  priority int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Exactly one parent must be set
  constraint redirect_rules_parent_check check (
    (qr_code_id is not null and short_link_id is null) or
    (qr_code_id is null and short_link_id is not null)
  )
);

-- Indexes
create index idx_redirect_rules_qr on public.redirect_rules(qr_code_id) where qr_code_id is not null;
create index idx_redirect_rules_link on public.redirect_rules(short_link_id) where short_link_id is not null;

-- Updated-at trigger
create trigger set_redirect_rules_updated_at
  before update on public.redirect_rules
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.redirect_rules enable row level security;

-- Users can read rules for their own QR codes / links
create policy "Users can view own redirect rules" on public.redirect_rules
  for select using (
    (qr_code_id is not null and exists (
      select 1 from public.qr_codes qr
      join public.placements p on p.id = qr.placement_id
      join public.campaigns c on c.id = p.campaign_id
      where qr.id = redirect_rules.qr_code_id
        and c.owner_id = auth.uid()
    ))
    or
    (short_link_id is not null and exists (
      select 1 from public.short_links sl
      where sl.id = redirect_rules.short_link_id
        and sl.created_by = auth.uid()
    ))
  );

-- Users can create own redirect rules
create policy "Users can create own redirect rules" on public.redirect_rules
  for insert with check (
    (qr_code_id is not null and exists (
      select 1 from public.qr_codes qr
      join public.placements p on p.id = qr.placement_id
      join public.campaigns c on c.id = p.campaign_id
      where qr.id = redirect_rules.qr_code_id
        and c.owner_id = auth.uid()
    ))
    or
    (short_link_id is not null and exists (
      select 1 from public.short_links sl
      where sl.id = redirect_rules.short_link_id
        and sl.created_by = auth.uid()
    ))
  );

-- Users can update their own rules
create policy "Users can update own redirect rules" on public.redirect_rules
  for update using (
    (qr_code_id is not null and exists (
      select 1 from public.qr_codes qr
      join public.placements p on p.id = qr.placement_id
      join public.campaigns c on c.id = p.campaign_id
      where qr.id = redirect_rules.qr_code_id
        and c.owner_id = auth.uid()
    ))
    or
    (short_link_id is not null and exists (
      select 1 from public.short_links sl
      where sl.id = redirect_rules.short_link_id
        and sl.created_by = auth.uid()
    ))
  );

-- Users can delete their own rules
create policy "Users can delete own redirect rules" on public.redirect_rules
  for delete using (
    (qr_code_id is not null and exists (
      select 1 from public.qr_codes qr
      join public.placements p on p.id = qr.placement_id
      join public.campaigns c on c.id = p.campaign_id
      where qr.id = redirect_rules.qr_code_id
        and c.owner_id = auth.uid()
    ))
    or
    (short_link_id is not null and exists (
      select 1 from public.short_links sl
      where sl.id = redirect_rules.short_link_id
        and sl.created_by = auth.uid()
    ))
  );

-- Service role can do everything (for redirect handler)
create policy "Service role full access to redirect rules" on public.redirect_rules
  for all using (auth.role() = 'service_role');
