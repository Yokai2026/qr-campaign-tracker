'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireSubscription } from '@/lib/billing/gates';
import { abVariantSchema } from '@/lib/validations';
import type { AbVariant } from '@/types';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getAbVariants(
  qrCodeId: string,
): Promise<AbVariant[]> {
  await requireSubscription('conditional_redirects');
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('ab_variants')
    .select('*')
    .eq('qr_code_id', qrCodeId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AbVariant[];
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createAbVariant(input: {
  qr_code_id?: string;
  short_link_id?: string;
  target_url: string;
  weight: number;
  label?: string;
}): Promise<{ success: boolean; error?: string }> {
  await requireSubscription('conditional_redirects');

  const parsed = abVariantSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungueltige Eingabe' };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('ab_variants').insert({
    qr_code_id: input.qr_code_id || null,
    short_link_id: input.short_link_id || null,
    target_url: input.target_url,
    weight: input.weight,
    label: input.label || null,
    active: true,
  });

  if (error) return { success: false, error: error.message };

  if (input.qr_code_id) revalidatePath(`/qr-codes/${input.qr_code_id}`);
  if (input.short_link_id) revalidatePath(`/links/${input.short_link_id}`);

  return { success: true };
}

export async function updateAbVariant(
  id: string,
  input: {
    target_url?: string;
    weight?: number;
    label?: string;
    active?: boolean;
  },
): Promise<{ success: boolean; error?: string }> {
  await requireSubscription('conditional_redirects');
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('ab_variants')
    .select('qr_code_id, short_link_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Variante nicht gefunden' };
  }

  const updateData: Record<string, unknown> = {};
  if (input.target_url !== undefined) updateData.target_url = input.target_url;
  if (input.weight !== undefined) updateData.weight = input.weight;
  if (input.label !== undefined) updateData.label = input.label || null;
  if (input.active !== undefined) updateData.active = input.active;

  const { error } = await supabase
    .from('ab_variants')
    .update(updateData)
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  if (existing.qr_code_id) revalidatePath(`/qr-codes/${existing.qr_code_id}`);
  if (existing.short_link_id) revalidatePath(`/links/${existing.short_link_id}`);

  return { success: true };
}

export async function deleteAbVariant(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireSubscription('conditional_redirects');
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('ab_variants')
    .select('qr_code_id, short_link_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Variante nicht gefunden' };
  }

  const { error } = await supabase
    .from('ab_variants')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  if (existing.qr_code_id) revalidatePath(`/qr-codes/${existing.qr_code_id}`);
  if (existing.short_link_id) revalidatePath(`/links/${existing.short_link_id}`);

  return { success: true };
}
