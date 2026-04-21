'use server';

import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { shortLinkSchema, linkGroupSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import { nanoid } from 'nanoid';
import type { ShortLink, LinkGroup } from '@/types';

export type ShortLinkWithStats = ShortLink & {
  /** Klicks in den letzten 7 Tagen (aus redirect_events, ohne Bots). */
  clicks_7d?: number;
  /** Klicks gesamt (aus redirect_events, ohne Bots). Single source of truth. */
  clicks_total?: number;
  /** ISO-Zeitstempel des letzten Klicks (aus redirect_events, ohne Bots). */
  last_click_at?: string | null;
  /** Delta in % gegenüber Woche davor. null = keine Info, 'new' = vorher leer. */
  clicks_trend?: number | 'new' | null;
};

// =========================================
// Short Links — Queries
// =========================================

export async function getShortLinks(filters?: {
  campaignId?: string;
  groupId?: string;
  search?: string;
  archived?: boolean;
}): Promise<ShortLinkWithStats[]> {
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

  // Single source of truth for every click-stat: redirect_events.
  // ALL-TIME fetch, ordered DESC so the first row per link_id is automatically
  // the latest — used for last_click_at. 7T/Prev7T derived in-memory.
  const weekAgoIso = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const twoWeeksAgoIso = new Date(Date.now() - 14 * 86_400_000).toISOString();
  const [{ data }, { data: events }] = await Promise.all([
    query,
    supabase
      .from('redirect_events')
      .select('short_link_id, created_at')
      .eq('event_type', 'link_open')
      .eq('is_bot', false)
      .not('short_link_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(200_000),
  ]);

  const clicks7d: Record<string, number> = {};
  const clicksPrev7d: Record<string, number> = {};
  const clicksTotal: Record<string, number> = {};
  const lastClickAt: Record<string, string> = {};
  (events ?? []).forEach((e: { short_link_id: string | null; created_at: string }) => {
    if (!e.short_link_id) return;
    const id = e.short_link_id;
    clicksTotal[id] = (clicksTotal[id] ?? 0) + 1;
    if (!lastClickAt[id]) lastClickAt[id] = e.created_at;
    if (e.created_at >= weekAgoIso) {
      clicks7d[id] = (clicks7d[id] ?? 0) + 1;
    } else if (e.created_at >= twoWeeksAgoIso) {
      clicksPrev7d[id] = (clicksPrev7d[id] ?? 0) + 1;
    }
  });

  const rows = (data ?? []).map((row: Record<string, unknown>) => {
    const id = row.id as string;
    const curr = clicks7d[id] ?? 0;
    const prev = clicksPrev7d[id] ?? 0;
    return {
      ...(row as unknown as ShortLink),
      clicks_7d: curr,
      clicks_total: clicksTotal[id] ?? 0,
      last_click_at: lastClickAt[id] ?? null,
      clicks_trend: computeTrend(curr, prev),
    };
  });

  // Default-Sort: Performance (7T DESC) — Top-Performer oben.
  rows.sort((a, b) => (b.clicks_7d ?? 0) - (a.clicks_7d ?? 0));
  return rows;
}

function computeTrend(current: number, previous: number): number | 'new' | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 'new';
  return ((current - previous) / previous) * 100;
}

export async function getShortLink(id: string): Promise<ShortLinkWithStats | null> {
  await requireAuth();
  const supabase = await createClient();

  const [{ data }, { count: totalCount }, { data: latest }] = await Promise.all([
    supabase
      .from('short_links')
      .select('*, campaign:campaigns(id, name), link_group:link_groups(id, name, color)')
      .eq('id', id)
      .single(),
    supabase
      .from('redirect_events')
      .select('id', { count: 'exact', head: true })
      .eq('short_link_id', id)
      .eq('event_type', 'link_open')
      .eq('is_bot', false),
    supabase
      .from('redirect_events')
      .select('created_at')
      .eq('short_link_id', id)
      .eq('event_type', 'link_open')
      .eq('is_bot', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (!data) return null;

  return {
    ...(data as ShortLink),
    clicks_total: totalCount ?? 0,
    last_click_at: (latest as { created_at: string } | null)?.created_at ?? null,
  };
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
