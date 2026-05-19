-- ============================================
-- Fix: Signup-Hang "Database error saving new user"
-- ============================================
-- Bug: generate_referral_code() (Trigger auf auth.users INSERT, eingefuehrt
-- in Mig 048) ruft gen_random_bytes() OHNE Schema-Qualifizierung auf.
-- pgcrypto lebt in der `extensions` Schema. Der Rolle `supabase_auth_admin`
-- ist `search_path=auth` gesetzt — daher findet GoTrue beim INSERT in
-- auth.users die Funktion nicht. Resultat: jeder Signup-Versuch schlaegt
-- mit "Database error saving new user" + SQLSTATE 42883 fehl.
--
-- Bestaetigt im auth_logs:
--   "ERROR: function gen_random_bytes(integer) does not exist (SQLSTATE 42883)"
--
-- Fix:
--   1. SET search_path TO public, extensions, pg_temp setzen — damit
--      pgcrypto-Funktionen aus der `extensions`-Schema gefunden werden.
--   2. Schema-Qualifizierung als Belt-and-Suspenders: extensions.gen_random_bytes.
-- ============================================

CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'pg_temp'
AS $function$
declare
  new_code text;
  attempts int := 0;
begin
  loop
    attempts := attempts + 1;
    -- 8 Chars aus a-z + 0-9, exklusiv verwirrender (0, o, i, l, 1)
    new_code := lower(substr(encode(extensions.gen_random_bytes(6), 'base64'), 1, 8));
    new_code := regexp_replace(new_code, '[^a-z0-9]', '', 'g');
    if length(new_code) >= 8 then
      new_code := substr(new_code, 1, 8);
      exit when not exists (select 1 from public.referral_codes where code = new_code);
    end if;
    if attempts > 20 then
      raise exception 'Could not generate unique referral code after 20 attempts';
    end if;
  end loop;

  insert into public.referral_codes (user_id, code)
  values (new.id, new_code)
  on conflict (user_id) do nothing;

  return new;
end;
$function$;
