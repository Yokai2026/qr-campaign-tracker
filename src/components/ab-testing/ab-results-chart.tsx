'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import { ChartCard } from '@/components/shared/chart-card';
import { CHART_PALETTE, AXIS_STYLE, GRID_STYLE } from '@/lib/chart-config';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { AbVariant } from '@/types';

const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 6,
  border: '1px solid oklch(0.92 0 0)',
  boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)',
};

type VariantResult = {
  id: string;
  label: string;
  clicks: number;
  uniqueVisitors: number;
};

type Props = {
  variants: AbVariant[];
  qrCodeId?: string;
  shortLinkId?: string;
};

/**
 * Compute z-score for two proportions to determine statistical significance.
 * Returns true if p < 0.05 (95% confidence).
 */
function isSignificant(clicksA: number, clicksB: number, totalA: number, totalB: number): boolean {
  if (totalA < 30 || totalB < 30) return false;
  const pA = clicksA / totalA;
  const pB = clicksB / totalB;
  const pPool = (clicksA + clicksB) / (totalA + totalB);
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / totalA + 1 / totalB));
  if (se === 0) return false;
  const z = Math.abs(pA - pB) / se;
  return z > 1.96;
}

export function AbResultsChart({ variants, qrCodeId, shortLinkId }: Props) {
  const supabase = createClient();
  const activeVariants = variants.filter((v) => v.active);

  const { data: results } = useQuery({
    queryKey: ['ab-results', qrCodeId, shortLinkId],
    enabled: activeVariants.length > 0,
    queryFn: async () => {
      let query = supabase
        .from('redirect_events')
        .select('id, ab_variant_id, ip_hash')
        .not('ab_variant_id', 'is', null);

      if (qrCodeId) query = query.eq('qr_code_id', qrCodeId);
      if (shortLinkId) query = query.eq('short_link_id', shortLinkId);

      const { data: events } = await query;
      if (!events) return [];

      const variantMap = new Map<string, { clicks: number; ips: Set<string> }>();
      for (const v of activeVariants) {
        variantMap.set(v.id, { clicks: 0, ips: new Set() });
      }

      for (const e of events) {
        const entry = variantMap.get(e.ab_variant_id);
        if (!entry) continue;
        entry.clicks++;
        if (e.ip_hash) entry.ips.add(e.ip_hash);
      }

      return activeVariants.map((v): VariantResult => {
        const entry = variantMap.get(v.id);
        return {
          id: v.id,
          label: v.label || v.target_url.replace(/^https?:\/\//, '').slice(0, 30),
          clicks: entry?.clicks ?? 0,
          uniqueVisitors: entry?.ips.size ?? 0,
        };
      });
    },
  });

  if (activeVariants.length === 0) return null;

  const data = results ?? [];
  const totalClicks = data.reduce((s, d) => s + d.clicks, 0);
  if (totalClicks === 0 && data.length > 0) {
    return (
      <ChartCard title="A/B-Testergebnisse" empty emptyText="Noch keine Daten - Varianten werden bei Scans automatisch ausgeliefert"><span /></ChartCard>
    );
  }
  if (data.length === 0) return null;

  const maxClicks = Math.max(...data.map((d) => d.clicks));
  const winners = data.filter((d) => d.clicks === maxClicks);
  const winner = winners.length === 1 ? winners[0] : null;

  // Check significance between top two
  const sorted = [...data].sort((a, b) => b.clicks - a.clicks);
  const significant = sorted.length >= 2 && isSignificant(
    sorted[0].clicks, sorted[1].clicks,
    totalClicks, totalClicks,
  );

  const chartData = data.map((d) => ({
    name: d.label,
    Klicks: d.clicks,
    Besucher: d.uniqueVisitors,
    anteil: totalClicks > 0 ? ((d.clicks / totalClicks) * 100).toFixed(1) : '0',
  }));

  return (
    <div className="space-y-4">
      <ChartCard title="A/B-Testergebnisse">
        <ResponsiveContainer width="100%" height={Math.max(180, data.length * 60)}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid {...GRID_STYLE} />
            <XAxis type="number" {...AXIS_STYLE} allowDecimals={false} />
            <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={120} />
            <Tooltip
              contentStyle={TOOLTIP_STYLE}
              formatter={(value, name, props) => {
                const payload = props?.payload as Record<string, unknown> | undefined;
                if (name === 'Klicks' && payload?.anteil) return [`${value} (${payload.anteil}%)`, name];
                return [value, String(name)];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Klicks" radius={[0, 3, 3, 0]}>
              {chartData.map((_, idx) => (
                <Cell key={idx} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
              ))}
            </Bar>
            <Bar dataKey="Besucher" radius={[0, 3, 3, 0]} fill="oklch(0.65 0.08 230)" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Winner summary */}
      {totalClicks > 0 && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="flex items-start gap-3">
            <Trophy className="h-4 w-4 mt-0.5 shrink-0 text-amber-500" />
            <div className="space-y-1">
              {winner ? (
                <>
                  <p className="text-[13px] font-medium">
                    &quot;{winner.label}&quot; fuehrt mit {winner.clicks} Klicks ({((winner.clicks / totalClicks) * 100).toFixed(1)}%)
                  </p>
                  {significant ? (
                    <p className="text-[12px] text-green-600 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Statistisch signifikant (95% Konfidenz)
                    </p>
                  ) : (
                    <p className="text-[12px] text-muted-foreground flex items-center gap-1">
                      <Minus className="h-3 w-3" />
                      Noch nicht signifikant - mehr Daten noetig (min. 30 Klicks pro Variante)
                    </p>
                  )}
                </>
              ) : (
                <p className="text-[13px] font-medium flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
                  Varianten liegen gleichauf - noch kein klarer Gewinner
                </p>
              )}
              <p className="text-[11px] text-muted-foreground">
                {totalClicks} Klicks insgesamt ueber {data.length} Varianten
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
