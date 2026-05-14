-- ============================================
-- Cancellation Reasons: erfasse warum User kündigen
-- ============================================
-- Wird beim Cancel-Flow vor dem Stripe-Cancel gespeichert.
-- Reason: standardisierte Kategorie (für Aggregation).
-- Feedback: optionaler Free-Text.

alter table public.subscriptions
  add column if not exists cancellation_reason text
    check (cancellation_reason in (
      'too_expensive',
      'missing_features',
      'not_using_enough',
      'switched_competitor',
      'project_finished',
      'technical_issues',
      'other'
    )),
  add column if not exists cancellation_feedback text;

comment on column public.subscriptions.cancellation_reason is
  'Standardisierter Kündigungsgrund für Aggregation im Admin-Panel.';
comment on column public.subscriptions.cancellation_feedback is
  'Optionaler Free-Text zum Kündigungsgrund.';
