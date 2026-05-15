'use client';

import { useState } from 'react';
import { ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';

/**
 * Inline-CTA fuer Blog-Posts: Email-Capture fuer DSGVO-Checkliste-PDF.
 * Server-side persistierung via /api/lead-magnet/subscribe.
 */
export function LeadMagnetCTA({
  magnet = 'dsgvo-checkliste-2026',
  title = 'DSGVO-Checkliste Marketing-Tracking 2026',
  description = '14 konkrete Pruef-Punkte fuer dein Tracking-Setup. Schrems II, US-Cloud, AVV, Cookie-Banner — was 2026 wirklich gilt.',
}: {
  magnet?: string;
  title?: string;
  description?: string;
}) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (status === 'loading' || !email) return;
    setStatus('loading');
    setError(null);
    try {
      const r = await fetch('/api/lead-magnet/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, magnet }),
      });
      const j = await r.json();
      if (!r.ok) {
        setStatus('error');
        setError(j.error ?? 'Fehler beim Absenden');
        return;
      }
      setStatus('done');
    } catch {
      setStatus('error');
      setError('Netzwerk-Fehler — bitte nochmal versuchen');
    }
  }

  return (
    <aside className="my-8 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.06] via-transparent to-purple-500/[0.06] p-5 md:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15.5px] font-semibold tracking-tight">Hol dir die Checkliste</h3>
          <p className="mt-1 text-[13.5px] leading-relaxed text-muted-foreground">{description}</p>

          {status === 'done' ? (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[13px] text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              Check deine Mails — Link kommt in 1 Minute.
            </div>
          ) : (
            <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="deine@email.de"
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-[14px] outline-none focus:border-cyan-500/50"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-cyan-500 px-4 py-2 text-[13.5px] font-semibold text-cyan-950 transition-colors hover:bg-cyan-400 disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Senden...
                  </>
                ) : (
                  <>Checkliste anfordern</>
                )}
              </button>
            </form>
          )}
          {error && (
            <p className="mt-2 text-[12px] text-red-400">{error}</p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground/70">
            Keine Werbung, kein Spam — eine Mail, dann Schweigen. Abmeldung jederzeit.
          </p>
        </div>
      </div>
      <p className="sr-only">{title}</p>
    </aside>
  );
}
