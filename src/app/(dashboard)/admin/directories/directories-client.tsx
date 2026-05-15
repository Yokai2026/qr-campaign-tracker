'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, ExternalLink, CheckCircle2, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DIRECTORIES, LISTING_TEMPLATES } from '@/data/directories';

const AUTH_COLOR: Record<string, string> = {
  'sehr-hoch': 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  hoch: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  mittel: 'bg-muted text-muted-foreground border-border',
};

export function DirectoriesClient() {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Kopiert');
    setTimeout(() => setCopiedKey(null), 1500);
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-6 md:py-10">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Admin Center
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <ListChecks className="h-6 w-6 text-cyan-400" /> SaaS-Directory-Submission
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          15+ Directories die fuer DACH-B2B-SaaS sinnvoll sind. Pro Eintrag direkter Submit-Link + Aufwand + Authority + Tipp.
          Ziel: 50-200 Visits + Backlinks in den ersten 4 Wochen.
        </p>
      </div>

      {/* Ready-to-copy Texte */}
      <section className="mb-8 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
        <h2 className="mb-3 text-base font-semibold">Listing-Texte (Copy-Paste-ready)</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <CopyBlock
            label="Short (60 Zeichen)"
            text={LISTING_TEMPLATES.short_60}
            onCopy={(t) => copy(t, 'short')}
            active={copiedKey === 'short'}
          />
          <CopyBlock
            label="Medium (160 Zeichen)"
            text={LISTING_TEMPLATES.medium_160}
            onCopy={(t) => copy(t, 'medium')}
            active={copiedKey === 'medium'}
          />
          <CopyBlock
            label="Long (500 Zeichen)"
            text={LISTING_TEMPLATES.long_500}
            onCopy={(t) => copy(t, 'long')}
            active={copiedKey === 'long'}
          />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Tags:</span>
          {LISTING_TEMPLATES.tags.map((t) => (
            <button
              key={t}
              onClick={() => copy(t, `tag-${t}`)}
              className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] hover:bg-muted/70"
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* Directory-Liste */}
      <div className="space-y-3">
        {DIRECTORIES.map((d) => (
          <div key={d.name} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[15px] font-semibold">{d.name}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${AUTH_COLOR[d.authority]}`}>
                    {d.authority}
                  </span>
                  <span className="text-[10px] text-muted-foreground">· {d.effort}</span>
                  {d.free ? (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-300">Gratis</span>
                  ) : (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">Bezahlt</span>
                  )}
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    {d.category}
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">{d.tip}</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1 rounded-lg border border-border bg-card px-3 text-[12px] font-medium hover:bg-muted/50"
                >
                  <ExternalLink className="h-3 w-3" /> Vorschau
                </a>
                <a
                  href={d.submitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-8 items-center gap-1 rounded-lg bg-foreground px-3 text-[12px] font-semibold text-background hover:opacity-90"
                >
                  Submit →
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CopyBlock({ label, text, onCopy, active }: { label: string; text: string; onCopy: (t: string) => void; active: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <button onClick={() => onCopy(text)} className="text-[11px] text-cyan-300 hover:text-cyan-200">
          {active ? <CheckCircle2 className="inline h-3 w-3" /> : <Copy className="inline h-3 w-3" />}
        </button>
      </div>
      <p className="text-[12px] leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
