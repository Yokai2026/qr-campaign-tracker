'use client';

import { Download } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] hover:bg-muted/30 print:hidden"
    >
      <Download className="h-3.5 w-3.5" /> Als PDF speichern (Strg/Cmd+P)
    </button>
  );
}
