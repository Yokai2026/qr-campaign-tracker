-- ============================================
-- Fix: Case-insensitive unique index für username
-- ============================================
-- Bug: idx_profiles_username ist auf btree(username), aber resolve_username()
-- vergleicht via lower(username) = lower(lookup_username). Dadurch:
--   1. Der Unique-Index greift nicht für die Login-Query → Sequential Scan
--   2. Zwei User mit "Alice" und "alice" wären theoretisch möglich
--
-- Fix: Unique-Index auf lower(username) neu anlegen, alten droppen.
-- ============================================

DROP INDEX IF EXISTS public.idx_profiles_username;

CREATE UNIQUE INDEX idx_profiles_username_lower
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;
