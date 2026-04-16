import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/constants';
import { StatusBadge } from '@/components/shared/status-badge';
import Link from 'next/link';
import { TrendingUp, ArrowRight, Link2 } from 'lucide-react';
import { LiveScanFeed } from '@/components/shared/live-scan-feed';

export async function BottomLists() {
  noStore();
  const supabase = await createClient();

  const [
    { data: recentCampaigns },
    { data: topPlacements },
    { data: topLinks },
  ] = await Promise.all([
    supabase.from('campaigns').select('id, name, status, slug').order('updated_at', { ascending: false }).limit(5),
    supabase.from('redirect_events')
      .select('placement_id, placements(name, placement_code, location:locations(venue_name))')
      .eq('event_type', 'qr_open')
      .eq('is_bot', false)
      .not('placement_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('short_links')
      .select('id, title, short_code, click_count, campaign:campaigns(name)')
      .eq('archived', false)
      .order('click_count', { ascending: false })
      .limit(5),
  ]);

  const placementCounts: Record<string, { name: string; code: string; location: string; count: number }> = {};
  (topPlacements || []).forEach((ev: Record<string, unknown>) => {
    const pid = ev.placement_id as string;
    if (!pid) return;
    if (!placementCounts[pid]) {
      const p = ev.placements as { name: string; placement_code: string; location: { venue_name: string } | null } | null;
      placementCounts[pid] = {
        name: p?.name || 'Unbekannt',
        code: p?.placement_code || '',
        location: p?.location?.venue_name || '',
        count: 0,
      };
    }
    placementCounts[pid].count++;
  });
  const topPlacementList = Object.entries(placementCounts)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 5);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {/* Live Scan Feed */}
      <LiveScanFeed />

      {/* Recent Campaigns */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-[13px] font-medium">Aktuelle Kampagnen</h3>
          <Link href="/campaigns" className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Alle anzeigen <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-border/60">
          {recentCampaigns && recentCampaigns.length > 0 ? (
            recentCampaigns.map((c: Record<string, unknown>) => (
              <Link
                key={c.id as string}
                href={`/campaigns/${c.id}`}
                className="group flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0">
                  <div className="text-[13px] font-medium group-hover:text-brand transition-colors truncate">{c.name as string}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground font-mono">{c.slug as string}</div>
                </div>
                <StatusBadge
                  status={c.status as string}
                  label={CAMPAIGN_STATUS_LABELS[c.status as string] || (c.status as string)}
                />
              </Link>
            ))
          ) : (
            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              Noch keine Kampagnen vorhanden.
            </p>
          )}
        </div>
      </div>

      {/* Top Placements */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-[13px] font-medium">Top-Platzierungen</h3>
          <Link href="/placements" className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Alle anzeigen <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-border/60">
          {topPlacementList.length > 0 ? (
            topPlacementList.map(([pid, info], index) => (
              <Link
                key={pid}
                href={`/placements/${pid}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-semibold text-muted-foreground bg-muted">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate group-hover:text-brand transition-colors">{info.name}</div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground truncate">
                    {info.location} · <span className="font-mono">{info.code}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[13px] font-semibold tabular-nums">
                  {info.count}
                  <TrendingUp className="h-3 w-3 text-muted-foreground/50" />
                </div>
              </Link>
            ))
          ) : (
            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              Noch keine Scan-Daten vorhanden.
            </p>
          )}
        </div>
      </div>

      {/* Top Links */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-[13px] font-medium">Top-Links</h3>
          <Link href="/links" className="flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors">
            Alle anzeigen <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-border/60">
          {topLinks && topLinks.length > 0 ? (
            topLinks.map((link: Record<string, unknown>, index: number) => (
              <Link
                key={link.id as string}
                href={`/links/${link.id}`}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-md text-[12px] font-semibold text-muted-foreground bg-muted">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium truncate group-hover:text-brand transition-colors">
                    {(link.title as string) || (link.short_code as string)}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground truncate">
                    <span className="font-mono">/r/{link.short_code as string}</span>
                    {(link.campaign as { name: string } | null)?.name && (
                      <> · {(link.campaign as { name: string }).name}</>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[13px] font-semibold tabular-nums">
                  {link.click_count as number}
                  <Link2 className="h-3 w-3 text-muted-foreground/50" />
                </div>
              </Link>
            ))
          ) : (
            <p className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              Noch keine Link-Daten vorhanden
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
