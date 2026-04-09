-- ============================================
-- Migration: Lemon Squeezy → Stripe
-- Rename ls_* columns to stripe_* equivalents
-- ============================================

-- Rename columns
alter table public.subscriptions rename column ls_subscription_id to stripe_subscription_id;
alter table public.subscriptions rename column ls_customer_id to stripe_customer_id;
alter table public.subscriptions rename column ls_variant_id to stripe_price_id;

-- Update unique constraint (drop old, create new)
alter table public.subscriptions drop constraint if exists subscriptions_ls_subscription_id_key;
alter table public.subscriptions add constraint subscriptions_stripe_subscription_id_key unique (stripe_subscription_id);

-- Drop old index and create new one
drop index if exists idx_subscriptions_ls_sub_id;
create index if not exists idx_subscriptions_stripe_sub_id on public.subscriptions(stripe_subscription_id);
