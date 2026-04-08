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
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { CHART_PALETTE, SERIES_COLORS, AXIS_STYLE, GRID_STYLE } from '@/lib/chart-config';
import { generateAnalyticsPdf } from '@/lib/pdf/generate';
import { CountryChart } from '@/components/shared/country-chart';
import { WorldMap } from '@/components/shared/world-map';
import { PageHeader } from '@/components/shared/page-header';

type Props = {
  campaigns: { id: string; name: string }[];
  districts: string[];
};

type BreakdownEntry = { name: string; value: number };

type AnalyticsData = {
  kpis: {
    totalOpens: number;
    qrScans: number;
    linkClicks: number;
    uniqueScans: number;
    uniqueQrCodes: number;
    ctaClicks: number;
    formSubmits: number;
  };
  timeSeriesData: { date: string; qr: number; link: number }[];
  campaignData: { name: string; opens: number }[];
  placementData: { name: string; opens: number; location: string }[];
  deviceData: BreakdownEntry[];
  browserData: BreakdownEntry[];
  osData: BreakdownEntry[];
  countryData: BreakdownEntry[];
  unknownCountryCount: number;
  referrerData: BreakdownEntry[];
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
        .select('id, qr_code_id, short_link_id, campaign_id, placement_id, device_type, browser_family, os_family, created_at, event_type, ip_hash, country, referrer, is_bot, destination_url, placements(name, placement_code, location:locations(venue_name, district))')
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
      // Real CTA clicks come from page_events (tracked on the landing page), not redirect events.
      const ctaClicks = (pageEvents || []).filter((e: { event_type: string }) => e.event_type === 'cta_click').length;
      const formSubmits = (pageEvents || []).filter((e: { event_type: string }) => e.event_type === 'form_submit').length;

      const kpis = {
        totalOpens: filteredEvents.length,
        qrScans: qrEvents.length,
        linkClicks: linkEvents.length,
        uniqueScans: uniqueIps.size,
        uniqueQrCodes: uniqueQrs.size,
        ctaClicks,
        formSubmits,
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
        const rawDev = e.device_type;
        const dev = (!rawDev || rawDev === 'unknown') ? 'Unbekannt' : rawDev;
        devMap[dev] = (devMap[dev] || 0) + 1;
      });
      const deviceData = Object.entries(devMap).map(([name, value]) => ({ name, value }));

      // Browser breakdown
      const browserMap: Record<string, number> = {};
      filteredEvents.forEach((e: { browser_family: string | null }) => {
        const raw = e.browser_family;
        const b = (!raw || raw === 'unknown') ? 'Unbekannt' : raw;
        browserMap[b] = (browserMap[b] || 0) + 1;
      });
      const browserData = Object.entries(browserMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // OS breakdown
      const osMap: Record<string, number> = {};
      filteredEvents.forEach((e: { os_family: string | null }) => {
        const raw = e.os_family;
        const o = (!raw || raw === 'unknown') ? 'Unbekannt' : raw;
        osMap[o] = (osMap[o] || 0) + 1;
      });
      const osData = Object.entries(osMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Country breakdown — separate real countries (ISO alpha-2) from unknown/local
      const countryMap: Record<string, number> = {};
      let unknownCountryCount = 0;
      filteredEvents.forEach((e: { country: string | null }) => {
        const c = e.country;
        if (c && c.length === 2) {
          countryMap[c.toUpperCase()] = (countryMap[c.toUpperCase()] || 0) + 1;
        } else {
          unknownCountryCount++;
        }
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

      return { kpis, timeSeriesData, campaignData, placementData, deviceData, browserData, osData, countryData, unknownCountryCount, referrerData };
    },
  });

  const kpis = data?.kpis ?? { totalOpens: 0, qrScans: 0, linkClicks: 0, uniqueScans: 0, uniqueQrCodes: 0, ctaClicks: 0, formSubmits: 0 };
  const timeSeriesData = data?.timeSeriesData ?? [];
  const campaignData = data?.campaignData ?? [];
  const placementData = data?.placementData ?? [];
  const deviceData = data?.deviceData ?? [];
  const browserData = data?.browserData ?? [];
  const osData = data?.osData ?? [];
  const countryData = data?.countryData ?? [];
  const unknownCountryCount = data?.unknownCountryCount ?? 0;
  const referrerData = data?.referrerData ?? [];

  const conversionRate = kpis.totalOpens > 0 ? ((kpis.ctaClicks / kpis.totalOpens) * 100).toFixed(1) : '0.0';
  const formRate = kpis.totalOpens > 0 ? ((kpis.formSubmits / kpis.totalOpens) * 100).toFixed(1) : '0.0';

  async function handleExport() {
    try {
      const from = `${dateFrom}T00:00:00`;
      const to = `${dateTo}T23:59:59`;
      const eventTypes = source === 'qr' ? ['qr_open'] : source === 'link' ? ['link_open'] : ['qr_open', 'link_open'];

      let query = supabase
        .from('redirect_events')
        .select('short_code, event_type, device_type, browser_family, os_family, destination_url, country, created_at, placements(name, placement_code, location:locations(venue_name, district)), campaigns:campaign_id(name)')
        .in('event_type', eventTypes)
        .eq('is_bot', false)
        .gte('created_at', from)
        .lte('created_at', to)
        .order('created_at', { ascending: false });

      if (campaignId !== 'all') query = query.eq('campaign_id', campaignId);
      let { data, error } = await query;

      if (error) throw error;

      // Apply district filter client-side (matches chart logic)
      if (district !== 'all' && data) {
        data = data.filter((e: Record<string, unknown>) => {
          const p = e.placements as { location: { district: string | null } | null } | null;
          return p?.location?.district === district;
        });
      }
      if (!data || data.length === 0) {
        toast.info('Keine Daten zum Exportieren im gewählten Zeitraum');
        return;
      }

      const rows = data.map((e: Record<string, unknown>) => {
        const p = e.placements as { name: string; placement_code: string; location: { venue_name: string; district: string | null } | null } | null;
        const c = e.campaigns as { name: string } | null;
        return {
          datum: (e.created_at as string).slice(0, 19),
          short_code: e.short_code, event: e.event_type,
          kampagne: c?.name || '', platzierung: p?.name || '',
          code: p?.placement_code || '', standort: p?.location?.venue_name || '',
          bezirk: p?.location?.district || '', land: e.country || '', geraet: e.device_type || '',
          browser: e.browser_family || '', betriebssystem: e.os_family || '',
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
      toast.success(`${rows.length} Einträge exportiert`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export fehlgeschlagen');
    }
  }

  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="Analytik"
        description="Auswertung aller QR-Scans und Link-Klicks"
        badge={isLive ? (
          <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        ) : undefined}
        action={
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
                  dateFrom, dateTo, kpis, campaignData, placementData, deviceData, browserData, osData, countryData,
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
        }
      />

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
          {/* Reichweite — wie viele Aufrufe, wie viele echte Besucher */}
          <section className="space-y-3">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight">Reichweite</h2>
              <p className="text-[12px] text-muted-foreground">Wie oft wurden deine Codes und Links aufgerufen</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
              <KPIStatCard
                label="Aufrufe gesamt"
                value={kpis.totalOpens}
                icon={TrendingUp}
                subtext={kpis.totalOpens ? `${kpis.qrScans} QR · ${kpis.linkClicks} Link` : 'Noch keine Aufrufe'}
                hint="Summe aller QR-Scans und Kurzlink-Klicks im gewählten Zeitraum (ohne Bots)."
              />
              <KPIStatCard
                label="QR-Scans"
                value={kpis.qrScans}
                icon={QrCode}
                subtext={kpis.qrScans ? `${kpis.uniqueQrCodes} aktive Codes` : 'Noch keine Scans'}
                hint="Wie oft physische QR-Codes gescannt wurden."
              />
              <KPIStatCard
                label="Link-Klicks"
                value={kpis.linkClicks}
                icon={Link2}
                subtext="Aufrufe über Kurzlinks"
                hint="Klicks auf deine trackbaren Kurzlinks (z. B. für Social Media, E-Mail)."
              />
              <KPIStatCard
                label="Eindeutige Besucher"
                value={kpis.uniqueScans}
                icon={Users}
                subtext={
                  kpis.uniqueScans > 0
                    ? `${((kpis.uniqueScans / kpis.totalOpens) * 100).toFixed(0)}% der Aufrufe`
                    : kpis.totalOpens > 0
                      ? 'Wird in Produktion erfasst'
                      : 'Noch keine Daten'
                }
                hint="Verschiedene Besucher, erkannt über anonymisierten IP-Hash. Funktioniert erst mit echtem Traffic in Produktion (nicht lokal)."
              />
            </div>
          </section>

          {/* Engagement — nur anzeigen wenn Landing-Page-Tracking aktiv */}
          {(kpis.ctaClicks > 0 || kpis.formSubmits > 0) && (
            <section className="space-y-3">
              <div>
                <h2 className="text-[13px] font-semibold tracking-tight">Engagement</h2>
                <p className="text-[12px] text-muted-foreground">Was die Besucher auf der Zielseite tun</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
                <KPIStatCard
                  label="CTA-Klicks"
                  value={kpis.ctaClicks}
                  icon={MousePointerClick}
                  subtext="Klicks auf der Zielseite"
                  hint="Klicks auf Buttons/Links auf deiner Zielseite (via Tracking-Script)."
                />
                <KPIStatCard
                  label="Formular-Abschlüsse"
                  value={kpis.formSubmits}
                  icon={FileText}
                  subtext={kpis.formSubmits ? `${formRate}% der Besucher` : 'Noch keine Abschlüsse'}
                  hint="Gesendete Formulare auf der Zielseite (z. B. Anmeldungen, Kontakte)."
                />
                <KPIStatCard
                  label="Conversion-Rate"
                  value={`${conversionRate}%`}
                  icon={ArrowUpRight}
                  subtext="CTA-Klicks ÷ Aufrufe"
                  hint="Anteil der Aufrufe, die zu einer CTA-Aktion geführt haben."
                />
              </div>
            </section>
          )}

          {/* Analyse — Charts */}
          <section className="space-y-3">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight">Analyse</h2>
              <p className="text-[12px] text-muted-foreground">Zeitverlauf, Kampagnen und Geräteverteilung</p>
            </div>
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

            <ChartCard title="Aufrufe pro Kampagne" empty={campaignData.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={campaignData} layout="vertical">
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis type="number" {...AXIS_STYLE} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={120} />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 6,
                      border: '1px solid oklch(0.92 0 0)',
                      boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)',
                    }}
                  />
                  <Bar dataKey="opens" name="Aufrufe" fill={SERIES_COLORS.scans} radius={[0, 3, 3, 0]} />
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
          </section>

          {/* Technik — Browser & Betriebssystem */}
          <section className="space-y-3">
            <div>
              <h2 className="text-[13px] font-semibold tracking-tight">Technik</h2>
              <p className="text-[12px] text-muted-foreground">Welche Browser und Betriebssysteme deine Besucher nutzen</p>
            </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Browser" empty={browserData.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={browserData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" nameKey="name" label={{ fontSize: 11 }} strokeWidth={1}>
                    {browserData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid oklch(0.92 0 0)', boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Betriebssystem" empty={osData.length === 0}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={osData} cx="50%" cy="50%" outerRadius={90} innerRadius={50} dataKey="value" nameKey="name" label={{ fontSize: 11 }} strokeWidth={1}>
                    {osData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid oklch(0.92 0 0)', boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          </section>

          {/* Geo: Scans by Country */}
          {(countryData.length > 0 || unknownCountryCount > 0) && (
            <section className="space-y-3">
              <div>
                <h2 className="text-[13px] font-semibold tracking-tight">Geografie</h2>
                <p className="text-[12px] text-muted-foreground">Woher deine Besucher kommen</p>
              </div>

              {countryData.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard title="Weltkarte" className="lg:col-span-1">
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      Geografische Verteilung der Scans
                    </div>
                    <WorldMap data={countryData} />
                  </ChartCard>
                  <ChartCard title="Scans nach Land" className="lg:col-span-1">
                    <CountryChart data={countryData} />
                  </ChartCard>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/20 p-5 text-center">
                  <Globe className="mx-auto h-6 w-6 text-muted-foreground/60" />
                  <p className="mt-2 text-[13px] font-medium">Noch keine Länder-Daten</p>
                  <p className="mt-1 text-[12px] text-muted-foreground max-w-md mx-auto">
                    Sobald Scans von echten Besuchern über das Internet eingehen, erscheinen hier Weltkarte und Länder-Statistik.
                  </p>
                </div>
              )}

              {unknownCountryCount > 0 && (
                <div className="rounded-lg border border-border bg-muted/20 px-4 py-2.5 flex items-start gap-2.5">
                  <Globe className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">{unknownCountryCount} Scan{unknownCountryCount !== 1 ? 's' : ''} ohne Länder-Zuordnung.</span>{' '}
                    Das kann an lokalen Tests im WLAN (LAN-IPs) oder an fehlenden Geo-Headers liegen.
                    In Produktion (Vercel) werden Länder automatisch via Edge-Network erkannt.
                  </p>
                </div>
              )}
            </section>
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
