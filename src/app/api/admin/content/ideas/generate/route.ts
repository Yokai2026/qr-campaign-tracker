import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import {
  generateIdeasForCluster,
  validateIdeasQuality,
  filterByQuality,
  type GeneratedIdea,
  type HookPattern,
  type IdeaQualityScore,
} from '@/lib/content/ideas';
import { CLUSTERS, type ContentCluster } from '@/lib/content/pillars';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// 300s ist max auf Vercel Pro. Hard-cap unsere Loop-Zeit auf 270s damit der
// Final-Insert noch Zeit hat.
export const maxDuration = 300;

const LOOP_BUDGET_MS = 270_000;
const MAX_TOP_UP_ROUNDS = 3;

// Pflicht-Quoten pro Batch (in % von count, gerundet)
const QUOTA_MONEY_REGRET = 0.20;
const QUOTA_DISCOVERY = 0.20;
const QUOTA_AHA_MOMENT = 0.10;

const BANNED_TROPES: RegExp[] = [
  /\b47\s*(plak|standort|euro|mitarbeiter|prozent)/i,
  /\b500\s*postkarten/i,
  /\b180\s*flyer/i,
  /\b(8|11|19)\s*(wochen|tage|monate).*falsch/i,
  /\bvier anrufe\b/i,
  /stripe.?dashboard.*\b(47|312)\b/i,
  /bruder.{0,20}(steuerberater|versteht|fragt)/i,
  /(bitly|bittly).{0,40}(virginia|ashburn)/i,
  /sechs jahre.*atlantik/i,
  /\b67\s*plakat/i,
  /\b89(\.\d{3}|\.000)?\s*€\s*(jahr|pro jahr)?.*bitly/i,
];

const STOP_WORDS = new Set([
  'ist', 'das', 'die', 'der', 'und', 'oder', 'mit', 'für', 'von', 'auf',
  'nach', 'bei', 'vom', 'zum', 'zur', 'sich', 'sind', 'wie', 'was', 'wer', 'wir', 'ich', 'dein',
  'mein', 'sein', 'eine', 'einen', 'einem', 'eines', 'aus', 'nicht', 'noch', 'doch', 'immer', 'auch',
  'wenn', 'weil', 'dann', 'aber', 'sehr', 'hier', 'mehr', 'kein', 'keine',
]);

const SOFT_DUP_OVERLAP = 3;

const tokenize = (s: string): Set<string> =>
  new Set(s.toLowerCase().split(/[^a-zäöüß0-9]+/).filter((w) => w.length >= 4 && !STOP_WORDS.has(w)));

type FilterStats = {
  hardDup: number;
  softDup: number;
  bannedTrope: number;
  professionDup: number;
};

/**
 * Filtert eine frisch-generierte Idee-Liste gegen alle Regeln.
 * Profession-Hard-Cap: max 1 Idee pro Beruf in der KOMBINIERTEN (kept + new) Liste.
 */
function filterIdeas(
  fresh: GeneratedIdea[],
  existingSet: Set<string>,
  existingTokenSets: Set<string>[],
  professionsUsedSet: Set<string>,
  stats: FilterStats,
): GeneratedIdea[] {
  const kept: GeneratedIdea[] = [];

  for (const idea of fresh) {
    if (!idea.title || !idea.outline) continue;

    const titleLower = idea.title.trim().toLowerCase();
    if (existingSet.has(titleLower)) {
      stats.hardDup++;
      continue;
    }

    const fullText = `${idea.title} ${idea.outline ?? ''} ${idea.angle ?? ''}`;
    if (BANNED_TROPES.some((rx) => rx.test(fullText))) {
      stats.bannedTrope++;
      continue;
    }

    const newTokens = tokenize(idea.title);
    let isSoftDup = false;
    for (const ex of existingTokenSets) {
      let overlap = 0;
      for (const t of newTokens) if (ex.has(t)) overlap++;
      if (overlap >= SOFT_DUP_OVERLAP) {
        isSoftDup = true;
        break;
      }
    }
    if (isSoftDup) {
      stats.softDup++;
      continue;
    }

    // Profession-Hard-Cap: max 1 pro Beruf (außer "none", da max 2 erlaubt)
    const prof = (idea.profession ?? 'none').trim().toLowerCase();
    if (prof !== 'none' && professionsUsedSet.has(prof)) {
      stats.professionDup++;
      continue;
    }
    if (prof === 'none') {
      // Track "none"-Count separat — max 2 erlaubt
      const noneCount = Array.from(professionsUsedSet).filter((p) => p === 'none-1' || p === 'none-2').length;
      if (noneCount >= 2) {
        stats.professionDup++;
        continue;
      }
      professionsUsedSet.add(`none-${noneCount + 1}`);
    } else {
      professionsUsedSet.add(prof);
    }

    kept.push(idea);
    // Auch im Token-Set tracken damit nachfolgende Ideen im SELBEN Batch
    // nicht zu nah aneinander liegen
    existingSet.add(titleLower);
    existingTokenSets.push(newTokens);
  }

  return kept;
}

