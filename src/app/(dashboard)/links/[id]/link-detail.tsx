'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import {
  Link2, ExternalLink, Copy, Check, Trash2, ToggleLeft, ToggleRight,
  TrendingUp, Users, Globe, Monitor, ArrowUpRight, MousePointerClick,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

import type { ShortLink } from '@/types';
import { deleteShortLink, toggleShortLink } from '../actions';
import { formatDate, formatDateTime } from '@/lib/format';
import { CHART_PALETTE, SERIES_COLORS, AXIS_STYLE, GRID_STYLE } from '@/lib/chart-config';

import { PageHeader } from '@/components/shared/page-header';
import { KPIStatCard } from '@/components/shared/kpi-stat-card';
import { ChartCard } from '@/components/shared/chart-card';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CountryChart } from '@/components/shared/country-chart';

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 6,
  border: '1px solid oklch(0.92 0 0)',
  boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)',
};

type Props = { link: ShortLink };

export function LinkDetail({ link }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);

  const shortUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/r/${link.short_code}`
    : `/r/${link.short_code}`;

  function handleCopy() {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    toast.success('Link kopiert');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleToggle() {
    startTransition(async () => {
      const result = await toggleShortLink(link.id, !link.active);
      if (result.success) toast.success(link.active ? 'Deaktiviert' : 'Aktiviert');
      else toast.error(result.error || 'Fehler');
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteShortLink(link.id);
      if (result.success) {
        toast.success('Link gelöscht');
        router.push('/links');
      } else {
        toast.error(result.error || 'Fehler');
      }
    });
  }

  // Analytics data
  const dateFrom = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  const dateTo = format(new Date(), 'yyyy-MM-dd');

  const { data: analytics } = useQuery({
    queryKey: ['link-analytics', link.id, dateFrom, dateTo],
    queryFn: async () => {
      const from = `${dateFrom}T00:00:00`;
      const to = `${dateTo}T23:59:59`;

      const { data: events } = await supabase
        .from('redirect_events')
        .select('id, device_type, country, ip_hash, referrer, created_at, is_bot')
        .eq('short_link_id', link.id)
        .eq('event_type', 'link_open')
        .gte('created_at', from)
        .lte('created_at', to);

      const allEvents = events || [];
      const humanEvents = allEvents.filter((e) => !e.is_bot);

      const totalClicks = humanEvents.length;
      const uniqueVisitors = new Set(humanEvents.map((e) => e.ip_hash).filter(Boolean)).size;
      const botClicks = allEvents.length - humanEvents.length;

      // Time series
      const dayMap: Record<string, number> = {};
      humanEvents.forEach((e) => {
        const day = e.created_at.slice(0, 10);
        dayMap[day] = (dayMap[day] || 0) + 1;
      });
      const timeSeriesData = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, clicks]) => ({ date, clicks }));

      // Device breakdown
      const devMap: Record<string, number> = {};
      humanEvents.forEach((e) => {
        const dev = e.device_type || 'unbekannt';
        devMap[dev] = (devMap[dev] || 0) + 1;
      });
      const deviceData = Object.entries(devMap).map(([name, value]) => ({ name, value }));

      // Country breakdown
      const countryMap: Record<string, number> = {};
      humanEvents.forEach((e) => {
        const c = e.country || 'Unbekannt';
        countryMap[c] = (countryMap[c] || 0) + 1;
      });
      const countryData = Object.entries(countryMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

      // Referrer breakdown
      const refMap: Record<string, number> = {};
      humanEvents.forEach((e) => {
        if (!e.referrer) return;
        try {
          const host = new URL(e.referrer).hostname.replace('www.', '');
          refMap[host] = (refMap[host] || 0) + 1;
        } catch {
          refMap[e.referrer] = (refMap[e.referrer] || 0) + 1;
        }
      });
      const referrerData = Object.entries(refMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      return { totalClicks, uniqueVisitors, botClicks, timeSeriesData, deviceData, countryData, referrerData };
    },
  });

  const stats = analytics || {
    totalClicks: 0, uniqueVisitors: 0, botClicks: 0,
    timeSeriesData: [], deviceData: [], countryData: [], referrerData: [],
  };

  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title={link.title || link.short_code}
        description={link.target_url}
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleToggle} disabled={isPending}>
              {link.active ? (
                <><ToggleLeft className="mr-1.5 h-3.5 w-3.5" /> Deaktivieren</>
              ) : (
                <><ToggleRight className="mr-1.5 h-3.5 w-3.5" /> Aktivieren</>
              )}
            </Button>
            <Button variant="outline" size="sm" className="text-destructive" onClick={handleDelete} disabled={isPending}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Löschen
            </Button>
          </div>
        }
      />

      {/* Link card */}
      <Card className="border border-border">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Link2 className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium truncate">{shortUrl}</span>
                <button
                  onClick={handleCopy}
                  className="rounded p-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
              <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                <a href={link.target_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-foreground">
                  <ExternalLink className="h-3 w-3" />
                  {link.target_url}
                </a>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-[20px] font-bold tabular-nums">{link.click_count.toLocaleString('de-DE')}</div>
            <div className="text-[11px] text-muted-foreground">Klicks gesamt</div>
          </div>
        </CardContent>
      </Card>

      {/* Meta info */}
      <div className="flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-muted-foreground">
        {link.campaign && <span>Kampagne: <strong>{link.campaign.name}</strong></span>}
        {link.link_group && (
          <span className="flex items-center gap-1">
            Gruppe: <span className="h-2 w-2 rounded-full" style={{ background: link.link_group.color }} />
            <strong>{link.link_group.name}</strong>
          </span>
        )}
        <span>Erstellt: {formatDate(link.created_at)}</span>
        {link.expires_at && <span>Läuft ab: {formatDateTime(link.expires_at)}</span>}
        {link.last_clicked_at && <span>Letzter Klick: {formatDateTime(link.last_clicked_at)}</span>}
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KPIStatCard label="Klicks (30 Tage)" value={stats.totalClicks} icon={MousePointerClick} />
        <KPIStatCard label="Einzelne Besucher" value={stats.uniqueVisitors} icon={Users} />
        <KPIStatCard label="Bot-Klicks (gefiltert)" value={stats.botClicks} icon={Monitor} subtext="Nicht in Statistik enthalten" />
        <KPIStatCard
          label="Referrer"
          value={stats.referrerData.length}
          icon={ArrowUpRight}
          subtext={stats.referrerData[0] ? `Top: ${stats.referrerData[0].name}` : 'Keine Daten'}
        />
      </div>

      {/* Charts */}
      <ChartCard title="Klicks über Zeit" empty={stats.timeSeriesData.length === 0} emptyText="Keine Klicks im Zeitraum">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={stats.timeSeriesData}>
            <CartesianGrid {...GRID_STYLE} />
            <XAxis dataKey="date" {...AXIS_STYLE} />
            <YAxis {...AXIS_STYLE} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="clicks" name="Klicks" stroke={SERIES_COLORS.scans} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Gerätetypen" empty={stats.deviceData.length === 0}>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={stats.deviceData} cx="50%" cy="50%" outerRadius={85} innerRadius={48} dataKey="value" nameKey="name" label={{ fontSize: 11 }} strokeWidth={1}>
                {stats.deviceData.map((_, idx) => (
                  <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top-Referrer" empty={stats.referrerData.length === 0} emptyText="Keine Referrer-Daten">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats.referrerData} layout="vertical">
              <CartesianGrid {...GRID_STYLE} />
              <XAxis type="number" {...AXIS_STYLE} />
              <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={120} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Bar dataKey="value" name="Klicks" fill={SERIES_COLORS.clicks} radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {stats.countryData.length > 0 && (
        <ChartCard title="Klicks nach Land">
          <CountryChart data={stats.countryData} />
        </ChartCard>
      )}
    </div>
  );
}
