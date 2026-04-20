import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AlertTriangle, Clock, Ban, ArrowRight } from 'lucide-react';

type AttentionItem = {
  id: string;
  href: string;
  title: string;
  reason: string;
  severity: 'warn' | 'info';
  icon: typeof AlertTriangle;
};

/**
 * "Aufmerksamkeit" — surfaces the handful of things a solo-founder actually
 * needs to act on: QR-codes with big drops, expired codes still marked active,
 * or placements that were hot and have now gone silent.
 *
 * Renders nothing if there's nothing to worry about — this widget must be
 * invisible on a healthy account.
 */
export async function Attention() {
  noStore();
  const supabase = await createClient();

  const now = Date.now();
  const sevenDaysAgoIso = new Date(now - 7 * 86_400_000).toISOString();
  const fourteenDaysAgoIso = new Date(now - 14 * 86_400_000).toISOString();

  const [expiredActive, placementsCurr, placementsPrev] = await Promise.all([
    // Active QRs whose valid_until has passed — redirect-handler still blocks,
    // but the user should know they need to extend or archive.
    supabase
      .from('qr_codes')
      .select('id, short_code, note, valid_until, placement:placements(name)')
      .eq('active', true)
      .not('valid_until', 'is', null)
      .lt('valid_until', new Date().toISOString())
      .limit(5),
    supabase
      .from('redirect_events')
      .select('placement_id, placements(name)')
      .eq('event_type', 'qr_open')
      .eq('is_bot', false)
      .not('placement_id', 'is', null)
      .gte('created_at', sevenDaysAgoIso),
    supabase
      .from('redirect_events')
      .select('placement_id, placements(name)')
      .eq('event_type', 'qr_open')
      .eq('is_bot', false)
      .not('placement_id', 'is', null)
      .gte('created_at', fourteenDaysAgoIso)
      .lt('created_at', sevenDaysAgoIso),
  ]);

  const items: AttentionItem[] = [];

  // 1. Expired-but-active QR codes
  (expiredActive.data ?? []).forEach((qr: Record<string, unknown>) => {
    const placement = qr.placement as { name: string } | null;
    const label = placement?.name || (qr.note as string | null) || (qr.short_code as string);
    items.push({
      id: `expired:${qr.id as string}`,
      href: `/qr-codes/${qr.id as string}`,
      title: label,
      reason: 'Gültigkeit abgelaufen, aber noch aktiv',
      severity: 'warn',
      icon: Clock,
    });
  });

  // 2. Silent placements — had ≥5 scans in the previous week, got zero this week
  const currCounts: Record<string, number> = {};
  (placementsCurr.data ?? []).forEach((e: { placement_id: string | null }) => {
    const pid = e.placement_id;
    if (!pid) return;
    currCounts[pid] = (currCounts[pid] ?? 0) + 1;
  });
  const prevCountsWithName: Record<string, { count: number; name: string }> = {};
  (placementsPrev.data ?? []).forEach((e: Record<string, unknown>) => {
    const pid = e.placement_id as string;
    if (!pid) return;
    if (!prevCountsWithName[pid]) {
      const p = e.placements as { name: string } | null;
      prevCountsWithName[pid] = { count: 0, name: p?.name ?? 'Unbekannt' };
    }
    prevCountsWithName[pid].count++;
  });
  Object.entries(prevCountsWithName).forEach(([pid, info]) => {
    const curr = currCounts[pid] ?? 0;
    if (info.count >= 5 && curr === 0) {
      items.push({
        id: `silent:${pid}`,
        href: `/placements/${pid}`,
        title: info.name,
        reason: `War bei ${info.count} Scans letzte Woche — diese Woche keine`,
        severity: 'warn',
        icon: Ban,
      });
    }
  });

  // Cap total visible items
  const visible = items.slice(0, 5);

  if (visible.length === 0) return null;

  return (
    <section
      aria-label="Aufmerksamkeit"
      className="overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/[0.03]"
    >
      <div className="flex items-center gap-2 border-b border-destructive/20 px-4 py-3">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive" strokeWidth={2} />
        <h3 className="text-[13.5px] font-semibold tracking-tight">Aufmerksamkeit</h3>
        <span className="ml-auto rounded-full bg-destructive/15 px-2 py-0.5 text-[11px] font-medium text-destructive">
          {visible.length}
        </span>
      </div>
      <ul className="divide-y divide-destructive/15">
        {visible.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <Link
                href={item.href}
                className="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-destructive/[0.05]"
              >
                <Icon className="h-3.5 w-3.5 shrink-0 text-destructive/70" strokeWidth={1.8} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium group-hover:text-destructive transition-colors">{item.title}</div>
                  <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{item.reason}</div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50 transition-colors group-hover:text-destructive" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
