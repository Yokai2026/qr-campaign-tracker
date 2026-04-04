'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { placementSchema } from '@/lib/validations';
import type {
  Placement,
  PlacementInput,
  PlacementStatus,
  Campaign,
  Location,
} from '@/types';

// ============================================
// Filters
// ============================================

export interface PlacementFilters {
  campaign_id?: string;
  location_id?: string;
  status?: PlacementStatus;
}

// ============================================
// Read operations
// ============================================

/**
 * Fetch all placements with joined campaign name and location venue_name.
 * Supports filtering by campaign_id, location_id, and status.
 */
export async function getPlacements(filters?: PlacementFilters) {
  await requireAuth();
  const supabase = await createClient();

  let query = supabase
    .from('placements')
    .select(
      `
      *,
      campaign:campaigns!campaign_id ( id, name, slug, status ),
      location:locations!location_id ( id, venue_name, district ),
      qr_codes ( id )
    `
    )
    .order('created_at', { ascending: false });

  if (filters?.campaign_id) {
    query = query.eq('campaign_id', filters.campaign_id);
  }
  if (filters?.location_id) {
    query = query.eq('location_id', filters.location_id);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Platzierungen konnten nicht geladen werden: ${error.message}`);
  }

  return (data ?? []) as (Placement & {
    campaign: Pick<Campaign, 'id' | 'name' | 'slug' | 'status'>;
    location: Pick<Location, 'id' | 'venue_name' | 'district'>;
    qr_codes: { id: string }[];
  })[];
}

/**
 * Fetch a single placement with its campaign, location, and qr_codes.
 */
export async function getPlacement(id: string) {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('placements')
    .select(
      `
      *,
      campaign:campaigns!campaign_id ( * ),
      location:locations!location_id ( * ),
      qr_codes (
        *,
        qr_status_history ( *, profile:profiles!changed_by ( id, display_name, email ) )
      )
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Platzierung konnte nicht geladen werden: ${error.message}`);
  }

  return data as Placement & {
    campaign: Campaign;
    location: Location;
  };
}

// ============================================
// Write operations
// ============================================

/**
 * Create a new placement.
 */
export async function createPlacement(input: PlacementInput) {
  await requireAuth();
  const supabase = await createClient();

  const parsed = placementSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(', ')
    );
  }

  const { data, error } = await supabase
    .from('placements')
    .insert({
      campaign_id: parsed.data.campaign_id,
      location_id: parsed.data.location_id,
      name: parsed.data.name,
      placement_code: parsed.data.placement_code,
      placement_type: parsed.data.placement_type,
      poster_version: parsed.data.poster_version || null,
      flyer_version: parsed.data.flyer_version || null,
      notes: parsed.data.notes || null,
      status: parsed.data.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Platzierung konnte nicht erstellt werden: ${error.message}`);
  }

  revalidatePath('/placements');
  return data as Placement;
}

/**
 * Update an existing placement.
 */
export async function updatePlacement(id: string, input: Partial<PlacementInput>) {
  await requireAuth();
  const supabase = await createClient();

  // Validate only the provided fields by making all fields optional
  const partialSchema = placementSchema.partial();
  const parsed = partialSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(
      parsed.error.issues.map((i) => i.message).join(', ')
    );
  }

  // Build update payload, converting empty strings to null for optional fields
  const payload: Record<string, unknown> = {};
  const d = parsed.data;
  if (d.campaign_id !== undefined) payload.campaign_id = d.campaign_id;
  if (d.location_id !== undefined) payload.location_id = d.location_id;
  if (d.name !== undefined) payload.name = d.name;
  if (d.placement_code !== undefined) payload.placement_code = d.placement_code;
  if (d.placement_type !== undefined) payload.placement_type = d.placement_type;
  if (d.poster_version !== undefined) payload.poster_version = d.poster_version || null;
  if (d.flyer_version !== undefined) payload.flyer_version = d.flyer_version || null;
  if (d.notes !== undefined) payload.notes = d.notes || null;
  if (d.status !== undefined) payload.status = d.status;

  const { data, error } = await supabase
    .from('placements')
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Platzierung konnte nicht aktualisiert werden: ${error.message}`);
  }

  revalidatePath('/placements');
  revalidatePath(`/placements/${id}`);
  return data as Placement;
}

/**
 * Delete a placement by id.
 */
export async function deletePlacement(id: string) {
  await requireAuth();
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('placements')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Platzierung konnte nicht gelöscht werden: ${error.message}`);
  }

  revalidatePath('/placements');
}

// ============================================
// Helper queries (used by forms)
// ============================================

/**
 * Fetch active campaigns for select dropdowns.
 */
export async function getCampaignsForSelect() {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('campaigns')
    .select('id, name, slug, status')
    .in('status', ['draft', 'active', 'paused'])
    .order('name');

  if (error) {
    throw new Error(`Kampagnen konnten nicht geladen werden: ${error.message}`);
  }

  return (data ?? []) as Pick<Campaign, 'id' | 'name' | 'slug' | 'status'>[];
}

/**
 * Fetch active locations for select dropdowns.
 */
export async function getLocationsForSelect() {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('locations')
    .select('id, venue_name, district')
    .eq('active', true)
    .order('venue_name');

  if (error) {
    throw new Error(`Standorte konnten nicht geladen werden: ${error.message}`);
  }

  return (data ?? []) as Pick<Location, 'id' | 'venue_name' | 'district'>[];
}

/**
 * Generate the next placement code for a given campaign and location.
 */
export async function generatePlacementCode(
  campaignSlug: string,
  locationVenueName: string
) {
  await requireAuth();
  const supabase = await createClient();

  // Sanitize the location name to a slug-safe string
  const locationSlug = locationVenueName
    .toLowerCase()
    .replace(/[äöüß]/g, (c) =>
      ({ ä: 'ae', ö: 'oe', ü: 'ue', ß: 'ss' })[c] ?? c
    )
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);

  const prefix = `${campaignSlug}-${locationSlug}`;

  // Count existing placements with same prefix to generate counter
  const { count } = await supabase
    .from('placements')
    .select('id', { count: 'exact', head: true })
    .like('placement_code', `${prefix}%`);

  const counter = (count ?? 0) + 1;
  return `${prefix}-${String(counter).padStart(3, '0')}`;
}
