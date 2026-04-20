import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ArrowRight, ArrowUp, ArrowDown, Minus, MapPin, Megaphone, Link2 } from 'lucide-react';

const WINDOW_DAYS = 7;

type Entry = {
  id: string;
  title: string;
  subtitle: string;
  count: number;
  delta: 'up' | 'down' | 'flat' | null;
  href: string;
};

export async function TopPerformers() {
  noStore();
  const supabase = await createClient();

  const now = Date.now();
  const weekAgoIso = new Date(now - WINDOW_DAYS * 86_400_000).toISOString();
  const twoWeeksAgoIso = new Date(now - 2 * WINDOW_DAYS * 86_400_000).toISOString();

  const [placementsCurr, placementsPrev, linksData, campaignsData] = await Promise.all([
    supabase
      .from('redirect_events')
      .select('placement_id, placements(id, name, placement_code, location:locations(venue_name))')
      .eq('event_type', 'qr_open')
      .eq('is_bot', false)
      .not('placement_id', 'is', null)
      .gte('created_at', weekAgoIso),
    supabase
      .from('redirect_events')
      .select('placement_id')
      .eq('event_type', 'qr_open')
      .eq('is_bot', false)
      .not('placement_id', 'is', null)
      .gte('created_at', twoWeeksAgoIso)
      .lt('created_at', weekAgoIso),
    supabase
      .from('redirect_events')
      .select('short_link_id, short_links!inner(id, title, short_code, short_host)')
      .eq('event_type', 'link_open')
      .eq('is_bot', false)
      .not('short_link_id', 'is', null)
      .gte('created_at', weekAgoIso),
    supabase
      .from('redirect_events')
      .select('campaign_id, campaigns!inner(id, name, slug)')
      .in('event_type', ['qr_open', 'link_open'])
      .eq('is_bot', false)
      .not('campaign_id', 'is', null)
      .gte('created_at', weekAgoIso),
  ]);

  // Aggregate placements
  const placMap: Record<string, { count: number; name: string; venue: string; code: string }> = {};
  (placementsCurr.data ?? []).forEach((e: Record<string, unknown>) => {
    const pid = e.placement_id as string;
    if (!placMap[pid]) {
      const p = e.placements as { name: string; placement_code: string; location: { venue_name: string } | null } | null;
      placMap[pid] = { count: 0, name: p?.name ?? 'Unbekannt', venue: p?.location?.venue_name ?? '', code: p?.placement_code ?? '' };
    }
    placMap[pid].count++;
  });
  const placPrevMap: Record<string, number> = {};
  (placementsPrev.data ?? []).forEach((e: { placement_id: string | null }) => {
    const pid = e.placement_id;
    if (!pid) return;
    placPrevMap[pid] = (placPrevMap[pid] ?? 0) + 1;
  });
  const topPlacements: Entry[] = Object.entries(placMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([id, info]) => ({
      id,
      title: info.name,
      subtitle: info.venue || info.code,
      count: info.count,
      delta: computeDelta(info.count, placPrevMap[id] ?? 0),
      href: `/placements/${id}`,
    }));

  // Aggregate links
  const linkMap: Record<string, { count: number; title: string; short: string }> = {};
  (linksData.data ?? []).forEach((e: Record<string, unknown>) => {
    const lid = e.short_link_id as string;
    if (!lid) return;
    if (!linkMap[lid]) {
      const l = e.short_links as { title: string | null; short_code: string; short_host: string | null } | null;
      const short = l?.short_host ? `${l.short_host}/${l.short_code}` : `/r/${l?.short_code ?? ''}`;
      linkMap[lid] = { count: 0, title: l?.title ?? l?.short_code ?? 'Link', short };
    }
    linkMap[lid].count++;
  });
  const topLinks: Entry[] = Object.entries(linkMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([id, info]) => ({
      id,
      title: info.title,
      subtitle: info.short,
      count: info.count,
      delta: null,
      href: `/links/${id}`,
    }));

  // Aggregate campaigns
  const campMap: Record<string, { count: number; name: string; slug: string }> = {};
  (campaignsData.data ?? []).forEach((e: Record<string, unknown>) => {
    const cid = e.campaign_id as string;
    if (!cid) return;
    if (!campMap[cid]) {
      const c = e.campaigns as { name: string; slug: string } | null;
      campMap[cid] = { count: 0, name: c?.name ?? 'Unbekannt', slug: c?.slug ?? '' };
    }
    campMap[cid].count++;
  });
  const topCampaigns: Entry[] = Object.entries(campMap)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5)
    .map(([id, info]) => ({
      id,
      title: info.name,
      subtitle: info.slug,
      count: info.count,
      delta: null,
      href: `/campaigns/${id}`,
    }));

  return (
    <section aria-label="Top-Performer" className="space-y-3">
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight">Top-Performer · letzte 7 Tage</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">Wer aktuell Scans zieht</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <RankCard title="Platzierungen" icon={MapPin} entries={topPlacements} allHref="/placements" />
        <RankCard title="Kampagnen" icon={Megaphone} entries={topCampaigns} allHref="/campaigns" />
        <RankCard title="Kurzlinks" icon={Link2} entries={topLinks} allHref="/links" />
      </div>
    </section>
  );
}

function computeDelta(curr: number, prev: number): 'up' | 'down' | 'flat' | null {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return 'up';
  const change = (curr - prev) / prev;
  if (change > 0.1) return 'up';
  if (change < -0.1) return 'down';
  return 'flat';
}

function RankCard({
  title,
  icon: Icon,
  entries,
  allHref,
}: {
  title: string;
  icon: typeof MapPin;
  entries: Entry[];
  allHref: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
          <h3 className="text-[13.5px] font-semibold tracking-tight">{title}</h3>
        </div>
        <Link
          href={allHref}
          className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          Alle <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      <ul className="divide-y divide-border/60">
        {entries.length > 0 ? entries.map((e, idx) => (
          <li key={e.id}>
            <Link href={e.href} className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30">
              <span className="tabular-nums flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                {idx + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium group-hover:text-brand transition-colors">{e.title}</div>
                {e.subtitle && (
                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{e.subtitle}</div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="tabular-nums text-[13.5px] font-semibold">{e.count}</span>
                {e.delta === 'up' && <ArrowUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />}
                {e.delta === 'down' && <ArrowDown className="h-3 w-3 text-red-600 dark:text-red-400" />}
                {e.delta === 'flat' && <Minus className="h-3 w-3 text-muted-foreground/50" />}
              </div>
            </Link>
          </li>
        )) : (
          <li className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">Noch keine Daten</li>
        )}
      </ul>
    </div>
  );
}
