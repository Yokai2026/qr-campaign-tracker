-- ============================================
-- short_host: per-resource custom domain
-- ============================================
-- Optional hostname that overrides the primary custom domain when building
-- short URLs for a specific QR code or short link. Leaving it NULL keeps the
-- existing behaviour (fall back to primary custom domain, then app host).

alter table public.qr_codes
  add column if not exists short_host text;

alter table public.short_links
  add column if not exists short_host text;

-- Hosts are stored lowercased; no unique constraint (many resources share one host).
