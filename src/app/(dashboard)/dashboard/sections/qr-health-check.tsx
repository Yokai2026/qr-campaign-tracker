import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { QrHealthBanner } from './qr-health-banner';

/**
 * Shows a soft, dismissible notice when active QR codes haven't received scans
 * in 7+ days. Renders nothing if all QR codes are healthy.
 */
export async function QrHealthCheck() {
  noStore();
  const supabase = await createClient();

  const { data: activeQrs } = await supabase
    .from('qr_codes')
    .select('id, short_code, placement:placements(name)')
    .eq('active', true);

  if (!activeQrs || activeQrs.length === 0) return null;

  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: recentScans } = await supabase
    .from('redirect_events')
    .select('qr_code_id')
    .eq('event_type', 'qr_open')
    .gte('created_at', sevenDaysAgo);

  const scannedIds = new Set(
    (recentScans || []).map((e: { qr_code_id: string | null }) => e.qr_code_id),
  );

  const dormant = activeQrs
    .filter((qr) => !scannedIds.has(qr.id))
    .map((qr) => {
      const p = qr.placement as unknown as { name: string } | { name: string }[] | null;
      const name = Array.isArray(p) ? p[0]?.name : p?.name;
      return { id: qr.id, shortCode: qr.short_code, placementName: name ?? null };
    });

  if (dormant.length === 0) return null;

  return <QrHealthBanner dormant={dormant} />;
}
