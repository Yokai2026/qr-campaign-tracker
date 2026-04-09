'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { requireSubscription } from '@/lib/billing/gates';
import { redirectRuleSchema } from '@/lib/validations';
import type { RedirectRule } from '@/types';

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getRedirectRules(
  qrCodeId: string,
): Promise<RedirectRule[]> {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('redirect_rules')
    .select('*')
    .eq('qr_code_id', qrCodeId)
    .order('priority', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as RedirectRule[];
}

export async function getLinkRedirectRules(
  shortLinkId: string,
): Promise<RedirectRule[]> {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('redirect_rules')
    .select('*')
    .eq('short_link_id', shortLinkId)
    .order('priority', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as RedirectRule[];
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createRedirectRule(input: {
  qr_code_id?: string;
  short_link_id?: string;
  condition_type: string;
  condition_value: Record<string, unknown>;
  target_url: string;
  label?: string;
  priority?: number;
}): Promise<{ success: boolean; error?: string }> {
  await requireSubscription('conditional_redirects');

  const parsed = redirectRuleSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungueltige Eingabe' };
  }

  const supabase = await createClient();

  const { error } = await supabase.from('redirect_rules').insert({
    qr_code_id: input.qr_code_id || null,
    short_link_id: input.short_link_id || null,
    condition_type: input.condition_type,
    condition_value: input.condition_value,
    target_url: input.target_url,
    label: input.label || null,
    priority: input.priority ?? 0,
    active: true,
  });

  if (error) return { success: false, error: error.message };

  if (input.qr_code_id) revalidatePath(`/qr-codes/${input.qr_code_id}`);
  if (input.short_link_id) revalidatePath(`/links/${input.short_link_id}`);

  return { success: true };
}

export async function updateRedirectRule(
  id: string,
  input: {
    condition_type?: string;
    condition_value?: Record<string, unknown>;
    target_url?: string;
    label?: string;
    priority?: number;
    active?: boolean;
  },
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('redirect_rules')
    .select('qr_code_id, short_link_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Regel nicht gefunden' };
  }

  const updateData: Record<string, unknown> = {};
  if (input.condition_type !== undefined) updateData.condition_type = input.condition_type;
  if (input.condition_value !== undefined) updateData.condition_value = input.condition_value;
  if (input.target_url !== undefined) updateData.target_url = input.target_url;
  if (input.label !== undefined) updateData.label = input.label || null;
  if (input.priority !== undefined) updateData.priority = input.priority;
  if (input.active !== undefined) updateData.active = input.active;

  const { error } = await supabase
    .from('redirect_rules')
    .update(updateData)
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  if (existing.qr_code_id) revalidatePath(`/qr-codes/${existing.qr_code_id}`);
  if (existing.short_link_id) revalidatePath(`/links/${existing.short_link_id}`);

  return { success: true };
}

export async function deleteRedirectRule(
  id: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { data: existing, error: fetchError } = await supabase
    .from('redirect_rules')
    .select('qr_code_id, short_link_id')
    .eq('id', id)
    .single();

  if (fetchError || !existing) {
    return { success: false, error: 'Regel nicht gefunden' };
  }

  const { error } = await supabase
    .from('redirect_rules')
    .delete()
    .eq('id', id);

  if (error) return { success: false, error: error.message };

  if (existing.qr_code_id) revalidatePath(`/qr-codes/${existing.qr_code_id}`);
  if (existing.short_link_id) revalidatePath(`/links/${existing.short_link_id}`);

  return { success: true };
}
