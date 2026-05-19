/**
 * Resend-basierter Cold-Mail-Sender mit Throttle + Tracking-Persist.
 *
 * Tagesbudget: 30 Mails/Tag (anpassbar). Throttle: 60 Sek zwischen Sends.
 *
 * Tracking-Pipeline:
 * - Pro Lead wird VOR dem Send eine outbound_messages-Row mit selbst-erzeugter
 *   UUID + status='pending' angelegt. Die UUID wird im Mail-HTML in den
 *   Open-Pixel und Click-Tracker-Links eingebettet (siehe templates.ts).
 * - Resends eingebautes Open/Click-Tracking ist DEAKTIVIERT — Gmail blockt es
 *   ohnehin oft und wir wollen die Datenhoheit. Nur delivery/bounce/complaint
 *   kommt weiter via Resend-Webhook in /api/webhooks/resend.
 * - Nach Resend-Send: UPDATE der Row mit resend_message_id + sent_at + status='sent'.
 *   Fehlt der Send: UPDATE auf status='failed' mit error.
 */

import { randomUUID } from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';
import { buildMailForLead } from './templates';
import type { OutboundLead, OutboundSegment } from './types';

const RESEND_API = 'https://api.resend.com/emails';
const SENDER_FROM = process.env.OUTBOUND_FROM_EMAIL || 'David <david@spurig.com>';
const REPLY_TO = process.env.OUTBOUND_REPLY_TO || 'david@spurig.com';
const UNSUBSCRIBE_BASE = 'https://spurig.com/unsubscribe';
// BCC-Adresse — bekommt von jeder Outbound-Mail eine stille Kopie zur
// Bestaetigung dass tatsaechlich versendet wurde. Empfaenger sieht die BCC nicht.
const BCC_TO = process.env.OUTBOUND_BCC_EMAIL || null;

export type SendBatchOptions = {
  dailyLimit?: number;
  throttleMs?: number;
  segment?: OutboundSegment;
  dryRun?: boolean;
};

export type SendBatchResult = {
  attempted: number;
  sent: number;
  failed: number;
  skipped: number;
  errors: Array<{ leadId: string; error: string }>;
  sentEmails: Array<{ email: string; subject: string; lead: string }>;
  /** Dedupe-Telemetrie — wie viele Leads wurden durch den Anti-Spam-Filter
   *  auf do_not_contact gesetzt, damit der gleiche Empfaenger nicht 2x
   *  angeschrieben wird. */
  dedupedAlreadyContacted: number;
  dedupedBatchDuplicate: number;
};

