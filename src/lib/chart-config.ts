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
  'oklch(0.64 0.10 185)',  // brand teal (soft)
  'oklch(0.21 0.005 80)',  // near-black
  'oklch(0.74 0.10 38)',   // warm coral (soft)
  'oklch(0.50 0.008 80)',  // mid neutral
  'oklch(0.78 0.07 185)',  // pale teal
  'oklch(0.48 0.07 185)',  // muted teal
  'oklch(0.62 0.008 80)',  // warm zinc
  'oklch(0.78 0.005 80)',  // light zinc
] as const;

/** Named semantic colors for specific data series — brand teal primary, neutral secondaries */
export const SERIES_COLORS = {
  scans: 'oklch(0.64 0.10 185)',     // brand teal — primary metric
  clicks: 'oklch(0.21 0.005 80)',    // near-black — comparison
  forms: 'oklch(0.74 0.10 38)',      // warm coral — conversions
  forecast: 'oklch(0.62 0.008 80)',  // warm zinc — subordinate (dashed)
  active: 'oklch(0.64 0.10 185)',    // brand teal
  inactive: 'oklch(0.62 0.008 80)',  // warm zinc
} as const;

/** Shared axis/grid styling */
export const AXIS_STYLE = {
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  stroke: 'oklch(0.50 0.008 80)',
} as const;

export const GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: 'oklch(0.918 0.006 80)',
  strokeOpacity: 0.6,
} as const;

/** Shared tooltip styling — referenced by all charts for consistency */
export const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 12,
  border: '1px solid oklch(0.918 0.006 80)',
  background: 'oklch(1 0 0)',
  boxShadow:
    '0 6px 16px -6px oklch(0.20 0.02 80 / 0.12), 0 2px 4px -2px oklch(0.20 0.02 80 / 0.06)',
  padding: '8px 12px',
} as const;

/** Default max bar size — keeps bar charts elegant when data is sparse */
export const BAR_MAX_SIZE = 32;
