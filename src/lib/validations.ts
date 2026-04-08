import { z } from 'zod';

export const campaignSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  slug: z.string().min(1, 'Slug ist erforderlich').max(100)
    .regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche'),
  description: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(['draft', 'active', 'paused', 'completed', 'archived']),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()).optional(),
});

export const locationSchema = z.object({
  district: z.string().max(200).optional().or(z.literal('')),
  venue_name: z.string().min(1, 'Ortsname ist erforderlich').max(300),
  address: z.string().max(500).optional().or(z.literal('')),
  location_type: z.enum([
    'library', 'school', 'youth_center', 'community_center',
    'public_board', 'event_space', 'office', 'shop', 'other',
  ]),
  notes: z.string().max(2000).optional().or(z.literal('')),
  active: z.boolean(),
  lat: z.number().optional(),
  lng: z.number().optional(),
});

export const placementSchema = z.object({
  campaign_id: z.string().uuid('Kampagne ist erforderlich'),
  location_id: z.string().uuid('Standort ist erforderlich'),
  name: z.string().min(1, 'Name ist erforderlich').max(300),
  placement_code: z.string().min(1, 'Code ist erforderlich').max(100)
    .regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche'),
  placement_type: z.string().min(1, 'Typ ist erforderlich').max(100),
  poster_version: z.string().max(100).optional().or(z.literal('')),
  flyer_version: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(['planned', 'installed', 'active', 'paused', 'removed', 'archived']),
});

export const qrCodeSchema = z.object({
  placement_id: z.string().uuid('Platzierung ist erforderlich'),
  target_url: z.string().url('Gültige URL erforderlich').max(2000),
  note: z.string().max(500).optional().or(z.literal('')),
  valid_from: z.string().optional().or(z.literal('')),
  valid_until: z.string().optional().or(z.literal('')),
  utm_source: z.string().max(200).optional().or(z.literal('')),
  utm_medium: z.string().max(200).optional().or(z.literal('')),
  utm_campaign: z.string().max(200).optional().or(z.literal('')),
  utm_content: z.string().max(200).optional().or(z.literal('')),
  utm_id: z.string().max(200).optional().or(z.literal('')),
  qr_fg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültiger Farbcode').optional().or(z.literal('')),
  qr_bg_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Ungültiger Farbcode').optional().or(z.literal('')),
  max_scans: z.number().int().min(1, 'Mindestens 1 Scan').optional(),
  limit_redirect_url: z.string().url('Gültige URL erforderlich').max(2000).optional().or(z.literal('')),
});

export const shortLinkSchema = z.object({
  target_url: z.string().url('Gültige URL erforderlich').max(2000),
  short_code: z.string().min(3, 'Mindestens 3 Zeichen').max(50)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Nur Buchstaben, Zahlen, Bindestrich und Unterstrich')
    .optional()
    .or(z.literal('')),
  link_mode: z.enum(['short', 'direct']).optional(),
  title: z.string().max(200).optional().or(z.literal('')),
  description: z.string().max(2000).optional().or(z.literal('')),
  campaign_id: z.string().uuid().optional().or(z.literal('')),
  link_group_id: z.string().uuid().optional().or(z.literal('')),
  expires_at: z.string().optional().or(z.literal('')),
  expired_url: z.string().url('Gültige URL erforderlich').max(2000).optional().or(z.literal('')),
  utm_source: z.string().max(200).optional().or(z.literal('')),
  utm_medium: z.string().max(200).optional().or(z.literal('')),
  utm_campaign: z.string().max(200).optional().or(z.literal('')),
  utm_content: z.string().max(200).optional().or(z.literal('')),
  utm_id: z.string().max(200).optional().or(z.literal('')),
});

export const linkGroupSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  slug: z.string().min(1, 'Slug ist erforderlich').max(100)
    .regex(/^[a-z0-9-]+$/, 'Nur Kleinbuchstaben, Zahlen und Bindestriche'),
  description: z.string().max(2000).optional().or(z.literal('')),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional().or(z.literal('')),
  campaign_id: z.string().uuid().optional().or(z.literal('')),
});

export const trackEventSchema = z.object({
  event_type: z.enum([
    'landing_page_view', 'cta_click', 'form_start',
    'form_submit', 'file_download',
  ]),
  qr_code_id: z.string().optional(),
  placement_id: z.string().optional(),
  campaign_id: z.string().optional(),
  session_id: z.string().optional(),
  page_url: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

// Safe URL validation for redirect targets
const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:'];

export function isUrlSafe(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (BLOCKED_PROTOCOLS.some((p) => parsed.protocol.startsWith(p))) return false;
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    return true;
  } catch {
    return false;
  }
}
