import type { OutboundSegment } from './types';

export const DACH_CITIES = [
  'Berlin',
  'München',
  'Hamburg',
  'Köln',
  'Frankfurt am Main',
  'Stuttgart',
  'Düsseldorf',
  'Leipzig',
  'Dortmund',
  'Essen',
  'Bremen',
  'Dresden',
  'Hannover',
  'Nürnberg',
  'Wien',
  'Graz',
  'Linz',
  'Salzburg',
  'Zürich',
  'Genf',
  'Basel',
  'Bern',
] as const;

export type SegmentConfig = {
  key: OutboundSegment;
  label: string;
  description: string;
  queries: string[];
};

export const SEGMENT_CONFIGS: Record<OutboundSegment, SegmentConfig> = {
  marketing_agency: {
    key: 'marketing_agency',
    label: 'Marketing-Agenturen',
    description: 'Agenturen die Kampagnen für Kunden bauen — höchster Hebel, 1 Agentur = potentiell 10 Spurig-Accounts',
    queries: [
      'Marketing Agentur',
      'Werbeagentur',
      'Digitalagentur',
      'Performance Marketing Agentur',
      'Mediaagentur',
    ],
  },
  gastronomy: {
    key: 'gastronomy',
    label: 'Gastronomie',
    description: 'Restaurants, Cafés, Bars — QR-Speisekarten + Bewertungslinks',
    queries: ['Restaurant', 'Café', 'Bar', 'Bistro', 'Pizzeria'],
  },
  crafts_sme: {
    key: 'crafts_sme',
    label: 'Handwerk + KMU',
    description: 'Lokale Unternehmen mit Flyern/Visitenkarten',
    queries: ['Friseur', 'Bäckerei', 'Maler', 'Installateur', 'Autowerkstatt', 'Fitnessstudio'],
  },
  events_tourism: {
    key: 'events_tourism',
    label: 'Events & Tourismus',
    description: 'Eventagenturen + Stadtmarketing + Tourismusbüros — höhere Vertragsvolumen',
    queries: ['Eventagentur', 'Tourismusbüro', 'Stadtmarketing', 'Hotel', 'Eventlocation'],
  },
};

/**
 * Erzeugt eine deterministische Rotation aus (segment × query × city) basierend auf dem Tag.
 * So scrapt jeder Tagescron andere Kombinationen statt immer dieselben Top-10 zu treffen.
 */
export function rotateSearchQueries(
  segment: OutboundSegment,
  date: Date = new Date(),
  perRun: number = 3,
): string[] {
  const cfg = SEGMENT_CONFIGS[segment];
  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );

  const queries = cfg.queries;
  const cities = DACH_CITIES;
  const total = queries.length * cities.length;
  const out: string[] = [];

  for (let i = 0; i < perRun; i++) {
    const idx = (dayOfYear * perRun + i) % total;
    const q = queries[idx % queries.length];
    const c = cities[Math.floor(idx / queries.length) % cities.length];
    out.push(`${q} ${c}`);
  }

  return out;
}
