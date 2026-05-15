-- ============================================
-- Attribution Tracking auf profiles
-- ============================================
-- Speichert UTM-Source/Medium/Campaign/Content + Referrer beim Signup.
-- Wird vom Middleware aus URL + Cookie ausgelesen.

alter table public.profiles
  add column if not exists attribution_source     text,    -- z.B. 'linkedin', 'twitter', 'reddit', 'cold_email'
  add column if not exists attribution_medium     text,    -- 'social', 'cold', 'organic', 'referral'
  add column if not exists attribution_campaign   text,    -- z.B. blog-slug oder segment
  add column if not exists attribution_content    text,    -- z.B. lead-id, post-id
  add column if not exists attribution_referrer   text,    -- HTTP-Referrer URL
  add column if not exists attribution_first_seen_at timestamptz;

create index if not exists profiles_attribution_source_idx on public.profiles (attribution_source);
create index if not exists profiles_attribution_campaign_idx on public.profiles (attribution_campaign);

comment on column public.profiles.attribution_source is 'UTM-Source beim Signup (linkedin/twitter/reddit/cold_email/organic etc.)';
comment on column public.profiles.attribution_medium is 'UTM-Medium (social/cold/organic/referral)';
comment on column public.profiles.attribution_campaign is 'UTM-Campaign (blog-slug oder segment-id)';
comment on column public.profiles.attribution_content is 'UTM-Content (lead-id oder post-id fuer feinere Attribution)';
