-- 046_idea_classification_tags.sql
-- Fügt profession + hook_pattern Tags zu content_ideas hinzu.
-- Diese werden vom Ideas-Generator gefüllt und ermöglichen:
--   1. Berufs-Diversity-Filter (max 1 pro Beruf pro Batch) — code-side
--   2. Hook-Pattern-Quoten pro Batch (min 2 money_regret etc.) — code-side
--   3. Opener-Forcierung beim Blog-Expander (Money-Regret-Idee → Money-Regret-Opener)

alter table public.content_ideas
  add column if not exists profession text,
  add column if not exists hook_pattern text;

-- Optional Check-Constraint für valide hook_pattern-Werte
-- (lazy: keine CHECK damit ältere Ideen mit NULL nicht failen)

create index if not exists content_ideas_profession_idx
  on public.content_ideas (profession)
  where profession is not null;

create index if not exists content_ideas_hook_pattern_idx
  on public.content_ideas (hook_pattern)
  where hook_pattern is not null;
