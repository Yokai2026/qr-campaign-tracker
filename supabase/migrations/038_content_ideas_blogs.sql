-- ============================================
-- Content-Pillar-System: Ideen + DB-backed Blogs
-- ============================================
-- 5 Pillars: dsgvo_privacy, offline_roi, qr_practices, attribution, behind_scenes
-- Pipeline: Pillar → 15 Ideen → Expand zu Blog (DB) → Repurpose zu 3 Channels

create table if not exists public.content_ideas (
  id uuid primary key default gen_random_uuid(),
  cluster text not null check (cluster in (
    'dsgvo_privacy', 'offline_roi', 'qr_practices', 'attribution', 'behind_scenes'
  )),
  title text not null,
  outline text,
  angle text,                                          -- konkreter Story-Aufhaenger
  target_keywords text,                                -- SEO-Hint
  status text not null default 'backlog' check (status in ('backlog', 'expanded', 'skipped')),
  expanded_blog_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_ideas_cluster_idx on public.content_ideas (cluster);
create index if not exists content_ideas_status_idx on public.content_ideas (status);
create index if not exists content_ideas_created_at_idx on public.content_ideas (created_at desc);

-- DB-backed Blog-Posts (vs. file-based in src/app/blog/<slug>/page.tsx)
create table if not exists public.content_blogs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  tags text[] not null default '{}',
  body_md text not null,                                -- Markdown, wird zum Repurpose verwendet
  source text not null default 'ideas' check (source in ('ideas', 'manual')),
  published boolean not null default false,
  cluster text,                                         -- ueberschneidet sich mit content_ideas.cluster
  origin_idea_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_blogs_slug_idx on public.content_blogs (slug);
create index if not exists content_blogs_published_idx on public.content_blogs (published);
create index if not exists content_blogs_created_at_idx on public.content_blogs (created_at desc);

-- updated_at-Trigger fuer beide
create or replace function public.set_content_ideas_updated_at()
returns trigger as $tu$ begin new.updated_at = now(); return new; end; $tu$ language plpgsql;

drop trigger if exists content_ideas_updated_at_trg on public.content_ideas;
create trigger content_ideas_updated_at_trg before update on public.content_ideas
  for each row execute function public.set_content_ideas_updated_at();

create or replace function public.set_content_blogs_updated_at()
returns trigger as $tu$ begin new.updated_at = now(); return new; end; $tu$ language plpgsql;

drop trigger if exists content_blogs_updated_at_trg on public.content_blogs;
create trigger content_blogs_updated_at_trg before update on public.content_blogs
  for each row execute function public.set_content_blogs_updated_at();
