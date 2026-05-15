import { unstable_cache } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/server';

export type LiveStats = {
  /** Total scans tracked across the entire DB (lifetime). */
  totalScans: number;
  /** Active QR codes currently in use. */
  activeQrCodes: number;
  /** Distinct active tracking accounts (profiles). */
  activeAccounts: number;
  /** True when numbers cross the credibility threshold and should be shown publicly. */
  isPublishable: boolean;
};

/**
 * Below these thresholds we hide the live numbers and fall back to a static trust badge.
 * Why: showing "12 scans tracked" hurts conversion more than not showing anything.
 * How to apply: tune downward once the product crosses 1k+ real scans.
 */
const PUBLISH_THRESHOLD_SCANS = 1000;
const PUBLISH_THRESHOLD_ACCOUNTS = 5;

async function fetchStats(): Promise<LiveStats> {
  const empty: LiveStats = {
    totalScans: 0,
    activeQrCodes: 0,
    activeAccounts: 0,
    isPublishable: false,
  };

  try {
    const sb = await createServiceClient();

    const [scans, qr, accounts] = await Promise.all([
      sb.from('redirect_events').select('id', { count: 'exact', head: true }),
      sb
        .from('qr_codes')
        .select('id', { count: 'exact', head: true })
        .eq('active', true),
      sb.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    const totalScans = scans.count ?? 0;
    const activeQrCodes = qr.count ?? 0;
    const activeAccounts = accounts.count ?? 0;

    return {
      totalScans,
      activeQrCodes,
      activeAccounts,
      isPublishable:
        totalScans >= PUBLISH_THRESHOLD_SCANS &&
        activeAccounts >= PUBLISH_THRESHOLD_ACCOUNTS,
    };
  } catch {
    return empty;
  }
}

export const getLiveStats = unstable_cache(fetchStats, ['landing-live-stats-v1'], {
  revalidate: 900,
  tags: ['landing-live-stats'],
});
