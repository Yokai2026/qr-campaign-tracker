import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { SevenDayBarsClient } from './seven-day-bars-client';

type RawEvent = { created_at: string; event_type: string };

/**
 * Zwei kompakte 7-Tage-Balken-Charts oben auf dem Dashboard:
 * - QR-Scans pro Tag
 * - Link-Klicks pro Tag
 *
 * Server-Component: 1 Query, beide Charts geteilt sich die Daten.
 * Bietet auf einen Blick "wie war meine Woche?" — die wichtigste Frage
 * eines QR-Tracking-Users.
 */
export async function SevenDayBars() {
  noStore();
  const supabase = await createClient();

  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 86_400_000).toISOString();

  const { data } = await supabase
    .from('redirect_events')
    .select('created_at, event_type')
    .in('event_type', ['qr_open', 'link_open'])
    .eq('is_bot', false)
    .gte('created_at', sevenDaysAgo)
    .limit(20_000);

  const events = (data ?? []) as RawEvent[];

  // 7 Tage backwards inkl. heute. Reihenfolge: aelteste links → neueste rechts
  const days: { dateKey: string; label: string; qr: number; link: number }[] = [];
  const MONATE_DE = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86_400_000);
    const dateKey = d.toISOString().slice(0, 10);
    const label = `${d.getDate()}. ${MONATE_DE[d.getMonth()]}`;
    days.push({ dateKey, label, qr: 0, link: 0 });
  }
  const byKey = new Map(days.map((d) => [d.dateKey, d]));
  for (const e of events) {
    const key = e.created_at.slice(0, 10);
    const bucket = byKey.get(key);
    if (!bucket) continue;
    if (e.event_type === 'qr_open') bucket.qr++;
    else if (e.event_type === 'link_open') bucket.link++;
  }

  const totalQr = days.reduce((a, b) => a + b.qr, 0);
  const totalLink = days.reduce((a, b) => a + b.link, 0);

  return <SevenDayBarsClient data={days} totalQr={totalQr} totalLink={totalLink} />;
}
