import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/outbound/leads/[id]/mark-replied
 *  - Setzt outbound_leads.status = 'replied'
 *  - Setzt replied_at = now() auf der JUENGSTEN outbound_messages-Row des Leads
 *    (falls noch nicht gesetzt)
 *
 * Manueller Ersatz fuer ein Resend-Inbound-Webhook — funktioniert sofort
 * ohne DNS-/MX-Konfiguration. Der Admin sieht eine Reply in Gmail, klickt
 * im Outbound-Tracking auf 'Geantwortet', Lead wandert auf 'replied'.
 *
 * DELETE-Aequivalent (Markierung wieder entfernen): POST mit { undo: true }
 * — setzt status zurueck auf 'engaged'/'contacted' (je nach Click-Evidenz)
 * und nullt replied_at.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { id: leadId } = await params;
  const body = await request.json().catch(() => ({}));
  const undo = body?.undo === true;

  const sb = await createServiceClient();

  // Lead existiert?
  const { data: lead, error: leadFetchErr } = await sb
    .from('outbound_leads')
    .select('id, status')
    .eq('id', leadId)
    .maybeSingle();
  if (leadFetchErr) return NextResponse.json({ error: leadFetchErr.message }, { status: 500 });
  if (!lead) return NextResponse.json({ error: 'lead_not_found' }, { status: 404 });

  // Juengste Mail des Leads
  const { data: lastMsg } = await sb
    .from('outbound_messages')
    .select('id, replied_at, clicked_at')
    .eq('lead_id', leadId)
    .not('sent_at', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (undo) {
    // Reply-Markierung entfernen + Lead-Status auf Vorzustand zurueck
    const fallbackStatus = lastMsg?.clicked_at ? 'engaged' : 'contacted';
    await sb
      .from('outbound_leads')
      .update({ status: fallbackStatus })
      .eq('id', leadId);
    if (lastMsg?.id) {
      await sb
        .from('outbound_messages')
        .update({ replied_at: null, status: lastMsg.clicked_at ? 'clicked' : 'sent' })
        .eq('id', lastMsg.id);
    }
    return NextResponse.json({ ok: true, undone: true, leadStatus: fallbackStatus });
  }

  // Mark replied
  const now = new Date().toISOString();
  await sb.from('outbound_leads').update({ status: 'replied' }).eq('id', leadId);
  if (lastMsg?.id && !lastMsg.replied_at) {
    await sb
      .from('outbound_messages')
      .update({ replied_at: now, status: 'replied' })
      .eq('id', lastMsg.id);
  }

  return NextResponse.json({
    ok: true,
    leadStatus: 'replied',
    messageId: lastMsg?.id ?? null,
    repliedAt: lastMsg?.id ? now : null,
  });
}
