-- ============================================
-- CLEANUP: Remove all seed/test data
-- Run this in the Supabase SQL Editor
-- Deletes in correct order (respects foreign keys)
-- ============================================

-- 1. Events (depend on qr_codes, placements, campaigns)
DELETE FROM public.page_events;
DELETE FROM public.redirect_events;

-- 2. QR status history (depends on qr_codes)
DELETE FROM public.qr_status_history;

-- 3. QR codes (depend on placements)
DELETE FROM public.qr_codes;

-- 4. Placements (depend on campaigns, locations)
DELETE FROM public.placements;

-- 5. Campaign tags (depend on campaigns)
DELETE FROM public.campaign_tags;

-- 6. Campaigns
DELETE FROM public.campaigns;

-- 7. Locations
DELETE FROM public.locations;
