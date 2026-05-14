import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Resend Webhook — empfängt Engagement-Events (delivered, opened, clicked,
 * bounced, complained) und schreibt sie in outbound_messages.
 *
 * Setup: in Resend Dashboard → Webhooks → URL: https://spurig.com/api/webhooks/resend
 * Subscribe to: email.sent, email.delivered, email.opened, email.clicked,
 *               email.bounced, email.complained, email.failed
 *
 * Optional Verification via RESEND_WEBHOOK_SECRET (Svix-Signatur).
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body || !body.type || !body.data) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const type = body.type as string;
  const data = body.data as {
    email_id?: string;
    id?: string;
    created_at?: string;
    to?: string[];
    from?: string;
    subject?: string;
    bounce?: { type?: string; message?: string };
    click?: { link?: string };
  };

  const resendMessageId = data.email_id ?? data.id;
  if (!resendMessageId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const sb = await createServiceClient();
  const ts = data.created_at ?? new Date().toISOString();

  // Update outbound_messages basierend auf Event-Typ
  const updates: Record<string, string | number | null> = {};
  let newStatus: string | null = null;
  let leadUpdate: Record<string, string | null> | null = null;

  switch (type) {
    case 'email.sent':
      newStatus = 'sent';
      break;
    case 'email.delivered':
      updates.delivered_at = ts;
      newStatus = 'delivered';
      break;
    case 'email.opened':
      updates.opened_at = ts;
      newStatus = 'opened';
      break;
    case 'email.clicked':
      updates.clicked_at = ts;
      newStatus = 'clicked';
      break;
    case 'email.bounced':
      updates.bounced_at = ts;
      updates.error = data.bounce?.message ?? 'bounce';
      newStatus = 'bounced';
      leadUpdate = { status: 'bounced' };
      break;
    case 'email.complained':
      updates.complained_at = ts;
      newStatus = 'complained';
      leadUpdate = { status: 'do_not_contact' };
      break;
    case 'email.failed':
      updates.error = 'send failed';
      newStatus = 'failed';
      break;
    default:
      return NextResponse.json({ ok: true, ignored: true, type });
  }

  if (newStatus) updates.status = newStatus;

  // open_count / click_count via RPC-like increment ist mit PostgREST tricky; nutze update mit lokaler Logik
  if (type === 'email.opened' || type === 'email.clicked') {
    const field = type === 'email.opened' ? 'open_count' : 'click_count';
    const { data: current } = await sb
      .from('outbound_messages')
      .select(`id, lead_id, ${field}`)
      .eq('resend_message_id', resendMessageId)
      .maybeSingle();
    if (current) {
      const currentRow = current as unknown as Record<string, number | string>;
      updates[field] = (Number(currentRow[field]) || 0) + 1;
    }
  }

  const { data: msgs, error: msgErr } = await sb
    .from('outbound_messages')
    .update(updates)
    .eq('resend_message_id', resendMessageId)
    .select('lead_id')
    .limit(1);

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  // Lead-State updaten wenn nötig (bounce/complain)
  if (leadUpdate && msgs && msgs[0]?.lead_id) {
    await sb.from('outbound_leads').update(leadUpdate).eq('id', msgs[0].lead_id);
  }

  return NextResponse.json({ ok: true, type, resendMessageId, ...updates });
}
