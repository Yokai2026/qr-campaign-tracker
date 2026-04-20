import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { HeroKpiClient, type HeroRange, type HeroStats } from './hero-kpi-client';

const WINDOWS: Array<{ key: HeroRange; label: string; days: number }> = [
  { key: 'today', label: 'Heute', days: 1 },
  { key: '7d', label: '7 Tage', days: 7 },
  { key: '30d', label: '30 Tage', days: 30 },
];

export async function HeroKpi() {
  noStore();
  const supabase = await createClient();

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  // Fetch widest window once (30d); compute narrower windows in-memory.
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 86_400_000);

  const [currentRes, previousRes] = await Promise.all([
    supabase
      .from('redirect_events')
      .select('ip_hash, created_at, event_type')
      .in('event_type', ['qr_open', 'link_open'])
      .eq('is_bot', false)
      .gte('created_at', thirtyDaysAgo.toISOString()),
    supabase
      .from('redirect_events')
      .select('created_at, event_type')
      .in('event_type', ['qr_open', 'link_open'])
      .eq('is_bot', false)
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString()),
  ]);

  const events = (currentRes.data ?? []) as Array<{ ip_hash: string | null; created_at: string; event_type: string }>;
  const prevEvents = (previousRes.data ?? []) as Array<{ created_at: string; event_type: string }>;

  const stats: Record<HeroRange, HeroStats> = {
    today: buildStats(events, prevEvents, todayStart, now, 1),
    '7d': buildStats(events, prevEvents, new Date(now.getTime() - 7 * 86_400_000), now, 7),
    '30d': buildStats(events, prevEvents, thirtyDaysAgo, now, 30),
  };

  // Sparkline — hourly buckets for today, daily for 7d/30d
  const sparklines: Record<HeroRange, number[]> = {
    today: hourlyBuckets(events, todayStart, now),
    '7d': dailyBuckets(events, new Date(now.getTime() - 7 * 86_400_000), now, 7),
    '30d': dailyBuckets(events, thirtyDaysAgo, now, 30),
  };

  const lastScanAt = events.length > 0
    ? events.reduce((latest, e) => (e.created_at > latest ? e.created_at : latest), events[0].created_at)
    : null;

  return (
    <HeroKpiClient
      stats={stats}
      sparklines={sparklines}
      lastScanAt={lastScanAt}
      windows={WINDOWS}
    />
  );
}

function buildStats(
  events: Array<{ ip_hash: string | null; created_at: string; event_type: string }>,
  prevEvents: Array<{ created_at: string; event_type: string }>,
  from: Date,
  to: Date,
  windowDays: number,
): HeroStats {
  const fromIso = from.toISOString();
  const toIso = to.toISOString();
  const current = events.filter((e) => e.created_at >= fromIso && e.created_at <= toIso);
  const qrCount = current.filter((e) => e.event_type === 'qr_open').length;
  const linkCount = current.filter((e) => e.event_type === 'link_open').length;
  const uniqueIps = new Set(current.map((e) => e.ip_hash).filter(Boolean)).size;

  // Previous comparable period
  const prevTo = fromIso;
  const prevFrom = new Date(from.getTime() - windowDays * 86_400_000).toISOString();
  // Check both buckets — older fetched from prevEvents, newer fetched from events
  const previous = [
    ...events.filter((e) => e.created_at >= prevFrom && e.created_at < prevTo),
    ...prevEvents.filter((e) => e.created_at >= prevFrom && e.created_at < prevTo),
  ];
  const prevTotal = previous.length;
  const total = current.length;
  const delta = prevTotal === 0 ? (total > 0 ? 100 : null) : ((total - prevTotal) / prevTotal) * 100;

  return { total, qrCount, linkCount, uniqueIps, delta };
}

function hourlyBuckets(
  events: Array<{ created_at: string }>,
  from: Date,
  to: Date,
): number[] {
  const buckets: number[] = Array.from({ length: 24 }, () => 0);
  const fromMs = from.getTime();
  events.forEach((e) => {
    const ts = new Date(e.created_at).getTime();
    if (ts < fromMs || ts > to.getTime()) return;
    const hoursDiff = Math.floor((ts - fromMs) / 3_600_000);
    if (hoursDiff >= 0 && hoursDiff < 24) buckets[hoursDiff]++;
  });
  return buckets;
}

function dailyBuckets(
  events: Array<{ created_at: string }>,
  from: Date,
  to: Date,
  days: number,
): number[] {
  const buckets: number[] = Array.from({ length: days }, () => 0);
  const fromMs = from.getTime();
  events.forEach((e) => {
    const ts = new Date(e.created_at).getTime();
    if (ts < fromMs || ts > to.getTime()) return;
    const daysDiff = Math.floor((ts - fromMs) / 86_400_000);
    if (daysDiff >= 0 && daysDiff < days) buckets[daysDiff]++;
  });
  return buckets;
}
