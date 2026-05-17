-- 052_idea_richer_metadata.sql
-- Erweitert content_ideas um Modern-Builder-Metadata.
-- Diese Felder strukturieren Ideen besser + ermöglichen smartere Filterung +
-- machen Blog-Drafts gezielter (weil Emotion, Zielgruppe, CTA, AI-/Tracking-
-- Bezug direkt in den Expander übergeben werden).

alter table public.content_ideas
  add column if not exists emotion text,
  add column if not exists target_audience text,
  add column if not exists cta_suggestion text,
  add column if not exists ai_reference text,         -- chatgpt|claude|gemini|n8n|none|multiple
  add column if not exists tracking_reference text,   -- qr|link|email|kurzlink|campaign|none|multiple
  add column if not exists tonality text,             -- lehrreich|locker|provokant|story|aha|humor|unpopular_opinion
  add column if not exists blog_format text;          -- story|guide|case|comparison|tutorial|opinion|experiment|behind_scenes|breakdown

-- Indexe für häufigste Filter (AI-Themen-Suche, Tracking-Bezug)
create index if not exists content_ideas_ai_reference_idx
  on public.content_ideas (ai_reference)
  where ai_reference is not null;

create index if not exists content_ideas_tracking_reference_idx
  on public.content_ideas (tracking_reference)
  where tracking_reference is not null;

create index if not exists content_ideas_blog_format_idx
  on public.content_ideas (blog_format)
  where blog_format is not null;
