-- Migration 016: Onboarding-Card dismissable
--
-- Fügt ein optionales Dismiss-Timestamp zu profiles hinzu, damit User
-- die Onboarding-Schritte-Card auf dem Dashboard wegklicken können.
-- NULL = noch nicht dismissed, timestamptz = Zeitpunkt des Dismiss.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_dismissed_at timestamptz;

COMMENT ON COLUMN profiles.onboarding_dismissed_at IS
  'Zeitpunkt, zu dem der User die Onboarding-Card weggeklickt hat. NULL = noch sichtbar.';
