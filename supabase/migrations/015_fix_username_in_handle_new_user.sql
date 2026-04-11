-- ============================================
-- Fix: handle_new_user Trigger persistiert username
-- ============================================
-- Bug: Der Signup-Trigger hat das username-Feld aus raw_user_meta_data
-- nicht in profiles.username geschrieben. Dadurch lieferte
-- resolve_username() beim Login NULL zurück → "Benutzername nicht gefunden".
--
-- Fix:
--   1. handle_new_user() neu definieren, username aus metadata persistieren
--   2. Bestehende Profile mit NULL-Username aus auth.users-metadata backfilllen
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
begin
  insert into public.profiles (id, email, username, display_name, role, trial_ends_at)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'editor'),
    now() + interval '14 days'
  );
  return new;
end;
$function$;

-- Backfill: alle Profile mit NULL-Username aus vorhandenen auth.users-metadata füllen
update public.profiles p
set username = u.raw_user_meta_data->>'username'
from auth.users u
where u.id = p.id
  and p.username is null
  and u.raw_user_meta_data->>'username' is not null;
