-- 043_rls_content_tables.sql
-- Fix Supabase Security Advisor CRITICAL warnings:
-- 1. RLS Disabled in Public on: content_drafts, content_blogs, content_ideas, lead_magnet_subscribers
-- 2. Security Definer View: public.campaign_stats
--
-- Diese Tabellen werden ausschliesslich von Server-Side-Routes (Service-Role-Client)
-- gelesen/geschrieben — Service-Role bypassed RLS automatisch, deshalb brauchen
-- wir KEINE public-Lese/Schreib-Policies. RLS-enable allein blockiert dann
-- anon/authenticated-Direktzugriffe komplett.
--
-- Spezialfall content_blogs: SSR via createServiceClient() in /blog/[slug],
-- /blog, sitemap.ts, related-posts.tsx — alle bypass RLS. Sicher.

-- ============================================
-- 1) Enable RLS on content tables
-- ============================================

alter table public.content_drafts enable row level security;
alter table public.content_blogs enable row level security;
alter table public.content_ideas enable row level security;
alter table public.lead_magnet_subscribers enable row level security;

-- ============================================
-- 2) Optionale Public-Read-Policy fuer content_blogs
-- ============================================
-- Aktuell lesen alle Frontend-Routes via Service-Role, also bypassed RLS.
-- ABER: falls jemand mal Client-Side fetcht (z.B. eine future static-page mit
-- @supabase/ssr browser-client), soll lesen erlaubt sein fuer published Blogs.
-- Beschraenkt auf SELECT, keine Writes.

drop policy if exists "content_blogs are readable by anyone" on public.content_blogs;
create policy "content_blogs are readable by anyone"
  on public.content_blogs
  for select
  using (true);

-- ============================================
-- 3) campaign_stats View — security_invoker statt SECURITY DEFINER
-- ============================================
-- Default Views laufen mit Owner-Permissions (= SECURITY DEFINER), bypassen
-- damit RLS der zugrundeliegenden Tabellen. Mit security_invoker=true laeuft
-- die View mit den Permissions des aufrufenden Users — RLS der Base-Tables
-- (campaigns, placements, qr_codes, redirect_events, page_events) greift dann.

alter view public.campaign_stats set (security_invoker = true);
