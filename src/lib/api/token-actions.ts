'use server';

import { createClient } from '@/lib/supabase/server';
import { generateToken } from './tokens';
import { revalidatePath } from 'next/cache';

export type TokenSummary = {
  id: string;
  name: string;
  token_prefix: string;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
  revoked_at: string | null;
};

export async function listTokens(): Promise<TokenSummary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('api_tokens')
    .select('id, name, token_prefix, last_used_at, expires_at, created_at, revoked_at')
    .order('created_at', { ascending: false });
  return (data as TokenSummary[]) ?? [];
}

export type CreateTokenResult =
  | { success: true; token: string; prefix: string }
  | { success: false; error: string };

export async function createToken(name: string, expiresInDays: number | null): Promise<CreateTokenResult> {
  if (!name || name.trim().length === 0) {
    return { success: false, error: 'Name darf nicht leer sein.' };
  }
  if (name.length > 80) {
    return { success: false, error: 'Name maximal 80 Zeichen.' };
  }
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nicht angemeldet.' };

  const { full, prefix, hash } = generateToken();
  const expires_at = expiresInDays && expiresInDays > 0
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase.from('api_tokens').insert({
    user_id: user.id,
    name: name.trim(),
    token_prefix: prefix,
    token_hash: hash,
    expires_at,
  });

  if (error) {
    console.error('[api-tokens] create failed:', error);
    return { success: false, error: 'Konnte Token nicht anlegen.' };
  }

  revalidatePath('/settings');
  return { success: true, token: full, prefix };
}

export async function revokeToken(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nicht angemeldet.' };

  const { error } = await supabase
    .from('api_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, error: 'Konnte Token nicht widerrufen.' };
  }
  revalidatePath('/settings');
  return { success: true };
}

export async function deleteToken(id: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Nicht angemeldet.' };

  const { error } = await supabase.from('api_tokens').delete().eq('id', id).eq('user_id', user.id);
  if (error) return { success: false, error: 'Konnte Token nicht löschen.' };
  revalidatePath('/settings');
  return { success: true };
}
