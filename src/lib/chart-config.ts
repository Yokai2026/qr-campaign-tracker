/**
 * Shared chart configuration — muted, monochrome-friendly palette.
 */

export const CHART_COLORS = {
  primary: 'var(--chart-1)',
  secondary: 'var(--chart-2)',
  tertiary: 'var(--chart-3)',
  quaternary: 'var(--chart-4)',
  quinary: 'var(--chart-5)',
} as const;

/** Palette for pie/bar charts with multiple categories */
export const CHART_PALETTE = [
  'oklch(0.55 0.15 285)',
  'oklch(0.60 0.10 230)',
  'oklch(0.65 0.12 165)',
  'oklch(0.55 0.08 340)',
  'oklch(0.60 0.10 70)',
  'oklch(0.50 0.12 30)',
  'oklch(0.58 0.10 280)',
  'oklch(0.55 0.10 170)',
] as const;

/** Named semantic colors for specific data series */
export const SERIES_COLORS = {
  scans: 'oklch(0.55 0.15 285)',
  clicks: 'oklch(0.60 0.10 165)',
  forms: 'oklch(0.60 0.10 70)',
  active: 'oklch(0.60 0.10 165)',
  inactive: 'oklch(0.60 0 0)',
} as const;

/** Shared axis/grid styling */
export const AXIS_STYLE = {
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: 'oklch(0.90 0 0)',
  strokeOpacity: 0.5,
} as const;
