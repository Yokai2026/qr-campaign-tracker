-- API-Token-System fuer den Spurig Public API
-- Tokens werden gehasht (SHA-256) gespeichert; Full-Token wird nur
-- einmalig beim Erstellen zurueckgegeben. Pro User beliebig viele
-- Tokens. Soft-Delete via revoked_at.

create table public.api_tokens (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  token_prefix  text not null,                -- erste 12 Zeichen fuer UI-Anzeige
  token_hash    text not null unique,         -- SHA-256 Hex vom Full-Token
  last_used_at  timestamptz,
  expires_at    timestamptz,
  revoked_at    timestamptz,
  created_at    timestamptz not null default now()
);

create index idx_api_tokens_user on public.api_tokens(user_id);
create index idx_api_tokens_hash on public.api_tokens(token_hash) where revoked_at is null;

comment on table public.api_tokens is
  'Public-API Bearer-Tokens. token_hash = SHA-256 Hex. Plaintext nur einmalig zurueck.';

-- RLS: User sieht/managed nur seine eigenen Tokens
alter table public.api_tokens enable row level security;

create policy "api_tokens_select_own" on public.api_tokens
  for select using (auth.uid() = user_id);

create policy "api_tokens_insert_own" on public.api_tokens
  for insert with check (auth.uid() = user_id);

create policy "api_tokens_update_own" on public.api_tokens
  for update using (auth.uid() = user_id);

create policy "api_tokens_delete_own" on public.api_tokens
  for delete using (auth.uid() = user_id);
