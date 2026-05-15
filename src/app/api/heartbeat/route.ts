import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Heartbeat-Endpoint: trackt Live-Presence von ALLEN Website-Besuchern.
 *
 * - Eingeloggter User: setzt profiles.last_seen_at = NOW() (alte Logik) +
 *   upsertet visitor_heartbeats mit user_id (fuer den getrennten "eingeloggt"-
 *   vs "anonym"-Counter im Admin-Panel).
 * - Anonymer Besucher: upsertet visitor_heartbeats nur mit visitor_id
 *   (clientseitige localStorage-UUID).
 *
 * "Online" gilt im Admin-Panel als last_seen_at > NOW() - 2 Min.
 *
 * Body: { visitorId?: string, page?: string }
 *  - visitorId pflichtig fuer anonyme Calls; bei eingeloggten optional.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const visitorId =
    typeof body?.visitorId === 'string' && body.visitorId.length > 0 && body.visitorId.length <= 64
      ? body.visitorId
      : null;
  const page =
    typeof body?.page === 'string' && body.page.length <= 256 ? body.page.slice(0, 256) : null;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Eingeloggter User: profiles.last_seen_at updaten (Legacy-Verhalten)
  if (user) {
    await supabase
      .from('profiles')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', user.id);
  }

  // visitor_heartbeats nur upserten wenn visitorId vorhanden
  if (visitorId) {
    // Service-Client weil RLS unsigned writes blockt + wir die Row-ID kennen
    const admin = await createServiceClient();
    const userAgent = request.headers.get('user-agent')?.slice(0, 256) ?? null;
    await admin
      .from('visitor_heartbeats')
      .upsert(
        {
          visitor_id: visitorId,
          user_id: user?.id ?? null,
          last_seen_at: new Date().toISOString(),
          user_agent: userAgent,
          page,
        },
        { onConflict: 'visitor_id' },
      );
  }

  return NextResponse.json({ ok: true, authenticated: !!user, tracked: !!visitorId });
}
