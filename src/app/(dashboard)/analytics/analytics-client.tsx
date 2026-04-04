'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { KPIStatCard } from '@/components/shared/kpi-stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { DataTableShell } from '@/components/shared/data-table-shell';
import { KPISkeleton, ChartSkeleton, TableSkeleton } from '@/components/shared/loading-skeleton';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  TrendingUp, MousePointerClick, FileText, QrCode, Download, Users, FileDown, Globe,
  Link2, ArrowUpRight,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { CHART_PALETTE, SERIES_COLORS, AXIS_STYLE, GRID_STYLE } from '@/lib/chart-config';
import { generateAnalyticsPdf } from '@/lib/pdf/generate';
import { CountryChart } from '@/components/shared/country-chart';
import { WorldMap } from '@/components/shared/world-map';

type Props = {
  campaigns: { id: string; name: string }[];
  districts: string[];
};

type AnalyticsData = {
  kpis: { totalOpens: number; uniqueScans: number; uniqueQrCodes: number; ctaClicks: number; formSubmits: number; linkClicks: number };
  timeSeriesData: { date: string; qr: number; link: number }[];
  campaignData: { name: string; opens: number }[];
  placementData: { name: string; opens: number; location: string }[];
  deviceData: { name: string; value: number }[];
  countryData: { name: string; value: number }[];
  referrerData: { name: string; value: number }[];
};

type SourceFilter = 'all' | 'qr' | 'link';

