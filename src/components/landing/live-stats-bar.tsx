import { Activity, ShieldCheck, Zap } from 'lucide-react';
import { getLiveStats } from '@/lib/landing/live-stats';

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace('.0', '')} Mio.`;
  if (n >= 10_000) return `${Math.round(n / 1000)} Tsd.`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace('.0', '')} Tsd.`;
  return n.toLocaleString('de-DE');
}

export async function LiveStatsBar() {
  const stats = await getLiveStats();

  if (!stats.isPublishable) {
    return (
      <div className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[12.5px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-brand" aria-hidden />
          DSGVO-konform · Server in Frankfurt
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-brand" aria-hidden />
          Redirect &lt; 100 ms · live
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-brand" aria-hidden />
          Privacy-first · keine Cookies
        </span>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-8 inline-flex flex-wrap items-center justify-center gap-x-4 gap-y-2 rounded-full border border-border bg-card/70 px-4 py-2 text-[12.5px] text-muted-foreground shadow-[var(--shadow-sm)] backdrop-blur">
      <span className="inline-flex items-center gap-1.5">
        <span className="relative flex h-2 w-2" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-[pulseDot_1.6s_ease-in-out_infinite] rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
        </span>
        <span>
          <span className="tabular font-semibold text-foreground">
            {formatCount(stats.totalScans)}
          </span>{' '}
          Scans live getrackt
        </span>
      </span>
      <span className="hidden h-3 w-px bg-border sm:inline-block" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        <span className="tabular font-semibold text-foreground">
          {formatCount(stats.activeQrCodes)}
        </span>{' '}
        aktive QR-Codes
      </span>
      <span className="hidden h-3 w-px bg-border sm:inline-block" aria-hidden />
      <span className="inline-flex items-center gap-1.5">
        <span className="tabular font-semibold text-foreground">
          {formatCount(stats.activeAccounts)}
        </span>{' '}
        Tracking-Accounts
      </span>
    </div>
  );
}
