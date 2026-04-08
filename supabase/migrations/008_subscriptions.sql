-- ============================================
-- Subscriptions & Trial Support
-- ============================================

-- Trial-Feld auf profiles: Jeder neue User bekommt 14 Tage Trial
alter table public.profiles
  add column if not exists trial_ends_at timestamptz default now() + interval '14 days';

-- Bestehende User bekommen Trial ab jetzt
update public.profiles
  set trial_ends_at = now() + interval '14 days'
  where trial_ends_at is null;

-- ============================================
-- SUBSCRIPTIONS (synced via Lemon Squeezy webhooks)
-- ============================================
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  ls_subscription_id text unique not null,
  ls_customer_id text not null,
  ls_variant_id text not null,
  plan_tier text not null default 'free'
    check (plan_tier in ('free', 'standard', 'pro')),
  status text not null default 'on_trial'
    check (status in ('on_trial', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions(user_id);
create index idx_subscriptions_status on public.subscriptions(status);
create index idx_subscriptions_ls_sub_id on public.subscriptions(ls_subscription_id);

-- Auto-update updated_at
create trigger set_subscriptions_updated_at
  before update on public.subscriptions
  for each row execute function public.handle_updated_at();

-- ============================================
-- RLS: Users können nur ihre eigene Subscription lesen
-- Inserts/Updates nur via Service Role (Webhook)
-- ============================================
alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Kein insert/update/delete Policy für authenticated users
-- → Nur Service Role kann schreiben (Webhook Handler)

-- Update auth trigger: Setze trial_ends_at bei neuen Usern
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role, trial_ends_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'editor'),
    now() + interval '14 days'
  );
  return new;
end;
$$ language plpgsql security definer;
