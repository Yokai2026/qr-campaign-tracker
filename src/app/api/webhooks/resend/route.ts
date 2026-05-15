import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
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
 * Signatur-Verifikation: wenn RESEND_WEBHOOK_SECRET gesetzt ist, werden die
 * Svix-Header (svix-id, svix-timestamp, svix-signature) gegen den Secret
 * geprueft. Ungueltige/fehlende Signaturen → 401. Verhindert Spoofing.
 */

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

function verifySvixSignature(
  payload: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string,
): boolean {
  // Timestamp-Tolerance: schuetzt vor Replay-Attacken
  const ts = parseInt(svixTimestamp, 10);
  if (!Number.isFinite(ts)) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > SIGNATURE_TOLERANCE_SECONDS) return false;

  // Secret-Format: whsec_<base64> — der Teil nach 'whsec_' ist base64-encoded
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signedContent = `${svixId}.${svixTimestamp}.${payload}`;
  const expectedSig = crypto
    .createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');

  // Header kann mehrere Signaturen enthalten (rotierende Keys), space-separated.
  // Jede ist version-prefixed: "v1,<base64>".
  const signatures = svixSignature
    .split(' ')
    .map((s) => s.trim().split(',')[1])
    .filter(Boolean);

  return signatures.some((sig) => {
    if (sig.length !== expectedSig.length) return false;
    try {
      return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
    } catch {
      return false;
    }
  });
}

export async function POST(request: NextRequest) {
  // Wir muessen den raw-body fuer die HMAC haben — req.json() wuerde ihn konsumieren.
  const rawBody = await request.text();

  // Signatur pruefen, falls Secret konfiguriert
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (secret) {
    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');
    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json(
        { error: 'missing_signature_headers' },
        { status: 401 },
      );
    }
    if (!verifySvixSignature(rawBody, svixId, svixTimestamp, svixSignature, secret)) {
      return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
    }
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' || !('type' in body) || !('data' in body)) {
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

  // Diagnostik: jeden signatur-verifizierten Eingang in webhook_diagnostics
  // tracken — damit der Admin-Banner zuverlaessig zeigt ob Resend Events liefert,
  // auch wenn die jeweilige resend_message_id keinem outbound_message-Eintrag matcht.
  // Best-effort: Fehler werden geschluckt, damit die Webhook-Antwort nicht blockiert.
  try {
    const { data: current } = await sb
      .from('webhook_diagnostics')
      .select('total_received')
      .eq('service', 'resend')
      .maybeSingle();
    const totalReceived = (current?.total_received ?? 0) + 1;
    await sb
      .from('webhook_diagnostics')
      .upsert(
        {
          service: 'resend',
          last_received_at: new Date().toISOString(),
          last_event_type: type,
          total_received: totalReceived,
        },
        { onConflict: 'service' },
      );
  } catch (e) {
    // Tabelle existiert evtl. noch nicht (Migration nicht applied). Silent skip.
    console.warn('[webhooks/resend] diagnostics upsert skipped:', e);
  }

  return NextResponse.json({ ok: true, type, resendMessageId, ...updates });
}
