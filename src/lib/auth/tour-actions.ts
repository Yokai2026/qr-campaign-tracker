'use server';

import { createClient } from '@/lib/supabase/server';

// Markiert die Tour als abgeschlossen (oder bei Skip gleichermassen).
// Idempotent: setzt tour_completed_at nur wenn noch NULL — verhindert
// dass ein zweiter "Restart"-Klick den urspruenglichen Zeitpunkt
// ueberschreibt (falls wir den spaeter mal auswerten wollen).
export async function markTourCompleted(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ tour_completed_at: new Date().toISOString() })
      .eq('id', user.id)
      .is('tour_completed_at', null);
  } catch (err) {
    console.error('[tour] markTourCompleted failed:', err);
  }
}

// Setzt den Marker zurueck, damit die Tour beim naechsten /dashboard-Hit
// erneut startet. Vom "Tour erneut starten"-Button in den Einstellungen
// aufgerufen.
export async function restartTour(): Promise<void> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('profiles')
      .update({ tour_completed_at: null })
      .eq('id', user.id);
  } catch (err) {
    console.error('[tour] restartTour failed:', err);
  }
}
