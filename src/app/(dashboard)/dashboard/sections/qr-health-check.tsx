import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

/**
 * Shows a warning when active QR codes haven't received scans in 7+ days.
 * Renders nothing if all QR codes are healthy.
 */
export async function QrHealthCheck() {
  noStore();
  const supabase = await createClient();

  // Find active QR codes
  const { data: activeQrs } = await supabase
    .from('qr_codes')
    .select('id, short_code, placement:placements(name)')
    .eq('active', true);

  if (!activeQrs || activeQrs.length === 0) return null;

  // Find QR codes that had at least one scan in the last 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: recentScans } = await supabase
    .from('redirect_events')
    .select('qr_code_id')
    .eq('event_type', 'qr_open')
    .gte('created_at', sevenDaysAgo);

  const scannedIds = new Set((recentScans || []).map((e: { qr_code_id: string | null }) => e.qr_code_id));
  const dormant = activeQrs.filter((qr) => !scannedIds.has(qr.id));

  if (dormant.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3.5 dark:border-amber-800 dark:bg-amber-950/30">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-amber-800 dark:text-amber-300">
          {dormant.length} aktive{dormant.length === 1 ? 'r' : ''} QR-Code{dormant.length === 1 ? '' : 's'} ohne Scans seit 7+ Tagen
        </p>
        <p className="mt-0.5 text-[12px] text-amber-700/80 dark:text-amber-400/70">
          {dormant.slice(0, 3).map((qr) => {
            const p = qr.placement as unknown as { name: string } | { name: string }[] | null;
            const name = Array.isArray(p) ? p[0]?.name : p?.name;
            return name ? `${qr.short_code} (${name})` : qr.short_code;
          }).join(', ')}
          {dormant.length > 3 && ` und ${dormant.length - 3} weitere`}
          {' — '}
          <Link href="/qr-codes" className="underline hover:text-amber-900 dark:hover:text-amber-300">
            QR-Codes prüfen
          </Link>
        </p>
      </div>
    </div>
  );
}