export function AnalyticsClient({ campaigns, districts }: Props) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [campaignId, setCampaignId] = useState<string>('all');
  const [district, setDistrict] = useState<string>('all');
  const [source, setSource] = useState<SourceFilter>('all');
  const [isLive, setIsLive] = useState(false);

  // Realtime: invalidate analytics on new events
  const invalidateAnalytics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }, [queryClient]);

  useEffect(() => {
    const channel = supabase
      .channel('analytics-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'redirect_events' },
        invalidateAnalytics,
      )
      .subscribe((status) => {
        setIsLive(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, invalidateAnalytics]);

  const { data, isLoading: loading } = useQuery<AnalyticsData>({
    queryKey: ['analytics', dateFrom, dateTo, campaignId, district, source],
    queryFn: async () => {
      const from = `${dateFrom}T00:00:00`;
      const to = `${dateTo}T23:59:59`;

      // Determine which event types to query based on source filter
      const eventTypes = source === 'qr' ? ['qr_open'] : source === 'link' ? ['link_open'] : ['qr_open', 'link_open'];

      let redirectQuery = supabase
        .from('redirect_events')
        .select('id, qr_code_id, short_link_id, campaign_id, placement_id, device_type, created_at, event_type, ip_hash, country, referrer, is_bot, destination_url, placements(name, placement_code, location:locations(venue_name, district))')
        .in('event_type', eventTypes)
        .eq('is_bot', false)
        .gte('created_at', from)
        .lte('created_at', to);

      if (campaignId !== 'all') redirectQuery = redirectQuery.eq('campaign_id', campaignId);
      const { data: redirectEvents } = await redirectQuery;

      let filteredEvents = redirectEvents || [];
      if (district !== 'all') {
        filteredEvents = filteredEvents.filter((e: Record<string, unknown>) => {
          const p = e.placements as { location: { district: string | null } | null } | null;
          return p?.location?.district === district;
        });
      }

      let pageQuery = supabase
        .from('page_events')
        .select('id, event_type, campaign_id, created_at')
        .gte('created_at', from)
        .lte('created_at', to);

      if (campaignId !== 'all') pageQuery = pageQuery.eq('campaign_id', campaignId);
      const { data: pageEvents } = await pageQuery;

      const qrEvents = filteredEvents.filter((e: Record<string, unknown>) => e.event_type === 'qr_open');
      const linkEvents = filteredEvents.filter((e: Record<string, unknown>) => e.event_type === 'link_open');

      const uniqueQrs = new Set(qrEvents.map((e: Record<string, unknown>) => e.qr_code_id));
      const uniqueIps = new Set(filteredEvents.map((e: Record<string, unknown>) => e.ip_hash).filter(Boolean));
      const targetClicks = filteredEvents.filter((e: Record<string, unknown>) => e.destination_url).length;
      const formSubmits = (pageEvents || []).filter((e: { event_type: string }) => e.event_type === 'form_submit').length;

      const kpis = {
        totalOpens: filteredEvents.length,
        uniqueScans: uniqueIps.size,
        uniqueQrCodes: uniqueQrs.size,
        ctaClicks: targetClicks,
        formSubmits,
        linkClicks: linkEvents.length,
      };

      // Time series — QR vs Link per day
      const dayMap: Record<string, { qr: number; link: number }> = {};
      filteredEvents.forEach((e: Record<string, unknown>) => {
        const day = (e.created_at as string).slice(0, 10);
        if (!dayMap[day]) dayMap[day] = { qr: 0, link: 0 };
        if (e.event_type === 'qr_open') dayMap[day].qr++;
        else if (e.event_type === 'link_open') dayMap[day].link++;
      });
      const timeSeriesData = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, val]) => ({ date, ...val }));

      // Campaign breakdown
      const campMap: Record<string, number> = {};
      filteredEvents.forEach((e: { campaign_id: string | null }) => {
        const cid = e.campaign_id || 'unknown';
        campMap[cid] = (campMap[cid] || 0) + 1;
      });
      const campaignData = Object.entries(campMap)
        .map(([cid, opens]) => ({ name: campaigns.find((c) => c.id === cid)?.name || 'Unbekannt', opens }))
        .sort((a, b) => b.opens - a.opens);

      // Top placements (only for QR events)
      const placeMap: Record<string, { name: string; location: string; opens: number }> = {};
      qrEvents.forEach((e: Record<string, unknown>) => {
        const pid = e.placement_id as string;
        if (!pid) return;
        if (!placeMap[pid]) {
          const p = e.placements as { name: string; location: { venue_name: string } | null } | null;
          placeMap[pid] = { name: p?.name || 'Unbekannt', location: p?.location?.venue_name || '', opens: 0 };
        }
        placeMap[pid].opens++;
      });
      const placementData = Object.values(placeMap).sort((a, b) => b.opens - a.opens).slice(0, 10);

      // Device breakdown
      const devMap: Record<string, number> = {};
      filteredEvents.forEach((e: { device_type: string | null }) => {
        const dev = e.device_type || 'unbekannt';
        devMap[dev] = (devMap[dev] || 0) + 1;
      });
      const deviceData = Object.entries(devMap).map(([name, value]) => ({ name, value }));

      // Country breakdown
      const countryMap: Record<string, number> = {};
      filteredEvents.forEach((e: { country: string | null }) => {
        const c = e.country || 'Unbekannt';
        countryMap[c] = (countryMap[c] || 0) + 1;
      });
      const countryData = Object.entries(countryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Referrer breakdown
      const refMap: Record<string, number> = {};
      filteredEvents.forEach((e: Record<string, unknown>) => {
        const ref = e.referrer as string | null;
        if (!ref) return;
        try {
          const host = new URL(ref).hostname.replace('www.', '');
          refMap[host] = (refMap[host] || 0) + 1;
        } catch {
          refMap[ref] = (refMap[ref] || 0) + 1;
        }
      });
      const referrerData = Object.entries(refMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      return { kpis, timeSeriesData, campaignData, placementData, deviceData, countryData, referrerData };
    },
  });

  const kpis = data?.kpis ?? { totalOpens: 0, uniqueScans: 0, uniqueQrCodes: 0, ctaClicks: 0, formSubmits: 0, linkClicks: 0 };
  const timeSeriesData = data?.timeSeriesData ?? [];
  const campaignData = data?.campaignData ?? [];
  const placementData = data?.placementData ?? [];
  const deviceData = data?.deviceData ?? [];
  const countryData = data?.countryData ?? [];
  const referrerData = data?.referrerData ?? [];

  const conversionRate = kpis.totalOpens > 0 ? ((kpis.ctaClicks / kpis.totalOpens) * 100).toFixed(1) : '0.0';
  const formRate = kpis.totalOpens > 0 ? ((kpis.formSubmits / kpis.totalOpens) * 100).toFixed(1) : '0.0';

  async function handleExport() {
    const from = `${dateFrom}T00:00:00`;
    const to = `${dateTo}T23:59:59`;

    let query = supabase
      .from('redirect_events')
      .select('short_code, event_type, device_type, destination_url, created_at, placements(name, placement_code, location:locations(venue_name, district)), campaigns:campaign_id(name)')
      .gte('created_at', from)
      .lte('created_at', to)
      .order('created_at', { ascending: false });

    if (campaignId !== 'all') query = query.eq('campaign_id', campaignId);
    const { data } = await query;
    if (!data || data.length === 0) return;

    const rows = data.map((e: Record<string, unknown>) => {
      const p = e.placements as { name: string; placement_code: string; location: { venue_name: string; district: string | null } | null } | null;
      const c = e.campaigns as { name: string } | null;
      return {
        datum: (e.created_at as string).slice(0, 19),
        short_code: e.short_code, event: e.event_type,
        kampagne: c?.name || '', platzierung: p?.name || '',
        code: p?.placement_code || '', standort: p?.location?.venue_name || '',
        bezirk: p?.location?.district || '', geraet: e.device_type || '',
        ziel_url: e.destination_url || '',
      };
    });

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(';'),
      ...rows.map((r) => headers.map((h) => `"${(String((r as Record<string, unknown>)[h] ?? '')).replace(/"/g, '""')}"`).join(';')),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${dateFrom}-${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 animate-in-card">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold tracking-tight">Analytik</h1>
            {isLive && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Auswertung aller QR-Scans und Link-Klicks</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" render={<a href="/analytics/compare" />}>
            <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
            A/B Vergleich
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              generateAnalyticsPdf({
                dateFrom, dateTo, kpis, campaignData, placementData, deviceData, countryData,
              });
            }}
          >
            <FileDown className="mr-1.5 h-3.5 w-3.5" />
            PDF Bericht
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-1.5 h-3.5 w-3.5" />
            CSV Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Von</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Bis</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Quelle</Label>
            <Select value={source} onValueChange={(v) => setSource((v ?? 'all') as SourceFilter)}>
              <SelectTrigger className="h-8 text-[13px]">
                <SelectValue>
                  {source === 'all' ? 'Alle Quellen' : source === 'qr' ? 'QR-Codes' : 'Kurzlinks'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Quellen</SelectItem>
                <SelectItem value="qr">QR-Codes</SelectItem>
                <SelectItem value="link">Kurzlinks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Kampagne</Label>
            <Select value={campaignId} onValueChange={(v) => setCampaignId(v ?? 'all')}>
              <SelectTrigger className="h-8 text-[13px]">
                <SelectValue placeholder="Alle Kampagnen">
                  {campaignId === 'all'
                    ? 'Alle Kampagnen'
                    : campaigns.find((c) => c.id === campaignId)?.name ?? 'Alle Kampagnen'}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Kampagnen</SelectItem>
                {campaigns.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Bezirk</Label>
            <Select value={district} onValueChange={(v) => setDistrict(v ?? 'all')}>
              <SelectTrigger className="h-8 text-[13px]">
                <SelectValue placeholder="Alle Bezirke">
                  {district === 'all' ? 'Alle Bezirke' : district}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Bezirke</SelectItem>
                {districts.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <KPISkeleton count={4} />
          <ChartSkeleton />
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            <KPIStatCard label="Aufrufe gesamt" value={kpis.totalOpens} icon={TrendingUp} subtext={`${kpis.uniqueQrCodes} QR-Codes + ${kpis.linkClicks} Link-Klicks`} />
            <KPIStatCard label="Einzelne Besucher" value={kpis.uniqueScans} icon={Users} subtext={kpis.totalOpens ? `${((kpis.uniqueScans / kpis.totalOpens) * 100).toFixed(0)}% einzigartige Nutzer` : 'Keine Daten'} />
            <KPIStatCard label="Link-Klicks" value={kpis.linkClicks} icon={Link2} subtext="Klicks ueber Kurzlinks" />
            <KPIStatCard label="Zielseite erreicht" value={kpis.ctaClicks} icon={MousePointerClick} subtext={`${conversionRate}% Weiterleitungsrate`} />
            <KPIStatCard label="Formulare abgeschickt" value={kpis.formSubmits} icon={FileText} subtext={kpis.totalOpens ? `${formRate}% der Besucher` : 'Keine Daten'} />
            <KPIStatCard label="QR-Codes aktiv" value={kpis.uniqueQrCodes} icon={QrCode} subtext="Codes mit mindestens 1 Scan" />
            <KPIStatCard label="Top-Referrer" value={referrerData.length > 0 ? referrerData[0].name : '–'} icon={ArrowUpRight} subtext={referrerData.length > 0 ? `${referrerData[0].value} Klicks` : 'Keine Referrer-Daten'} />
            <KPIStatCard label="Abschlussrate" value={`${conversionRate}%`} icon={MousePointerClick} subtext="Aufruf → Zielseite erreicht" />
          </div>

          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="QR-Scans & Link-Klicks über Zeit" empty={timeSeriesData.length === 0} emptyText="Keine Daten im gewählten Zeitraum" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="date" {...AXIS_STYLE} />
                  <YAxis {...AXIS_STYLE} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid oklch(0.92 0 0)',
                      boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="qr" name="QR-Scans" stroke={SERIES_COLORS.scans} strokeWidth={1.5} dot={false} />
                  <Line type="monotone" dataKey="link" name="Link-Klicks" stroke={SERIES_COLORS.clicks} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Scans pro Kampagne" empty={campaignData.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={campaignData} layout="vertical">
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis type="number" {...AXIS_STYLE} />
                  <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={120} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid oklch(0.92 0 0)',
                      boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)',
                    }}
                  />
                  <Bar dataKey="opens" name="Scans" fill={SERIES_COLORS.scans} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Gerätetypen" empty={deviceData.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" nameKey="name" label={{ fontSize: 11 }} strokeWidth={1}>
                    {deviceData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid oklch(0.92 0 0)',
                      boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Geo: Scans by Country */}
          {countryData.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Weltkarte" className="lg:col-span-1">
                <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  Geografische Verteilung der QR-Scans
                </div>
                <WorldMap data={countryData} />
              </ChartCard>
              <ChartCard title="Scans nach Land" className="lg:col-span-1">
                <CountryChart data={countryData} />
              </ChartCard>
            </div>
          )}

          {/* Referrer Chart */}
          {referrerData.length > 0 && (
            <ChartCard title="Top-Referrer" className="lg:col-span-1">
              <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                <ArrowUpRight className="h-3.5 w-3.5" />
                Woher die Besucher kommen
              </div>
              <ResponsiveContainer width="100%" height={Math.max(200, referrerData.length * 36)}>
                <BarChart data={referrerData} layout="vertical">
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis type="number" {...AXIS_STYLE} />
                  <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={140} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid oklch(0.92 0 0)',
                      boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)',
                    }}
                  />
                  <Bar dataKey="value" name="Klicks" fill={SERIES_COLORS.clicks} radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          )}

          {/* Top Placements Table */}
          <ChartCard title="Top-Platzierungen" empty={placementData.length === 0} emptyText="Noch keine Scan-Daten">
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-[12px] font-medium text-muted-foreground">#</TableHead>
                    <TableHead className="text-[12px] font-medium text-muted-foreground">Platzierung</TableHead>
                    <TableHead className="text-[12px] font-medium text-muted-foreground">Standort</TableHead>
                    <TableHead className="text-right text-[12px] font-medium text-muted-foreground">Scans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placementData.map((p, i) => (
                    <TableRow key={i} className="border-b border-border/60 transition-colors">
                      <TableCell className="text-[13px] text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="text-[13px] font-medium">{p.name}</TableCell>
                      <TableCell className="text-[13px] text-muted-foreground">{p.location}</TableCell>
                      <TableCell className="text-right text-[13px] font-semibold tabular-nums">{p.opens}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>
          </ChartCard>
        </>
      )}
    </div>
  );
}
