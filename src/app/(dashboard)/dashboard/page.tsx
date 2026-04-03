import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <div className="space-y-8 animate-in-card">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Willkommen, {profile.display_name || profile.email}
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Hier ist eine Übersicht Ihrer QR-Kampagnen.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
        <Link href="/campaigns" className="group">
          <KPIStatCard label="Kampagnen" value={campaignCount || 0} icon={Megaphone} color="violet" className="transition-all duration-300 group-hover:shadow-card-hover group-hover:-translate-y-0.5" />
        </Link>
        <Link href="/locations" className="group">
          <KPIStatCard label="Standorte" value={locationCount || 0} icon={MapPin} color="blue" className="transition-all duration-300 group-hover:shadow-card-hover group-hover:-translate-y-0.5" />
        </Link>
        <Link href="/placements" className="group">
          <KPIStatCard label="Platzierungen" value={placementCount || 0} icon={ClipboardList} color="emerald" className="transition-all duration-300 group-hover:shadow-card-hover group-hover:-translate-y-0.5" />
        </Link>
        <Link href="/qr-codes" className="group">
          <KPIStatCard label="QR-Codes" value={qrCodeCount || 0} icon={QrCode} color="orange" className="transition-all duration-300 group-hover:shadow-card-hover group-hover:-translate-y-0.5" />
        </Link>
        <Link href="/analytics" className="group">
          <KPIStatCard label="QR-Scans" value={totalOpens || 0} icon={TrendingUp} color="pink" className="transition-all duration-300 group-hover:shadow-card-hover group-hover:-translate-y-0.5" />
        </Link>
        <Link href="/analytics" className="group">
          <KPIStatCard label="Conversion" value={`${conversionRate}%`} icon={MousePointerClick} color="indigo" className="transition-all duration-300 group-hover:shadow-card-hover group-hover:-translate-y-0.5" />
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Campaigns */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Aktuelle Kampagnen</CardTitle>
            <Link href="/campaigns" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {recentCampaigns && recentCampaigns.length > 0 ? (
              <div className="space-y-2">
                {recentCampaigns.map((c: Record<string, unknown>) => (
                  <Link
                    key={c.id as string}
                    href={`/campaigns/${c.id}`}
                    className="group flex items-center justify-between rounded-xl border border-border/40 p-3.5 transition-all duration-150 hover:bg-muted/30 hover:border-border/70"
                  >
                    <div>
                      <div className="font-semibold group-hover:text-primary transition-colors">{c.name as string}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground font-mono">{c.slug as string}</div>
                    </div>
                    <StatusBadge
                      status={c.status as string}
                      label={CAMPAIGN_STATUS_LABELS[c.status as string] || (c.status as string)}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Noch keine Kampagnen vorhanden.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Placements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Top-Platzierungen</CardTitle>
            <Link href="/placements" className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              Alle anzeigen <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <CardContent>
            {topPlacementList.length > 0 ? (
              <div className="space-y-2">
                {topPlacementList.map(([pid, info], index) => (
                  <Link
                    key={pid}
                    href={`/placements/${pid}`}
                    className="group flex items-center gap-3.5 rounded-xl border border-border/40 p-3.5 transition-all duration-150 hover:bg-muted/30 hover:border-border/70"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold truncate group-hover:text-primary transition-colors">{info.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground truncate">
                        {info.location} &middot; <span className="font-mono">{info.code}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      <span className="text-sm font-bold text-primary">{info.count}</span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Noch keine Scan-Daten vorhanden.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
