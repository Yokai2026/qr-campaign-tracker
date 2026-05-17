/**
 * POST /api/mail/campaigns/[id]/send
 *
 * Body: { recipients: Array<{email: string, name?: string}>, testOnly?: boolean }
 *
 * Sendet die Campaign an alle Recipients via Resend.
 *   1. Recipients in DB anlegen (mit unique pixel_token)
 *   2. Body-HTML pro Recipient rewriten (Links + Pixel)
 *   3. Links in DB anlegen (mit click_token)
 *   4. Mail via Resend versenden
 *   5. Status updaten
 *
 * MVP-Limit: max 100 Recipients pro Send.
 * testOnly=true → sendet nur an den ersten Recipient (für Vorschau).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateToken } from '@/lib/mail/tokens';
import { prepareTrackedHtml, htmlToPlainText } from '@/lib/mail/html-rewrite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const MAX_RECIPIENTS = 100;
const RESEND_API = 'https://api.resend.com/emails';
const RESEND_THROTTLE_MS = 600; // ~1.6 mails/sec, unter Resend's 2/sec limit

type RecipientInput = { email: string; name?: string };

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });

  let body: { recipients?: RecipientInput[]; testOnly?: boolean };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid-json' }, { status: 400 }); }

  const recipientsRaw = (body.recipients ?? [])
    .filter((r) => r && typeof r.email === 'string' && isValidEmail(r.email))
    .map((r) => ({ email: r.email.trim().toLowerCase(), name: r.name?.trim() }));

  if (recipientsRaw.length === 0) {
    return NextResponse.json({ error: 'no valid recipients' }, { status: 400 });
  }

  let recipients = recipientsRaw;
  if (body.testOnly) recipients = recipients.slice(0, 1);
  if (recipients.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: `max ${MAX_RECIPIENTS} recipients per send` }, { status: 400 });
  }

  const service = await createServiceClient();

  // Campaign laden + auth-check
  const { data: campaign } = await service
    .from('mail_campaigns')
    .select('id, user_id, subject, body_html, from_email, from_name, reply_to, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!campaign) return NextResponse.json({ error: 'campaign not found' }, { status: 404 });

  if (campaign.status === 'sending') {
    return NextResponse.json({ error: 'campaign already sending' }, { status: 400 });
  }

  // Status → sending
  await service.from('mail_campaigns').update({
    status: 'sending',
    sent_at: new Date().toISOString(),
    recipient_count: recipients.length,
  }).eq('id', id);

  // 1) Recipients in DB anlegen
  const recipientRows = recipients.map((r) => ({
    campaign_id: id,
    email: r.email,
    name: r.name ?? null,
    pixel_token: generateToken(),
    status: 'queued' as const,
  }));
  const { data: createdRecipients, error: rErr } = await service
    .from('mail_recipients')
    .insert(recipientRows)
    .select('id, email, name, pixel_token');
  if (rErr || !createdRecipients) {
    await service.from('mail_campaigns').update({ status: 'failed' }).eq('id', id);
    return NextResponse.json({ error: rErr?.message ?? 'recipient insert failed' }, { status: 500 });
  }

  // 2) Pro Recipient: HTML rewriten + Mail senden
  const allLinks = new Map<string, { campaign_id: string; original_url: string; click_token: string }>();
  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; error: string }> = [];

  for (const r of createdRecipients) {
    try {
      // HTML rewrite (mit Footer + Unsubscribe-Link)
      const { html: trackedHtml, links } = prepareTrackedHtml(campaign.body_html, r.pixel_token, {
        fromName: campaign.from_name ?? undefined,
        includeFooter: true,
      });

      // Link-Tokens sammeln (pro Campaign unique deduplizieren auf original_url)
      for (const l of links) {
        if (!allLinks.has(l.original_url)) {
          allLinks.set(l.original_url, {
            campaign_id: id,
            original_url: l.original_url,
            click_token: l.click_token,
          });
        }
      }

      const plainText = htmlToPlainText(trackedHtml);
      const fromHeader = campaign.from_name
        ? `${campaign.from_name} <${campaign.from_email}>`
        : campaign.from_email;

      // Personalisierung: {{name}} → r.name (oder Email-Prefix wenn kein name)
      const greetName = r.name ?? r.email.split('@')[0];
      const personalizedHtml = trackedHtml.replace(/\{\{name\}\}/g, greetName);
      const personalizedText = plainText.replace(/\{\{name\}\}/g, greetName);

      const resendBody = {
        from: fromHeader,
        to: r.email,
        subject: campaign.subject,
        html: personalizedHtml,
        text: personalizedText,
        ...(campaign.reply_to ? { reply_to: campaign.reply_to } : {}),
        // Resend's eigenes Tracking DEAKTIVIEREN — wir tracken selbst
        tracking: { click: { enabled: false }, open: { enabled: false } },
      };

      const res = await fetch(RESEND_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resendBody),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Resend ${res.status}: ${errText.slice(0, 200)}`);
      }

      // Resend gibt { id: "..." } zurück — speichern für Webhook-Lookup
      const sendResult = await res.json().catch(() => ({}));
      const resendMessageId = (sendResult as { id?: string })?.id ?? null;

      await service.from('mail_recipients').update({
        sent_at: new Date().toISOString(),
        status: 'sent',
        resend_message_id: resendMessageId,
      }).eq('id', r.id);
      sent++;
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : 'unknown';
      errors.push({ email: r.email, error: msg.slice(0, 200) });
      await service.from('mail_recipients').update({
        status: 'failed',
      }).eq('id', r.id);
    }
    // Throttle zwischen Mails
    await sleep(RESEND_THROTTLE_MS);
  }

  // 3) Links in DB anlegen (deduped pro Campaign)
  if (allLinks.size > 0) {
    const linkRows = Array.from(allLinks.values());
    await service.from('mail_links').insert(linkRows);
  }

  // 4) Final status
  await service.from('mail_campaigns').update({
    status: failed === recipients.length ? 'failed' : 'sent',
  }).eq('id', id);

  return NextResponse.json({
    sent,
    failed,
    total: recipients.length,
    errors,
  });
}
