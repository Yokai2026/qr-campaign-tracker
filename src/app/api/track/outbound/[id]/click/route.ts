import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Eigener Click-Tracker — alle Outbound-Mail-Links zeigen hierhin und
 * werden dann via 302 zur eigentlichen URL geleitet. Schreibt clicked_at +
 * click_count in outbound_messages und faellt auf opened_at zurueck (jeder
 * Klick impliziert eine Oeffnung).
 *
 * Funktioniert garantiert (im Gegensatz zu Resend's Pixel-Tracking, das
 * Gmail oft blockt).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const target = request.nextUrl.searchParams.get('url') ?? '/';
  // Whitelist auf spurig.com-Subdomains/Paths — verhindert Open-Redirect-Missbrauch
  let safeTarget: string;
  try {
    const t = new URL(target, 'https://spurig.com');
    const isSpurig =
      t.hostname === 'spurig.com' || t.hostname.endsWith('.spurig.com');
    safeTarget = isSpurig ? t.toString() : 'https://spurig.com';
  } catch {
    safeTarget = 'https://spurig.com';
  }

  const sb = await createServiceClient();
  try {
    const { data: current } = await sb
      .from('outbound_messages')
      .select('lead_id, clicked_at, opened_at, click_count, open_count')
      .eq('id', id)
      .maybeSingle();
    if (current) {
      const now = new Date().toISOString();
      await sb
        .from('outbound_messages')
        .update({
          clicked_at: current.clicked_at ?? now,
          click_count: (current.click_count ?? 0) + 1,
          // Click impliziert Open — falls noch nicht gesetzt
          opened_at: current.opened_at ?? now,
          open_count: current.opened_at ? current.open_count : (current.open_count ?? 0) + 1,
          status: 'clicked',
        })
        .eq('id', id);

      // Lead-Status auf 'engaged' setzen — wenn er Click macht ist er
      // definitiv interessiert (oder zumindest neugierig). Wirft nicht ueber
      // 'replied'/'converted' damit explizite Stati nicht ueberschrieben werden.
      if (current.lead_id) {
        await sb
          .from('outbound_leads')
          .update({ status: 'engaged' })
          .eq('id', current.lead_id)
          .in('status', ['contacted', 'queued']);
      }
    }
  } catch (e) {
    console.warn('[track/click] update failed:', e);
  }

  return NextResponse.redirect(safeTarget, { status: 302 });
}
