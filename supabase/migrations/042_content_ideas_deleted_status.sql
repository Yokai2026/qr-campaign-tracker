-- 042_content_ideas_deleted_status.sql
-- Add 'deleted' status to content_ideas so soft-deleted ideas remain known
-- and the AI generator can avoid recreating them.

alter table public.content_ideas drop constraint if exists content_ideas_status_check;

alter table public.content_ideas
  add constraint content_ideas_status_check
  check (status in ('backlog', 'expanded', 'skipped', 'deleted'));
