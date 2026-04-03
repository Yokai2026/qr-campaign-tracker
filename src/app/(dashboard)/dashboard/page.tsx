import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/constants';
import { StatusBadge } from '@/components/shared/status-badge';
import { KPIStatCard } from '@/components/shared/kpi-stat-card';
import Link from 'next/link';
import {
  Megaphone,
  MapPin,
  ClipboardList,
  QrCode,
  MousePointerClick,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

export default async function DashboardPage() {
  noStore();
  const profile = await requireAuth();
  const supabase = await createClient();

  const [
    { count: campaignCount },
    { count: locationCount },
    { count: placementCount },
    { count: qrCodeCount },
    { count: totalOpens },
    { count: ctaClicks },
    { data: recentCampaigns },
    { data: topPlacements },
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('locations').select('*', { count: 'exact', head: true }),
    supabase.from('placements').select('*', { count: 'exact', head: true }),
    supabase.from('qr_codes').select('*', { count: 'exact', head: true }),
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).eq('event_type', 'qr_open'),
    supabase.from('page_events').select('*', { count: 'exact', head: true }).eq('event_type', 'cta_click'),
    supabase.from('campaigns').select('id, name, status, slug').order('updated_at', { ascending: false }).limit(5),
    supabase.from('redirect_events')
      .select('placement_id, placements(name, placement_code, location:locations(venue_name))')
      .eq('event_type', 'qr_open')
      .not('placement_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(100),
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

  const conversionRate = totalOpens && ctaClicks
    ? ((ctaClicks / totalOpens) * 100).toFixed(1)
    : '0';

  return (
    <div className="space-y-6 animate-in-card">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold tracking-tight">
          Willkommen, {profile.display_name || profile.email}
        </h1>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          Übersicht Ihrer QR-Kampagnen
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        <Link href="/campaigns" className="group">
          <KPIStatCard
            label="Kampagnen"
            value={campaignCount || 0}
            icon={Megaphone}
            className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
          />
        </Link>
        <Link href="/locations" className="group">
          <KPIStatCard
            label="Standorte"
            value={locationCount || 0}
            icon={MapPin}
            className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
          />
        </Link>
        <Link href="/placements" className="group">
          <KPIStatCard
            label="Platzierungen"
            value={placementCount || 0}
            icon={ClipboardList}
            className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
          />
        </Link>
        <Link href="/qr-codes" className="group">
          <KPIStatCard
            label="QR-Codes"
            value={qrCodeCount || 0}
            icon={QrCode}
            className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
          />
        </Link>
        <Link href="/analytics" className="group">
          <KPIStatCard
            label="QR-Scans"
            value={totalOpens || 0}
            icon={TrendingUp}
            className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
          />
        </Link>
        <Link href="/analytics" className="group">
          <KPIStatCard
            label="Conversion"
            value={`${conversionRate}%`}
            icon={MousePointerClick}
            className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
          />
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Campaigns */}
        <div className="rounded-lg border border-border bg-card">
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
                    <div className="text-[13px] font-medium group-hover:text-primary transition-colors truncate">{c.name as string}</div>
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
        <div className="rounded-lg border border-border bg-card">
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
                  <span className="flex h-6 w-6 items-center justify-center rounded text-[12px] font-medium text-muted-foreground bg-muted">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium truncate group-hover:text-primary transition-colors">{info.name}</div>
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
      </div>
    </div>
  );
}
