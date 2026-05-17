-- 050_content_pillars_expanded.sql
-- Erweitert content_ideas + content_blogs um 4 neue Pillars:
--   ai_marketing       - KI im Marketing + KI-Agenten + Automatisierung
--   email_shortlinks   - Email-Tracking + Kurzlinks + Newsletter
--   creator_design     - Designer + Creator + Visual-Marketing
--   everyday_marketing - Marketing-Alltag + Business-Hacks + Vorher/Nachher

alter table public.content_ideas
  drop constraint if exists content_ideas_cluster_check;

alter table public.content_ideas
  add constraint content_ideas_cluster_check
  check (cluster in (
    'qr_realtalk',
    'print_lebt',
    'compliance_lite',
    'mittelstand',
    'tracking_tricks',
    'founder_diary',
    'ai_marketing',
    'email_shortlinks',
    'creator_design',
    'everyday_marketing'
  ));

-- content_blogs hat optional cluster (NULL erlaubt), aber falls Check-Constraint existiert:
alter table public.content_blogs
  drop constraint if exists content_blogs_cluster_check;
