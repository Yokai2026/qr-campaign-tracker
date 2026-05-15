-- ============================================
-- Lead-Magnet Subscribers (Email-Capture-Funnel)
-- ============================================
-- Speichert Email-Captures von Lead-Magnet-PDFs (DSGVO-Checkliste etc.).
-- Verknuepft mit Attribution + Conversion-zu-Signup.

create table if not exists public.lead_magnet_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  magnet_slug text not null default 'dsgvo-checkliste-2026',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  referrer text,
  ip_hash text,
  user_agent text,
  downloaded_at timestamptz,
  converted_to_signup boolean not null default false,
  converted_user_id uuid,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists lead_magnet_email_magnet_uniq
  on public.lead_magnet_subscribers (lower(email), magnet_slug);

create index if not exists lead_magnet_subscribers_utm_source_idx
  on public.lead_magnet_subscribers (utm_source);

create index if not exists lead_magnet_subscribers_created_at_idx
  on public.lead_magnet_subscribers (created_at desc);

comment on table public.lead_magnet_subscribers is 'Lead-Magnet Email-Captures (DSGVO-Checkliste-PDF etc.). Track Source + Conversion-zu-Signup.';
