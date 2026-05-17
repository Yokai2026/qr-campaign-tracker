-- 053_ai_risk_pillar.sql
-- 12. Pillar: ai_risk (KI-Recht & Sicherheit)
-- Themen: EU AI Act, AI-Compliance, DSGVO+KI, Hallucinations, Urheberrecht bei
-- KI-Content, Haftung, Deepfakes, AI-Agent-Security, Kundendaten in ChatGPT,
-- sichere AI-Workflows, Risiken vs Chancen.

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
    'geld_business',
    'ai_risk'
  ));
