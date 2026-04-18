'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { shortLinkSchema, linkGroupSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import { nanoid } from 'nanoid';
import type { ShortLink, LinkGroup } from '@/types';

// =========================================
// Short Links — Queries
// =========================================

export async function getShortLinks(filters?: {
  campaignId?: string;
  groupId?: string;
  search?: string;
  archived?: boolean;
}): Promise<ShortLink[]> {
  await requireAuth();
  const supabase = await createClient();

  // Server-side hard cap — mirrors QR-codes. UI paginates client-side (pageSize 15).
  const SERVER_CAP = 1000;

  let query = supabase
    .from('short_links')
    .select('*, campaign:campaigns(id, name), link_group:link_groups(id, name, color)')
    .order('created_at', { ascending: false })
    .limit(SERVER_CAP);

  if (filters?.campaignId) query = query.eq('campaign_id', filters.campaignId);
  if (filters?.groupId) query = query.eq('link_group_id', filters.groupId);
  if (filters?.archived !== undefined) query = query.eq('archived', filters.archived);
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,short_code.ilike.%${filters.search}%,target_url.ilike.%${filters.search}%`);
  }

  const { data } = await query;
  return (data || []) as ShortLink[];
}

export async function getShortLink(id: string): Promise<ShortLink | null> {
  await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from('short_links')
    .select('*, campaign:campaigns(id, name), link_group:link_groups(id, name, color)')
    .eq('id', id)
    .single();

  return data as ShortLink | null;
}

// =========================================
// Short Links — Mutations
// =========================================

export async function createShortLink(input: Record<string, unknown>): Promise<{ success: boolean; error?: string; id?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();

  const parsed = shortLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' };
  }

  const data = parsed.data;

  // Generate or validate short code
  let shortCode = data.short_code || nanoid(7);

  // Check uniqueness across both tables
  const [{ data: existingQr }, { data: existingLink }] = await Promise.all([
    supabase.from('qr_codes').select('id').eq('short_code', shortCode).maybeSingle(),
    supabase.from('short_links').select('id').eq('short_code', shortCode).maybeSingle(),
  ]);

  if (existingQr || existingLink) {
    if (data.short_code) {
      return { success: false, error: 'Dieser Kurzcode ist bereits vergeben' };
    }
    // Retry with new code
    shortCode = nanoid(7);
  }

  // Verify the chosen short_host is an actually verified custom domain.
  // Silently drop unverified hosts — we never want a bad host in the DB.
  let verifiedShortHost: string | null = null;
  if (data.short_host) {
    const host = data.short_host.toLowerCase();
    const { data: domainRow } = await supabase
      .from('custom_domains')
      .select('host')
      .eq('host', host)
      .eq('verified', true)
      .maybeSingle();
    if (domainRow) verifiedShortHost = host;
  }

  const { data: created, error } = await supabase
    .from('short_links')
    .insert({
      short_code: shortCode,
      target_url: data.target_url,
      title: data.title || null,
      description: data.description || null,
      campaign_id: data.campaign_id || null,
      link_group_id: data.link_group_id || null,
      link_mode: data.link_mode || 'short',
      expires_at: data.expires_at || null,
      expired_url: data.expired_url || null,
      utm_source: data.utm_source || null,
      utm_medium: data.utm_medium || 'link',
      utm_campaign: data.utm_campaign || null,
      utm_content: data.utm_content || null,
      utm_id: data.utm_id || null,
      short_host: verifiedShortHost,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/links');
  return { success: true, id: created?.id };
}

export async function updateShortLink(
  id: string,
  input: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const parsed = shortLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' };
  }

  const data = parsed.data;

  let verifiedShortHost: string | null = null;
  if (data.short_host) {
    const host = data.short_host.toLowerCase();
    const { data: domainRow } = await supabase
      .from('custom_domains')
      .select('host')
      .eq('host', host)
      .eq('verified', true)
      .maybeSingle();
    if (domainRow) verifiedShortHost = host;
  }

  const { error } = await supabase
    .from('short_links')
    .update({
      target_url: data.target_url,
      title: data.title || null,
      description: data.description || null,
      campaign_id: data.campaign_id || null,
      link_group_id: data.link_group_id || null,
      expires_at: data.expires_at || null,
      expired_url: data.expired_url || null,
      utm_source: data.utm_source || null,
      utm_medium: data.utm_medium || 'link',
      utm_campaign: data.utm_campaign || null,
      utm_content: data.utm_content || null,
      utm_id: data.utm_id || null,
      short_host: verifiedShortHost,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/links');
  revalidatePath(`/links/${id}`);
  return { success: true };
}

export async function deleteShortLink(id: string): Promise<{ success: boolean; error?: string }> {
  const profile = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase.from('short_links').delete().eq('id', id);
  if (error) return { success: false, error: error.message };

  await logAudit({
    userId: profile.id,
    action: 'short_link.deleted',
    entityType: 'short_link',
    entityId: id,
  });

  revalidatePath('/links');
  return { success: true };
}

export async function toggleShortLink(id: string, active: boolean): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from('short_links')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/links');
  return { success: true };
}

// =========================================
// Link Groups
// =========================================

export async function getLinkGroups(): Promise<LinkGroup[]> {
  await requireAuth();
  const supabase = await createClient();

  const { data } = await supabase
    .from('link_groups')
    .select('*, campaign:campaigns(id, name)')
    .order('name');

  return (data || []) as LinkGroup[];
}

export async function createLinkGroup(input: Record<string, unknown>): Promise<{ success: boolean; error?: string; id?: string }> {
  const user = await requireAuth();
  const supabase = await createClient();

  const parsed = linkGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' };
  }

  const data = parsed.data;

  const { data: created, error } = await supabase
    .from('link_groups')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      color: data.color || '#0D9488',
      campaign_id: data.campaign_id || null,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath('/links');
  return { success: true, id: created?.id };
}

export async function updateLinkGroup(
  id: string,
  input: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const parsed = linkGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' };
  }

  const data = parsed.data;

  const { error } = await supabase
    .from('link_groups')
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      color: data.color || '#0D9488',
      campaign_id: data.campaign_id || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) return { success: false, error: error.message };
  revalidatePath('/links');
  return { success: true };
}

export async function deleteLinkGroup(id: string): Promise<{ success: boolean; error?: string }> {
  await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase.from('link_groups').delete().eq('id', id);
  if (error) return { success: false, error: error.message };
  revalidatePath('/links');
  return { success: true };
}
