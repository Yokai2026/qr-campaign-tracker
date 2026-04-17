'use client';

import { memo, useMemo, useState, useCallback } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';

const GEO_URL =
  'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

/**
 * ISO 3166-1 numeric -> alpha-2 mapping for countries we track.
 * world-atlas uses numeric IDs; our data uses alpha-2 codes.
 */
const NUM_TO_ALPHA2: Record<string, string> = {
  '276': 'DE', '040': 'AT', '756': 'CH', '528': 'NL', '056': 'BE',
  '250': 'FR', '826': 'GB', '840': 'US', '616': 'PL', '203': 'CZ',
  '380': 'IT', '724': 'ES', '208': 'DK', '752': 'SE', '578': 'NO',
  '246': 'FI', '620': 'PT', '372': 'IE', '442': 'LU', '348': 'HU',
  '642': 'RO', '100': 'BG', '191': 'HR', '705': 'SI', '703': 'SK',
  '300': 'GR', '792': 'TR', '643': 'RU', '804': 'UA', '392': 'JP',
  '156': 'CN', '356': 'IN', '076': 'BR', '124': 'CA', '036': 'AU',
  '484': 'MX', '410': 'KR', '032': 'AR', '152': 'CL', '170': 'CO',
  '604': 'PE', '710': 'ZA', '818': 'EG', '566': 'NG', '404': 'KE',
  '764': 'TH', '360': 'ID', '458': 'MY', '608': 'PH', '704': 'VN',
  '682': 'SA', '784': 'AE', '376': 'IL', '554': 'NZ', '702': 'SG',
};

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

type WorldMapProps = {
  data: { name: string; value: number }[];
};

type TooltipState = {
  x: number;
  y: number;
  name: string;
  value: number;
} | null;

function getColor(value: number, max: number): string {
  if (value === 0) return 'oklch(0.96 0.005 80)';
  const ratio = Math.min(value / max, 1);
  // Brand-teal heat: light at low values, deeper teal at high values
  const l = 0.88 - ratio * 0.32; // 0.88 -> 0.56
  const c = 0.04 + ratio * 0.10; // 0.04 -> 0.14
  return `oklch(${l} ${c} 185)`;
}

function WorldMapInner({ data }: WorldMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState>(null);

  const dataMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const d of data) {
      m.set(d.name, d.value);
    }
    return m;
  }, [data]);

  const maxValue = useMemo(
    () => Math.max(...data.map((d) => d.value), 1),
    [data]
  );

  const handleMouseEnter = useCallback(
    (geo: { id: string; properties: { name: string } }, e: React.MouseEvent) => {
      const numId = geo.id;
      const alpha2 = NUM_TO_ALPHA2[numId] || '';
      const value = dataMap.get(alpha2) || 0;
      if (value === 0) return;
      const name = COUNTRY_NAMES[alpha2] || geo.properties.name || alpha2;
      const rect = (e.currentTarget as SVGElement).closest('svg')?.getBoundingClientRect();
      if (!rect) return;
      setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top - 10, name, value });
    },
    [dataMap]
  );

  const handleMouseLeave = useCallback(() => setTooltip(null), []);

  return (
    <div className="relative w-full">
      <ComposableMap
        projectionConfig={{ rotate: [-10, 0, 0], scale: 140 }}
        height={380}
        style={{ width: '100%', height: 'auto' }}
      >
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const numId = geo.id as string;
                const alpha2 = NUM_TO_ALPHA2[numId] || '';
                const value = dataMap.get(alpha2) || 0;
                const fill = getColor(value, maxValue);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="oklch(1 0 0)"
                    strokeWidth={0.5}
                    onMouseEnter={(e) => handleMouseEnter(geo, e)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      default: { outline: 'none', transition: 'fill 200ms ease' },
                      hover: {
                        fill: value > 0 ? 'oklch(0.45 0.13 185)' : 'oklch(0.92 0.01 80)',
                        outline: 'none',
                        cursor: value > 0 ? 'pointer' : 'default',
                      },
                      pressed: { outline: 'none' },
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Custom tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-[var(--shadow-md)]"
          style={{ left: tooltip.x, top: tooltip.y, transform: 'translate(-50%, -100%)' }}
        >
          <span className="font-semibold">{tooltip.name}</span>
          <span className="ml-2 tabular-nums text-brand">{tooltip.value} Scans</span>
        </div>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
        <span>Wenig</span>
        <div className="flex h-2 w-36 rounded-full overflow-hidden ring-1 ring-border">
          {Array.from({ length: 8 }, (_, i) => (
            <div
              key={i}
              className="flex-1"
              style={{ background: getColor(((i + 1) / 8) * maxValue, maxValue) }}
            />
          ))}
        </div>
        <span>Viel</span>
      </div>
    </div>
  );
}

export const WorldMap = memo(WorldMapInner);