export async function sendOutboundBatch(
  options: SendBatchOptions = {},
): Promise<SendBatchResult> {
  const dailyLimit = options.dailyLimit ?? 30;
  const throttleMs = options.throttleMs ?? 60_000;
  const dryRun = options.dryRun ?? false;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey && !dryRun) {
    throw new Error('RESEND_API_KEY is not set');
  }

  const sb = await createServiceClient();

  // Wie viele wurden heute schon versendet?
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const { count: sentToday } = await sb
    .from('outbound_messages')
    .select('id', { count: 'exact', head: true })
    .gte('sent_at', todayStart.toISOString());

  const remaining = Math.max(0, dailyLimit - (sentToday ?? 0));
  if (remaining === 0) {
    return {
      attempted: 0,
      sent: 0,
      failed: 0,
      skipped: 0,
      dedupedAlreadyContacted: 0,
      dedupedBatchDuplicate: 0,
      errors: [],
      sentEmails: [],
    };
  }

  // Kandidaten holen: Leads mit Email, status=new, nicht im don_not_contact.
  // Mehr als 'remaining' fetchen — wir filtern gleich Duplikate weg und brauchen
  // einen Puffer, sonst bleibt das Tagesbudget durch Dedupe-Drops unausgeschoepft.
  let q = sb
    .from('outbound_leads')
    .select('*')
    .eq('email_status', 'discovered')
    .eq('status', 'new')
    .not('email', 'is', null)
    .order('rating_count', { ascending: false, nullsFirst: false })  // bevorzuge Unternehmen mit mehr Reviews (= aktiv)
    .limit(remaining * 4);

  if (options.segment) q = q.eq('segment', options.segment);

  const { data: rawCandidates, error } = await q;
  if (error) throw new Error('Fetch candidates failed: ' + error.message);

  // ANTI-SPAM-DEDUPE — verhindert dass die selbe Email-Adresse mehrfach
  // kontaktiert wird. Quellen fuer Duplikate:
  //  (a) Franchise-Standorte teilen eine zentrale Kontaktadresse
  //      (z.B. mehrere PRIME-TIME-Gyms → join@primetime-fitness.de)
  //  (b) Scrape-Duplikate (gleicher Betrieb 2x in outbound_leads)
  //
  // Zweistufiger Filter:
  //  1. Global: jede Email die schon EINMAL in outbound_messages auftaucht
  //     (egal welcher Lead) wird komplett uebersprungen + Lead -> do_not_contact.
  //  2. Innerhalb Batch: pro Email-Adresse nur den staerksten Lead behalten
  //     (sortiert nach rating_count desc), Rest -> do_not_contact.
  const candidatePool = (rawCandidates ?? []) as OutboundLead[];
  const candidateEmails = Array.from(
    new Set(
      candidatePool
        .map((c) => c.email?.trim().toLowerCase())
        .filter((e): e is string => Boolean(e)),
    ),
  );

  // (1) Welche dieser Emails wurden je angeschrieben? Join ueber lead_id auf
  //     outbound_messages — wir wollen status IN (pending, sent, ...) zaehlen,
  //     'failed' ist OK weil dort nichts wirklich rausging.
  const alreadyContactedEmails = new Set<string>();
  if (candidateEmails.length > 0) {
    const { data: contactedRows } = await sb
      .from('outbound_messages')
      .select('lead_id, outbound_leads!inner(email)')
      .neq('status', 'failed');
    for (const row of (contactedRows ?? []) as Array<{
      outbound_leads: { email: string | null } | { email: string | null }[] | null;
    }>) {
      const rel = row.outbound_leads;
      const email = Array.isArray(rel) ? rel[0]?.email : rel?.email;
      if (email) alreadyContactedEmails.add(email.trim().toLowerCase());
    }
  }

  // (2) Pro Email den ersten Lead behalten (Pool ist nach rating_count desc
  //     sortiert → das ist automatisch der "staerkste"). Den Rest markieren wir
  //     gleich als do_not_contact, damit sie nicht in kuenftigen Batches wieder
  //     auftauchen.
  const seenEmails = new Set<string>();
  const candidates: OutboundLead[] = [];
  const skippedAlreadyContacted: string[] = [];  // lead.ids
  const skippedBatchDuplicate: string[] = [];   // lead.ids

  for (const lead of candidatePool) {
    const email = lead.email?.trim().toLowerCase();
    if (!email) continue;

    if (alreadyContactedEmails.has(email)) {
      skippedAlreadyContacted.push(lead.id);
      continue;
    }
    if (seenEmails.has(email)) {
      skippedBatchDuplicate.push(lead.id);
      continue;
    }
    seenEmails.add(email);
    candidates.push(lead);
    if (candidates.length >= remaining) break;
  }

  // Duplikate als do_not_contact markieren — best-effort, blockiert den Send-
  // Pfad nicht wenn das Update fehlschlaegt. Reason wird in notes festgehalten
  // damit die Provenance nicht verloren geht.
  if (!dryRun && skippedAlreadyContacted.length > 0) {
    await sb
      .from('outbound_leads')
      .update({
        status: 'do_not_contact',
        notes: 'auto: email bereits kontaktiert (anderer Lead-Datensatz)',
      })
      .in('id', skippedAlreadyContacted);
  }
  if (!dryRun && skippedBatchDuplicate.length > 0) {
    await sb
      .from('outbound_leads')
      .update({
        status: 'do_not_contact',
        notes: 'auto: dupliziert (gleiche Email wie staerkerer Lead im Batch)',
      })
      .in('id', skippedBatchDuplicate);
  }

  const result: SendBatchResult = {
    attempted: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    sentEmails: [],
    dedupedAlreadyContacted: skippedAlreadyContacted.length,
    dedupedBatchDuplicate: skippedBatchDuplicate.length,
  };

  for (let i = 0; i < (candidates?.length ?? 0); i++) {
    const lead = candidates![i] as OutboundLead;
    result.attempted++;

    // Eigene Message-UUID — wird sowohl als outbound_messages.id verwendet
    // als auch in die Tracking-URLs der Mail eingebaut. Muss VOR dem Build
    // existieren, damit Pixel + Click-Wraps auf die richtige Row zeigen.
    const messageId = randomUUID();

    const unsubscribeUrl = `${UNSUBSCRIBE_BASE}?l=${lead.id}`;
    const mail = buildMailForLead(lead, unsubscribeUrl, messageId);
    if (!mail) {
      result.skipped++;
      continue;
    }

    if (dryRun) {
      result.sent++;
      result.sentEmails.push({ email: lead.email!, subject: mail.subject, lead: lead.name });
      continue;
    }

    // Row VOR dem Resend-Send persistieren — sonst koennten unsere eigenen
    // Tracking-Endpoints (/api/track/outbound/{id}/{open,click}) keinen Match
    // finden, falls der Empfaenger blitzschnell klickt.
    const { error: insertErr } = await sb.from('outbound_messages').insert({
      id: messageId,
      lead_id: lead.id,
      template_key: mail.templateKey,
      subject: mail.subject,
      body_html: mail.bodyHtml,
      body_text: mail.bodyText,
      personalization_hook: mail.personalizationHook,
      status: 'pending',
    });
    if (insertErr) {
      result.failed++;
      result.errors.push({ leadId: lead.id, error: 'insert pending failed: ' + insertErr.message });
      continue;
    }

    try {
      const res = await fetch(RESEND_API, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: SENDER_FROM,
          to: [lead.email],
          ...(BCC_TO ? { bcc: [BCC_TO] } : {}),
          reply_to: REPLY_TO,
          subject: mail.subject,
          html: mail.bodyHtml,
          text: mail.bodyText,
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl}>, <mailto:${REPLY_TO}?subject=unsubscribe>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
          tags: [
            { name: 'type', value: 'outbound_cold' },
            { name: 'segment', value: lead.segment },
            { name: 'template', value: mail.templateKey },
          ],
          // Resend-Tracking ABGESCHALTET — unser eigener Pixel + Click-Wrap
          // (siehe templates.ts) ist Gmail-unabhaengig und liefert Daten
          // direkt in outbound_messages ueber /api/track/outbound/[id]/...
          // Resend liefert weiterhin delivered/bounced/complained via Webhook.
          tracking: {
            opens: false,
            clicks: false,
          },
        }),
      });

      if (!res.ok) {
        const errBody = await res.text();
        result.failed++;
        result.errors.push({ leadId: lead.id, error: `${res.status}: ${errBody.slice(0, 200)}` });
        // Pending-Row auf 'failed' markieren — sonst bleibt sie ewig pending
        await sb
          .from('outbound_messages')
          .update({ status: 'failed', error: `${res.status}: ${errBody.slice(0, 200)}` })
          .eq('id', messageId);
        continue;
      }

      const sendData = await res.json();
      const resendMessageId = sendData.id as string;

      // Pending-Row mit Resend-ID + sent_at finalisieren
      await sb
        .from('outbound_messages')
        .update({
          resend_message_id: resendMessageId,
          sent_at: new Date().toISOString(),
          status: 'sent',
        })
        .eq('id', messageId);

      // Lead-State updaten
      await sb
        .from('outbound_leads')
        .update({
          status: 'contacted',
          contacted_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      result.sent++;
      result.sentEmails.push({ email: lead.email!, subject: mail.subject, lead: lead.name });

      // Throttle zwischen den Sends
      if (i < candidates!.length - 1 && throttleMs > 0) {
        await new Promise((r) => setTimeout(r, throttleMs));
      }
    } catch (e) {
      result.failed++;
      const errMsg = e instanceof Error ? e.message : 'unknown';
      result.errors.push({ leadId: lead.id, error: errMsg });
      // Pending-Row auf 'failed' setzen — best-effort
      await sb
        .from('outbound_messages')
        .update({ status: 'failed', error: errMsg })
        .eq('id', messageId);
    }
  }

  return result;
}
