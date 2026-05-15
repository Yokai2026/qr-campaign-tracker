import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { generateIdeasForCluster } from '@/lib/content/ideas';
import { CLUSTERS, type ContentCluster } from '@/lib/content/pillars';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

const MIN_BACKLOG = 5;        // unter dieser Schwelle wird aufgefuellt
const REPLENISH_TO = 15;      // generierte Anzahl pro Pillar

/**
 * GET /api/cron/content-replenish
 *
 * Sonntags via n8n: pruefe jeden Pillar.
 * Wenn Backlog-Ideen < MIN_BACKLOG → generiere 15 neue.
 * So bleibt immer genug Pipeline da damit User nur "Blog schreiben" klicken muss.
 *
 * Authentication: Bearer CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = await createServiceClient();
  const results: Record<string, { existing: number; generated: number; error?: string }> = {};

  for (const cluster of CLUSTERS) {
    try {
      // Count existing backlog
      const { count } = await sb
        .from('content_ideas')
        .select('id', { count: 'exact', head: true })
        .eq('cluster', cluster)
        .eq('status', 'backlog');

      const existing = count ?? 0;
      if (existing >= MIN_BACKLOG) {
        results[cluster] = { existing, generated: 0 };
        continue;
      }

      const ideas = await generateIdeasForCluster(cluster as ContentCluster, REPLENISH_TO);

      // Dedup existing titles
      const { data: existingRows } = await sb
        .from('content_ideas')
        .select('title')
        .eq('cluster', cluster);
      const seen = new Set((existingRows ?? []).map((r) => r.title.trim().toLowerCase()));

      const rows = ideas
        .filter((i) => !seen.has(i.title.trim().toLowerCase()))
        .map((i) => ({
          cluster,
          title: i.title.slice(0, 200),
          outline: i.outline ?? null,
          angle: i.angle ?? null,
          target_keywords: i.target_keywords ?? null,
          status: 'backlog' as const,
        }));

      if (rows.length > 0) {
        const { error } = await sb.from('content_ideas').insert(rows);
        if (error) {
          results[cluster] = { existing, generated: 0, error: error.message };
        } else {
          results[cluster] = { existing, generated: rows.length };
        }
      } else {
        results[cluster] = { existing, generated: 0, error: 'all duplicates' };
      }
    } catch (e) {
      results[cluster] = {
        existing: 0,
        generated: 0,
        error: e instanceof Error ? e.message : 'unknown',
      };
    }
  }

  return NextResponse.json({
    triggeredAt: new Date().toISOString(),
    results,
  });
}