function countHookPatterns(ideas: GeneratedIdea[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const i of ideas) {
    const p = (i.hook_pattern ?? 'other').toLowerCase();
    counts[p] = (counts[p] ?? 0) + 1;
  }
  return counts;
}

/**
 * Welche Hook-Patterns fehlen noch, um die Quoten für `targetCount` Ideen zu erfüllen?
 */
function identifyMissingPatterns(kept: GeneratedIdea[], targetCount: number): HookPattern[] {
  const counts = countHookPatterns(kept);
  const need: HookPattern[] = [];

  const minMoney = Math.ceil(targetCount * QUOTA_MONEY_REGRET);
  const minDiscovery = Math.ceil(targetCount * QUOTA_DISCOVERY);
  const minAha = Math.ceil(targetCount * QUOTA_AHA_MOMENT);

  const moneyHave = counts['money_regret'] ?? 0;
  const discoveryHave = counts['discovery_insider'] ?? 0;
  const ahaHave = counts['aha_moment'] ?? 0;

  for (let i = moneyHave; i < minMoney; i++) need.push('money_regret');
  for (let i = discoveryHave; i < minDiscovery; i++) need.push('discovery_insider');
  for (let i = ahaHave; i < minAha; i++) need.push('aha_moment');

  return need;
}

/**
 * POST /api/admin/content/ideas/generate
 * Body: { cluster: ContentCluster, count?: number (default 10) }
 *
 * Top-Up-Loop:
 *   1. Generate `count` ideas
 *   2. Filter (hard-dup, soft-dup, banned-trope, profession-cap)
 *   3. Wenn kept < count ODER Pattern-Quota nicht erfüllt → Top-Up-Call mit
 *      avoidProfessions + requireHookPatterns
 *   4. Max MAX_TOP_UP_ROUNDS Runden ODER LOOP_BUDGET_MS Zeitbudget
 *   5. Insert was kept ist
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

  const hardCap = Number(process.env.CONTENT_IDEAS_MAX_COUNT ?? '10');
  const count = Math.max(5, Math.min(hardCap, body.count ?? 10));

  const service = await createServiceClient();
  const [{ data: existingIdeas }, { data: postedBlogs }] = await Promise.all([
    service
      .from('content_ideas')
      .select('title, cluster, status')
      .order('created_at', { ascending: false })
      .limit(300),
    service
      .from('content_blogs')
      .select('title')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const sameClusterTitles = (existingIdeas ?? [])
    .filter((r) => r.cluster === cluster)
    .map((r) => r.title);
  const otherClusterTitles = (existingIdeas ?? [])
    .filter((r) => r.cluster !== cluster)
    .map((r) => r.title);
  const publishedBlogTitles = (postedBlogs ?? []).map((r) => r.title);
  const existingTitles = [...publishedBlogTitles, ...sameClusterTitles, ...otherClusterTitles];

  // Mutables für den Loop
  const existingSet = new Set(existingTitles.map((t) => t.trim().toLowerCase()));
  const existingTokenSets = existingTitles.map(tokenize);
  const professionsUsedSet = new Set<string>();
  const stats: FilterStats = { hardDup: 0, softDup: 0, bannedTrope: 0, professionDup: 0 };
  const kept: GeneratedIdea[] = [];

  const loopStart = Date.now();
  let round = 0;
  const rounds: Array<{ requested: number; got: number; kept: number; tookMs: number }> = [];

  while (round < MAX_TOP_UP_ROUNDS) {
    if (Date.now() - loopStart > LOOP_BUDGET_MS) {
      console.log(`[ideas-generate] budget exhausted after round ${round}, kept=${kept.length}/${count}`);
      break;
    }

    const stillNeeded = count - kept.length;
    const missingPatterns = identifyMissingPatterns(kept, count);
    const quotaOk = missingPatterns.length === 0;

    if (stillNeeded <= 0 && quotaOk) break;

    // Diese Runde Anfrage-Größe: was fehlt + Buffer (2 extra fürs Filtering)
    const reqCount = Math.min(10, Math.max(stillNeeded > 0 ? stillNeeded + 2 : 3, missingPatterns.length));

    const isTopUp = round > 0;
    const extra = isTopUp ? {
      avoidProfessions: Array.from(professionsUsedSet).filter((p) => !p.startsWith('none-')),
      requireHookPatterns: missingPatterns,
      avoidTitles: kept.map((k) => k.title),
    } : {};

    const roundStart = Date.now();
    let fresh: GeneratedIdea[];
    try {
      fresh = await generateIdeasForCluster(cluster, reqCount, existingTitles, extra);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      console.error(`[ideas-generate round=${round} FAIL] ${msg}`);
      if (round === 0) {
        return NextResponse.json({ error: msg }, { status: 500 });
      }
      // In Top-Up-Runden: failure ignorieren, mit was wir haben weitermachen
      break;
    }
    const tookMs = Date.now() - roundStart;

    const newlyKept = filterIdeas(fresh, existingSet, existingTokenSets, professionsUsedSet, stats);
    kept.push(...newlyKept);

    rounds.push({ requested: reqCount, got: fresh.length, kept: newlyKept.length, tookMs });
    console.log(`[ideas-generate round=${round}] req=${reqCount} got=${fresh.length} kept=${newlyKept.length} total=${kept.length}/${count} took=${tookMs}ms`);

    if (newlyKept.length === 0 && round > 0) {
      // Wenn Top-Up gar nichts brachte → abbrechen statt endlos versuchen
      console.log(`[ideas-generate round=${round}] zero kept, stopping top-up`);
      break;
    }

    round++;
  }

  // Trim auf exakt count falls über-geliefert
  let finalKept = kept.slice(0, count);

  // ──────────────────────────────────────────────────────────────────
  // OPTIONAL: Quality-Validator-Pass (Stufe 5)
  // Aktivierung via ?validate=1 Query-Param ODER env CONTENT_IDEAS_VALIDATE=1
  // ──────────────────────────────────────────────────────────────────
  const url = new URL(request.url);
  const validateRequested = url.searchParams.get('validate') === '1'
    || process.env.CONTENT_IDEAS_VALIDATE === '1';

  let validationSummary: {
    enabled: boolean;
    threshold?: number;
    passing?: number;
    rejected?: number;
    scores?: Array<Omit<IdeaQualityScore, 'index'> & { title: string }>;
    rejectedTitles?: string[];
    error?: string;
  } = { enabled: validateRequested };

  if (validateRequested && finalKept.length > 0 && Date.now() - loopStart < LOOP_BUDGET_MS) {
    try {
      const valStart = Date.now();
      const scores = await validateIdeasQuality(finalKept);
      const threshold = Number(process.env.CONTENT_IDEAS_VALIDATE_THRESHOLD ?? '32');
      const { passing, rejected, scoreByIdx } = filterByQuality(finalKept, scores, threshold);

      console.log(`[ideas-generate VALIDATE] passing=${passing.length} rejected=${rejected.length} threshold=${threshold} took=${Date.now() - valStart}ms`);

      validationSummary = {
        enabled: true,
        threshold,
        passing: passing.length,
        rejected: rejected.length,
        scores: scores.map((s) => {
          const idea = finalKept[s.index];
          return { ...s, title: idea?.title?.slice(0, 80) ?? '<unknown>' };
        }).map(({ index: _, ...rest }) => rest),
        rejectedTitles: rejected.map((r) => r.title.slice(0, 80)),
      };

      finalKept = passing;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'validator-failed';
      console.error(`[ideas-generate VALIDATE FAIL] ${msg}`);
      validationSummary = { enabled: true, error: msg };
      // Bei Validator-Fail: nicht abbrechen, mit unvalidierten Ideen weitermachen
    }
  }

  const rows = finalKept.map((i) => ({
    cluster,
    title: i.title.slice(0, 200),
    outline: i.outline ?? null,
    angle: i.angle ?? null,
    target_keywords: i.target_keywords ?? null,
    profession: i.profession?.trim().toLowerCase().slice(0, 40) ?? null,
    hook_pattern: i.hook_pattern ?? null,
    status: 'backlog' as const,
  }));

  const hookCounts = countHookPatterns(finalKept);
  console.log(`[ideas-generate FINAL] kept=${finalKept.length}/${count} rounds=${rounds.length} stats=${JSON.stringify(stats)} hooks=${JSON.stringify(hookCounts)} validated=${validationSummary.enabled}`);

  if (rows.length === 0) {
    return NextResponse.json({
      generated: 0,
      requested: count,
      duplicates: stats.hardDup + stats.softDup,
      stats,
      rounds,
      validation: validationSummary,
    });
  }

  const { data: inserted, error } = await service
    .from('content_ideas')
    .insert(rows)
    .select('id, title');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    generated: inserted?.length ?? 0,
    requested: count,
    rounds: rounds.length,
    hookCounts,
    stats,
    validation: validationSummary,
    ideas: inserted,
  });
}
