import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { OverviewClient, type OverviewData, type OverviewRange } from './overview-client';

type RawEvent = {
  created_at: string;
  event_type: string;
  ip_hash: string | null;
  device_type: string | null;
  country: string | null;
  campaign_id: string | null;
};

const WINDOWS: Array<{ key: OverviewRange; label: string; days: number }> = [
  { key: '7d', label: '7 Tage', days: 7 },
  { key: '14d', label: '14 Tage', days: 14 },
  { key: '30d', label: '30 Tage', days: 30 },
];

export async function Overview() {
  noStore();
  const supabase = await createClient();

  const now = Date.now();
  // Holen wir Events der letzten 60 Tage (= 2× max-window 30d, damit "Vergleichsperiode" abgedeckt ist)
  const sixtyDaysAgoIso = new Date(now - 60 * 86_400_000).toISOString();

  const [eventsRes, campaignsRes, tagsRes] = await Promise.all([
    supabase
      .from('redirect_events')
      .select('created_at, event_type, ip_hash, device_type, country, campaign_id')
      .in('event_type', ['qr_open', 'link_open'])
      .eq('is_bot', false)
      .gte('created_at', sixtyDaysAgoIso)
      .order('created_at', { ascending: true })
      .limit(100_000),
    supabase
      .from('campaigns')
      .select('id, name, status')
      .neq('status', 'archived'),
    supabase
      .from('campaign_tags')
      .select('campaign_id, tag'),
  ]);

  const events = (eventsRes.data ?? []) as RawEvent[];
  const campaignsById = new Map<string, { name: string }>();
  (campaignsRes.data ?? []).forEach((c: { id: string; name: string }) => {
    campaignsById.set(c.id, { name: c.name });
  });
  const firstTagByCampaign = new Map<string, string>();
  (tagsRes.data ?? []).forEach((t: { campaign_id: string; tag: string }) => {
    if (!firstTagByCampaign.has(t.campaign_id)) firstTagByCampaign.set(t.campaign_id, t.tag);
  });

  const data: Record<OverviewRange, OverviewData> = {
    '7d': buildWindow(events, campaignsById, firstTagByCampaign, 7, now),
    '14d': buildWindow(events, campaignsById, firstTagByCampaign, 14, now),
    '30d': buildWindow(events, campaignsById, firstTagByCampaign, 30, now),
  };

  return <OverviewClient data={data} windows={WINDOWS} />;
}

