-- 044_rename_clusters.sql
-- Pillar-Redesign 2026: 5 alte Cluster auf 6 neue umstrukturieren.
--
-- Mapping:
--   dsgvo_privacy → compliance_lite
--   offline_roi   → print_lebt
--   qr_practices  → qr_realtalk
--   attribution   → tracking_tricks
--   behind_scenes → founder_diary
--   NEU: mittelstand (keine Migration, leerer Pillar zum Start)
--
-- Wirkt auf content_ideas + content_blogs. Beide Tabellen haben cluster als
-- text-Spalte mit CHECK-Constraint — erst Constraint drop, dann update,
-- dann neue Constraint mit erweitertem Wertebereich.

-- Drop old CHECK constraints
alter table public.content_ideas drop constraint if exists content_ideas_cluster_check;
alter table public.content_blogs drop constraint if exists content_blogs_cluster_check;

-- Content Ideas
update public.content_ideas set cluster = 'compliance_lite' where cluster = 'dsgvo_privacy';
update public.content_ideas set cluster = 'print_lebt' where cluster = 'offline_roi';
update public.content_ideas set cluster = 'qr_realtalk' where cluster = 'qr_practices';
update public.content_ideas set cluster = 'tracking_tricks' where cluster = 'attribution';
update public.content_ideas set cluster = 'founder_diary' where cluster = 'behind_scenes';

-- Content Blogs
update public.content_blogs set cluster = 'compliance_lite' where cluster = 'dsgvo_privacy';
update public.content_blogs set cluster = 'print_lebt' where cluster = 'offline_roi';
update public.content_blogs set cluster = 'qr_realtalk' where cluster = 'qr_practices';
update public.content_blogs set cluster = 'tracking_tricks' where cluster = 'attribution';
update public.content_blogs set cluster = 'founder_diary' where cluster = 'behind_scenes';

-- Add new CHECK constraints with new cluster values
alter table public.content_ideas add constraint content_ideas_cluster_check
  check (cluster in ('qr_realtalk','print_lebt','compliance_lite','mittelstand','tracking_tricks','founder_diary'));
alter table public.content_blogs add constraint content_blogs_cluster_check
  check (cluster in ('qr_realtalk','print_lebt','compliance_lite','mittelstand','tracking_tricks','founder_diary'));

-- Alle aktuell-im-Backlog-stehenden Ideen die noch alte tropes enthalten
-- auf 'deleted' setzen damit sie nicht weiter im UI auftauchen aber
-- in der Anti-Rep-Liste bleiben (verhindert Re-Generation).
-- User wollte ausdruecklich "diese themen weg".
update public.content_ideas
  set status = 'deleted'
  where status = 'backlog'
    and (
      title ilike '%47%plak%' or
      title ilike '%47%standort%' or
      title ilike '%500%postkarten%' or
      title ilike '%8 wochen%falsch%' or
      title ilike '%stripe-dashboard%47%' or
      title ilike '%bruder%steuerberater%' or
      title ilike '%bitly%virginia%' or
      title ilike '%bitly%ashburn%' or
      title ilike '%sechs jahre%atlantik%' or
      title ilike '%plakat-budget verschwindet%'
    );
