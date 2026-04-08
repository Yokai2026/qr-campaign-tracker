'use server';

import { createServiceClient } from '@/lib/supabase/server';

/**
 * Resolves a username to an email address using the service client (bypasses RLS).
 * Used on the login page where the user is not yet authenticated.
 * Returns null if the username is not found.
 */
export async function resolveUsername(username: string): Promise<string | null> {
  const supabase = await createServiceClient();

  const { data } = await supabase
    .from('profiles')
    .select('email')
    .ilike('username', username)
    .single();

  return data?.email ?? null;
}
