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
 * Brand-Teal first, then neutrals + warm accent for contrast.
 * Order: brand-teal → near-black → warm-coral → mid-neutral → light-teal → muted-teal → warm-zinc → light-zinc.
 */
export const CHART_PALETTE = [
  'oklch(0.66 0.13 185)',  // brand teal
  'oklch(0.21 0.005 80)',  // near-black
  'oklch(0.74 0.13 38)',   // warm coral
  'oklch(0.50 0.008 80)',  // mid neutral
  'oklch(0.78 0.10 185)',  // light teal
  'oklch(0.45 0.085 185)', // muted teal
  'oklch(0.62 0.008 80)',  // warm zinc
  'oklch(0.78 0.005 80)',  // light zinc
] as const;

/** Named semantic colors for specific data series — brand teal primary, neutral secondaries */
export const SERIES_COLORS = {
  scans: 'oklch(0.66 0.13 185)',     // brand teal — primary metric
  clicks: 'oklch(0.21 0.005 80)',    // near-black — comparison
  forms: 'oklch(0.74 0.13 38)',      // warm coral — conversions
  active: 'oklch(0.66 0.13 185)',    // brand teal
  inactive: 'oklch(0.62 0.008 80)',  // warm zinc
} as const;

/** Shared axis/grid styling */
export const AXIS_STYLE = {
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

export const GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: 'oklch(0.918 0.006 80)',
  strokeOpacity: 0.6,
} as const;
