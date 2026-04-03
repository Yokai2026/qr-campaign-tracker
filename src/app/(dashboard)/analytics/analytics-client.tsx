'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  TrendingUp, MousePointerClick, FileText, QrCode, Download,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { CHART_PALETTE, SERIES_COLORS, AXIS_STYLE, GRID_STYLE } from '@/lib/chart-config';

type Props = {
  campaigns: { id: string; name: string }[];
  districts: string[];
};

type KPIs = {
  totalOpens: number;
  uniqueQrCodes: number;
  ctaClicks: number;
  formSubmits: number;
};

export function AnalyticsClient({ campaigns, districts }: Props) {
  const supabase = createClient();

  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [campaignId, setCampaignId] = useState<string>('all');
  const [district, setDistrict] = useState<string>('all');

  const [kpis, setKpis] = useState<KPIs>({ totalOpens: 0, uniqueQrCodes: 0, ctaClicks: 0, formSubmits: 0 });
  const [timeSeriesData, setTimeSeriesData] = useState<{ date: string; opens: number; clicks: number }[]>([]);
  const [campaignData, setCampaignData] = useState<{ name: string; opens: number }[]>([]);
  const [placementData, setPlacementData] = useState<{ name: string; opens: number; location: string }[]>([]);
  const [deviceData, setDeviceData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const from = `${dateFrom}T00:00:00`;
    const to = `${dateTo}T23:59:59`;

    let redirectQuery = supabase
      .from('redirect_events')
      .select('id, qr_code_id, campaign_id, placement_id, device_type, created_at, event_type, placements(name, placement_code, location:locations(venue_name, district))')
      .eq('event_type', 'qr_open')
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

    const uniqueQrs = new Set(filteredEvents.map((e: Record<string, unknown>) => e.qr_code_id));
    const ctaClicks = (pageEvents || []).filter((e: { event_type: string }) => e.event_type === 'cta_click').length;
    const formSubmits = (pageEvents || []).filter((e: { event_type: string }) => e.event_type === 'form_submit').length;

    setKpis({ totalOpens: filteredEvents.length, uniqueQrCodes: uniqueQrs.size, ctaClicks, formSubmits });

    // Time series
    const dayMap: Record<string, { opens: number; clicks: number }> = {};
    filteredEvents.forEach((e: { created_at: string }) => {
      const day = e.created_at.slice(0, 10);
      if (!dayMap[day]) dayMap[day] = { opens: 0, clicks: 0 };
      dayMap[day].opens++;
    });
    (pageEvents || []).forEach((e: { event_type: string; created_at: string }) => {
      if (e.event_type === 'cta_click') {
        const day = e.created_at.slice(0, 10);
        if (!dayMap[day]) dayMap[day] = { opens: 0, clicks: 0 };
        dayMap[day].clicks++;
      }
    });
    setTimeSeriesData(
      Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, val]) => ({ date, ...val })),
    );

    // Campaign breakdown
    const campMap: Record<string, number> = {};
    filteredEvents.forEach((e: { campaign_id: string | null }) => {
      const cid = e.campaign_id || 'unknown';
      campMap[cid] = (campMap[cid] || 0) + 1;
    });
    setCampaignData(
      Object.entries(campMap)
        .map(([cid, opens]) => ({ name: campaigns.find((c) => c.id === cid)?.name || 'Unbekannt', opens }))
        .sort((a, b) => b.opens - a.opens),
    );

    // Top placements
    const placeMap: Record<string, { name: string; location: string; opens: number }> = {};
    filteredEvents.forEach((e: Record<string, unknown>) => {
      const pid = e.placement_id as string;
      if (!pid) return;
      if (!placeMap[pid]) {
        const p = e.placements as { name: string; location: { venue_name: string } | null } | null;
        placeMap[pid] = { name: p?.name || 'Unbekannt', location: p?.location?.venue_name || '', opens: 0 };
      }
      placeMap[pid].opens++;
    });
    setPlacementData(Object.values(placeMap).sort((a, b) => b.opens - a.opens).slice(0, 10));

    // Device breakdown
    const devMap: Record<string, number> = {};
    filteredEvents.forEach((e: { device_type: string | null }) => {
      const dev = e.device_type || 'unbekannt';
      devMap[dev] = (devMap[dev] || 0) + 1;
    });
    setDeviceData(Object.entries(devMap).map(([name, value]) => ({ name, value })));
    setLoading(false);
  }, [supabase, dateFrom, dateTo, campaignId, district, campaigns]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const conversionRate = kpis.totalOpens > 0 ? ((kpis.ctaClicks / kpis.totalOpens) * 100).toFixed(1) : '0';
  const formRate = kpis.totalOpens > 0 ? ((kpis.formSubmits / kpis.totalOpens) * 100).toFixed(1) : '0';

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
          <h1 className="text-3xl font-bold tracking-tight">Analytik</h1>
          <p className="mt-1 text-muted-foreground">Auswertung aller QR-Scans und Events</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="mr-2 h-4 w-4" />
          CSV Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-card">
        <CardContent className="pt-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label>Von</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Bis</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Kampagne</Label>
              <Select value={campaignId} onValueChange={(v) => setCampaignId(v ?? 'all')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Kampagnen</SelectItem>
                  {campaigns.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Bezirk</Label>
              <Select value={district} onValueChange={(v) => setDistrict(v ?? 'all')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Bezirke</SelectItem>
                  {districts.map((d) => (<SelectItem key={d} value={d}>{d}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <KPISkeleton count={4} />
          <ChartSkeleton />
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartSkeleton />
            <ChartSkeleton />
          </div>
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
            <KPIStatCard label="QR-Scans" value={kpis.totalOpens} icon={TrendingUp} color="pink" subtext={`${kpis.uniqueQrCodes} verschiedene QR-Codes`} />
            <KPIStatCard label="CTA-Klicks" value={kpis.ctaClicks} icon={MousePointerClick} color="indigo" subtext={`${conversionRate}% Conversion`} />
            <KPIStatCard label="Formulare" value={kpis.formSubmits} icon={FileText} color="emerald" subtext={`${formRate}% Abschlussrate`} />
            <KPIStatCard label="Aktive Codes" value={kpis.uniqueQrCodes} icon={QrCode} color="orange" />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Scans & Klicks über Zeit" empty={timeSeriesData.length === 0} emptyText="Keine Daten im gewählten Zeitraum" className="lg:col-span-2">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis dataKey="date" {...AXIS_STYLE} />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="opens" name="QR-Scans" stroke={SERIES_COLORS.scans} strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="clicks" name="CTA-Klicks" stroke={SERIES_COLORS.clicks} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Scans pro Kampagne" empty={campaignData.length === 0}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={campaignData} layout="vertical">
                  <CartesianGrid {...GRID_STYLE} />
                  <XAxis type="number" {...AXIS_STYLE} />
                  <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={120} />
                  <Tooltip />
                  <Bar dataKey="opens" name="Scans" fill={SERIES_COLORS.scans} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Gerätetypen" empty={deviceData.length === 0}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={deviceData} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label>
                    {deviceData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Top Placements Table */}
          <ChartCard title="Top-Platzierungen" empty={placementData.length === 0} emptyText="Noch keine Scan-Daten">
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">#</TableHead>
                    <TableHead className="font-semibold">Platzierung</TableHead>
                    <TableHead className="font-semibold">Standort</TableHead>
                    <TableHead className="text-right font-semibold">Scans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placementData.map((p, i) => (
                    <TableRow key={i} className="group transition-colors">
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.location}</TableCell>
                      <TableCell className="text-right font-semibold">{p.opens}</TableCell>
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
