import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSegments } from '@/lib/outbound/scrape';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Daily 06:00 UTC: scraped 4 ICP-Segmente × 3 Queries/Segment = max 240 Leads/Tag
 * via deterministischer Rotation über DACH-Städte + Branche-Queries.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const results = await scrapeAllSegments({ queriesPerRun: 3, maxPerQuery: 20 });
    const totals = results.reduce(
      (acc, r) => ({
        found: acc.found + r.found,
        inserted: acc.inserted + r.inserted,
        duplicates: acc.duplicates + r.duplicates,
        errors: acc.errors + r.errors.length,
      }),
      { found: 0, inserted: 0, duplicates: 0, errors: 0 },
    );

    return NextResponse.json({ ok: true, totals, results });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'unknown' },
      { status: 500 },
    );
  }
}
