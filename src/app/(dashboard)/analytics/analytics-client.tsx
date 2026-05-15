'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/shared/date-picker';
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
  Link2, ArrowUpRight, ShieldCheck, ChevronDown, SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { CHART_PALETTE, SERIES_COLORS, AXIS_STYLE, GRID_STYLE, TOOLTIP_STYLE, BAR_MAX_SIZE } from '@/lib/chart-config';
import dynamic from 'next/dynamic';
import { CountryChart } from '@/components/shared/country-chart';
import { InsightBanner } from '@/components/shared/insight-banner';
import { ConversionFunnel } from '@/components/shared/conversion-funnel';

// react-simple-maps zieht D3 + topojson nach (~250KB). Nur laden,
// wenn der User wirklich bis zum Karten-Block gescrollt hat.
const WorldMap = dynamic(
  () => import('@/components/shared/world-map').then((m) => m.WorldMap),
  { ssr: false, loading: () => <div className="h-[380px] rounded-2xl bg-muted/30" /> },
);
import { PageHeader } from '@/components/shared/page-header';
import { ChartTransition, StaggerContainer, StaggerItem } from '@/components/shared/chart-transition';
import { ReachDetailDialog, type DrillDownScope } from './reach-detail-dialog';

type Props = {
  campaigns: { id: string; name: string }[];
  districts: string[];
};

type BreakdownEntry = { name: string; value: number };

type KpiDeltas = {
  totalOpens: number | null;
  qrScans: number | null;
  linkClicks: number | null;
  uniqueScans: number | null;
  ctaClicks: number | null;
  formSubmits: number | null;
  conversionRate: number | null;
};

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
  deltas: KpiDeltas;
  botCount: number;
  timeSeriesData: { date: string; qr: number; link: number }[];
  hourlyData: { hour: number; label: string; qr: number; link: number }[];
  weekdayData: { day: string; sortKey: number; qr: number; link: number }[];
  peakSlot: { dayLabel: string; hourLabel: string; count: number } | null;
  campaignData: { name: string; opens: number }[];
  placementData: { name: string; opens: number; location: string }[];
  deviceData: BreakdownEntry[];
  browserData: BreakdownEntry[];
  osData: BreakdownEntry[];
  countryData: BreakdownEntry[];
  unknownCountryCount: number;
  referrerData: BreakdownEntry[];
};

/** Percent change vs. previous value. null when previous had no data AND current is also zero. */
function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return ((current - previous) / previous) * 100;
}

type SourceFilter = 'all' | 'qr' | 'link';

