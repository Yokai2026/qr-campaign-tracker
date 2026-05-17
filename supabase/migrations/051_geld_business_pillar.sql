-- 051_geld_business_pillar.sql
-- Neuer Pillar: geld_business
-- Themen: Cashflow, Marketing-Budget-ROI, Tool-Stack-Audit, Pricing, Fördermittel,
-- Revenue-Growth, KI-Cost-Savings, Co-Marketing, Steueroptimierung für KMU.

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
    'everyday_marketing',
    'geld_business'
  ));
