'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const SHOW_AT_SCROLL_PERCENT = 40;
const HIDE_NEAR_BOTTOM_PERCENT = 92;
const STORAGE_KEY = 'spurig.sticky-cta.dismissed';

export function StickyMobileCta() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === '1') setDismissed(true);
    } catch {
      // ignore — sessionStorage may be unavailable
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let rafId: number | null = null;

    function update() {
      const doc = document.documentElement;
      const scrolled = window.scrollY;
      const total = Math.max(1, doc.scrollHeight - window.innerHeight);
      const pct = (scrolled / total) * 100;
      setVisible(pct >= SHOW_AT_SCROLL_PERCENT && pct < HIDE_NEAR_BOTTOM_PERCENT);
      rafId = null;
    }

    function onScroll() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(update);
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);

    if (reduced) {
      // Still respect threshold, but disable transitions on element
    }

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [dismissed]);

  function dismiss() {
    setDismissed(true);
    try {
      sessionStorage.setItem(STORAGE_KEY, '1');
    } catch {
      // ignore
    }
  }

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Schneller Einstieg"
      className={
        'fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)] backdrop-blur transition-all duration-300 sm:hidden ' +
        (visible
          ? 'translate-y-0 opacity-100'
          : 'pointer-events-none translate-y-full opacity-0')
      }
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[13px] font-semibold leading-tight text-foreground">
            14 Tage gratis testen
          </span>
          <span className="text-[11px] leading-tight text-muted-foreground">
            Keine Kreditkarte · DSGVO · ab 8,99 €
          </span>
        </div>
        <Button
          size="sm"
          variant="brand"
          render={<Link href="/signup" />}
          className="shrink-0"
        >
          Starten
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Schließen"
          className="-mr-1 ml-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/70 hover:bg-muted hover:text-foreground"
        >
          <span aria-hidden className="text-base leading-none">×</span>
        </button>
      </div>
    </div>
  );
}
