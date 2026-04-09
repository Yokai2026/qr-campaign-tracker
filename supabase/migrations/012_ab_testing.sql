-- A/B testing variants for QR codes and short links
-- Weighted random distribution across multiple target URLs

create table public.ab_variants (
  id uuid primary key default gen_random_uuid(),
  qr_code_id uuid references public.qr_codes(id) on delete cascade,
  short_link_id uuid references public.short_links(id) on delete cascade,
  target_url text not null,
  weight int not null default 50 check (weight >= 1 and weight <= 100),
  label text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Exactly one parent must be set
  constraint ab_variants_parent_check check (
    (qr_code_id is not null and short_link_id is null) or
    (qr_code_id is null and short_link_id is not null)
  )
);

-- Track which AB variant was served
alter table public.redirect_events
  add column ab_variant_id uuid references public.ab_variants(id) on delete set null;

-- Indexes
create index idx_ab_variants_qr on public.ab_variants(qr_code_id) where qr_code_id is not null;
create index idx_ab_variants_link on public.ab_variants(short_link_id) where short_link_id is not null;

-- Updated-at trigger
create trigger set_ab_variants_updated_at
  before update on public.ab_variants
  for each row execute function public.handle_updated_at();

-- RLS
alter table public.ab_variants enable row level security;

create policy "Users can view own ab variants" on public.ab_variants
  for select using (
    (qr_code_id is not null and exists (
      select 1 from public.qr_codes qr
      join public.placements p on p.id = qr.placement_id
      join public.campaigns c on c.id = p.campaign_id
      where qr.id = ab_variants.qr_code_id
        and c.owner_id = auth.uid()
    ))
    or
    (short_link_id is not null and exists (
      select 1 from public.short_links sl
      where sl.id = ab_variants.short_link_id
        and sl.created_by = auth.uid()
    ))
  );

create policy "Users can create own ab variants" on public.ab_variants
  for insert with check (
    (qr_code_id is not null and exists (
      select 1 from public.qr_codes qr
      join public.placements p on p.id = qr.placement_id
      join public.campaigns c on c.id = p.campaign_id
      where qr.id = ab_variants.qr_code_id
        and c.owner_id = auth.uid()
    ))
    or
    (short_link_id is not null and exists (
      select 1 from public.short_links sl
      where sl.id = ab_variants.short_link_id
        and sl.created_by = auth.uid()
    ))
  );

create policy "Users can update own ab variants" on public.ab_variants
  for update using (
    (qr_code_id is not null and exists (
      select 1 from public.qr_codes qr
      join public.placements p on p.id = qr.placement_id
      join public.campaigns c on c.id = p.campaign_id
      where qr.id = ab_variants.qr_code_id
        and c.owner_id = auth.uid()
    ))
    or
    (short_link_id is not null and exists (
      select 1 from public.short_links sl
      where sl.id = ab_variants.short_link_id
        and sl.created_by = auth.uid()
    ))
  );

create policy "Users can delete own ab variants" on public.ab_variants
  for delete using (
    (qr_code_id is not null and exists (
      select 1 from public.qr_codes qr
      join public.placements p on p.id = qr.placement_id
      join public.campaigns c on c.id = p.campaign_id
      where qr.id = ab_variants.qr_code_id
        and c.owner_id = auth.uid()
    ))
    or
    (short_link_id is not null and exists (
      select 1 from public.short_links sl
      where sl.id = ab_variants.short_link_id
        and sl.created_by = auth.uid()
    ))
  );

create policy "Service role full access to ab variants" on public.ab_variants
  for all using (auth.role() = 'service_role');
