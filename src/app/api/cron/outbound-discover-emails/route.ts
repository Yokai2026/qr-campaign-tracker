import { NextRequest, NextResponse } from 'next/server';
import { discoverEmailsForLeadBatch } from '@/lib/outbound/discover-emails-for-leads';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300;

/**
 * Daily 07:00 UTC: crawlt Websites von neu gescrapten Leads ohne Email-Status,
 * extrahiert die beste E-Mail (personal > role > generic), speichert in DB.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Batch-Size auf 8 limitiert weil Vercel-Hobby Functions
    // nach 60s gekillt werden — 8 Leads × ~6s = ~48s, passt sauber.
    // Pipeline laeuft sowieso taeglich, ueber 5 Tage werden 40 Leads pro
    // Cluster bearbeitet — bei aktuell ~150 pending reicht das fuer 4 Wochen.
    const result = await discoverEmailsForLeadBatch({ limit: 8 });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
