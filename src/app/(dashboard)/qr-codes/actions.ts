'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { generateQrCode, buildRedirectUrl } from '@/lib/qr/generate';
import { qrCodeSchema, isUrlSafe } from '@/lib/validations';
import { getAppUrl } from '@/lib/constants';
import type { QrCode, QrCodeInput, QrStatusHistory, QrAction } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Insert a row into qr_status_history.
 */
async function addHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  opts: {
    qr_code_id: string;
    action: QrAction;
    changed_by: string;
    old_value?: string | null;
    new_value?: string | null;
    note?: string | null;
  },
) {
  await supabase.from('qr_status_history').insert({
    qr_code_id: opts.qr_code_id,
    action: opts.action,
    changed_by: opts.changed_by,
    old_value: opts.old_value ?? null,
    new_value: opts.new_value ?? null,
    note: opts.note ?? null,
  });
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export interface QrCodeFilters {
  placement_id?: string;
  active?: boolean;
  search?: string;
}

export interface QrCodeWithMeta extends QrCode {
  placement_name?: string;
  campaign_name?: string;
  redirect_count?: number;
}

/**
 * Fetch all QR codes with joined placement / campaign names.
 */
export async function getQrCodes(
  filters?: QrCodeFilters,
): Promise<QrCodeWithMeta[]> {
  await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from('qr_codes')
    .select(`
      *,
      placement:placements!placement_id (
        id,
        name,
        placement_code,
        campaign:campaigns!campaign_id ( id, name, slug )
      )
    `)
    .order('created_at', { ascending: false });

  if (filters?.placement_id) {
    query = query.eq('placement_id', filters.placement_id);
  }
  if (typeof filters?.active === 'boolean') {
    query = query.eq('active', filters.active);
  }
  if (filters?.search) {
    query = query.or(
      `short_code.ilike.%${filters.search}%,target_url.ilike.%${filters.search}%,note.ilike.%${filters.search}%`,
    );
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  // Flatten joined names for convenience
  return (data ?? []).map((row: Record<string, unknown>) => {
    const placement = row.placement as Record<string, unknown> | null;
    const campaign = placement?.campaign as Record<string, unknown> | null;
    return {
      ...row,
      placement_name: (placement?.name as string) ?? undefined,
      campaign_name: (campaign?.name as string) ?? undefined,
    } as QrCodeWithMeta;
  });
}

/**
 * Fetch a single QR code with full placement (including campaign & location)
 * plus status history and redirect count.
 */
export async function getQrCode(id: string) {
  await requireAuth();
  const supabase = await createClient();

  const [qrResult, historyResult, countResult] = await Promise.all([
    supabase
      .from('qr_codes')
      .select(`
        *,
        placement:placements!placement_id (
          *,
          campaign:campaigns!campaign_id ( * ),
          location:locations!location_id ( * )
        )
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('qr_status_history')
      .select('*, profile:profiles!changed_by ( id, display_name, email )')
      .eq('qr_code_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('redirect_events')
      .select('id', { count: 'exact', head: true })
      .eq('qr_code_id', id)
      .eq('event_type', 'qr_open'),
  ]);

  if (qrResult.error) throw new Error(qrResult.error.message);

  return {
    qrCode: qrResult.data as QrCode,
    history: (historyResult.data ?? []) as QrStatusHistory[],
    redirectCount: countResult.count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Fetch placements for selectors
// ---------------------------------------------------------------------------

export async function getPlacements() {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('placements')
    .select('id, name, placement_code, campaign:campaigns!campaign_id ( id, name, slug )')
    .order('name');

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    name: row.name as string,
    placement_code: row.placement_code as string,
    campaign: Array.isArray(row.campaign)
      ? (row.campaign[0] as { id: string; name: string; slug: string } | undefined) ?? null
      : (row.campaign as { id: string; name: string; slug: string } | null),
  }));
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Create a new QR code for a given placement.
 */
export async function createQrCode(input: QrCodeInput): Promise<QrCode> {
  const profile = await requireAuth();
  const supabase = await createClient();

  // Validate input
  const parsed = qrCodeSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((e) => e.message).join(', '));
  }

  if (!isUrlSafe(input.target_url)) {
    throw new Error('Die Ziel-URL ist nicht sicher oder ungültig.');
  }

  // Fetch placement with campaign for defaults
  const { data: placement, error: placementErr } = await supabase
    .from('placements')
    .select('*, campaign:campaigns!campaign_id ( id, name, slug )')
    .eq('id', input.placement_id)
    .single();

  if (placementErr || !placement) {
    throw new Error('Platzierung nicht gefunden.');
  }

  const campaign = placement.campaign as { id: string; name: string; slug: string } | null;

  // Generate short code and URLs
  const shortCode = nanoid(8);
  const baseUrl = getAppUrl();
  const redirectUrl = buildRedirectUrl(baseUrl, shortCode);

  // Generate QR code images with optional colors
  const fgColor = input.qr_fg_color || '#000000';
  const bgColor = input.qr_bg_color || '#FFFFFF';
  const { pngDataUrl, svgString } = await generateQrCode(redirectUrl, {
    fgColor,
    bgColor,
  });

  // Build SVG data URL for storage
  const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;

  // Set UTM defaults from placement / campaign
  const utmCampaign = input.utm_campaign || campaign?.slug || '';
  const utmContent = input.utm_content || placement.placement_code || '';

  const { data: qrCode, error: insertErr } = await supabase
    .from('qr_codes')
    .insert({
      placement_id: input.placement_id,
      short_code: shortCode,
      target_url: input.target_url,
      active: true,
      valid_from: input.valid_from || null,
      valid_until: input.valid_until || null,
      note: input.note || null,
      created_by: profile.id,
      qr_png_url: pngDataUrl,
      qr_svg_url: svgDataUrl,
      utm_source: input.utm_source || 'qr',
      utm_medium: input.utm_medium || 'offline',
      utm_campaign: utmCampaign,
      utm_content: utmContent,
      utm_id: input.utm_id || null,
      qr_fg_color: fgColor,
      qr_bg_color: bgColor,
      max_scans: input.max_scans || null,
      limit_redirect_url: input.limit_redirect_url || null,
    })
    .select()
    .single();

  if (insertErr) throw new Error(insertErr.message);

  // Add history entry
  await addHistory(supabase, {
    qr_code_id: qrCode.id,
    action: 'created',
    changed_by: profile.id,
    new_value: redirectUrl,
    note: `QR-Code erstellt für ${input.target_url}`,
  });

  revalidatePath('/qr-codes');
  return qrCode as QrCode;
}

/**
 * Update an existing QR code's target URL, note, UTM fields, and active status.
 */
export async function updateQrCode(
  id: string,
  data: Partial<
    Pick<
      QrCode,
      | 'target_url'
      | 'note'
      | 'active'
      | 'valid_from'
      | 'valid_until'
      | 'utm_source'
      | 'utm_medium'
      | 'utm_campaign'
      | 'utm_content'
      | 'utm_id'
      | 'qr_fg_color'
      | 'qr_bg_color'
      | 'max_scans'
      | 'limit_redirect_url'
    >
  >,
): Promise<QrCode> {
  const profile = await requireAuth();
  const supabase = await createClient();

  // Fetch current record
  const { data: existing, error: fetchErr } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchErr || !existing) throw new Error('QR-Code nicht gefunden.');

  const updates: Record<string, unknown> = {};

  // Target URL change -> regenerate QR code
  let targetChanged = false;
  if (data.target_url !== undefined && data.target_url !== existing.target_url) {
    if (!isUrlSafe(data.target_url)) {
      throw new Error('Die Ziel-URL ist nicht sicher oder ungültig.');
    }
    updates.target_url = data.target_url;
    targetChanged = true;
  }

  // Active status change
  let activeChanged = false;
  if (data.active !== undefined && data.active !== existing.active) {
    updates.active = data.active;
    activeChanged = true;
  }

  // UTM and other fields
  const copyFields = [
    'note', 'valid_from', 'valid_until',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_id',
  ] as const;
  for (const field of copyFields) {
    if (data[field] !== undefined) {
      updates[field] = data[field] || null;
    }
  }

  // Scan limit fields
  if (data.max_scans !== undefined) {
    updates.max_scans = data.max_scans || null;
  }
  if (data.limit_redirect_url !== undefined) {
    updates.limit_redirect_url = data.limit_redirect_url || null;
  }

  // Color changes
  let colorChanged = false;
  if (data.qr_fg_color !== undefined && data.qr_fg_color !== existing.qr_fg_color) {
    updates.qr_fg_color = data.qr_fg_color;
    colorChanged = true;
  }
  if (data.qr_bg_color !== undefined && data.qr_bg_color !== existing.qr_bg_color) {
    updates.qr_bg_color = data.qr_bg_color;
    colorChanged = true;
  }

  // Regenerate QR image if target URL or colors changed
  if (targetChanged || colorChanged) {
    const baseUrl = getAppUrl();
    const redirectUrl = buildRedirectUrl(baseUrl, existing.short_code);
    const fgColor = (updates.qr_fg_color as string) ?? existing.qr_fg_color ?? '#000000';
    const bgColor = (updates.qr_bg_color as string) ?? existing.qr_bg_color ?? '#FFFFFF';
    const { pngDataUrl, svgString } = await generateQrCode(redirectUrl, { fgColor, bgColor });
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;
    updates.qr_png_url = pngDataUrl;
    updates.qr_svg_url = svgDataUrl;
  }

  const { data: updated, error: updateErr } = await supabase
    .from('qr_codes')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (updateErr) throw new Error(updateErr.message);

  // History entries
  if (targetChanged) {
    await addHistory(supabase, {
      qr_code_id: id,
      action: 'target_changed',
      changed_by: profile.id,
      old_value: existing.target_url,
      new_value: data.target_url!,
    });
  }

  if (activeChanged) {
    await addHistory(supabase, {
      qr_code_id: id,
      action: data.active ? 'activated' : 'deactivated',
      changed_by: profile.id,
      old_value: String(existing.active),
      new_value: String(data.active),
    });
  }

  revalidatePath('/qr-codes');
  revalidatePath(`/qr-codes/${id}`);
  return updated as QrCode;
}

/**
 * Quick-toggle active status.
 */
export async function toggleQrCode(
  id: string,
  active: boolean,
): Promise<QrCode> {
  return updateQrCode(id, { active });
}

/**
 * Soft-delete (archive) a QR code by deactivating it and adding an archived history entry.
 */
export async function deleteQrCode(id: string): Promise<void> {
  await requireAuth();
  const supabase = await createServiceClient();

  // FK cascades handle qr_status_history; redirect_events uses ON DELETE SET NULL
  const { error } = await supabase
    .from('qr_codes')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);

  revalidatePath('/qr-codes');
}

/**
 * Bulk-create QR codes for a single placement from a list of items.
 * Max 100 items per call.
 */
export async function bulkCreateQrCodes(
  placementId: string,
  items: { target_url: string; note?: string }[],
): Promise<{ created: number; errors: string[] }> {
  const profile = await requireAuth();
  const supabase = await createClient();

  if (items.length > 100) {
    return { created: 0, errors: ['Maximal 100 QR-Codes pro Bulk-Import.'] };
  }

  // Validate placement
  const { data: placement } = await supabase
    .from('placements')
    .select('*, campaign:campaigns!campaign_id ( id, name, slug )')
    .eq('id', placementId)
    .single();

  if (!placement) {
    return { created: 0, errors: ['Platzierung nicht gefunden.'] };
  }

  const campaign = placement.campaign as { id: string; name: string; slug: string } | null;
  const baseUrl = getAppUrl();
  const errors: string[] = [];
  let created = 0;

  for (const item of items) {
    try {
      if (!isUrlSafe(item.target_url)) {
        errors.push(`Unsichere URL übersprungen: ${item.target_url}`);
        continue;
      }

      const shortCode = nanoid(8);
      const redirectUrl = buildRedirectUrl(baseUrl, shortCode);
      const { pngDataUrl, svgString } = await generateQrCode(redirectUrl);
      const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgString).toString('base64')}`;

      const { error } = await supabase.from('qr_codes').insert({
        placement_id: placementId,
        short_code: shortCode,
        target_url: item.target_url,
        active: true,
        note: item.note || null,
        created_by: profile.id,
        qr_png_url: pngDataUrl,
        qr_svg_url: svgDataUrl,
        utm_source: 'qr',
        utm_medium: 'offline',
        utm_campaign: campaign?.slug || '',
        utm_content: placement.placement_code || '',
        qr_fg_color: '#000000',
        qr_bg_color: '#FFFFFF',
      });

      if (error) {
        errors.push(`Fehler bei ${item.target_url}: ${error.message}`);
      } else {
        created++;
      }
    } catch (err) {
      errors.push(`Fehler bei ${item.target_url}: ${err instanceof Error ? err.message : 'Unbekannt'}`);
    }
  }

  revalidatePath('/qr-codes');
  return { created, errors };
}
