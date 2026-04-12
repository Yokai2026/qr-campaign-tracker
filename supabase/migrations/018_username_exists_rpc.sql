-- ============================================
-- username_exists RPC für Signup-Pre-Check
-- ============================================
-- Bug: Zwei User mit gleichem Username → profiles-INSERT im handle_new_user
-- Trigger schlägt am Unique-Index fehl → Auth-User-Anlage wird zurückgerollt
-- → User sieht nur generische "Registrierung fehlgeschlagen"-Meldung.
--
-- Fix: Pre-Check per RPC vor dem signUp-Call. SECURITY DEFINER bypasst RLS,
-- returnt nur boolean (kein Datenleak), case-insensitive via lower().
-- ============================================

CREATE OR REPLACE FUNCTION public.username_exists(lookup_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE lower(username) = lower(lookup_username)
  );
$function$;

-- Anon darf den Check aufrufen (Signup-Flow, noch nicht authentifiziert)
GRANT EXECUTE ON FUNCTION public.username_exists(text) TO anon, authenticated;
