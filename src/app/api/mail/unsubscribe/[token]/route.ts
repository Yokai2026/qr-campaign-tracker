/**
 * GET /api/mail/unsubscribe/[token]
 *
 * Recipient-spezifischer Unsubscribe-Link. Setzt status='unsubscribed' und
 * zeigt eine Bestätigungs-Seite (HTML).
 *
 * Future: dedicated unsubscribes-Tabelle pro user_id (cross-campaign).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function confirmationPage(message: string, success: boolean): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"><title>Abmeldung</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 80px auto; padding: 24px; background: #0a0a0a; color: #e5e5e5; line-height: 1.6; }
  .box { background: #111111; border: 1px solid #1f1f1f; border-radius: 12px; padding: 32px; text-align: center; }
  h1 { margin: 0 0 12px; font-size: 22px; color: ${success ? '#10b981' : '#ef4444'}; }
  p { margin: 0; color: #a3a3a3; font-size: 14px; }
  a { color: #22d3ee; text-decoration: none; }
</style></head>
<body><div class="box">
  <h1>${success ? '✓ Abgemeldet' : '✗ Abmeldung fehlgeschlagen'}</h1>
  <p>${message}</p>
  <p style="margin-top:16px"><a href="https://spurig.com">Zurück zu Spurig</a></p>
</div></body></html>`;

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!token || token.length < 10) {
    return confirmationPage('Ungültiger Abmelde-Link.', false);
  }

  const sb = await createServiceClient();
  const { data: recipient } = await sb
    .from('mail_recipients')
    .select('id, email, status')
    .eq('pixel_token', token)
    .maybeSingle();

  if (!recipient) {
    return confirmationPage('Wir konnten deine Adresse nicht finden — eventuell ist der Link bereits abgelaufen.', false);
  }

  // Mark as unsubscribed (custom status — DB-CHECK constraint erlaubt das aktuell nicht;
  // wir markieren via bounce_type='unsubscribed' damit's ohne Migration funktioniert)
  await sb.from('mail_recipients')
    .update({ bounce_type: 'unsubscribed' })
    .eq('id', recipient.id);

  return confirmationPage(`${recipient.email} wurde abgemeldet. Du bekommst keine weiteren Mails mehr von uns.`, true);
}
