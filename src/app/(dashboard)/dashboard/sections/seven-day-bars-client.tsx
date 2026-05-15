'use client';

import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { QrCode, Link2 } from 'lucide-react';
import { SERIES_COLORS, AXIS_STYLE, GRID_STYLE, TOOLTIP_STYLE, BAR_MAX_SIZE } from '@/lib/chart-config';

type DayPoint = { dateKey: string; label: string; qr: number; link: number };

type Props = {
  data: DayPoint[];
  totalQr: number;
  totalLink: number;
};

/**
 * Zwei nebeneinander stehende Balken-Charts fuer die letzten 7 Tage:
 *  links: QR-Scans, rechts: Link-Klicks
 * Auf Mobile gestapelt, auf Desktop in 2 Spalten.
 */
export function SevenDayBarsClient({ data, totalQr, totalLink }: Props) {
  return (
    <section aria-label="7-Tage-Verlauf" className="grid gap-3 md:grid-cols-2">
      <BarPanel
        title="QR-Scans"
        subtitle="der letzten 7 Tage"
        icon={QrCode}
        total={totalQr}
        data={data}
        dataKey="qr"
        color={SERIES_COLORS.scans}
      />
      <BarPanel
        title="Link-Klicks"
        subtitle="der letzten 7 Tage"
        icon={Link2}
        total={totalLink}
        data={data}
        dataKey="link"
        color={SERIES_COLORS.clicks}
      />
    </section>
  );
}

function BarPanel({
  title,
  subtitle,
  icon: Icon,
  total,
  data,
  dataKey,
  color,
}: {
  title: string;
  subtitle: string;
  icon: typeof QrCode;
  total: number;
  data: DayPoint[];
  dataKey: 'qr' | 'link';
  color: string;
}) {
  const hasData = total > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.8} />
            <h3 className="text-[13.5px] font-semibold tracking-tight">{title}</h3>
          </div>
          <p className="mt-0.5 text-[11.5px] text-muted-foreground">{subtitle}</p>
        </div>
        <div className="text-right">
          <div className="tabular-nums text-[22px] font-semibold leading-none tracking-tight">
            {total.toLocaleString('de-DE')}
          </div>
          <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
            Gesamt
          </div>
        </div>
      </div>
      <div className="h-[180px] w-full">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 6, left: -16, bottom: 0 }}>
              <CartesianGrid {...GRID_STYLE} vertical={false} />
              <XAxis dataKey="label" {...AXIS_STYLE} interval={0} tick={{ fontSize: 10.5, fill: 'var(--muted-foreground)' }} />
              <YAxis {...AXIS_STYLE} allowDecimals={false} width={28} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                cursor={{ fill: 'var(--muted)' }}
                formatter={(value) => [`${Number(value ?? 0).toLocaleString('de-DE')}`, title]}
              />
              <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={BAR_MAX_SIZE} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-border/60 text-[12px] text-muted-foreground">
            Noch keine {dataKey === 'qr' ? 'Scans' : 'Klicks'} in den letzten 7 Tagen
          </div>
        )}
      </div>
    </div>
  );
}