export function AnalyticsClient({ campaigns, districts }: Props) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [dateFrom, setDateFrom] = useState(searchParams.get('from') || format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(searchParams.get('to') || format(new Date(), 'yyyy-MM-dd'));
  const [campaignId, setCampaignId] = useState<string>(searchParams.get('campaign') || 'all');
  const [district, setDistrict] = useState<string>(searchParams.get('district') || 'all');
  const [source, setSource] = useState<SourceFilter>((searchParams.get('source') as SourceFilter) || 'all');
  const [isLive, setIsLive] = useState(false);
  // Drill-Down-Modal — öffnet sich beim Klick auf eine KPI-Card mit
  // granularer Pro-Item-Liste.
  const [drillDown, setDrillDown] = useState<DrillDownScope | null>(null);
  // Mobile filter drawer — on desktop the filters are always inline (CSS handles it).
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const activeSecondaryFilters =
    (source !== 'all' ? 1 : 0) + (campaignId !== 'all' ? 1 : 0) + (district !== 'all' ? 1 : 0);

  // Sync filters → URL (dates always included, 'all' values omitted)
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('from', dateFrom);
    params.set('to', dateTo);
    if (campaignId !== 'all') params.set('campaign', campaignId);
    if (district !== 'all') params.set('district', district);
    if (source !== 'all') params.set('source', source);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [dateFrom, dateTo, campaignId, district, source, pathname, router]);

  // Realtime: invalidate analytics on new events
  const invalidateAnalytics = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] });
  }, [queryClient]);

  useEffect(() => {
    // Realtime ist nice-to-have, aber wenn die Subscription wirft
    // (Realtime-Modul nicht initialisiert, RLS-Probleme, alte Versionen)
    // soll die ganze Analytics-Page NICHT abstuerzen. Try/catch + Guard.
    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      const built = supabase
        .channel('analytics-realtime')
        ?.on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'redirect_events' },
          invalidateAnalytics,
        );
      if (built && typeof built.subscribe === 'function') {
        channel = built.subscribe((status) => {
          setIsLive(status === 'SUBSCRIBED');
        });
      }
    } catch (err) {
      console.error('[analytics] realtime subscribe failed:', err);
    }

    return () => {
      try {
        if (channel) supabase.removeChannel(channel);
      } catch {
        // ignore
      }
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

      // =========================================================
      // Period-over-Period — fetch same-duration previous window
      // =========================================================
      const fromMs = new Date(from).getTime();
      const toMs = new Date(to).getTime();
      const periodMs = toMs - fromMs;
      const prevFromIso = new Date(fromMs - periodMs - 1000).toISOString();
      const prevToIso = new Date(fromMs - 1000).toISOString();

      let prevQuery = supabase
        .from('redirect_events')
        .select('event_type, ip_hash, campaign_id, placement_id, placements(location:locations(district))')
        .in('event_type', eventTypes)
        .eq('is_bot', false)
        .gte('created_at', prevFromIso)
        .lte('created_at', prevToIso);
      if (campaignId !== 'all') prevQuery = prevQuery.eq('campaign_id', campaignId);
      const { data: prevRedirect } = await prevQuery;

      let prevFiltered = prevRedirect || [];
      if (district !== 'all') {
        prevFiltered = prevFiltered.filter((e: Record<string, unknown>) => {
          const p = e.placements as { location: { district: string | null } | null } | null;
          return p?.location?.district === district;
        });
      }

      let prevPageQuery = supabase
        .from('page_events')
        .select('event_type, campaign_id')
        .gte('created_at', prevFromIso)
        .lte('created_at', prevToIso);
      if (campaignId !== 'all') prevPageQuery = prevPageQuery.eq('campaign_id', campaignId);
      const { data: prevPage } = await prevPageQuery;

      const prevTotalOpens = prevFiltered.length;
      const prevQrScans = prevFiltered.filter((e: { event_type: string }) => e.event_type === 'qr_open').length;
      const prevLinkClicks = prevFiltered.filter((e: { event_type: string }) => e.event_type === 'link_open').length;
      const prevUniqueIps = new Set(prevFiltered.map((e: { ip_hash: string | null }) => e.ip_hash).filter(Boolean)).size;
      const prevCtaClicks = (prevPage || []).filter((e: { event_type: string }) => e.event_type === 'cta_click').length;
      const prevFormSubmits = (prevPage || []).filter((e: { event_type: string }) => e.event_type === 'form_submit').length;
      const prevConversionRate = prevTotalOpens > 0 ? (prevCtaClicks / prevTotalOpens) * 100 : 0;
      const currConversionRate = kpis.totalOpens > 0 ? (kpis.ctaClicks / kpis.totalOpens) * 100 : 0;

      const deltas: KpiDeltas = {
        totalOpens: pctChange(kpis.totalOpens, prevTotalOpens),
        qrScans: pctChange(kpis.qrScans, prevQrScans),
        linkClicks: pctChange(kpis.linkClicks, prevLinkClicks),
        uniqueScans: pctChange(kpis.uniqueScans, prevUniqueIps),
        ctaClicks: pctChange(kpis.ctaClicks, prevCtaClicks),
        formSubmits: pctChange(kpis.formSubmits, prevFormSubmits),
        conversionRate: pctChange(currConversionRate, prevConversionRate),
      };

      // Bot count (same window, is_bot=true) — shown as transparency indicator
      let botQuery = supabase
        .from('redirect_events')
        .select('id', { count: 'exact', head: true })
        .in('event_type', eventTypes)
        .eq('is_bot', true)
        .gte('created_at', from)
        .lte('created_at', to);
      if (campaignId !== 'all') botQuery = botQuery.eq('campaign_id', campaignId);
      const { count: botCount } = await botQuery;

      // Time series — QR vs Link pro Tag. ALLE Tage im gewaehlten Zeitraum
      // werden gefuellt (auch wenn 0 Events) damit die Kurve sauber von links
      // nach rechts durchgeht und nicht ploetzlich auftaucht.
      const dayMap: Record<string, { qr: number; link: number }> = {};
      const startDate = new Date(`${dateFrom}T00:00:00`);
      const endDate = new Date(`${dateTo}T00:00:00`);
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        dayMap[key] = { qr: 0, link: 0 };
      }
      filteredEvents.forEach((e: Record<string, unknown>) => {
        const day = (e.created_at as string).slice(0, 10);
        if (!dayMap[day]) dayMap[day] = { qr: 0, link: 0 };
        if (e.event_type === 'qr_open') dayMap[day].qr++;
        else if (e.event_type === 'link_open') dayMap[day].link++;
      });
      const timeSeriesData = Object.entries(dayMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, val]) => ({ date, ...val }));

      // Stunden-Verteilung (0–23 Lokalzeit) ueber den Filter-Zeitraum — qr + link separat
      const hourlyData: { hour: number; label: string; qr: number; link: number }[] =
        Array.from({ length: 24 }, (_, h) => ({
          hour: h,
          label: `${String(h).padStart(2, '0')}:00`,
          qr: 0,
          link: 0,
        }));
      filteredEvents.forEach((e: Record<string, unknown>) => {
        const dt = new Date(e.created_at as string);
        const h = dt.getHours();
        if (h < 0 || h >= 24) return;
        if (e.event_type === 'qr_open') hourlyData[h].qr++;
        else if (e.event_type === 'link_open') hourlyData[h].link++;
      });

      // Wochentag-Verteilung (Mo–So) ueber den Filter-Zeitraum
      const WEEKDAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
      const weekdayData: { day: string; sortKey: number; qr: number; link: number }[] = [
        { day: 'Mo', sortKey: 1, qr: 0, link: 0 },
        { day: 'Di', sortKey: 2, qr: 0, link: 0 },
        { day: 'Mi', sortKey: 3, qr: 0, link: 0 },
        { day: 'Do', sortKey: 4, qr: 0, link: 0 },
        { day: 'Fr', sortKey: 5, qr: 0, link: 0 },
        { day: 'Sa', sortKey: 6, qr: 0, link: 0 },
        { day: 'So', sortKey: 7, qr: 0, link: 0 },
      ];
      filteredEvents.forEach((e: Record<string, unknown>) => {
        const dow = new Date(e.created_at as string).getDay();
        const target = weekdayData.find((w) => w.day === WEEKDAYS_DE[dow]);
        if (!target) return;
        if (e.event_type === 'qr_open') target.qr++;
        else if (e.event_type === 'link_open') target.link++;
      });

      // Peak-Slot (welche (Wochentag, Stunde)-Kombination ist am stärksten)
      const slotMap = new Map<string, number>();
      filteredEvents.forEach((e: Record<string, unknown>) => {
        const dt = new Date(e.created_at as string);
        const key = `${dt.getDay()}|${dt.getHours()}`;
        slotMap.set(key, (slotMap.get(key) ?? 0) + 1);
      });
      let peakSlot: { dayLabel: string; hourLabel: string; count: number } | null = null;
      let peakBest = 0;
      for (const [key, count] of slotMap) {
        if (count > peakBest) {
          peakBest = count;
          const [d, h] = key.split('|').map(Number);
          peakSlot = {
            dayLabel: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][d],
            hourLabel: `${String(h).padStart(2, '0')}:00 – ${String((h + 1) % 24).padStart(2, '0')}:00`,
            count,
          };
        }
      }

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

      return { kpis, deltas, botCount: botCount ?? 0, timeSeriesData, hourlyData, weekdayData, peakSlot, campaignData, placementData, deviceData, browserData, osData, countryData, unknownCountryCount, referrerData };
    },
  });

  const kpis = data?.kpis ?? { totalOpens: 0, qrScans: 0, linkClicks: 0, uniqueScans: 0, uniqueQrCodes: 0, ctaClicks: 0, formSubmits: 0 };
  const deltas = data?.deltas ?? { totalOpens: null, qrScans: null, linkClicks: null, uniqueScans: null, ctaClicks: null, formSubmits: null, conversionRate: null };
  const botCount = data?.botCount ?? 0;
  const timeSeriesData = data?.timeSeriesData ?? [];
  const hourlyData = data?.hourlyData ?? Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    label: `${String(h).padStart(2, '0')}:00`,
    qr: 0,
    link: 0,
  }));
  const weekdayData = data?.weekdayData ?? [];
  const peakSlot = data?.peakSlot ?? null;
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

  // Anomalie-Erkennung: Tage, an denen Total > Mittelwert + 2*Standardabweichung
  // — werden im Chart als orange Dots hervorgehoben. Hilft User "ungewoehnliche
  // Spitzen" zu erkennen ohne dass er die Kurve manuell scannen muss.
  // Mindestens 5 Tage Daten noetig, damit eine sinnvolle Statistik moeglich ist.
  const anomalyThreshold = (() => {
    if (timeSeriesData.length < 5) return Number.POSITIVE_INFINITY;
    const totals = timeSeriesData.map((d) => d.qr + d.link);
    const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
    const variance =
      totals.reduce((a, b) => a + (b - mean) ** 2, 0) / totals.length;
    const std = Math.sqrt(variance);
    // 2-Sigma Schwelle, mit Mindestabstand zur Vermeidung von "alles ist Anomalie" bei flat data
    return Math.max(mean + 2 * std, mean + 3);
  })();
  const timeSeriesWithAnomalies = timeSeriesData.map((d) => ({
    ...d,
    total: d.qr + d.link,
    isAnomaly: d.qr + d.link > anomalyThreshold,
  }));
  const anomalyCount = timeSeriesWithAnomalies.filter((d) => d.isAnomaly).length;

  // Top-Kampagne fuer Insight-Banner (bereits in campaignData sortiert)
  const topCampaignForInsight =
    campaignData.length > 0 && campaignData[0].opens > 0
      ? { name: campaignData[0].name, opens: campaignData[0].opens }
      : null;

  const chartTransitionKey = `${dateFrom}-${dateTo}-${campaignId}-${district}-${source}`;

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
      const { data: rawData, error } = await query;

      if (error) throw error;

      let data = rawData;

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
    <div className="space-y-8 animate-in-card">
      <PageHeader
        title="Analytik"
        description="Auswertung aller QR-Scans und Link-Klicks"
        badge={isLive ? (
          <span
            className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400"
            title="Realtime — Daten aktualisieren sich sobald Aufrufe eintreffen"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.6s_ease-in-out_infinite] rounded-full bg-emerald-400/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        ) : undefined}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" render={<a href="/analytics/compare" />}>
              <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">A/B Vergleich</span>
              <span className="sm:hidden">A/B</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                // jspdf + jspdf-autotable sind ~250KB — erst beim Klick laden,
                // damit sie nicht im Initial-Analytics-Bundle stecken.
                const { generateAnalyticsPdf } = await import('@/lib/pdf/generate');
                generateAnalyticsPdf({
                  dateFrom, dateTo, kpis, campaignData, placementData, deviceData, browserData, osData, countryData,
                });
              }}
            >
              <FileDown className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">PDF Bericht</span>
              <span className="sm:hidden">PDF</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">CSV Export</span>
              <span className="sm:hidden">CSV</span>
            </Button>
          </div>
        }
      />

      {/* Filters — sticky am oberen Rand, bleibt beim Scrollen sichtbar.
          backdrop-blur sorgt fuer "Frosted-Glass"-Effekt sobald Content drunter durchscrollt. */}
      <div className="sticky top-2 z-20 rounded-2xl border border-border bg-card/95 p-4 shadow-[var(--shadow-sm)] backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
        {/* Date-Preset Chips — always visible */}
        <DatePresetRow
          dateFrom={dateFrom}
          onApply={(from, to) => {
            setDateFrom(from);
            setDateTo(to);
          }}
        />

        {/* Date range — always visible, compact 2-col */}
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Von</Label>
            <DatePicker value={dateFrom} onChange={setDateFrom} maxDate={dateTo} ariaLabel="Startdatum" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Bis</Label>
            <DatePicker
              value={dateTo}
              onChange={setDateTo}
              minDate={dateFrom}
              maxDate={format(new Date(), 'yyyy-MM-dd')}
              ariaLabel="Enddatum"
            />
          </div>
        </div>

        {/* Mobile toggle — hidden on lg+, where the filters stay inline */}
        <button
          type="button"
          onClick={() => setMobileFiltersOpen((v) => !v)}
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2 text-[13px] font-medium text-foreground transition-colors hover:border-brand/30 hover:bg-muted/40 lg:hidden"
          aria-expanded={mobileFiltersOpen}
        >
          <span className="inline-flex items-center gap-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            Weitere Filter
            {activeSecondaryFilters > 0 && (
              <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold text-brand">
                {activeSecondaryFilters}
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${mobileFiltersOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Secondary filters — always visible on lg, collapsible on mobile */}
        <div
          className={`mt-3 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:!grid ${mobileFiltersOpen ? 'grid grid-cols-1' : 'hidden'}`}
        >
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Quelle</Label>
            {/* Chips statt Dropdown — nur 3 Optionen, sofort sichtbar/klickbar
                spart einen Klick im Vergleich zum Select. */}
            <div
              role="radiogroup"
              aria-label="Quelle filtern"
              className="inline-flex h-9 w-full items-center gap-0.5 rounded-md border border-border bg-muted/30 p-0.5"
            >
              {(
                [
                  { value: 'all', label: 'Alle', icon: null },
                  { value: 'qr', label: 'QR-Codes', icon: QrCode },
                  { value: 'link', label: 'Kurzlinks', icon: Link2 },
                ] as const
              ).map((opt) => {
                const active = source === opt.value;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSource(opt.value as SourceFilter)}
                    className={
                      'flex flex-1 items-center justify-center gap-1.5 rounded-sm px-2 py-1 text-[12px] font-medium transition-colors ' +
                      (active
                        ? 'bg-card text-foreground shadow-[var(--shadow-xs)]'
                        : 'text-muted-foreground hover:text-foreground')
                    }
                  >
                    {Icon && <Icon className="h-3 w-3" strokeWidth={2} />}
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Kampagne</Label>
            <Select value={campaignId} onValueChange={(v) => setCampaignId(v ?? 'all')}>
              <SelectTrigger className="h-9 text-[13px]">
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
              <SelectTrigger className="h-9 text-[13px]">
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

      {/* Insight-Banner — Plain-Language-Zusammenfassung, erfuellt die "5-Sekunden-Regel":
          User sieht IN EINEM SATZ wie es im Zeitraum gerade laeuft, ohne 7 KPI-Cards zu scannen. */}
      {!loading && (
        <InsightBanner
          totalOpens={kpis.totalOpens}
          delta={deltas.totalOpens}
          topCampaign={topCampaignForInsight}
          peakSlot={peakSlot}
          uniqueVisitors={kpis.uniqueScans}
          hasData={kpis.totalOpens > 0}
        />
      )}

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
          {/* 01 — Überblick: Reichweite + (conditional) Engagement zusammengefasst.
              Statt zwei separater Sections direkt nebeneinander mit doppeltem Header
              wird hier eine einheitliche "Überblick"-Section gerendert — die zwei
              KPI-Gruppen werden durch einen Untertitel ("Reichweite" / "Engagement")
              getrennt, nicht durch zwei volle Section-Header. */}
          <section className="space-y-4 scroll-mt-24" aria-labelledby="section-uebersicht">
            <AnalyticsSectionHeader
              step="01 · Überblick"
              title="Reichweite & Engagement"
              description="Wie oft wurden deine Codes und Links aufgerufen und was tun Besucher danach"
            />
            <div className="space-y-2">
              <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                Reichweite
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
              <KPIStatCard
                label="Aufrufe gesamt"
                value={kpis.totalOpens}
                icon={TrendingUp}
                subtext={kpis.totalOpens ? `${kpis.qrScans} QR · ${kpis.linkClicks} Link` : 'Noch keine Aufrufe'}
                hint="Klick öffnet Liste aller QR-Codes und Kurzlinks mit Count."
                delta={deltas.totalOpens}
                deltaLabel="vs. Vorperiode"
                onClick={() => setDrillDown('all')}
              />
              <KPIStatCard
                label="QR-Scans"
                value={kpis.qrScans}
                icon={QrCode}
                subtext={kpis.qrScans ? `${kpis.uniqueQrCodes} aktive Codes` : 'Noch keine Scans'}
                hint="Klick öffnet Liste der QR-Codes mit Scan-Anzahl pro Code."
                delta={deltas.qrScans}
                deltaLabel="vs. Vorperiode"
                onClick={() => setDrillDown('qr')}
              />
              <KPIStatCard
                label="Link-Klicks"
                value={kpis.linkClicks}
                icon={Link2}
                subtext="Aufrufe über Kurzlinks"
                hint="Klick öffnet Liste der Kurzlinks mit Klick-Anzahl pro Link."
                delta={deltas.linkClicks}
                deltaLabel="vs. Vorperiode"
                onClick={() => setDrillDown('link')}
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
                hint="Klick öffnet Breakdown pro Besucher — wie viele Scans, QR vs. Link."
                delta={deltas.uniqueScans}
                deltaLabel="vs. Vorperiode"
                onClick={() => setDrillDown('unique')}
              />
              </div>
            </div>

            {/* Engagement — Sub-Block der Überblick-Section, nur wenn Landing-Page-Tracking aktiv.
                Funnel ergaenzt die Endzahlen mit dem Drop-off zwischen den Steps. */}
            {(kpis.ctaClicks > 0 || kpis.formSubmits > 0) && (
              <div className="space-y-3 pt-1">
                <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  Engagement auf der Zielseite
                </div>
                <div className="grid gap-3 lg:grid-cols-5">
                  {/* KPI-Cards — 3 Cards in 3 Spalten (Desktop), darunter Funnel mit 2 Spalten */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:col-span-3 lg:grid-cols-1">
                    <KPIStatCard
                      label="CTA-Klicks"
                      value={kpis.ctaClicks}
                      icon={MousePointerClick}
                      subtext="Klicks auf der Zielseite"
                      hint="Klicks auf Buttons/Links auf deiner Zielseite (via Tracking-Script)."
                      delta={deltas.ctaClicks}
                      deltaLabel="vs. Vorperiode"
                    />
                    <KPIStatCard
                      label="Formular-Abschlüsse"
                      value={kpis.formSubmits}
                      icon={FileText}
                      subtext={kpis.formSubmits ? `${formRate}% der Besucher` : 'Noch keine Abschlüsse'}
                      hint="Gesendete Formulare auf der Zielseite (z. B. Anmeldungen, Kontakte)."
                      delta={deltas.formSubmits}
                      deltaLabel="vs. Vorperiode"
                    />
                    <KPIStatCard
                      label="Conversion-Rate"
                      value={`${conversionRate}%`}
                      icon={ArrowUpRight}
                      subtext="CTA-Klicks ÷ Aufrufe"
                      hint="Anteil der Aufrufe, die zu einer CTA-Aktion geführt haben."
                      delta={deltas.conversionRate}
                      deltaLabel="vs. Vorperiode"
                    />
                  </div>
                  {/* Conversion-Funnel — visualisiert den Drop-off Aufruf→CTA→Formular */}
                  <ConversionFunnel
                    totalOpens={kpis.totalOpens}
                    ctaClicks={kpis.ctaClicks}
                    formSubmits={kpis.formSubmits}
                    className="lg:col-span-2"
                  />
                </div>
              </div>
            )}

            <ReachDetailDialog
              scope={drillDown}
              dateFrom={dateFrom}
              dateTo={dateTo}
              campaignId={campaignId}
              district={district}
              onClose={() => setDrillDown(null)}
            />
            {botCount > 0 && (
              <p className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-brand/70" />
                {botCount.toLocaleString('de-DE')} Bot-Zugriff{botCount === 1 ? '' : 'e'} erkannt und ausgefiltert
              </p>
            )}
          </section>

          {/* 02 — Verlauf: Zeitreihen-Chart als eigener Block. Volle Breite,
              ohne Konkurrenz durch andere Charts — das ist DER Trend-Indikator.
              Anomalie-Dots: Tage mit Total > Mittelwert+2σ werden orange markiert,
              damit der User Spitzen sofort sieht ohne mit dem Auge zu scannen. */}
          <section className="space-y-4 scroll-mt-24" aria-labelledby="section-verlauf">
            <AnalyticsSectionHeader
              step="02 · Verlauf"
              title="Aufrufe im Zeitverlauf"
              description="QR-Scans und Link-Klicks Tag für Tag — auffällige Spitzen sind orange markiert"
            />
            <ChartTransition transitionKey={chartTransitionKey}>
              <ChartCard title="QR-Scans & Link-Klicks über Zeit" empty={timeSeriesData.length === 0} emptyText="Keine Daten im gewählten Zeitraum">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={timeSeriesWithAnomalies} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid {...GRID_STYLE} />
                    <XAxis
                      dataKey="date"
                      {...AXIS_STYLE}
                      tickFormatter={(d: string) => {
                        const date = new Date(d);
                        return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
                      }}
                      minTickGap={24}
                    />
                    <YAxis {...AXIS_STYLE} allowDecimals={false} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ stroke: 'var(--border)', strokeWidth: 1 }}
                      labelFormatter={(d) =>
                        typeof d === 'string'
                          ? new Date(d).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })
                          : String(d ?? '')
                      }
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                    <Line
                      type="monotone"
                      dataKey="qr"
                      name="QR-Scans"
                      stroke={SERIES_COLORS.scans}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="link"
                      name="Link-Klicks"
                      stroke={SERIES_COLORS.clicks}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                    />
                    {/* Unsichtbare Anomalie-Linie ueber dem "total" — nur fuer die orange
                        Dots an Spitzen-Tagen. Selbst nicht sichtbar (transparent stroke). */}
                    <Line
                      type="monotone"
                      dataKey="total"
                      name="Anomalien"
                      stroke="transparent"
                      strokeWidth={0}
                      legendType="none"
                      activeDot={false}
                      isAnimationActive={false}
                      dot={(props: { cx?: number; cy?: number; payload?: { isAnomaly?: boolean } }) => {
                        if (!props.payload?.isAnomaly || props.cx == null || props.cy == null) {
                          return <g />;
                        }
                        return (
                          <g>
                            <circle
                              cx={props.cx}
                              cy={props.cy}
                              r={8}
                              fill="rgb(251 146 60 / 0.18)"
                              stroke="rgb(251 146 60 / 0.4)"
                              strokeWidth={1}
                            />
                            <circle cx={props.cx} cy={props.cy} r={4} fill="rgb(251 146 60)" stroke="white" strokeWidth={1.5} />
                          </g>
                        );
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
              {anomalyCount > 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <span className="inline-flex h-2 w-2 rounded-full bg-orange-400" />
                  <span>
                    <span className="font-medium text-foreground tabular-nums">{anomalyCount}</span>{' '}
                    {anomalyCount === 1 ? 'auffälliger Tag' : 'auffällige Tage'} im Zeitraum (Total ≥ Mittelwert + 2σ) —
                    schau, ob eine Kampagne oder ein Event den Spike erklärt
                  </span>
                </p>
              )}

              {/* Fokussierte Einzel-Charts: gleicher Zeitraum, aber QR und Link
                  je in einem eigenen Bar-Chart. Macht es einfacher den isolierten
                  Trend einer Quelle zu lesen, ohne dass die jeweils andere stoert. */}
              <div className="mt-2 grid gap-4 lg:grid-cols-2">
                <ChartCard title="QR-Scans im Verlauf" empty={timeSeriesData.length === 0 || timeSeriesData.every((d) => d.qr === 0)} emptyText="Keine QR-Scans im Zeitraum">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={timeSeriesData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid {...GRID_STYLE} vertical={false} />
                      <XAxis
                        dataKey="date"
                        {...AXIS_STYLE}
                        tickFormatter={(d: string) => {
                          const date = new Date(d);
                          return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
                        }}
                        minTickGap={24}
                      />
                      <YAxis {...AXIS_STYLE} allowDecimals={false} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: 'var(--muted)' }}
                        labelFormatter={(d) =>
                          typeof d === 'string'
                            ? new Date(d).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })
                            : String(d ?? '')
                        }
                        formatter={(value) => [Number(value ?? 0).toLocaleString('de-DE'), 'QR-Scans']}
                      />
                      <Bar dataKey="qr" name="QR-Scans" fill={SERIES_COLORS.scans} radius={[4, 4, 0, 0]} maxBarSize={BAR_MAX_SIZE} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Link-Klicks im Verlauf" empty={timeSeriesData.length === 0 || timeSeriesData.every((d) => d.link === 0)} emptyText="Keine Link-Klicks im Zeitraum">
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={timeSeriesData} margin={{ top: 10, right: 12, left: -10, bottom: 0 }}>
                      <CartesianGrid {...GRID_STYLE} vertical={false} />
                      <XAxis
                        dataKey="date"
                        {...AXIS_STYLE}
                        tickFormatter={(d: string) => {
                          const date = new Date(d);
                          return date.toLocaleDateString('de-DE', { day: '2-digit', month: 'short' });
                        }}
                        minTickGap={24}
                      />
                      <YAxis {...AXIS_STYLE} allowDecimals={false} />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        cursor={{ fill: 'var(--muted)' }}
                        labelFormatter={(d) =>
                          typeof d === 'string'
                            ? new Date(d).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' })
                            : String(d ?? '')
                        }
                        formatter={(value) => [Number(value ?? 0).toLocaleString('de-DE'), 'Link-Klicks']}
                      />
                      <Bar dataKey="link" name="Link-Klicks" fill={SERIES_COLORS.clicks} radius={[4, 4, 0, 0]} maxBarSize={BAR_MAX_SIZE} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </ChartTransition>
          </section>

          {/* 03 — Performance: Was läuft? Kampagnen-Ranking + Top-Platzierungen
              gehören thematisch zusammen (beide beantworten "wer/was zieht Aufrufe").
              Früher waren sie zwei weit entfernte Blöcke — jetzt nebeneinander. */}
          <section className="space-y-4 scroll-mt-24" aria-labelledby="section-performance">
            <AnalyticsSectionHeader
              step="03 · Performance"
              title="Was läuft am besten"
              description="Top-Kampagnen und Top-Platzierungen im gewählten Zeitraum"
            />
            <ChartTransition transitionKey={chartTransitionKey + '-perf'}>
              <div className="grid gap-4 lg:grid-cols-2">
                <ChartCard title="Aufrufe pro Kampagne" empty={campaignData.length === 0} emptyText="Keine Kampagnen-Daten">
                  <ResponsiveContainer width="100%" height={Math.max(240, campaignData.length * 36)}>
                    <BarChart data={campaignData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid {...GRID_STYLE} horizontal={false} />
                      <XAxis type="number" {...AXIS_STYLE} allowDecimals={false} />
                      <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={90} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)' }} />
                      <Bar dataKey="opens" name="Aufrufe" fill={SERIES_COLORS.scans} radius={[0, 6, 6, 0]} maxBarSize={BAR_MAX_SIZE} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title="Top-Platzierungen" empty={placementData.length === 0} emptyText="Noch keine Scan-Daten">
                  {/* Desktop: table with 4 columns */}
                  <div className="hidden sm:block">
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
                  </div>
                  {/* Mobile: card-list — readable without horizontal scroll */}
                  <ul className="divide-y divide-border/60 sm:hidden">
                    {placementData.map((p, i) => (
                      <li key={i} className="flex items-center gap-3 py-3">
                        <span className="tabular-nums flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted text-[12px] font-semibold text-muted-foreground">
                          {i + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-medium">{p.name}</div>
                          {p.location && (
                            <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{p.location}</div>
                          )}
                        </div>
                        <span className="tabular-nums text-[14px] font-semibold">{p.opens}</span>
                      </li>
                    ))}
                  </ul>
                </ChartCard>
              </div>
            </ChartTransition>
          </section>

          {/* 04 — Zeitmuster: Stunden + Wochentage + Peak-Slot */}
          <section className="space-y-4 scroll-mt-24" aria-labelledby="section-zeitmuster">
            <AnalyticsSectionHeader
              step="04 · Zeitmuster"
              title="Wann Besucher aktiv sind"
              description="Verteilung nach Tagesstunde, Wochentag und stärkster Aktivitätsphase"
            />
            <ChartTransition transitionKey={chartTransitionKey + '-times'}>
            <div className="grid gap-4 lg:grid-cols-2">
              <ChartCard title="Verteilung über Tagesstunden" empty={hourlyData.every((h) => h.qr === 0 && h.link === 0)} emptyText="Keine Aufrufe im gewählten Zeitraum" className="lg:col-span-2">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={hourlyData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid {...GRID_STYLE} vertical={false} />
                    <XAxis dataKey="label" {...AXIS_STYLE} interval={1} />
                    <YAxis {...AXIS_STYLE} allowDecimals={false} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: 'var(--muted)' }}
                      labelFormatter={(l) => `${l} – ${String((parseInt(String(l).slice(0, 2), 10) + 1) % 24).padStart(2, '0')}:00 Uhr`}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                    <Bar dataKey="qr" name="QR-Scans" stackId="t" fill={SERIES_COLORS.scans} radius={[0, 0, 0, 0]} maxBarSize={BAR_MAX_SIZE} />
                    <Bar dataKey="link" name="Link-Klicks" stackId="t" fill={SERIES_COLORS.clicks} radius={[4, 4, 0, 0]} maxBarSize={BAR_MAX_SIZE} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Verteilung über Wochentage" empty={weekdayData.every((w) => w.qr === 0 && w.link === 0)} emptyText="Keine Aufrufe im gewählten Zeitraum">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={weekdayData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <CartesianGrid {...GRID_STYLE} vertical={false} />
                    <XAxis dataKey="day" {...AXIS_STYLE} />
                    <YAxis {...AXIS_STYLE} allowDecimals={false} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: 'var(--muted)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                    <Bar dataKey="qr" name="QR-Scans" stackId="t" fill={SERIES_COLORS.scans} radius={[0, 0, 0, 0]} maxBarSize={BAR_MAX_SIZE} />
                    <Bar dataKey="link" name="Link-Klicks" stackId="t" fill={SERIES_COLORS.clicks} radius={[4, 4, 0, 0]} maxBarSize={BAR_MAX_SIZE} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-center">
                <div className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Peak-Zeit</div>
                {peakSlot ? (
                  <>
                    <div className="mt-2 text-[24px] font-semibold leading-tight tracking-tight">
                      {peakSlot.dayLabel}
                    </div>
                    <div className="text-[20px] font-medium tabular-nums text-brand">{peakSlot.hourLabel}</div>
                    <div className="mt-3 text-[12.5px] text-muted-foreground">
                      In diesem Slot wurden im gewählten Zeitraum <span className="font-semibold text-foreground tabular-nums">{peakSlot.count}</span> {peakSlot.count === 1 ? 'Aufruf' : 'Aufrufe'} aufgezeichnet — die stärkste Aktivitätsphase deiner Kampagne.
                    </div>
                  </>
                ) : (
                  <div className="mt-3 text-[12.5px] text-muted-foreground">
                    Noch zu wenig Daten, um einen Peak-Slot zu bestimmen.
                  </div>
                )}
              </div>
            </div>
            </ChartTransition>
          </section>

          {/* 05 — Publikum: Geräte + Browser + OS zusammen in einer Section.
              Vorher war "Gerätetypen" allein in "Analyse" und Browser/OS in "Technik" —
              das war thematisch dasselbe ("wer ruft auf"). Jetzt 3-Spalten-Pies. */}
          <section className="space-y-4 scroll-mt-24" aria-labelledby="section-publikum">
            <AnalyticsSectionHeader
              step="05 · Publikum"
              title="Wer ruft auf"
              description="Geräte, Browser und Betriebssysteme deiner Besucher"
            />
            <div className="grid gap-4 lg:grid-cols-3">
              <ChartCard title="Gerätetypen" empty={deviceData.length === 0}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" outerRadius={86} innerRadius={52} dataKey="value" nameKey="name" label={false} stroke="var(--card)" strokeWidth={2} paddingAngle={1.5}>
                      {deviceData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Browser" empty={browserData.length === 0}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={browserData} cx="50%" cy="50%" outerRadius={86} innerRadius={52} dataKey="value" nameKey="name" label={false} stroke="var(--card)" strokeWidth={2} paddingAngle={1.5}>
                      {browserData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Betriebssystem" empty={osData.length === 0}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={osData} cx="50%" cy="50%" outerRadius={86} innerRadius={52} dataKey="value" nameKey="name" label={false} stroke="var(--card)" strokeWidth={2} paddingAngle={1.5}>
                      {osData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </div>
          </section>

          {/* 06 — Herkunft: Wo kommen die Besucher her? Geo (Land, Karte) + Referrer
              (Verweis-URLs) gehören thematisch zusammen. Vorher waren Geo eine Section
              und Referrer ein standalone-Chart-Card ohne Section-Header → unfertig wirkend. */}
          {(countryData.length > 0 || unknownCountryCount > 0 || referrerData.length > 0) && (
            <section className="space-y-4 scroll-mt-24" aria-labelledby="section-herkunft">
              <AnalyticsSectionHeader
                step="06 · Herkunft"
                title="Wo kommen Aufrufe her"
                description="Geografische Verteilung und Verweis-Quellen (Referrer)"
              />

              {countryData.length > 0 ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <ChartCard title="Weltkarte">
                    <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                      <Globe className="h-3.5 w-3.5" />
                      Geografische Verteilung der Aufrufe
                    </div>
                    <WorldMap data={countryData} />
                  </ChartCard>
                  <ChartCard title="Aufrufe nach Land">
                    <CountryChart data={countryData} />
                  </ChartCard>
                </div>
              ) : unknownCountryCount > 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-6 text-center">
                  <Globe className="mx-auto h-6 w-6 text-muted-foreground/60" />
                  <p className="mt-2 text-[13.5px] font-semibold">Noch keine Länder-Daten</p>
                  <p className="mt-1 text-[12px] text-muted-foreground max-w-md mx-auto">
                    Sobald Aufrufe von echten Besuchern über das Internet eingehen, erscheinen hier Weltkarte und Länder-Statistik.
                  </p>
                </div>
              ) : null}

              {referrerData.length > 0 && (
                <ChartCard title="Top-Referrer">
                  <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Externe Seiten, von denen Besucher zu deinen Links kamen
                  </div>
                  <ResponsiveContainer width="100%" height={Math.max(200, referrerData.length * 38)}>
                    <BarChart data={referrerData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid {...GRID_STYLE} horizontal={false} />
                      <XAxis type="number" {...AXIS_STYLE} />
                      <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={110} />
                      <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)' }} />
                      <Bar dataKey="value" name="Klicks" fill={SERIES_COLORS.clicks} radius={[0, 6, 6, 0]} maxBarSize={BAR_MAX_SIZE} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              )}

              {unknownCountryCount > 0 && (
                <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3 flex items-start gap-2.5">
                  <Globe className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <p className="text-[12px] text-muted-foreground leading-relaxed">
                    <span className="font-medium text-foreground">{unknownCountryCount} {unknownCountryCount === 1 ? 'Aufruf' : 'Aufrufe'} ohne Länder-Zuordnung.</span>{' '}
                    Das kann an lokalen Tests im WLAN (LAN-IPs) oder an fehlenden Geo-Headers liegen.
                    In Produktion (Vercel) werden Länder automatisch via Edge-Network erkannt.
                  </p>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

/** Strukturierter Section-Header mit Eyebrow-Nummer, Titel und Beschreibung.
    Schafft visuelle Hierarchie zwischen den Analytics-Bloecken — der User
    sieht auf einen Blick "wo bin ich" und kann scannen. */
function AnalyticsSectionHeader({
  step,
  title,
  description,
  action,
}: {
  step: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-2 border-b border-border/60 pb-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-brand/80">
          {step}
        </div>
        <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-foreground sm:text-[18px]">
          {title}
        </h2>
        <p className="mt-0.5 text-[12.5px] text-muted-foreground">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/** Date-Range Preset Chips — schnelle Quick-Picks ohne Calendar */
const DATE_PRESETS = [
  { label: 'Heute', days: 0 },
  { label: '7 Tage', days: 6 },
  { label: '30 Tage', days: 29 },
  { label: '90 Tage', days: 89 },
  { label: 'YTD', ytd: true },
] as const;

function DatePresetRow({
  dateFrom,
  onApply,
}: {
  dateFrom: string;
  onApply: (from: string, to: string) => void;
}) {
  function handleClick(preset: (typeof DATE_PRESETS)[number]) {
    const today = new Date();
    const to = format(today, 'yyyy-MM-dd');
    let from: string;
    if ('ytd' in preset && preset.ytd) {
      from = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
    } else {
      const days = 'days' in preset ? preset.days : 0;
      from = format(subDays(today, days), 'yyyy-MM-dd');
    }
    onApply(from, to);
  }

  function isActive(preset: (typeof DATE_PRESETS)[number]): boolean {
    const today = new Date();
    const expectedTo = format(today, 'yyyy-MM-dd');
    let expectedFrom: string;
    if ('ytd' in preset && preset.ytd) {
      expectedFrom = format(new Date(today.getFullYear(), 0, 1), 'yyyy-MM-dd');
    } else {
      const days = 'days' in preset ? preset.days : 0;
      expectedFrom = format(subDays(today, days), 'yyyy-MM-dd');
    }
    return dateFrom === expectedFrom;
    // Note: we only check `from` — `to` is always "today" when a preset is active
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        Zeitraum
      </span>
      {DATE_PRESETS.map((preset) => {
        const active = isActive(preset);
        return (
          <button
            key={preset.label}
            type="button"
            onClick={() => handleClick(preset)}
            className={
              'rounded-full border px-2.5 py-1 text-[12px] font-medium transition-colors ' +
              (active
                ? 'border-brand bg-brand/10 text-brand'
                : 'border-border bg-card text-muted-foreground hover:border-brand/30 hover:bg-brand/[0.04] hover:text-foreground')
            }
          >
            {preset.label}
          </button>
        );
      })}
    </div>
  );
}
