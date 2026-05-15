'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Copy, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Result = {
  intent: string;
  confidence: number;
  summary: string;
  suggested_response: string | null;
  telegram_alert: boolean;
};

const INTENT_LABEL: Record<string, { label: string; color: string }> = {
  interested: { label: '🔥 Heisses Lead', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  question: { label: '❓ Frage offen', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  not_interested: { label: '⏸️ Kein Interesse', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
  unsubscribe: { label: '🛑 Unsubscribe', color: 'bg-red-500/15 text-red-300 border-red-500/30' },
  spam: { label: '🗑️ Spam/Auto', color: 'bg-muted text-muted-foreground' },
  other: { label: 'Sonstiges', color: 'bg-muted text-muted-foreground' },
};

export function SalesAgentClient() {
  const [leadId, setLeadId] = useState('');
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function classify() {
    if (!replyText.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const r = await fetch('/api/admin/sales-agent/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: leadId.trim() || undefined, replyText: replyText.trim() }),
      });
      const j = await r.json();
      if (!r.ok) {
        setError(j.error ?? 'unknown');
        return;
      }
      setResult(j);
      if (j.telegram_alert) toast.success('Telegram-Alert gesendet (heisses Lead!)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'unknown');
    } finally {
      setLoading(false);
    }
  }

  function copyResponse() {
    if (!result?.suggested_response) return;
    navigator.clipboard.writeText(result.suggested_response);
    setCopied(true);
    toast.success('Antwort in Zwischenablage');
    setTimeout(() => setCopied(false), 1500);
  }

  const intentInfo = result ? INTENT_LABEL[result.intent] ?? INTENT_LABEL.other : null;

  return (
    <div className="container mx-auto max-w-4xl px-4 py-6 md:py-10">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Admin Center
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <Bot className="h-6 w-6 text-cyan-400" />
          AI Sales-Agent
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Paste eine Reply-Mail (vom Outbound-Lead) — Claude klassifiziert + draftet die Antwort.
          Bei "interested"-Replies wird automatisch Telegram-Push ausgeloest.
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-5">
        <div>
          <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
            Lead-ID (optional, fuer Auto-Status-Update + Kontext)
          </label>
          <input
            value={leadId}
            onChange={(e) => setLeadId(e.target.value)}
            placeholder="z.B. 80b60b3e-ca51-4133-9dc2-..."
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-[13px] font-mono outline-none focus:border-cyan-500/40"
          />
        </div>

        <div>
          <label className="mb-1 block text-[12px] font-medium text-muted-foreground">
            Reply-Text der vom Lead kam:
          </label>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={8}
            placeholder="Hi David, ja klingt interessant. Koennten wir naechste Woche kurz telefonieren?"
            className="w-full rounded-lg border border-border bg-background p-3 text-[13px] leading-relaxed outline-none focus:border-cyan-500/40"
          />
        </div>

        <Button onClick={classify} disabled={loading || !replyText.trim()} className="w-full md:w-auto">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Klassifiziere + drafte...
            </>
          ) : (
            <>
              <Bot className="mr-2 h-4 w-4" /> Reply analysieren
            </>
          )}
        </Button>

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-[13px] text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold ${intentInfo?.color}`}>
              {intentInfo?.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Confidence: {Math.round(result.confidence * 100)}%
            </span>
            {result.telegram_alert && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                ✓ Telegram-Alert gesendet
              </span>
            )}
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-4">
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Zusammenfassung</div>
            <p className="text-[14px]">{result.summary}</p>
          </div>

          {result.suggested_response ? (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-300">
                  Vorgeschlagene Antwort
                </span>
                <Button size="sm" variant="outline" onClick={copyResponse}>
                  {copied ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
                  {copied ? 'Kopiert' : 'Kopieren'}
                </Button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-[14px] leading-relaxed">
                {result.suggested_response}
              </pre>
            </div>
          ) : (
            <p className="text-[12px] italic text-muted-foreground">
              Kein Antwort-Vorschlag (Intent = {result.intent}, keine Antwort empfohlen).
            </p>
          )}
        </div>
      )}
    </div>
  );
}
