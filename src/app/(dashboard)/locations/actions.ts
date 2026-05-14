'use server';

import { revalidatePath } from 'next/cache';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { locationSchema } from '@/lib/validations';
import type { Location, LocationInput, PlacementStatus } from '@/types';

export type LocationWithStats = Location & {
  /** Scans in den letzten 7 Tagen (aggregiert über alle Placements des Standorts). */
  scans_7d: number;
  /** Scans gesamt (aggregiert). */
  scans_total: number;
  /** Delta in % gegenüber Woche davor. null = keine Info, 'new' = vorher leer. */
  scans_trend: number | 'new' | null;
};

export type PlacementSummary = {
  id: string;
  name: string;
  placement_code: string;
  placement_type: string;
  status: PlacementStatus;
  campaign: { id: string; name: string } | null;
  qr_count: number;
  scans_7d: number;
  scans_total: number;
  scans_trend: number | 'new' | null;
};

export type LocationWithPlacements = LocationWithStats & {
  placement_count: number;
  placements: PlacementSummary[];
};

// Fetch all locations with aggregated scan counts (across placements).
export async function getLocations(): Promise<LocationWithStats[]> {
  await requireAuth();
  const supabase = await createClient();

  const [locRes, statsRes] = await Promise.all([
    supabase.from('locations').select('*').order('venue_name', { ascending: true }),
    // Fast path: SQL-aggregiert via 022_stats_rpcs.sql.
    supabase.rpc('get_location_stats'),
  ]);

  if (locRes.error) {
    throw new Error(`Standorte konnten nicht geladen werden: ${locRes.error.message}`);
  }

  const scansTotal: Record<string, number> = {};
  const scans7d: Record<string, number> = {};
  const scansPrev7d: Record<string, number> = {};

  if (!statsRes.error && Array.isArray(statsRes.data)) {
    for (const r of statsRes.data as Array<{ location_id: string; scans_total: number; scans_7d: number; scans_prev_7d: number }>) {
      if (!r.location_id) continue;
      scansTotal[r.location_id] = Number(r.scans_total) || 0;
      scans7d[r.location_id] = Number(r.scans_7d) || 0;
      scansPrev7d[r.location_id] = Number(r.scans_prev_7d) || 0;
    }
  } else {
    // Fallback: Migration 022 noch nicht applied — alte Aggregation.
    const weekAgoIso = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const twoWeeksAgoIso = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const [placementsRes, eventsRes] = await Promise.all([
      supabase.from('placements').select('id, location_id'),
      supabase
        .from('redirect_events')
        .select('placement_id, created_at')
        .eq('event_type', 'qr_open')
        .eq('is_bot', false)
        .not('placement_id', 'is', null)
        .limit(100_000),
    ]);
    const placementToLocation: Record<string, string> = {};
    (placementsRes.data ?? []).forEach((p: { id: string; location_id: string }) => {
      placementToLocation[p.id] = p.location_id;
    });
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
  }

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

// Fetch all locations with their placements (Master-Detail UI).
export async function getLocationsWithPlacements(): Promise<LocationWithPlacements[]> {
  await requireAuth();
  const supabase = await createClient();

  const [locRes, placRes, locStatsRes, placStatsRes] = await Promise.all([
    supabase.from('locations').select('*').order('venue_name', { ascending: true }),
    supabase
      .from('placements')
      .select(
        `
        id, name, placement_code, placement_type, status, location_id,
        campaign:campaigns!campaign_id ( id, name ),
        qr_codes ( id )
      `,
      )
      .order('name', { ascending: true }),
    supabase.rpc('get_location_stats'),
    supabase.rpc('get_placement_stats'),
  ]);

  if (locRes.error) {
    throw new Error(`Standorte konnten nicht geladen werden: ${locRes.error.message}`);
  }
  if (placRes.error) {
    throw new Error(`Platzierungen konnten nicht geladen werden: ${placRes.error.message}`);
  }

  const locStatsTotal: Record<string, number> = {};
  const locStats7d: Record<string, number> = {};
  const locStatsPrev7d: Record<string, number> = {};
  const placStatsTotal: Record<string, number> = {};
  const placStats7d: Record<string, number> = {};
  const placStatsPrev7d: Record<string, number> = {};

  const haveLocRpc = !locStatsRes.error && Array.isArray(locStatsRes.data);
  const havePlacRpc = !placStatsRes.error && Array.isArray(placStatsRes.data);

  if (haveLocRpc) {
    for (const r of locStatsRes.data as Array<{
      location_id: string;
      scans_total: number;
      scans_7d: number;
      scans_prev_7d: number;
    }>) {
      if (!r.location_id) continue;
      locStatsTotal[r.location_id] = Number(r.scans_total) || 0;
      locStats7d[r.location_id] = Number(r.scans_7d) || 0;
      locStatsPrev7d[r.location_id] = Number(r.scans_prev_7d) || 0;
    }
  }
  if (havePlacRpc) {
    for (const r of placStatsRes.data as Array<{
      placement_id: string;
      scans_total: number;
      scans_7d: number;
      scans_prev_7d: number;
    }>) {
      if (!r.placement_id) continue;
      placStatsTotal[r.placement_id] = Number(r.scans_total) || 0;
      placStats7d[r.placement_id] = Number(r.scans_7d) || 0;
      placStatsPrev7d[r.placement_id] = Number(r.scans_prev_7d) || 0;
    }
  }

  // Fallback: wenn RPC nicht da ist, zumindest aus Events aggregieren.
  if (!haveLocRpc || !havePlacRpc) {
    const weekAgoIso = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const twoWeeksAgoIso = new Date(Date.now() - 14 * 86_400_000).toISOString();
    const { data: events } = await supabase
      .from('redirect_events')
      .select('placement_id, created_at')
      .eq('event_type', 'qr_open')
      .eq('is_bot', false)
      .not('placement_id', 'is', null)
      .limit(100_000);

    const placToLoc: Record<string, string | null> = {};
    (placRes.data ?? []).forEach((p: { id: string; location_id: string | null }) => {
      placToLoc[p.id] = p.location_id;
    });

    (events ?? []).forEach((e: { placement_id: string | null; created_at: string }) => {
      if (!e.placement_id) return;
      if (!havePlacRpc) {
        placStatsTotal[e.placement_id] = (placStatsTotal[e.placement_id] ?? 0) + 1;
        if (e.created_at >= weekAgoIso) {
          placStats7d[e.placement_id] = (placStats7d[e.placement_id] ?? 0) + 1;
        } else if (e.created_at >= twoWeeksAgoIso) {
          placStatsPrev7d[e.placement_id] = (placStatsPrev7d[e.placement_id] ?? 0) + 1;
        }
      }
      if (!haveLocRpc) {
        const locId = placToLoc[e.placement_id];
        if (!locId) return;
        locStatsTotal[locId] = (locStatsTotal[locId] ?? 0) + 1;
        if (e.created_at >= weekAgoIso) {
          locStats7d[locId] = (locStats7d[locId] ?? 0) + 1;
        } else if (e.created_at >= twoWeeksAgoIso) {
          locStatsPrev7d[locId] = (locStatsPrev7d[locId] ?? 0) + 1;
        }
      }
    });
  }

  // Placements pro Standort gruppieren.
  const placementsByLocation: Record<string, PlacementSummary[]> = {};
  for (const p of (placRes.data ?? []) as Array<{
    id: string;
    name: string;
    placement_code: string;
    placement_type: string;
    status: PlacementStatus;
    location_id: string;
    campaign: { id: string; name: string } | { id: string; name: string }[] | null;
    qr_codes: { id: string }[] | null;
  }>) {
    const curr = placStats7d[p.id] ?? 0;
    const prev = placStatsPrev7d[p.id] ?? 0;
    const summary: PlacementSummary = {
      id: p.id,
      name: p.name,
      placement_code: p.placement_code,
      placement_type: p.placement_type,
      status: p.status,
      campaign: Array.isArray(p.campaign) ? p.campaign[0] ?? null : p.campaign,
      qr_count: p.qr_codes?.length ?? 0,
      scans_7d: curr,
      scans_total: placStatsTotal[p.id] ?? 0,
      scans_trend: computeTrend(curr, prev),
    };
    (placementsByLocation[p.location_id] ??= []).push(summary);
  }
  // Sub-Liste sortieren: best 7T zuerst.
  for (const list of Object.values(placementsByLocation)) {
    list.sort((a, b) => b.scans_7d - a.scans_7d || a.name.localeCompare(b.name));
  }

  const rows: LocationWithPlacements[] = (locRes.data ?? []).map((loc: Location) => {
    const curr = locStats7d[loc.id] ?? 0;
    const prev = locStatsPrev7d[loc.id] ?? 0;
    const ps = placementsByLocation[loc.id] ?? [];
    return {
      ...loc,
      scans_7d: curr,
      scans_total: locStatsTotal[loc.id] ?? 0,
      scans_trend: computeTrend(curr, prev),
      placement_count: ps.length,
      placements: ps,
    };
  });

  // Default-Sort: aktivste Standorte zuerst.
  rows.sort((a, b) => {
    const diff = b.scans_7d - a.scans_7d;
    if (diff !== 0) return diff;
    return a.venue_name.localeCompare(b.venue_name);
  });
  return rows;
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
