'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Info, X, Check } from 'lucide-react';

type Dormant = {
  id: string;
  shortCode: string;
  placementName: string | null;
};

const STORAGE_KEY = 'qr-health-dismissed';
/** Hide for 7 days after dismiss — wenn sich der Status verändert, kommt neuer Hash. */
const DISMISS_DURATION_MS = 7 * 24 * 3600 * 1000;

function makeHash(dormant: Dormant[]): string {
  return dormant
    .map((d) => d.id)
    .sort()
    .join('|');
}

type StoredDismiss = {
  hash: string;
  until: number;
};

/**
 * Soft info-banner for dormant QR-Codes. Nicht mehr agressiv-amber, dafür
 * dismissible (lokal, 7 Tage) — wenn neue Codes dormant werden ändert sich
 * der Hash und der Banner erscheint wieder.
 */
export function QrHealthBanner({ dormant }: { dormant: Dormant[] }) {
  const [mounted, setMounted] = useState(false);
  const [hidden, setHidden] = useState(false);

  const currentHash = makeHash(dormant);

  useEffect(() => {
    setMounted(true);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const stored = JSON.parse(raw) as StoredDismiss;
      if (stored.hash === currentHash && stored.until > Date.now()) {
        setHidden(true);
      }
    } catch {
      // ignore malformed storage
    }
  }, [currentHash]);

  function dismiss() {
    const payload: StoredDismiss = {
      hash: currentHash,
      until: Date.now() + DISMISS_DURATION_MS,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // storage not available
    }
    setHidden(true);
  }

  // Vor mount nicht rendern (vermeidet flash of dismissed content)
  if (!mounted) return null;
  if (hidden) return null;

  return (
    <div className="group flex items-start gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 transition-all">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
        <Info className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-foreground">
          {dormant.length} aktive{dormant.length === 1 ? 'r' : ''} QR-Code
          {dormant.length === 1 ? '' : 's'} ohne Scans seit 7+ Tagen
        </p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted-foreground">
          {dormant
            .slice(0, 3)
            .map((qr) => (qr.placementName ? `${qr.shortCode} (${qr.placementName})` : qr.shortCode))
            .join(', ')}
          {dormant.length > 3 && ` und ${dormant.length - 3} weitere`}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-[12px]">
          <Link
            href="/qr-codes"
            className="font-medium text-brand hover:underline"
          >
            QR-Codes prüfen
          </Link>
          <button
            type="button"
            onClick={dismiss}
            className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Check className="h-3 w-3" />
            Erledigt
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Hinweis schließen"
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
