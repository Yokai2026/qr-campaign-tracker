import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// 1x1 transparente GIF (43 bytes)
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64',
);

/**
 * Eigener Open-Tracker — wird als <img> in Outbound-Mails eingebettet.
 * Liefert eine 1x1 transparente GIF zurueck UND markiert die Mail als
 * geoeffnet in outbound_messages.
 *
 * Unabhaengig von Resend's eigenem Tracking (das bei Gmail oft nicht feuert).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sb = await createServiceClient();

  // Best-effort Update — wenn Fehler, trotzdem Pixel ausliefern
  try {
    const { data: current } = await sb
      .from('outbound_messages')
      .select('opened_at, open_count')
      .eq('id', id)
      .maybeSingle();
    if (current) {
      const now = new Date().toISOString();
      await sb
        .from('outbound_messages')
        .update({
          opened_at: current.opened_at ?? now,
          open_count: (current.open_count ?? 0) + 1,
          status: 'opened',
        })
        .eq('id', id);
    }
  } catch (e) {
    console.warn('[track/open] update failed:', e);
  }

  void request;
  return new NextResponse(TRANSPARENT_GIF as unknown as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Content-Length': String(TRANSPARENT_GIF.length),
      'Cache-Control': 'no-store, max-age=0',
      'Pragma': 'no-cache',
    },
  });
}
