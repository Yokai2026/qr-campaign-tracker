'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { locationSchema } from '@/lib/validations';
import type { Location, LocationInput } from '@/types';

export type LocationWithStats = Location & {
  /** Scans in den letzten 7 Tagen (aggregiert über alle Placements des Standorts). */
  scans_7d: number;
  /** Scans gesamt (aggregiert). */
  scans_total: number;
  /** Delta in % gegenüber Woche davor. null = keine Info, 'new' = vorher leer. */
  scans_trend: number | 'new' | null;
};

// Fetch all locations with aggregated scan counts (across placements).
export async function getLocations(): Promise<LocationWithStats[]> {
  await requireAuth();
  const supabase = await createClient();

  const weekAgoIso = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const twoWeeksAgoIso = new Date(Date.now() - 14 * 86_400_000).toISOString();

  const [locRes, placementsRes, eventsRes] = await Promise.all([
    supabase.from('locations').select('*').order('venue_name', { ascending: true }),
    supabase.from('placements').select('id, location_id'),
    supabase
      .from('redirect_events')
      .select('placement_id, created_at')
      .eq('event_type', 'qr_open')
      .eq('is_bot', false)
      .not('placement_id', 'is', null)
      .limit(100_000),
  ]);

  if (locRes.error) {
    throw new Error(`Standorte konnten nicht geladen werden: ${locRes.error.message}`);
  }

  // placement_id → location_id Lookup
  const placementToLocation: Record<string, string> = {};
  (placementsRes.data ?? []).forEach((p: { id: string; location_id: string }) => {
    placementToLocation[p.id] = p.location_id;
  });

  const scansTotal: Record<string, number> = {};
  const scans7d: Record<string, number> = {};
  const scansPrev7d: Record<string, number> = {};
  (eventsRes.data ?? []).forEach((e: { placement_id: string | null; created_at: string }) => {
    if (!e.placement_id) return;
    const locId = placementToLocation[e.placement_id];
    if (!locId) return;
    scansTotal[locId] = (scansTotal[locId] ?? 0) + 1;
    if (e.created_at >= weekAgoIso) {
      scans7d[locId] = (scans7d[locId] ?? 0) + 1;
    } else if (e.created_at >= twoWeeksAgoIso) {
      scansPrev7d[locId] = (scansPrev7d[locId] ?? 0) + 1;
    }
  });

  const rows = (locRes.data ?? []).map((loc: Location) => {
    const curr = scans7d[loc.id] ?? 0;
    const prev = scansPrev7d[loc.id] ?? 0;
    return {
      ...loc,
      scans_7d: curr,
      scans_total: scansTotal[loc.id] ?? 0,
      scans_trend: computeTrend(curr, prev),
    } as LocationWithStats;
  });

  // Default-Sort: Performance (7T DESC), Fallback auf venue_name alphabetisch.
  rows.sort((a, b) => {
    const diff = b.scans_7d - a.scans_7d;
    if (diff !== 0) return diff;
    return a.venue_name.localeCompare(b.venue_name);
  });
  return rows;
}

function computeTrend(current: number, previous: number): number | 'new' | null {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) return 'new';
  return ((current - previous) / previous) * 100;
}

// Fetch a single location with its placement count
export async function getLocation(id: string): Promise<{
  location: Location;
  placementCount: number;
  placements: Array<{
    id: string;
    name: string;
    placement_code: string;
    status: string;
    campaign: { id: string; name: string } | null;
  }>;
}> {
  await requireAuth();
  const supabase = await createClient();

  const { data: location, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !location) {
    throw new Error('Standort nicht gefunden.');
  }

  const { data: placements, error: placementsError } = await supabase
    .from('placements')
    .select('id, name, placement_code, status, campaign:campaigns(id, name)')
    .eq('location_id', id)
    .order('name', { ascending: true });

  if (placementsError) {
    throw new Error(`Platzierungen konnten nicht geladen werden: ${placementsError.message}`);
  }

  // Supabase returns joined relations as arrays; normalize to single object or null
  const normalized = (placements ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    name: p.name as string,
    placement_code: p.placement_code as string,
    status: p.status as string,
    campaign: Array.isArray(p.campaign) ? (p.campaign[0] as { id: string; name: string } | undefined) ?? null : (p.campaign as { id: string; name: string } | null),
  }));

  return {
    location: location as Location,
    placementCount: normalized.length,
    placements: normalized,
  };
}

// Create a new location
export async function createLocation(
  data: LocationInput
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  const profile = await requireAuth();

  const parsed = locationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' };
  }

  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from('locations')
    .insert({ ...parsed.data, created_by: profile.id })
    .select('id')
    .single();

  if (error) {
    return { success: false, error: `Fehler beim Erstellen: ${error.message}` };
  }

  revalidatePath('/locations');
  return { success: true, id: created.id };
}

// Update an existing location
export async function updateLocation(
  id: string,
  data: LocationInput
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAuth();

  const parsed = locationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('locations')
    .update(parsed.data)
    .eq('id', id);

  if (error) {
    return { success: false, error: `Fehler beim Aktualisieren: ${error.message}` };
  }

  revalidatePath('/locations');
  revalidatePath(`/locations/${id}`);
  return { success: true };
}

// Delete a location
export async function deleteLocation(
  id: string
): Promise<{ success: true } | { success: false; error: string }> {
  await requireAuth();
  const supabase = await createServiceClient();

  // Check for linked placements
  const { count } = await supabase
    .from('placements')
    .select('id', { count: 'exact', head: true })
    .eq('location_id', id);

  if (count && count > 0) {
    return {
      success: false,
      error: `Dieser Standort hat noch ${count} Platzierung(en) und kann nicht gelöscht werden.`,
    };
  }

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);

  if (error) {
    return { success: false, error: `Fehler beim Löschen: ${error.message}` };
  }

  revalidatePath('/locations');
  return { success: true };
}
