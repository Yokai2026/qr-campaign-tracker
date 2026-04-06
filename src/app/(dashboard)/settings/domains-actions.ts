'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import type { CustomDomain } from '@/types';

// Hostname validation: letters/digits/dots/hyphens, at least one dot, no protocol/path.
const hostSchema = z
  .string()
  .trim()
  .min(3, 'Hostname zu kurz')
  .max(253, 'Hostname zu lang')
  .regex(
    /^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.(?!-)[a-zA-Z0-9-]{1,63}(?<!-))+$/,
    'Ungültiger Hostname — erwartet z.B. kurz.example.com'
  )
  .transform((v) => v.toLowerCase());

export async function getCustomDomains(): Promise<CustomDomain[]> {
  await requireAuth();
  const supabase = await createClient();
  const { data } = await supabase
    .from('custom_domains')
    .select('*')
    .order('created_at', { ascending: false });
  return (data || []) as CustomDomain[];
}

export async function createCustomDomain(
  rawHost: string
): Promise<{ success: boolean; error?: string; domain?: CustomDomain }> {
  const user = await requireAuth();

  const parsed = hostSchema.safeParse(rawHost);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültiger Hostname' };
  }
  const host = parsed.data;

  // Reject main app host
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const appHost = new URL(appUrl).hostname.toLowerCase();
      if (host === appHost) {
        return { success: false, error: 'Dies ist bereits die Haupt-Domain' };
      }
    } catch {
      // ignore parse errors
    }
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('custom_domains')
    .insert({ host, created_by: user.id })
    .select('*')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Diese Domain wurde bereits hinzugefügt' };
    }
    return { success: false, error: error.message };
  }

  revalidatePath('/settings');
  return { success: true, domain: data as CustomDomain };
}

export async function deleteCustomDomain(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase.from('custom_domains').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  revalidatePath('/settings');
  return { success: true };
}

export async function verifyCustomDomain(
  id: string
): Promise<{ success: boolean; error?: string; verified?: boolean }> {
  await requireAuth();
  const supabase = await createClient();

  const { data: domain, error: fetchError } = await supabase
    .from('custom_domains')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !domain) {
    return { success: false, error: 'Domain nicht gefunden' };
  }

  const expected = (domain as CustomDomain).verification_token;
  const host = (domain as CustomDomain).host;
  const lookupName = `_spurig-verify.${host}`;

  try {
    const { resolveTxt } = await import('node:dns/promises');
    const records = await resolveTxt(lookupName);
    const flat = records.map((r) => r.join('')).map((v) => v.trim());
    const match = flat.includes(expected);

    if (!match) {
      return {
        success: false,
        verified: false,
        error: `TXT-Record ${lookupName} gefunden, aber Token stimmt nicht. Erwartet: ${expected}`,
      };
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      verified: false,
      error: `DNS-Lookup fehlgeschlagen: ${message}. Bitte lege einen TXT-Record unter ${lookupName} mit dem Wert ${expected} an.`,
    };
  }

  const { error: updateError } = await supabase
    .from('custom_domains')
    .update({
      verified: true,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateError) return { success: false, error: updateError.message };

  revalidatePath('/settings');
  return { success: true, verified: true };
}

export async function setPrimaryCustomDomain(
  id: string
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { data: domain } = await supabase
    .from('custom_domains')
    .select('verified')
    .eq('id', id)
    .single();

  if (!domain) return { success: false, error: 'Domain nicht gefunden' };
  if (!(domain as { verified: boolean }).verified) {
    return { success: false, error: 'Domain muss erst verifiziert werden' };
  }

  // Unset current primary, then set new primary (partial unique index requires this order).
  const { error: clearError } = await supabase
    .from('custom_domains')
    .update({ is_primary: false, updated_at: new Date().toISOString() })
    .eq('is_primary', true);

  if (clearError) return { success: false, error: clearError.message };

  const { error: setError } = await supabase
    .from('custom_domains')
    .update({ is_primary: true, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (setError) return { success: false, error: setError.message };

  revalidatePath('/settings');
  return { success: true };
}

export async function unsetPrimaryCustomDomain(): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('custom_domains')
    .update({ is_primary: false, updated_at: new Date().toISOString() })
    .eq('is_primary', true);

  if (error) return { success: false, error: error.message };
  revalidatePath('/settings');
  return { success: true };
}
