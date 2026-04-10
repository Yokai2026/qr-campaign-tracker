-- ============================================
-- Migration: Simplify plan_tier to 'free' | 'paid'
-- Previously: 'free' | 'standard' | 'pro'
-- New model: single paid plan (Spurig) with monthly/yearly variants
-- ============================================

-- Migrate existing data: standard/pro → paid
update public.subscriptions
  set plan_tier = 'paid'
  where plan_tier in ('standard', 'pro');

-- Drop old check constraint
alter table public.subscriptions
  drop constraint if exists subscriptions_plan_tier_check;

-- Add new check constraint with simplified values
alter table public.subscriptions
  add constraint subscriptions_plan_tier_check
  check (plan_tier in ('free', 'paid'));
