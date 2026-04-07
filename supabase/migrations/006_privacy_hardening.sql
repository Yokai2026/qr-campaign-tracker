-- Add browser_family and os_family columns to tracking tables
ALTER TABLE public.redirect_events ADD COLUMN IF NOT EXISTS browser_family text;
ALTER TABLE public.redirect_events ADD COLUMN IF NOT EXISTS os_family text;
ALTER TABLE public.page_events ADD COLUMN IF NOT EXISTS browser_family text;
ALTER TABLE public.page_events ADD COLUMN IF NOT EXISTS os_family text;

-- Clear existing user_agent data (GDPR: data minimization)
UPDATE public.redirect_events SET user_agent = NULL WHERE user_agent IS NOT NULL;
UPDATE public.page_events SET user_agent = NULL WHERE user_agent IS NOT NULL;

-- Clear full referrer URLs, keep only hostname
UPDATE public.redirect_events SET referrer = NULL WHERE referrer IS NOT NULL AND referrer LIKE '%/%';
UPDATE public.page_events SET referrer = NULL WHERE referrer IS NOT NULL AND referrer LIKE '%/%';

-- Harden profiles RLS: only authenticated users can read profiles
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

-- Restrict public INSERT on tracking tables to specific columns via check
DROP POLICY IF EXISTS "redirect_events_insert" ON public.redirect_events;
CREATE POLICY "redirect_events_insert" ON public.redirect_events FOR INSERT WITH CHECK (
  length(coalesce(user_agent, '')) < 10
  AND length(coalesce(referrer, '')) < 256
);

DROP POLICY IF EXISTS "page_events_insert" ON public.page_events;
CREATE POLICY "page_events_insert" ON public.page_events FOR INSERT WITH CHECK (
  length(coalesce(user_agent, '')) < 10
  AND length(coalesce(referrer, '')) < 256
  AND length(coalesce(metadata::text, '')) < 4096
);
