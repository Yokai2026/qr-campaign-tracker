/**
 * POST /api/mail/campaigns/[id]/resend-non-openers
 *
 * Body: { subject?: string, body_html?: string }
 *  - Wenn beide fehlen: Original-Campaign nochmal an alle ohne Open senden
 *  - Wenn body_html/subject geliefert: NEUE Campaign mit gleichen Recipients erstellen
 *
 * Erkennt Non-Openers als: human_open_count = 0
 * Erstellt eine neue Campaign (Status=sending) + sendet via gleicher Send-Logik.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateToken } from '@/lib/mail/tokens';
import { prepareTrackedHtml, htmlToPlainText } from '@/lib/mail/html-rewrite';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const RESEND_API = 'https://api.resend.com/emails';
const RESEND_THROTTLE_MS = 600;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY missing' }, { status: 500 });

  let body: { subject?: string; body_html?: string };
  try { body = await request.json(); } catch { body = {}; }

  const service = await createServiceClient();
  const { data: original } = await service
    .from('mail_campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!original) return NextResponse.json({ error: 'campaign not found' }, { status: 404 });

  // Non-Openers identifizieren (human_open_count = 0, status='sent', kein unsubscribe)
  const { data: nonOpeners } = await service
    .from('mail_recipients')
    .select('email, name')
    .eq('campaign_id', id)
    .eq('human_open_count', 0)
    .eq('status', 'sent')
    .neq('bounce_type', 'unsubscribed');
  if (!nonOpeners || nonOpeners.length === 0) {
    return NextResponse.json({ error: 'no non-openers to resend' }, { status: 400 });
  }

  // Neue Campaign anlegen (Follow-up)
  const newSubject = body.subject?.trim() ?? `Re: ${original.subject}`;
  const newBodyHtml = body.body_html?.trim() ?? original.body_html;

  const { data: newCampaign, error: newErr } = await service
    .from('mail_campaigns')
    .insert({
      user_id: user.id,
      subject: newSubject,
      body_html: newBodyHtml,
      from_email: original.from_email,
      from_name: original.from_name,
      reply_to: original.reply_to,
      status: 'sending',
      sent_at: new Date().toISOString(),
      recipient_count: nonOpeners.length,
    })
    .select('id')
    .single();
  if (newErr || !newCampaign) {
    return NextResponse.json({ error: newErr?.message ?? 'create failed' }, { status: 500 });
  }

  const newCampaignId = newCampaign.id;

  // Recipients in DB
  const recipientRows = nonOpeners.map((r) => ({
    campaign_id: newCampaignId,
    email: r.email,
    name: r.name,
    pixel_token: generateToken(),
    status: 'queued' as const,
  }));
  const { data: created } = await service
    .from('mail_recipients')
    .insert(recipientRows)
    .select('id, email, name, pixel_token');

  if (!created) return NextResponse.json({ error: 'recipient insert failed' }, { status: 500 });

  const allLinks = new Map<string, { campaign_id: string; original_url: string; click_token: string }>();
  let sent = 0;
  let failed = 0;

  for (const r of created) {
    try {
      const { html, links } = prepareTrackedHtml(newBodyHtml, r.pixel_token, {
        fromName: original.from_name ?? undefined,
      });
      for (const l of links) {
        if (!allLinks.has(l.original_url)) {
          allLinks.set(l.original_url, { campaign_id: newCampaignId, ...l });
        }
      }
      const greetName = r.name ?? r.email.split('@')[0];
      const personalizedHtml = html.replace(/\{\{name\}\}/g, greetName);
      const fromHeader = original.from_name ? `${original.from_name} <${original.from_email}>` : original.from_email;

      const res = await fetch(RESEND_API, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: fromHeader,
          to: r.email,
          subject: newSubject,
          html: personalizedHtml,
          text: htmlToPlainText(personalizedHtml).replace(/\{\{name\}\}/g, greetName),
          ...(original.reply_to ? { reply_to: original.reply_to } : {}),
          tracking: { click: { enabled: false }, open: { enabled: false } },
        }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}`);
      await service.from('mail_recipients').update({ sent_at: new Date().toISOString(), status: 'sent' }).eq('id', r.id);
      sent++;
    } catch {
      failed++;
      await service.from('mail_recipients').update({ status: 'failed' }).eq('id', r.id);
    }
    await sleep(RESEND_THROTTLE_MS);
  }

  if (allLinks.size > 0) {
    await service.from('mail_links').insert(Array.from(allLinks.values()));
  }

  await service.from('mail_campaigns').update({
    status: failed === created.length ? 'failed' : 'sent',
  }).eq('id', newCampaignId);

  return NextResponse.json({ new_campaign_id: newCampaignId, sent, failed, total: created.length });
}