function buildWindow(
  events: RawEvent[],
  campaignsById: Map<string, { name: string }>,
  firstTagByCampaign: Map<string, string>,
  days: number,
  now: number,
): OverviewData {
  const fromMs = now - days * 86_400_000;
  const prevFromMs = now - 2 * days * 86_400_000;

  const inWindow: RawEvent[] = [];
  const inPrevWindow: RawEvent[] = [];
  for (const e of events) {
    const ts = new Date(e.created_at).getTime();
    if (ts >= fromMs && ts <= now) inWindow.push(e);
    else if (ts >= prevFromMs && ts < fromMs) inPrevWindow.push(e);
  }

  // KPIs
  const scans = inWindow.length;
  const prevScans = inPrevWindow.length;
  const qrScans = inWindow.filter((e) => e.event_type === 'qr_open').length;
  const linkClicks = inWindow.filter((e) => e.event_type === 'link_open').length;
  const uniqueIps = new Set(inWindow.map((e) => e.ip_hash).filter(Boolean)).size;
  const prevUnique = new Set(inPrevWindow.map((e) => e.ip_hash).filter(Boolean)).size;

  const trendPct =
    prevScans === 0 ? (scans > 0 ? 100 : null) : ((scans - prevScans) / prevScans) * 100;
  const uniqueTrendPct =
    prevUnique === 0 ? (uniqueIps > 0 ? 100 : null) : ((uniqueIps - prevUnique) / prevUnique) * 100;

  const activeCampaignIds = new Set(
    inWindow.map((e) => e.campaign_id).filter((c): c is string => !!c),
  );
  const activeCampaigns = activeCampaignIds.size;
  const prevActiveCampaigns = new Set(
    inPrevWindow.map((e) => e.campaign_id).filter((c): c is string => !!c),
  ).size;

  // Sparklines pro KPI (kleine 12-bucket Vorschau)
  const sparkScans = bucketize(inWindow, fromMs, now, 12, () => 1);
  const sparkUnique = bucketize(inWindow, fromMs, now, 12, (_, accSeen, e) => {
    if (!e.ip_hash || accSeen.has(e.ip_hash)) return 0;
    accSeen.add(e.ip_hash);
    return 1;
  });

  // Chart-Daten: stündlich für 7d (168 Buckets), sonst täglich
  const useHourly = days === 7;
  const bucketCount = useHourly ? 24 * days : days;
  const bucketSizeMs = useHourly ? 3_600_000 : 86_400_000;

  const chart = buildChartSeries(inWindow, inPrevWindow, fromMs, prevFromMs, bucketCount, bucketSizeMs);

  // Top-Kampagnen (Top 3 in diesem Fenster)
  const campaignCounts = new Map<string, number>();
  for (const e of inWindow) {
    if (!e.campaign_id) continue;
    campaignCounts.set(e.campaign_id, (campaignCounts.get(e.campaign_id) ?? 0) + 1);
  }
  const topCampaignsRaw = [...campaignCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topScansMax = topCampaignsRaw[0]?.[1] ?? 1;
  const topCampaigns = topCampaignsRaw.map(([id, count]) => ({
    id,
    name: campaignsById.get(id)?.name ?? 'Unbekannte Kampagne',
    tag: firstTagByCampaign.get(id) ?? null,
    scans: count,
    pct: Math.round((count / topScansMax) * 100),
  }));

  // Geo: Top 3 Länder
  const countryCounts = new Map<string, number>();
  for (const e of inWindow) {
    const c = (e.country ?? '').trim();
    if (!c) continue;
    countryCounts.set(c, (countryCounts.get(c) ?? 0) + 1);
  }
  const topCountries = [...countryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([code, count]) => ({
      code,
      label: countryLabel(code),
      pct: scans > 0 ? Math.round((count / scans) * 100) : 0,
    }));

  // Devices: %-Verteilung
  const devCounts = new Map<string, number>();
  for (const e of inWindow) {
    const d = (e.device_type ?? 'unknown').toLowerCase();
    devCounts.set(d, (devCounts.get(d) ?? 0) + 1);
  }
  const devTotal = [...devCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const devices = {
    mobile: Math.round((100 * (devCounts.get('mobile') ?? 0)) / devTotal),
    desktop: Math.round((100 * (devCounts.get('desktop') ?? 0)) / devTotal),
    tablet: Math.round((100 * (devCounts.get('tablet') ?? 0)) / devTotal),
  };

  // Peak: best (Wochentag, Stunde) Slot
  const peak = computePeak(inWindow);

  return {
    days,
    kpis: {
      scans,
      scansTrend: trendPct,
      qrScans,
      linkClicks,
      unique: uniqueIps,
      uniqueTrend: uniqueTrendPct,
      trendVsPrev: trendPct,
      activeCampaigns,
      activeCampaignsDelta: activeCampaigns - prevActiveCampaigns,
    },
    sparklines: { scans: sparkScans, unique: sparkUnique },
    chart,
    topCampaigns,
    topCountries,
    devices,
    peak,
  };
}

function bucketize(
  events: RawEvent[],
  fromMs: number,
  toMs: number,
  bucketCount: number,
  contribution: (i: number, seen: Set<string>, e: RawEvent) => number,
): number[] {
  const buckets = Array.from({ length: bucketCount }, () => 0);
  const range = toMs - fromMs;
  const bucketSize = range / bucketCount;
  const seen = new Set<string>();
  for (const e of events) {
    const ts = new Date(e.created_at).getTime();
    const i = Math.min(bucketCount - 1, Math.max(0, Math.floor((ts - fromMs) / bucketSize)));
    buckets[i] += contribution(i, seen, e);
  }
  return buckets;
}

type ChartPoint = { t: string; qr: number; link: number; total: number; prev: number };

function buildChartSeries(
  curr: RawEvent[],
  prev: RawEvent[],
  fromMs: number,
  prevFromMs: number,
  bucketCount: number,
  bucketSizeMs: number,
): ChartPoint[] {
  const qrBuckets = Array.from({ length: bucketCount }, () => 0);
  const linkBuckets = Array.from({ length: bucketCount }, () => 0);
  const prevBuckets = Array.from({ length: bucketCount }, () => 0);
  for (const e of curr) {
    const i = Math.floor((new Date(e.created_at).getTime() - fromMs) / bucketSizeMs);
    if (i < 0 || i >= bucketCount) continue;
    if (e.event_type === 'qr_open') qrBuckets[i]++;
    else if (e.event_type === 'link_open') linkBuckets[i]++;
  }
  for (const e of prev) {
    const i = Math.floor((new Date(e.created_at).getTime() - prevFromMs) / bucketSizeMs);
    if (i >= 0 && i < bucketCount) prevBuckets[i]++;
  }
  return qrBuckets.map((q, i) => ({
    t: new Date(fromMs + i * bucketSizeMs).toISOString(),
    qr: q,
    link: linkBuckets[i],
    total: q + linkBuckets[i],
    prev: prevBuckets[i],
  }));
}

function computePeak(events: RawEvent[]): { dayLabel: string; hourRange: string; count: number } | null {
  if (events.length === 0) return null;
  const slots = new Map<string, number>();
  for (const e of events) {
    const d = new Date(e.created_at);
    const dow = d.getDay();
    const hour = d.getHours();
    const key = `${dow}|${hour}`;
    slots.set(key, (slots.get(key) ?? 0) + 1);
  }
  let bestKey = '';
  let bestCount = 0;
  for (const [k, c] of slots) {
    if (c > bestCount) {
      bestCount = c;
      bestKey = k;
    }
  }
  if (!bestKey) return null;
  const [dowStr, hourStr] = bestKey.split('|');
  const dow = Number(dowStr);
  const hour = Number(hourStr);
  const days = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const endHour = Math.min(hour + 2, 23);
  return {
    dayLabel: days[dow],
    hourRange: `${hour}–${endHour} Uhr`,
    count: bestCount,
  };
}

function countryLabel(code: string): string {
  const labels: Record<string, string> = {
    DE: 'Deutschland',
    AT: 'Österreich',
    CH: 'Schweiz',
    NL: 'Niederlande',
    FR: 'Frankreich',
    IT: 'Italien',
    ES: 'Spanien',
    PL: 'Polen',
    GB: 'Großbritannien',
    US: 'USA',
  };
  return labels[code.toUpperCase()] ?? code.toUpperCase();
}
