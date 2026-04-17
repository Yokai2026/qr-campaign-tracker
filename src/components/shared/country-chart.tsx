'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { SERIES_COLORS, AXIS_STYLE, GRID_STYLE, TOOLTIP_STYLE, BAR_MAX_SIZE } from '@/lib/chart-config';

const COUNTRY_NAMES: Record<string, string> = {
  DE: 'Deutschland', AT: 'Oesterreich', CH: 'Schweiz', NL: 'Niederlande',
  BE: 'Belgien', FR: 'Frankreich', GB: 'Grossbritannien', US: 'USA',
  PL: 'Polen', CZ: 'Tschechien', IT: 'Italien', ES: 'Spanien',
  DK: 'Daenemark', SE: 'Schweden', NO: 'Norwegen', FI: 'Finnland',
  PT: 'Portugal', IE: 'Irland', LU: 'Luxemburg', HU: 'Ungarn',
  RO: 'Rumaenien', BG: 'Bulgarien', HR: 'Kroatien', SI: 'Slowenien',
  SK: 'Slowakei', GR: 'Griechenland', TR: 'Tuerkei', RU: 'Russland',
  UA: 'Ukraine', JP: 'Japan', CN: 'China', IN: 'Indien', BR: 'Brasilien',
  CA: 'Kanada', AU: 'Australien', MX: 'Mexiko', KR: 'Suedkorea',
};

function getCountryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

type CountryChartProps = {
  data: { name: string; value: number }[];
};

export function CountryChart({ data }: CountryChartProps) {
  const chartData = data
    .map((d) => ({ name: getCountryName(d.name), scans: d.value }))
    .sort((a, b) => b.scans - a.scans)
    .slice(0, 10);

  if (chartData.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 38)}>
      <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID_STYLE} horizontal={false} />
        <XAxis type="number" {...AXIS_STYLE} />
        <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={120} />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'var(--muted)' }} />
        <Bar dataKey="scans" name="Scans" fill={SERIES_COLORS.scans} radius={[0, 6, 6, 0]} maxBarSize={BAR_MAX_SIZE} />
      </BarChart>
    </ResponsiveContainer>
  );
}
