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
  // Cap auf 10 — bei 15 dauert die Generation ~65s und reisst das Vercel-Hobby
  // 60s-Limit. Mit 10 ist die Generation bei ~35-45s sicher unter Limit.
  // Auf Pro kann ueber CONTENT_IDEAS_MAX_COUNT auf bis zu 20 hochgezogen werden.
  const hardCap = Number(process.env.CONTENT_IDEAS_MAX_COUNT ?? '10');
  const count = Math.max(5, Math.min(hardCap, body.count ?? 10));

  // Existing titles per cluster — JETZT VORHER fetchen damit wir sie an den
  // Generator weitergeben koennen (so dass Claude EXPLICIT vermeidet sie zu
  // wiederholen statt nur nachher zu deduppen)
  const service = await createServiceClient();
  const { data: existing } = await service
    .from('content_ideas')
    .select('title')
    .eq('cluster', cluster)
    .order('created_at', { ascending: false })
    .limit(50);
  const existingTitles = (existing ?? []).map((r) => r.title);
  const existingSet = new Set(existingTitles.map((t) => t.trim().toLowerCase()));

  let ideas;
  const generateStart = Date.now();
  try {
    ideas = await generateIdeasForCluster(cluster, count, existingTitles);
    console.log(`[ideas-generate] cluster=${cluster} count=${ideas.length} existing=${existingTitles.length} took=${Date.now() - generateStart}ms`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    const stack = e instanceof Error ? e.stack : '';
    console.error(`[ideas-generate FAIL] cluster=${cluster} took=${Date.now() - generateStart}ms err=${msg}`);
    if (stack) console.error(stack.slice(0, 1000));
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  if (!ideas.length) return NextResponse.json({ generated: 0, ideas: [] });

  // Soft-Dup-Filter: 4-Wort-Overlap mit existierendem Titel = Wiederholung.
  // Faengt Faelle wie "Postkarten/Anrufe/Niemand/misst" vs "Postkarten/Anrufe/
  // Niemand/weiss" trotz unterschiedlicher Wort-Kombo.
  const stopWords = new Set(['ist', 'das', 'die', 'der', 'und', 'oder', 'mit', 'für', 'von', 'auf',
    'nach', 'bei', 'vom', 'zum', 'zur', 'sich', 'sind', 'wie', 'was', 'wer', 'wir', 'ich', 'dein',
    'mein', 'sein', 'eine', 'einen', 'einem', 'eines', 'aus', 'nicht', 'noch', 'doch', 'immer', 'auch',
    'wenn', 'weil', 'dann', 'aber', 'sehr', 'hier', 'mehr', 'kein', 'keine']);
  const tokenize = (s: string) => new Set(
    s.toLowerCase().split(/[^a-zäöüß0-9]+/).filter((w) => w.length >= 4 && !stopWords.has(w)),
  );
  const existingTokenSets = existingTitles.map(tokenize);
  const SOFT_DUP_OVERLAP = 4; // 4 oder mehr gemeinsame Schlagwoerter = Duplikat

  let softDupCount = 0;
  const rows = ideas
    .filter((i) => {
      const newTitleLower = i.title.trim().toLowerCase();
      if (existingSet.has(newTitleLower)) return false;
      const newTokens = tokenize(i.title);
      for (const ex of existingTokenSets) {
        let overlap = 0;
        for (const t of newTokens) if (ex.has(t)) overlap++;
        if (overlap >= SOFT_DUP_OVERLAP) {
          softDupCount++;
          return false;
        }
      }
      return true;
    })
    .map((i) => ({
      cluster,
      title: i.title.slice(0, 200),
      outline: i.outline ?? null,
      angle: i.angle ?? null,
      target_keywords: i.target_keywords ?? null,
      status: 'backlog' as const,
    }));
  console.log(`[ideas-generate dedupe] hard-dups=${ideas.length - rows.length - softDupCount} soft-dups=${softDupCount} kept=${rows.length}`);

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
