'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { cn } from '@/lib/utils';

/** Modul-weiter Cache fuer fertig generierte Data-URLs.
 *  Selber Short-Code muss nicht mehrfach gerendert werden — spart CPU bei
 *  vielen QR-Vorschau-Rows (z. B. Live-Feed, Top-Performer). */
const dataUrlCache = new Map<string, string>();

type Props = {
  /** Short-Code des QR — wird zur Generierung der Redirect-URL genutzt */
  shortCode: string;
  /** Render-Groesse in px (Default 28) */
  size?: number;
  /** Optional zusaetzliche Klassen aufs Wrapper-Element */
  className?: string;
  /** Quadratisch eckig + abgerundet — schickere Optik in Listen */
  rounded?: boolean;
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
export function QrPreview({ shortCode, size = 28, className, rounded = true }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(() => dataUrlCache.get(shortCode) ?? null);

  useEffect(() => {
    if (dataUrlCache.has(shortCode)) {
      setDataUrl(dataUrlCache.get(shortCode)!);
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
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((d) => {
        if (cancelled) return;
        dataUrlCache.set(shortCode, d);
        setDataUrl(d);
      })
      .catch(() => {
        // Auf Fehler still scheitern — Skeleton bleibt sichtbar.
      });
    return () => {
      cancelled = true;
    };
  }, [shortCode, size]);

  return (
    <span
      aria-hidden
      className={cn(
        'relative inline-block shrink-0 overflow-hidden border border-border/40 bg-white',
        rounded ? 'rounded-md' : '',
        className,
      )}
      style={{ width: size, height: size }}
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
