-- ============================================
-- Content-Repurposing Drafts
-- ============================================
-- Pro Blog-Post werden 3 Drafts generiert (LinkedIn-Post, Twitter-Thread, Reddit-Post)
-- via Claude. Admin reviewt, editiert, kopiert, postet manuell -- oder spaeter
-- automatisch wenn LinkedIn-Company-Page + OAuth eingerichtet ist.

create table if not exists public.content_drafts (
  id uuid primary key default gen_random_uuid(),
  blog_slug text not null,
  channel text not null check (channel in ('linkedin', 'twitter', 'reddit')),
  draft_text text not null,
  model text not null default 'claude-haiku-4-5',
  status text not null default 'draft' check (status in ('draft', 'edited', 'posted', 'skipped')),
  posted_at timestamptz,
  external_url text,                                    -- Link zum geposteten Content (manuell eingetragen)
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Einzigartig pro Slug + Channel (re-generate ueberschreibt)
create unique index if not exists content_drafts_slug_channel_uniq
  on public.content_drafts (blog_slug, channel);

create index if not exists content_drafts_status_idx on public.content_drafts (status);
create index if not exists content_drafts_created_at_idx on public.content_drafts (created_at desc);

-- updated_at-Trigger
create or replace function public.set_content_drafts_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists content_drafts_updated_at_trg on public.content_drafts;
create trigger content_drafts_updated_at_trg
  before update on public.content_drafts
  for each row execute function public.set_content_drafts_updated_at();
