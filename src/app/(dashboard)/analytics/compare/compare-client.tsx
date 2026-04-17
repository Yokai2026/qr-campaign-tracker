'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { KPIStatCard } from '@/components/shared/kpi-stat-card';
import { SERIES_COLORS, AXIS_STYLE, GRID_STYLE, TOOLTIP_STYLE, BAR_MAX_SIZE } from '@/lib/chart-config';
import {
  TrendingUp, TrendingDown, Equal, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

type Campaign = { id: string; name: string };
type CompareData = {
  name: string;
  scans: number;
  uniqueVisitors: number;
  devices: Record<string, number>;
};

export function CompareClient() {
  const supabase = createClient();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignA, setCampaignA] = useState('');
  const [campaignB, setCampaignB] = useState('');
  const [dataA, setDataA] = useState<CompareData | null>(null);
  const [dataB, setDataB] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('campaigns').select('id, name').order('name').then(({ data }) => {
      setCampaigns(data || []);
    });
  }, []);

  async function fetchCampaignData(campaignId: string, name: string): Promise<CompareData> {
    const { data: events } = await supabase
      .from('redirect_events')
      .select('id, ip_hash, device_type, is_bot')
      .eq('campaign_id', campaignId)
      .in('event_type', ['qr_open', 'link_open']);

    const rows = (events || []).filter(
      (e: { is_bot: boolean | null }) => !e.is_bot,
    );
    const uniqueIps = new Set(rows.map((e: { ip_hash: string | null }) => e.ip_hash).filter(Boolean));
    const devices: Record<string, number> = {};
    rows.forEach((e: { device_type: string | null }) => {
      const d = e.device_type || 'Unbekannt';
      devices[d] = (devices[d] || 0) + 1;
    });

    return {
      name,
      scans: rows.length,
      uniqueVisitors: uniqueIps.size,
      devices,
    };
  }

  async function handleCompare() {
    if (!campaignA || !campaignB) {
      toast.error('Bitte zwei Kampagnen auswählen');
      return;
    }
    if (campaignA === campaignB) {
      toast.error('Bitte zwei verschiedene Kampagnen wählen');
      return;
    }

    setLoading(true);
    try {
      const nameA = campaigns.find((c) => c.id === campaignA)?.name || 'A';
      const nameB = campaigns.find((c) => c.id === campaignB)?.name || 'B';
      const [a, b] = await Promise.all([
        fetchCampaignData(campaignA, nameA),
        fetchCampaignData(campaignB, nameB),
      ]);
      setDataA(a);
      setDataB(b);
    } catch {
      toast.error('Fehler beim Laden der Daten');
    } finally {
      setLoading(false);
    }
  }

  function getWinnerIcon(a: number, b: number) {
    if (a > b) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (a < b) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Equal className="h-4 w-4 text-muted-foreground" />;
  }

  function getDiffText(a: number, b: number): string {
    if (b === 0 && a === 0) return 'Gleich';
    if (b === 0) return '+100%';
    const diff = ((a - b) / b * 100).toFixed(0);
    return `${Number(diff) > 0 ? '+' : ''}${diff}%`;
  }

  const comparisonChart = dataA && dataB ? [
    { metric: 'Scans', [dataA.name]: dataA.scans, [dataB.name]: dataB.scans },
    { metric: 'Besucher', [dataA.name]: dataA.uniqueVisitors, [dataB.name]: dataB.uniqueVisitors },
  ] : [];

  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="A/B Vergleich"
        description="Vergleiche die Performance von zwei Kampagnen — finde heraus, welche besser ankommt"
        breadcrumbs={[
          { label: 'Analytik', href: '/analytics' },
          { label: 'A/B Vergleich' },
        ]}
      />

      {/* Campaign selectors */}
      <Card>
        <CardHeader>
          <CardTitle>Kampagnen auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="space-y-1.5 flex-1 w-full">
              <Label className="text-xs text-muted-foreground">Kampagne A</Label>
              <Select value={campaignA} onValueChange={(v) => setCampaignA(v ?? '')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="hidden sm:flex items-center justify-center pb-1">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="space-y-1.5 flex-1 w-full">
              <Label className="text-xs text-muted-foreground">Kampagne B</Label>
              <Select value={campaignB} onValueChange={(v) => setCampaignB(v ?? '')}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleCompare} disabled={loading} className="w-full sm:w-auto">
              {loading ? 'Lade...' : 'Vergleichen'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {dataA && dataB && (
        <>
          {/* Side-by-side KPIs */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {dataA.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Scans</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tabular-nums">{dataA.scans}</span>
                    {getWinnerIcon(dataA.scans, dataB.scans)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Einzelne Besucher</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tabular-nums">{dataA.uniqueVisitors}</span>
                    {getWinnerIcon(dataA.uniqueVisitors, dataB.uniqueVisitors)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Unique-Rate</span>
                  <span className="text-sm font-medium tabular-nums">
                    {dataA.scans > 0 ? ((dataA.uniqueVisitors / dataA.scans) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {dataB.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Scans</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tabular-nums">{dataB.scans}</span>
                    {getWinnerIcon(dataB.scans, dataA.scans)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Einzelne Besucher</span>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold tabular-nums">{dataB.uniqueVisitors}</span>
                    {getWinnerIcon(dataB.uniqueVisitors, dataA.uniqueVisitors)}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Unique-Rate</span>
                  <span className="text-sm font-medium tabular-nums">
                    {dataB.scans > 0 ? ((dataB.uniqueVisitors / dataB.scans) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Vergleichs-Übersicht</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={comparisonChart} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid {...GRID_STYLE} vertical={false} />
                  <XAxis dataKey="metric" {...AXIS_STYLE} />
                  <YAxis {...AXIS_STYLE} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)' }} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                  <Bar dataKey={dataA.name} fill={SERIES_COLORS.scans} radius={[6, 6, 0, 0]} maxBarSize={BAR_MAX_SIZE} />
                  <Bar dataKey={dataB.name} fill={SERIES_COLORS.clicks} radius={[6, 6, 0, 0]} maxBarSize={BAR_MAX_SIZE} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Winner Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="rounded-lg bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Ergebnis</p>
                {dataA.scans > dataB.scans ? (
                  <p className="text-lg font-semibold">
                    <span className="text-green-500">{dataA.name}</span> hat{' '}
                    {getDiffText(dataA.scans, dataB.scans)} mehr Scans
                  </p>
                ) : dataB.scans > dataA.scans ? (
                  <p className="text-lg font-semibold">
                    <span className="text-green-500">{dataB.name}</span> hat{' '}
                    {getDiffText(dataB.scans, dataA.scans)} mehr Scans
                  </p>
                ) : (
                  <p className="text-lg font-semibold">Beide Kampagnen sind gleichauf</p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
