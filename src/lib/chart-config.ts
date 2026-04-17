/**
 * Shared chart configuration — muted, monochrome-friendly palette.
 * Alle Farben beziehen sich jetzt auf CSS-Tokens — funktioniert in light + dark.
 */

export const CHART_COLORS = {
  primary: 'var(--chart-1)',
  secondary: 'var(--chart-2)',
  tertiary: 'var(--chart-3)',
  quaternary: 'var(--chart-4)',
  quinary: 'var(--chart-5)',
} as const;

/**
 * Palette für Pie/Bar charts mit mehreren Kategorien.
 * Reihenfolge: brand → near-black → warm-coral → neutral → pale-teal → muted-teal → zinc → light-zinc.
 * Alles via chart-* Tokens → automatisch dark-mode-anpassend.
 */
export const CHART_PALETTE = [
  'var(--chart-1)',
  'var(--chart-3)',
  'var(--chart-2)',
  'var(--muted-foreground)',
  'var(--chart-4)',
  'var(--chart-5)',
  'oklch(0.62 0 0)',
  'oklch(0.78 0 0)',
] as const;

/** Named semantic colors for specific data series — brand primary, neutral secondaries */
export const SERIES_COLORS = {
  scans: 'var(--chart-1)',        // brand teal — primary metric
  clicks: 'var(--chart-3)',       // near-black (light) / white (dark) — comparison
  forms: 'var(--chart-2)',        // warm coral — conversions
  forecast: 'var(--chart-5)',     // zinc — subordinate (dashed)
  active: 'var(--chart-1)',       // brand teal
  inactive: 'var(--chart-5)',     // zinc
} as const;

/** Shared axis/grid styling — theme-aware */
export const AXIS_STYLE = {
  fontSize: 11,
  tickLine: false,
  axisLine: false,
  stroke: 'var(--muted-foreground)',
} as const;

export const GRID_STYLE = {
  strokeDasharray: '3 3',
  stroke: 'var(--border)',
  strokeOpacity: 0.8,
} as const;

/** Shared tooltip styling — theme-aware via CSS variables */
export const TOOLTIP_STYLE = {
  fontSize: 12,
  borderRadius: 12,
  border: '1px solid var(--border)',
  background: 'var(--popover)',
  color: 'var(--popover-foreground)',
  boxShadow: 'var(--shadow-md)',
  padding: '8px 12px',
} as const;

/** Theme-aware cursor fills for bar/line charts */
export const CURSOR_FILL = 'var(--muted)';
export const CURSOR_STROKE = 'var(--border)';

/** Default max bar size — keeps bar charts elegant when data is sparse */
export const BAR_MAX_SIZE = 32;
