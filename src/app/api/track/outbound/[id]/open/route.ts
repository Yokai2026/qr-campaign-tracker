import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { notifyLifecycle } from '@/lib/notify/webhook';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SEGMENT_LABELS: Record<string, string> = {
  marketing_agency: 'Marketing-Agentur',
  gastronomy: 'Gastronomie',
  crafts_sme: 'Handwerk & KMU',
  events_tourism: 'Events & Tourismus',
};

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
 *
 * Discord-Ping (optional): NOTIFY_OUTBOUND_OPEN=true setzen damit bei erstem
 * Open eines Leads eine Notification feuert. Default off, weil Opens viel
 * frequenter als Clicks sind (Spam-Gefahr bei laufenden Batches).
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
      .select('lead_id, opened_at, open_count')
      .eq('id', id)
      .maybeSingle();
    if (current) {
      const now = new Date().toISOString();
      const isFirstOpen = !current.opened_at;
      await sb
        .from('outbound_messages')
        .update({
          opened_at: current.opened_at ?? now,
          open_count: (current.open_count ?? 0) + 1,
          status: 'opened',
        })
        .eq('id', id);

      // Erster Open + Opt-In via Env → Discord-Ping. Fire-and-forget,
      // blockt Pixel-Auslieferung nicht.
      if (isFirstOpen && current.lead_id && process.env.NOTIFY_OUTBOUND_OPEN === 'true') {
        void (async () => {
          const { data: lead } = await sb
            .from('outbound_leads')
            .select('name, email, segment, city')
            .eq('id', current.lead_id)
            .maybeSingle();
          if (!lead) return;
          const fields: Array<{ name: string; value: string }> = [
            { name: 'Firma', value: lead.name },
            { name: 'Email', value: lead.email ?? '—' },
            { name: 'Segment', value: SEGMENT_LABELS[lead.segment] ?? lead.segment },
          ];
          if (lead.city) fields.push({ name: 'Stadt', value: lead.city });
          await notifyLifecycle({
            title: '👀 Cold-Mail-Open',
            description: `**${lead.name}** hat die Cold-Mail geöffnet. Noch kein Click — eventuell ein guter Zeitpunkt für LinkedIn-Connect oder kurze Follow-Up.`,
            level: 'info',
            fields,
            url: 'https://spurig.com/admin/outbound',
          });
        })().catch((e) => console.warn('[track/open] notify failed:', e));
      }
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
