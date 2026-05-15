import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const VALID_MAGNETS = ['dsgvo-checkliste-2026'];

/**
 * POST /api/lead-magnet/subscribe
 * Body: { email: string, magnet?: string }
 *
 * Speichert Email + UTM-Attribution (aus Cookie) + sendet PDF-Link per Mail.
 * Idempotent: existing email + magnet -> 200 (kein doppelter Eintrag).
 */
export async function POST(request: NextRequest) {
  let body: { email?: string; magnet?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid-json' }, { status: 400 }); }

  const email = body.email?.trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid-email' }, { status: 400 });
  }
  const magnet = body.magnet ?? 'dsgvo-checkliste-2026';
  if (!VALID_MAGNETS.includes(magnet)) {
    return NextResponse.json({ error: 'unknown-magnet' }, { status: 400 });
  }

  // UTM aus Cookie auslesen
  const utmCookie = request.cookies.get('spurig_utm')?.value;
  let utm: Record<string, string | null> = { source: null, medium: null, campaign: null, content: null, referrer: null };
  if (utmCookie) {
    try {
      const parsed = JSON.parse(utmCookie);
      utm = {
        source: parsed.source ?? null,
        medium: parsed.medium ?? null,
        campaign: parsed.campaign ?? null,
        content: parsed.content ?? null,
        referrer: parsed.referrer ?? null,
      };
    } catch { /* ignore */ }
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  const ipHash = ip ? crypto.createHash('sha256').update(ip + (process.env.IP_HASH_SALT ?? 'spurig')).digest('hex').slice(0, 32) : null;
  const ua = request.headers.get('user-agent')?.slice(0, 300) ?? null;

  const service = await createServiceClient();
  const { error } = await service.from('lead_magnet_subscribers').upsert(
    {
      email,
      magnet_slug: magnet,
      utm_source: utm.source,
      utm_medium: utm.medium,
      utm_campaign: utm.campaign,
      utm_content: utm.content,
      referrer: utm.referrer,
      ip_hash: ipHash,
      user_agent: ua,
    },
    { onConflict: 'email,magnet_slug', ignoreDuplicates: false },
  );
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // PDF-Link senden via Resend (best-effort, blockt nicht)
  void sendLeadMagnetEmail(email, magnet);

  return NextResponse.json({ ok: true });
}

async function sendLeadMagnetEmail(email: string, magnet: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const downloadUrl = `https://spurig.com/lead-magnet/${magnet}/download`;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.OUTBOUND_FROM_EMAIL ?? 'David da Silva Gornik <david@hello.spurig.com>',
        to: [email],
        reply_to: 'david@spurig.com',
        subject: 'Dein Spurig-Download: DSGVO-Checkliste Marketing-Tracking 2026',
        html: buildLeadMagnetHtml(downloadUrl),
        tags: [{ name: 'type', value: 'lead_magnet' }],
        tracking: { opens: true, clicks: true },
      }),
    });
  } catch {
    // best-effort
  }
}

function buildLeadMagnetHtml(downloadUrl: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e5e5">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="text-align:left;padding:0 8px 24px">
      <span style="font-size:18px;font-weight:700;color:#fafafa">Spurig</span>
    </div>
    <div style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;padding:28px">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;color:#fafafa">Hier ist deine Checkliste.</h1>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
        Danke fuers Eintragen. Die DSGVO-Checkliste fuer Marketing-Tracking 2026 wartet auf dich.
      </p>
      <a href="${downloadUrl}" style="display:inline-block;padding:12px 22px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
        Checkliste herunterladen &rarr;
      </a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#737373">
        Falls dir die Checkliste hilft: Spurig setzt all das technisch um — EU-Hosting, kein US-Cloud, kein Cookie-Banner. <a href="https://spurig.com/?utm_source=lead_magnet&utm_medium=email&utm_campaign=dsgvo-checkliste-2026" style="color:#22d3ee">Spurig anschauen</a>.
      </p>
    </div>
  </div>
</body>
</html>`;
}
