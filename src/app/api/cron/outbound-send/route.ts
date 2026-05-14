import { NextRequest, NextResponse } from 'next/server';
import { sendOutboundBatch } from '@/lib/outbound/sender';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

const OUTBOUND_ENABLED = process.env.OUTBOUND_SEND_ENABLED === 'true';
const DAILY_LIMIT = parseInt(process.env.OUTBOUND_DAILY_LIMIT ?? '30', 10);
const THROTTLE_MS = parseInt(process.env.OUTBOUND_THROTTLE_MS ?? '60000', 10);

/**
 * Daily 09:30 UTC (Mon-Fri): versendet bis zu 30 personalisierte Cold-Mails
 * über Resend. Throttle: 60 Sek zwischen Sends.
 *
 * Safety-Gate: nur wenn OUTBOUND_SEND_ENABLED=true gesetzt.
 * Wenn nicht, läuft der Cron als Dry-Run (zählt nicht aufs Tagesbudget,
 * sendet nichts, schreibt nichts in DB).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Skip Wochenenden (UTC Tag 0 = Sonntag, 6 = Samstag)
  const dow = new Date().getUTCDay();
  if (dow === 0 || dow === 6) {
    return NextResponse.json({ ok: true, skipped: true, reason: 'weekend' });
  }

  try {
    const result = await sendOutboundBatch({
      dailyLimit: DAILY_LIMIT,
      throttleMs: THROTTLE_MS,
      dryRun: !OUTBOUND_ENABLED,
    });
    return NextResponse.json({
      ok: true,
      dryRun: !OUTBOUND_ENABLED,
      ...result,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
