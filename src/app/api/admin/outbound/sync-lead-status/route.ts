import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * POST /api/admin/outbound/sync-lead-status
 *
 * Repariert outbound_leads.status retroaktiv basierend auf outbound_messages-
 * Evidenz. Notwendig weil Click-Handler + Webhook-Bounce-Handler in der
 * Vergangenheit Lead-Updates silentlich fehlgeschlagen haben (siehe Logs ab
 * Mai 2026). Ist idempotent — kann jederzeit gefahrlos erneut laufen.
 *
 * Priority-Reihenfolge (strongest wins):
 *   1) email.complained → outbound_leads.status = 'do_not_contact'
 *   2) email.bounced    → 'do_not_contact'
 *   3) email.replied    → 'replied' (vorhanden = unangetastet)
 *   4) email.clicked    → 'engaged'  (nur wenn current ∈ {contacted, queued, new})
 *   5) email.sent       → 'contacted' (nur wenn current ∈ {queued, new})
 *
 * Stoerken statt schwaecher — bestehende 'replied'/'converted' werden NIE
 * heruntergesetzt.
 */
export async function POST() {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { data: profile } = await userClient.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const sb = await createServiceClient();
  const counters = {
    leadsScanned: 0,
    setDoNotContact: 0,
    setEngaged: 0,
    setContacted: 0,
    unchanged: 0,
  };

  // 1) Alle Leads die jemals Outbound-Messages bekommen haben
  const { data: msgRows, error: msgErr } = await sb
    .from('outbound_messages')
    .select('lead_id, sent_at, clicked_at, replied_at, bounced_at, complained_at');
  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 });
  }

  // Pro lead_id den staerksten Engagement-Indikator aggregieren
  type Agg = {
    sent: boolean;
    clicked: boolean;
    replied: boolean;
    bounced: boolean;
    complained: boolean;
  };
  const byLead = new Map<string, Agg>();
  for (const m of msgRows ?? []) {
    if (!m.lead_id) continue;
    const cur = byLead.get(m.lead_id) ?? {
      sent: false, clicked: false, replied: false, bounced: false, complained: false,
    };
    if (m.sent_at) cur.sent = true;
    if (m.clicked_at) cur.clicked = true;
    if (m.replied_at) cur.replied = true;
    if (m.bounced_at) cur.bounced = true;
    if (m.complained_at) cur.complained = true;
    byLead.set(m.lead_id, cur);
  }

  if (byLead.size === 0) {
    return NextResponse.json({ ok: true, ...counters });
  }

  // 2) Aktuelle Lead-Stati holen
  const leadIds = Array.from(byLead.keys());
  const { data: leadRows, error: leadErr } = await sb
    .from('outbound_leads')
    .select('id, status')
    .in('id', leadIds);
  if (leadErr) {
    return NextResponse.json({ error: leadErr.message }, { status: 500 });
  }
  const leadStatusById = new Map<string, string>();
  for (const l of leadRows ?? []) {
    leadStatusById.set(l.id, l.status);
  }

  // 3) Pro Lead den Soll-Status berechnen + ggf. updaten
  // Wir batchen NICHT — pro Lead 1 Roundtrip ist sauberer und einfach zu debuggen
  for (const [leadId, agg] of byLead.entries()) {
    counters.leadsScanned++;
    const current = leadStatusById.get(leadId);
    if (!current) continue;

    // Welcher Status soll der Lead haben?
    let want: 'do_not_contact' | 'engaged' | 'contacted' | null = null;
    let onlyIf: string[] | null = null; // nur upgraden wenn current ∈ onlyIf
    if (agg.complained || agg.bounced) {
      want = 'do_not_contact';
      // Override alles ausser bereits-do_not_contact (idempotent)
      onlyIf = ['new', 'queued', 'contacted', 'engaged', 'bounced', 'replied'];
    } else if (agg.replied) {
      // 'replied' ist staerker als 'engaged' — wir touchen das NICHT von hier aus,
      // da wir aktuell eh nichts erkennen das replied setzt (Inbound-Webhook fehlt).
      // Falls aber doch eine Message replied_at hat, lassen wir den Lead so wie er ist.
      continue;
    } else if (agg.clicked) {
      want = 'engaged';
      onlyIf = ['new', 'queued', 'contacted'];
    } else if (agg.sent) {
      want = 'contacted';
      onlyIf = ['new', 'queued'];
    }

    if (!want || !onlyIf) {
      counters.unchanged++;
      continue;
    }
    if (!onlyIf.includes(current)) {
      counters.unchanged++;
      continue;
    }

    const { data: upd, error: updErr } = await sb
      .from('outbound_leads')
      .update({ status: want })
      .eq('id', leadId)
      .in('status', onlyIf)
      .select('id, status');
    if (updErr) {
      console.warn('[sync-lead-status] update failed:', updErr.message, 'lead_id=' + leadId);
      continue;
    }
    if (upd && upd.length > 0) {
      if (want === 'do_not_contact') counters.setDoNotContact++;
      else if (want === 'engaged') counters.setEngaged++;
      else if (want === 'contacted') counters.setContacted++;
    } else {
      counters.unchanged++;
    }
  }

  return NextResponse.json({ ok: true, ...counters });
}
