import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { EntityStatsHeaderClient, type StatsScope as ClientScope } from './entity-stats-header-client';

/**
 * Scope for a stats-header query. Each entity-type maps to a different column
 * on redirect_events. Locations aggregate across multiple placements.
 */
export type StatsScope = ClientScope;

type Props = {
  scope: StatsScope;
  /** Optional label shown in the corner ("QR-Code", "Kurzlink" …). */
  label?: string;
};

/**
 * Sticky quick-stats bar for entity-detail pages. Renders on top of the
 * detail view so the mobile user sees "Scans today / 7d / last scan" without
 * scrolling.
 *
 * Server-Component holt initiale Werte (cheap counts), uebergibt sie an die
 * Client-Variante die anschliessend Supabase-Realtime fuer redirect_events
 * abonniert — neue Scans erscheinen damit ohne Page-Reload.
 */
export async function EntityStatsHeader({ scope, label }: Props) {
  noStore();
  const { today, sevenDays, lastScan } = await fetchStats(scope);

  return (
    <EntityStatsHeaderClient
      scope={scope}
      label={label}
      initial={{ today, sevenDays, lastScan }}
    />
  );
}

async function fetchStats(scope: StatsScope): Promise<{
  today: number;
  sevenDays: number;
  lastScan: string | null;
}> {
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayIso = todayStart.toISOString();
  const sevenDaysAgoIso = new Date(now.getTime() - 7 * 86_400_000).toISOString();

  // Base query builder — scope filter applied inline for each call
  const scopedCount = (sinceIso: string) => {
    let q = supabase
      .from('redirect_events')
      .select('id', { count: 'exact', head: true })
      .in('event_type', ['qr_open', 'link_open'])
      .eq('is_bot', false)
      .gte('created_at', sinceIso);
    q = applyScopeFilter(q, scope);
    return q;
  };

  const scopedLast = () => {
    let q = supabase
      .from('redirect_events')
      .select('created_at')
      .in('event_type', ['qr_open', 'link_open'])
      .eq('is_bot', false);
    q = applyScopeFilter(q, scope);
    return q.order('created_at', { ascending: false }).limit(1).maybeSingle();
  };

  const [todayRes, sevenDayRes, lastRes] = await Promise.all([
    scopedCount(todayIso),
    scopedCount(sevenDaysAgoIso),
    scopedLast(),
  ]);

  return {
    today: todayRes.count ?? 0,
    sevenDays: sevenDayRes.count ?? 0,
    lastScan: (lastRes.data as { created_at: string } | null)?.created_at ?? null,
  };
}

// Applies the scope filter to a redirect_events query. Typed loosely because
// Supabase's PostgrestFilterBuilder is awkward to parametrise; runtime is the
// same .eq / .in filter chain either way.
type ScopedQuery = ReturnType<ReturnType<typeof createClient> extends Promise<infer C> ? C extends { from: (t: string) => infer F } ? () => F : never : never>;

function applyScopeFilter<Q>(q: Q, scope: StatsScope): Q {
  const builder = q as unknown as {
    eq: (c: string, v: string) => Q;
    in: (c: string, v: string[]) => Q;
  };
  switch (scope.kind) {
    case 'qr_code':
      return builder.eq('qr_code_id', scope.id);
    case 'short_link':
      return builder.eq('short_link_id', scope.id);
    case 'campaign':
      return builder.eq('campaign_id', scope.id);
    case 'placement':
      return builder.eq('placement_id', scope.id);
    case 'location':
      if (scope.placementIds.length === 0) {
        // Empty placement list — match nothing
        return builder.in('placement_id', ['__none__']);
      }
      return builder.in('placement_id', scope.placementIds);
  }
}

// Suppress unused type alias warning (kept for future narrower typing).
export type _ScopedQuery = ScopedQuery;
