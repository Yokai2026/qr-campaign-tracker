import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateIdeasForCluster } from '@/lib/content/ideas';
import { CLUSTERS, type ContentCluster } from '@/lib/content/pillars';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// 300s ist max auf Vercel Pro. Auf Hobby wird's bei 60s gekappt — dann muss
// CONTENT_WEB_SEARCH_MAX_USES auf 1 oder 0 (=off) gesetzt werden.
export const maxDuration = 300;

/**
 * POST /api/admin/content/ideas/generate
 * Body: { cluster: ContentCluster, count?: number (default 15) }
 *
 * Generiert N Ideen fuer den Pillar via Claude und insertet sie in content_ideas
 * mit status='backlog'. Duplikate (gleicher Titel + Cluster) werden geskippt.
 */
export async function POST(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let body: { cluster?: string; count?: number };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid-json' }, { status: 400 }); }

  const cluster = body.cluster as ContentCluster;
  if (!CLUSTERS.includes(cluster)) {
    return NextResponse.json({ error: 'invalid cluster' }, { status: 400 });
  }
  const count = Math.max(5, Math.min(20, body.count ?? 15));

  let ideas;
  const generateStart = Date.now();
  try {
    ideas = await generateIdeasForCluster(cluster, count);
    console.log(`[ideas-generate] cluster=${cluster} count=${ideas.length} took=${Date.now() - generateStart}ms`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    const stack = e instanceof Error ? e.stack : '';
    console.error(`[ideas-generate FAIL] cluster=${cluster} took=${Date.now() - generateStart}ms err=${msg}`);
    if (stack) console.error(stack.slice(0, 1000));
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!ideas.length) return NextResponse.json({ generated: 0, ideas: [] });

  const service = await createServiceClient();

  // Existing titles per cluster -> skip dupes
  const { data: existing } = await service
    .from('content_ideas')
    .select('title')
    .eq('cluster', cluster);
  const existingSet = new Set((existing ?? []).map((r) => r.title.trim().toLowerCase()));

  const rows = ideas
    .filter((i) => !existingSet.has(i.title.trim().toLowerCase()))
    .map((i) => ({
      cluster,
      title: i.title.slice(0, 200),
      outline: i.outline ?? null,
      angle: i.angle ?? null,
      target_keywords: i.target_keywords ?? null,
      status: 'backlog' as const,
    }));

  if (rows.length === 0) {
    return NextResponse.json({ generated: 0, duplicates: ideas.length });
  }

  const { data: inserted, error } = await service
    .from('content_ideas')
    .insert(rows)
    .select('id, title');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    generated: inserted?.length ?? 0,
    duplicates: ideas.length - (inserted?.length ?? 0),
    ideas: inserted,
  });
}
