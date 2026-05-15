import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return profile?.role === 'admin' ? user : null;
}

/**
 * GET /api/admin/outbound/stats
 * Returns:
 *  - totals: { leads, withEmail, queuedToSend, sent, delivered, opened, clicked, replied, bounced }
 *  - rates: { deliveredPct, openPct, clickPct, replyPct, bouncePct }
 *  - daily: last-14d Sends/Opens/Clicks Series
 *  - segments: counts per segment
 */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const sb = await createServiceClient();

  const [
    leadsTotal,
    leadsWithEmail,
    leadsQueued,
    msgSent,
    msgDelivered,
    msgOpened,
    msgClicked,
    msgReplied,
    msgBounced,
    msgComplained,
    leadsBySegment,
    leadsByStatus,
    last14d,
    // Wann wurde der letzte Webhook-Event empfangen? Wenn null → Resend-Webhook
    // ist gar nicht konfiguriert. Wichtige Diagnose damit der Admin weiss
    // ob die fehlenden delivered/opened-Zahlen vom Webhook kommen.
    lastWebhook,
  ] = await Promise.all([
    sb.from('outbound_leads').select('id', { count: 'exact', head: true }),
    sb.from('outbound_leads').select('id', { count: 'exact', head: true }).eq('email_status', 'discovered'),
    sb
      .from('outbound_leads')
      .select('id', { count: 'exact', head: true })
      .eq('email_status', 'discovered')
      .eq('status', 'new'),
    sb.from('outbound_messages').select('id', { count: 'exact', head: true }).not('sent_at', 'is', null),
    sb.from('outbound_messages').select('id', { count: 'exact', head: true }).not('delivered_at', 'is', null),
    sb.from('outbound_messages').select('id', { count: 'exact', head: true }).not('opened_at', 'is', null),
    sb.from('outbound_messages').select('id', { count: 'exact', head: true }).not('clicked_at', 'is', null),
    sb.from('outbound_messages').select('id', { count: 'exact', head: true }).not('replied_at', 'is', null),
    sb.from('outbound_messages').select('id', { count: 'exact', head: true }).not('bounced_at', 'is', null),
    sb.from('outbound_messages').select('id', { count: 'exact', head: true }).not('complained_at', 'is', null),
    sb.from('outbound_leads').select('segment'),
    sb.from('outbound_leads').select('status'),
    sb
      .from('outbound_messages')
      .select('sent_at, opened_at, clicked_at, replied_at')
      .gte('sent_at', new Date(Date.now() - 14 * 86_400_000).toISOString()),
    // Latest webhook events — wir nehmen das hoechste von delivered/opened/clicked/bounced/complained.
    // Wenn alle null → kein Webhook hat je gefeuert.
    Promise.all([
      sb.from('outbound_messages').select('delivered_at').not('delivered_at', 'is', null).order('delivered_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('outbound_messages').select('opened_at').not('opened_at', 'is', null).order('opened_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('outbound_messages').select('clicked_at').not('clicked_at', 'is', null).order('clicked_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('outbound_messages').select('bounced_at').not('bounced_at', 'is', null).order('bounced_at', { ascending: false }).limit(1).maybeSingle(),
      sb.from('outbound_messages').select('complained_at').not('complained_at', 'is', null).order('complained_at', { ascending: false }).limit(1).maybeSingle(),
    ]),
  ]);

  const sent = msgSent.count ?? 0;
  const delivered = msgDelivered.count ?? 0;
  const opened = msgOpened.count ?? 0;
  const clicked = msgClicked.count ?? 0;
  const replied = msgReplied.count ?? 0;
  const bounced = msgBounced.count ?? 0;
  const complained = msgComplained.count ?? 0;

  const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : 0);

  const totals = {
    leads: leadsTotal.count ?? 0,
    withEmail: leadsWithEmail.count ?? 0,
    queuedToSend: leadsQueued.count ?? 0,
    sent,
    delivered,
    opened,
    clicked,
    replied,
    bounced,
    complained,
  };

  const rates = {
    deliveredPct: pct(delivered, sent),
    openPct: pct(opened, delivered || sent),
    clickPct: pct(clicked, opened || delivered || sent),
    replyPct: pct(replied, sent),
    bouncePct: pct(bounced, sent),
  };

  // Aggregate by segment
  const segments: Record<string, number> = {};
  for (const r of leadsBySegment.data ?? []) {
    segments[r.segment] = (segments[r.segment] ?? 0) + 1;
  }

  // Aggregate by status
  const byStatus: Record<string, number> = {};
  for (const r of leadsByStatus.data ?? []) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  }

  // Daily series for last 14 days
  const days = new Map<
    string,
    { date: string; sent: number; opened: number; clicked: number; replied: number }
  >();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
    days.set(d, { date: d, sent: 0, opened: 0, clicked: 0, replied: 0 });
  }
  for (const r of last14d.data ?? []) {
    if (r.sent_at) {
      const d = String(r.sent_at).slice(0, 10);
      const day = days.get(d);
      if (day) day.sent++;
    }
    if (r.opened_at) {
      const d = String(r.opened_at).slice(0, 10);
      const day = days.get(d);
      if (day) day.opened++;
    }
    if (r.clicked_at) {
      const d = String(r.clicked_at).slice(0, 10);
      const day = days.get(d);
      if (day) day.clicked++;
    }
    if (r.replied_at) {
      const d = String(r.replied_at).slice(0, 10);
      const day = days.get(d);
      if (day) day.replied++;
    }
  }
  const daily = Array.from(days.values());

  // Webhook-Diagnostik: Bevorzugt aus dedizierter webhook_diagnostics-Tabelle.
  // Das ist die ehrlichste Quelle, da dort JEDER signaturen-verifizierte Eingang
  // gelogged wird (auch wenn die Resend-ID keinem outbound_message-Eintrag matcht).
  // Fallback: aelteres Verhalten (juengstes delivered/opened/clicked/...-Feld
  // ueber alle Messages). Greift wenn die Tabelle noch nicht existiert oder leer ist.
  let lastWebhookAt: string | null = null;
  try {
    const { data: diag } = await sb
      .from('webhook_diagnostics')
      .select('last_received_at')
      .eq('service', 'resend')
      .maybeSingle();
    if (diag?.last_received_at) {
      lastWebhookAt = diag.last_received_at as string;
    }
  } catch {
    // Tabelle nicht da → Fallback unten
  }

  if (!lastWebhookAt) {
    const webhookTimestamps: string[] = [];
    const [d, o, c, b, cm] = lastWebhook;
    if (d.data?.delivered_at) webhookTimestamps.push(d.data.delivered_at as string);
    if (o.data?.opened_at) webhookTimestamps.push(o.data.opened_at as string);
    if (c.data?.clicked_at) webhookTimestamps.push(c.data.clicked_at as string);
    if (b.data?.bounced_at) webhookTimestamps.push(b.data.bounced_at as string);
    if (cm.data?.complained_at) webhookTimestamps.push(cm.data.complained_at as string);
    lastWebhookAt =
      webhookTimestamps.length > 0
        ? webhookTimestamps.sort().slice(-1)[0]
        : null;
  }

  // Tracking-Refactor-Marker: alle Mails mit '/api/track/outbound/' im body_html
  // nutzen unseren Open-Pixel + Click-Wrap. Davor wurde Resends eingebautes
  // Tracking verwendet, das Gmail/Yahoo/Apple Mail standardmaessig blockt.
  // Wir geben Cutoff-Zeitpunkt + Counts zurueck, damit das UI klarstellen kann
  // warum die Pre-Refactor-Mails so niedrige Open-Rates haben.
  const [oldRes, newRes, cutoffRes] = await Promise.all([
    sb
      .from('outbound_messages')
      .select('id', { count: 'exact', head: true })
      .not('sent_at', 'is', null)
      .not('body_html', 'ilike', '%/api/track/outbound/%'),
    sb
      .from('outbound_messages')
      .select('id', { count: 'exact', head: true })
      .not('sent_at', 'is', null)
      .ilike('body_html', '%/api/track/outbound/%'),
    sb
      .from('outbound_messages')
      .select('sent_at')
      .ilike('body_html', '%/api/track/outbound/%')
      .not('sent_at', 'is', null)
      .order('sent_at', { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const trackingRefactor = {
    cutoffAt: (cutoffRes.data?.sent_at as string | undefined) ?? null,
    oldCount: oldRes.count ?? 0,
    newCount: newRes.count ?? 0,
  };

  return NextResponse.json({ totals, rates, segments, byStatus, daily, lastWebhookAt, trackingRefactor });
}
