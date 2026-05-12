'use client';

import { Printer } from 'lucide-react';

// Client-Component damit window.print() funktioniert. Aufgesplittet weil
// die Guide-Page sonst komplett client-side rendern muesste (waere sinnlos
// fuer SEO).
export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2 text-[13px] font-medium transition-colors hover:border-brand/30 hover:bg-muted/40"
    >
      <Printer className="h-3.5 w-3.5" />
      Als PDF speichern
    </button>
  );
}
