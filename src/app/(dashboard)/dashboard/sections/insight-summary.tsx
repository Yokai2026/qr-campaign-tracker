import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { InsightBanner } from '@/components/shared/insight-banner';

type RawEvent = {
  created_at: string;
  event_type: string;
  ip_hash: string | null;
  campaign_id: string | null;
};

const WINDOW_DAYS = 7;

/**
 * Server-Component-Variante des Insight-Banners fuers Dashboard.
 * Liefert die Plain-Language-Zusammenfassung der letzten 7 Tage in einem Satz —
 * erfuellt die "5-Sekunden-Regel" am Top des Dashboards.
 *
 * Eigene Query (kein Re-Use von Overview), weil:
 *  - Overview ist ein Hero-Card-Block fuer Detailansicht
 *  - Hier brauchen wir nur drei Zahlen + Peak + Top-Campaign
 */
export async function InsightSummary() {
  noStore();
  const supabase = await createClient();

  const now = Date.now();
  const fromMs = now - WINDOW_DAYS * 86_400_000;
  const prevFromMs = now - 2 * WINDOW_DAYS * 86_400_000;
  const prevFromIso = new Date(prevFromMs).toISOString();

  const [eventsRes, campaignsRes] = await Promise.all([
    supabase
      .from('redirect_events')
      .select('created_at, event_type, ip_hash, campaign_id')
      .in('event_type', ['qr_open', 'link_open'])
      .eq('is_bot', false)
      .gte('created_at', prevFromIso)
      .limit(50_000),
    supabase.from('campaigns').select('id, name'),
  ]);

  const all = (eventsRes.data ?? []) as RawEvent[];
  const campaignsById = new Map<string, string>();
  (campaignsRes.data ?? []).forEach((c: { id: string; name: string }) => {
    campaignsById.set(c.id, c.name);
  });

  const curr: RawEvent[] = [];
  const prev: RawEvent[] = [];
  for (const e of all) {
    const ts = new Date(e.created_at).getTime();
    if (ts >= fromMs) curr.push(e);
    else if (ts >= prevFromMs) prev.push(e);
  }

  const totalOpens = curr.length;
  const prevTotal = prev.length;
  const delta =
    prevTotal === 0 ? (totalOpens > 0 ? 100 : null) : ((totalOpens - prevTotal) / prevTotal) * 100;
  const uniqueVisitors = new Set(curr.map((e) => e.ip_hash).filter(Boolean)).size;

  // Top-Kampagne in der aktuellen Periode
  const campCounts = new Map<string, number>();
  for (const e of curr) {
    if (!e.campaign_id) continue;
    campCounts.set(e.campaign_id, (campCounts.get(e.campaign_id) ?? 0) + 1);
  }
  let topCampaign: { name: string; opens: number } | null = null;
  let topMax = 0;
  for (const [cid, count] of campCounts) {
    if (count > topMax) {
      topMax = count;
      topCampaign = { name: campaignsById.get(cid) ?? 'Unbekannt', opens: count };
    }
  }

  // Peak-Slot: staerkster (Wochentag, Stunde)-Kombination der aktuellen Periode
  const slotMap = new Map<string, number>();
  for (const e of curr) {
    const d = new Date(e.created_at);
    const key = `${d.getDay()}|${d.getHours()}`;
    slotMap.set(key, (slotMap.get(key) ?? 0) + 1);
  }
  let peakSlot: { dayLabel: string; hourLabel: string } | null = null;
  let peakMax = 0;
  for (const [k, c] of slotMap) {
    if (c > peakMax) {
      peakMax = c;
      const [dStr, hStr] = k.split('|');
      const d = Number(dStr);
      const h = Number(hStr);
      peakSlot = {
        dayLabel: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'][d],
        hourLabel: `${String(h).padStart(2, '0')}:00 Uhr`,
      };
    }
  }

  return (
    <InsightBanner
      totalOpens={totalOpens}
      delta={delta}
      topCampaign={topCampaign}
      peakSlot={peakSlot}
      uniqueVisitors={uniqueVisitors}
      hasData={totalOpens > 0 || prevTotal > 0}
    />
  );
}
