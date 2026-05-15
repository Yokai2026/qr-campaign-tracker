'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

/** Modul-weiter Cache fuer fertig generierte Data-URLs.
 *  Key: shortCode + fg + bg + size (jede Variante separat). Selber Code mit
 *  selben Farben muss nicht zweimal gerendert werden — spart CPU bei
 *  vielen QR-Vorschau-Rows (z. B. Live-Feed, Top-Performer, Liste). */
const dataUrlCache = new Map<string, string>();

const DEFAULT_FG = '#0f172a';
const DEFAULT_BG = '#ffffff';

type Props = {
  /** Short-Code des QR — wird zur Generierung der Redirect-URL genutzt */
  shortCode: string;
  /** Render-Groesse in px (Default 28) */
  size?: number;
  /** Optional zusaetzliche Klassen aufs Wrapper-Element */
  className?: string;
  /** Quadratisch eckig + abgerundet — schickere Optik in Listen */
  rounded?: boolean;
  /** Vordergrund (Dots). Default: dunkles Slate. */
  fg?: string | null;
  /** Hintergrund. Default: weiss. */
  bg?: string | null;
};

/**
 * Mini-QR-Vorschau — generiert clientseitig ein kleines PNG, damit das
 * Pattern in Listen/Feeds wiedererkennbar ist (jeder QR sieht anders aus).
 *
 * Anders als das `<QrCode>`-Icon von lucide (das fuer ALLE Codes identisch ist)
 * zeigt das hier den echten Code als Mini-Bild. Das hilft visuell zu unterscheiden
 * welcher Code gerade gescannt wurde — speziell wichtig im Live-Feed.
 *
 * PNG-Variante (Data-URL) statt SVG: vermeidet dangerouslySetInnerHTML und
 * laesst sich beliebig via CSS skalieren.
 */
export function QrPreview({
  shortCode,
  size = 28,
  className,
  rounded = true,
  fg,
  bg,
}: Props) {
  // Normalisierte Farben — defaults wenn null/leer
  const fgColor = fg && /^#[0-9A-Fa-f]{6}$/.test(fg) ? fg : DEFAULT_FG;
  const bgColor = bg && /^#[0-9A-Fa-f]{6}$/.test(bg) ? bg : DEFAULT_BG;
  const cacheKey = `${shortCode}|${fgColor}|${bgColor}|${size}`;

  const [dataUrl, setDataUrl] = useState<string | null>(() => dataUrlCache.get(cacheKey) ?? null);

  useEffect(() => {
    if (dataUrlCache.has(cacheKey)) {
      setDataUrl(dataUrlCache.get(cacheKey)!);
      return;
    }
    let cancelled = false;
    // Wir kodieren die Redirect-URL des Hosts; bei SSR-Fallback nimmt das Browser-origin.
    // Fuer die Optik der Mini-Vorschau ist die exakte URL egal (das Pattern haengt
    // primaer am Inhalt) — Hauptsache: gleicher Short-Code → gleiches Pattern.
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://spurig.app';
    const url = `${origin}/r/${shortCode}`;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'L',
      margin: 1,
      // Render in 4x der Anzeigegroesse fuer scharfes Hi-DPI
      width: size * 4,
      color: { dark: fgColor, light: bgColor },
    })
      .then((d) => {
        if (cancelled) return;
        dataUrlCache.set(cacheKey, d);
        setDataUrl(d);
      })
      .catch(() => {
        // Auf Fehler still scheitern — Skeleton bleibt sichtbar.
      });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, shortCode, size, fgColor, bgColor]);

  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-block shrink-0 overflow-hidden border border-border/40',
        rounded ? 'rounded-md' : '',
        className,
      )}
      style={{ width: size, height: size, background: bgColor }}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Data-URL, kein next/image-Vorteil
        <img
          src={dataUrl}
          alt=""
          width={size}
          height={size}
          className="block h-full w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span className="block h-full w-full animate-pulse bg-muted/40" />
      )}
    </span>
  );
}
