'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { locationSchema } from '@/lib/validations';
import type { Location, LocationInput } from '@/types';

// Fetch all locations ordered by venue_name
export async function getLocations(): Promise<Location[]> {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('venue_name', { ascending: true });

  if (error) {
    throw new Error(`Standorte konnten nicht geladen werden: ${error.message}`);
  }

  return data as Location[];
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
  await requireAuth();

  const parsed = locationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe.' };
  }

  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from('locations')
    .insert(parsed.data)
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
  const supabase = await createClient();

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
