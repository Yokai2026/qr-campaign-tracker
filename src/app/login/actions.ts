'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Resolves a username to an email address via Postgres RPC function.
 * The RPC function uses SECURITY DEFINER to bypass RLS,
 * so this works with the anon key (no service role needed).
 */
export async function resolveUsername(username: string): Promise<string | null> {
  const supabase = await createClient();

  const { data } = await supabase.rpc('resolve_username', {
    lookup_username: username,
  });

  return data ?? null;
}
