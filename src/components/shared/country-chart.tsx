'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { SERIES_COLORS, AXIS_STYLE, GRID_STYLE } from '@/lib/chart-config';

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
    <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 36)}>
      <BarChart data={chartData} layout="vertical">
        <CartesianGrid {...GRID_STYLE} />
        <XAxis type="number" {...AXIS_STYLE} />
        <YAxis dataKey="name" type="category" {...AXIS_STYLE} width={120} />
        <Tooltip
          contentStyle={{
            fontSize: 12,
            borderRadius: 6,
            border: '1px solid oklch(0.92 0 0)',
            boxShadow: '0 4px 12px oklch(0 0 0 / 0.08)',
          }}
        />
        <Bar dataKey="scans" name="Scans" fill={SERIES_COLORS.scans} radius={[0, 3, 3, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
