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

/**
 * Palette for pie/bar charts with multiple categories.
 * Neutral-first with semantic accents — no violet/brand-color dominance.
 * Order: near-black → mid-neutral → emerald → amber → rose → teal → indigo-grey → warm-grey.
 */
export const CHART_PALETTE = [
  'oklch(0.25 0 0)',
  'oklch(0.55 0 0)',
  'oklch(0.65 0.12 165)',
  'oklch(0.70 0.12 70)',
  'oklch(0.60 0.12 20)',
  'oklch(0.60 0.10 200)',
  'oklch(0.45 0 0)',
  'oklch(0.75 0 0)',
] as const;

/** Named semantic colors for specific data series — neutral primary, semantic accents only */
export const SERIES_COLORS = {
  scans: 'oklch(0.25 0 0)',
  clicks: 'oklch(0.65 0.12 165)',
  forms: 'oklch(0.70 0.12 70)',
  active: 'oklch(0.65 0.12 165)',
  inactive: 'oklch(0.65 0 0)',
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
