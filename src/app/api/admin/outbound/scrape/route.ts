import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { scrapeAllSegments, scrapeSegment } from '@/lib/outbound/scrape';
import { SEGMENT_CONFIGS } from '@/lib/outbound/segments';
import type { OutboundSegment } from '@/lib/outbound/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

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
 * POST /api/admin/outbound/scrape
 * Body: { segment?: OutboundSegment, queriesPerRun?: number, maxPerQuery?: number }
 * Wenn segment fehlt, werden alle 4 Segmente nacheinander gescrapt.
 */
export async function POST(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const segment = body.segment as OutboundSegment | undefined;
  const queriesPerRun = typeof body.queriesPerRun === 'number' ? body.queriesPerRun : 3;
  const maxPerQuery = typeof body.maxPerQuery === 'number' ? body.maxPerQuery : 20;

  if (segment && !SEGMENT_CONFIGS[segment]) {
    return NextResponse.json({ error: `Unknown segment: ${segment}` }, { status: 400 });
  }

  try {
    const results = segment
      ? [await scrapeSegment(segment, { queriesPerRun, maxPerQuery })]
      : await scrapeAllSegments({ queriesPerRun, maxPerQuery });

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
