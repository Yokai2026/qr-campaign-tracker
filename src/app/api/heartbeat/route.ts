import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Heartbeat-Endpoint: setzt profiles.last_seen_at = NOW() für den
 * eingeloggten User. Wird vom Heartbeat-Client alle 30s gepingt.
 *
 * "Online" gilt im Admin-Panel als last_seen_at > NOW() - interval '2 min'.
 *
 * Nicht-eingeloggte Calls werden ignoriert (200, ohne Fehler) — kein Leak.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: true, anonymous: true });
  }

  await supabase
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id);

  return NextResponse.json({ ok: true });
}
