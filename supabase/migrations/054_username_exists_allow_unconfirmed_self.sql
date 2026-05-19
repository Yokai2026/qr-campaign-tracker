-- ============================================
-- Fix: Signup-Block bei unbestaetigtem Wiederholversuch
-- ============================================
-- Bug: User registriert sich mit username "leviett2" + leviett2@gmail.com,
-- kriegt Bestaetigungsmail, klickt sie nicht. Beim zweiten Versuch (gleiche
-- Daten) zeigt der Pre-Check "Dieser Benutzername ist bereits vergeben" —
-- obwohl es SEIN eigener unbestaetigter Versuch ist.
--
-- Wurzelursache: username_exists() prueft nur ob ein profile-Row mit dem
-- Namen existiert. Bei unbestaetigten Wiederholversuchen kollidiert der
-- User mit sich selbst.
--
-- Fix:
--   1. RPC nimmt zusaetzlich lookup_email entgegen.
--   2. Trifft genau diese (username + email)-Kombi auf einen UNbestaetigten
--      Account → false (frei), damit Supabase.auth.signUp die Bestaetigungs-
--      mail erneut schickt (Standard-Verhalten).
--   3. Trifft username auf einen bestaetigten Account ODER auf einen
--      unbestaetigten mit ANDERER Email → true (vergeben).
--
-- Sicherheit:
--   - SECURITY DEFINER + read-only.
--   - "Stealen" eines unbestaetigten Usernames moeglich? Nein — wir verlangen
--     auch Email-Match. Ohne Email-Zugriff kann niemand fremde Accounts uebernehmen.
-- ============================================

-- Alte 1-Arg-Signature droppen, sonst kollidiert PostgREST: bei 1-Arg-Aufruf
-- kann es nicht zwischen username_exists(text) und username_exists(text, text)
-- entscheiden (PGRST203 "Multiple Choices"). Die neue 2-Arg-Version hat
-- lookup_email DEFAULT NULL — damit funktionieren sowohl 1-Arg- als auch
-- 2-Arg-Aufrufe (Backward-Compat fuer alten Frontend-Code).
DROP FUNCTION IF EXISTS public.username_exists(text);

CREATE OR REPLACE FUNCTION public.username_exists(
  lookup_username text,
  lookup_email text DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE lower(p.username) = lower(lookup_username)
      AND NOT (
        -- Ausnahme: gleiche Email + unbestaetigt → es ist DER user der retry'd.
        -- Wir lassen den Signup-Flow durch, Supabase resendet die Bestaetigung.
        lookup_email IS NOT NULL
        AND u.email IS NOT NULL
        AND lower(u.email) = lower(lookup_email)
        AND u.email_confirmed_at IS NULL
      )
  );
$function$;

-- Permissions bleiben gleich (anon + authenticated duerfen aufrufen)
GRANT EXECUTE ON FUNCTION public.username_exists(text, text) TO anon, authenticated;

-- ============================================
-- Trigger-Schutz: bei Re-Signup unbestaetigter Account aufraeumen
-- ============================================
-- Selbst wenn der Pre-Check unsen User durchlaesst, kann der nachfolgende
-- auth.signUp eine bestehende profile-Row mit gleichem username treffen, wenn
-- Supabase einen NEUEN auth.users-Eintrag anlegt statt den alten zu reusen.
-- (Verhalten haengt von Supabase-Settings ab — "Allow new users to sign up"
-- vs "Confirmations enabled" kombiniert.)
--
-- Sicherer Pfad: im handle_new_user-Trigger pruefen, ob ein orphan-Profile
-- mit gleichem Username+Email existiert das zu einem UNbestaetigten Account
-- gehoert. Wenn ja → loeschen, dann neuen einfuegen.
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  new_username text;
  orphan_id uuid;
begin
  new_username := new.raw_user_meta_data->>'username';

  -- Orphan-Cleanup: gleicher Username + gleiche Email + unbestaetigt + nicht
  -- der neue user selbst → das ist ein abgebrochener Vorversuch, freigeben.
  if new_username IS NOT NULL then
    select p.id into orphan_id
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(p.username) = lower(new_username)
      and u.email is not null
      and new.email is not null
      and lower(u.email) = lower(new.email)
      and u.email_confirmed_at is null
      and p.id <> new.id
    limit 1;

    if orphan_id is not null then
      delete from public.profiles where id = orphan_id;
      delete from auth.users where id = orphan_id;
    end if;
  end if;

  insert into public.profiles (id, email, username, display_name, role, trial_ends_at)
  values (
    new.id,
    new.email,
    new_username,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'editor'),
    now() + interval '14 days'
  );

  return new;
end;
$function$;
