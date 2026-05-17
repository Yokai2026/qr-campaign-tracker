-- 048_referral_program.sql
-- Referral-Programm: jeder User kriegt einen unique Code, kann teilen,
-- bei Conversion eines Invitees zum paid plan kriegt Referrer 1 Monat gratis.

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  code text not null unique,
  times_used int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists referral_codes_code_idx on public.referral_codes (code);

-- Pro Klick / Signup-Tracking einen Eintrag, dann beim Stripe-Webhook auf
-- converted/rewarded transitionieren.
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  referral_code_id uuid not null references public.referral_codes(id) on delete cascade,
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  invitee_user_id uuid references auth.users(id) on delete set null,
  invitee_email text,
  ip_hash text,
  user_agent text,
  status text not null default 'clicked' check (status in (
    'clicked',      -- Landing-Page besucht via ?ref=
    'signed_up',    -- Account erstellt mit aktivem ref-Cookie
    'converted',    -- Invitee hat erste paid Rechnung gezahlt
    'rewarded',     -- Referrer hat Free-Month-Coupon zugewiesen bekommen
    'invalid'       -- Self-Referral oder anderer Missbrauch
  )),
  stripe_coupon_id text,
  converted_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists referrals_referrer_idx on public.referrals (referrer_user_id, created_at desc);
create index if not exists referrals_invitee_user_idx on public.referrals (invitee_user_id) where invitee_user_id is not null;
create index if not exists referrals_status_idx on public.referrals (status);

-- RLS: User sieht nur eigene Referrals
alter table public.referral_codes enable row level security;
alter table public.referrals enable row level security;

drop policy if exists "Users see own referral code" on public.referral_codes;
create policy "Users see own referral code"
  on public.referral_codes
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users see own referrals (as referrer)" on public.referrals;
create policy "Users see own referrals (as referrer)"
  on public.referrals
  for select
  using (auth.uid() = referrer_user_id);

-- Auto-generate Code on User-Insert (8 chars, alphanumerisch, lowercase)
create or replace function public.generate_referral_code()
returns trigger language plpgsql security definer as $$
declare
  new_code text;
  attempts int := 0;
begin
  loop
    attempts := attempts + 1;
    -- 8 Chars aus a-z + 0-9, exklusiv verwirrender (0, o, i, l, 1)
    new_code := lower(substr(encode(gen_random_bytes(6), 'base64'), 1, 8));
    new_code := regexp_replace(new_code, '[^a-z0-9]', '', 'g');
    -- Auf 8 Chars trimmen / auffüllen
    if length(new_code) >= 8 then
      new_code := substr(new_code, 1, 8);
      exit when not exists (select 1 from public.referral_codes where code = new_code);
    end if;
    if attempts > 20 then
      raise exception 'Could not generate unique referral code after 20 attempts';
    end if;
  end loop;

  insert into public.referral_codes (user_id, code)
  values (new.id, new_code)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

-- Trigger auf auth.users (über profiles-Sync, sicherer als direkt)
drop trigger if exists trigger_generate_referral_code on auth.users;
create trigger trigger_generate_referral_code
  after insert on auth.users
  for each row execute function public.generate_referral_code();

-- Backfill: bestehende User ohne Code kriegen einen
do $$
declare u record;
begin
  for u in select id from auth.users
           where id not in (select user_id from public.referral_codes)
  loop
    -- Inline-generate für Bestand
    insert into public.referral_codes (user_id, code)
    values (u.id, lower(substr(encode(gen_random_bytes(6), 'base64'), 1, 8)))
    on conflict do nothing;
  end loop;
end $$;
