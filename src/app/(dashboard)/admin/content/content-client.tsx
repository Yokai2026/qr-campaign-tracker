'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  Send,
  Sparkles,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { IdeasBacklog } from './ideas-backlog';

type Channel = 'linkedin' | 'twitter' | 'reddit';
type Status = 'draft' | 'edited' | 'posted' | 'skipped';

type Draft = {
  id: string;
  blog_slug: string;
  channel: Channel;
  draft_text: string;
  model: string;
  status: Status;
  posted_at: string | null;
  external_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type Article = {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
  source?: 'file' | 'db';
  image_prompt?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
};

type Response = {
  drafts: Draft[];
  articles: Article[];
};

const CHANNEL_LABELS: Record<Channel, string> = {
  linkedin: 'LinkedIn',
  twitter: 'Twitter/X',
  reddit: 'Reddit',
};

const CHANNEL_COLORS: Record<Channel, string> = {
  linkedin: '#0a66c2',
  twitter: '#1d9bf0',
  reddit: '#ff4500',
};

const CHANNEL_PUBLISH_URLS: Record<Channel, string> = {
  linkedin: 'https://www.linkedin.com/feed/?shareActive=true',
  twitter: 'https://twitter.com/intent/tweet',
  reddit: 'https://www.reddit.com/submit',
};

export function ContentClient() {
  const [generatingSlug, setGeneratingSlug] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Response>({
    queryKey: ['content-drafts'],
    queryFn: async () => {
      const r = await fetch('/api/admin/content');
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    },
    refetchInterval: 30_000,
  });

  async function generate(slug: string) {
    setGeneratingSlug(slug);
    try {
      const r = await fetch('/api/admin/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });
      const j = await r.json();
      if (!r.ok) {
        toast.error(`HTTP ${r.status}: ${j.error ?? 'unknown'}`);
        return;
      }
      const results = (j.results ?? []) as Array<{ channel: string; ok: boolean; error?: string }>;
      const ok = results.filter((x) => x.ok).length;
      const fails = results.filter((x) => !x.ok);
      if (ok > 0) {
        toast.success(`${ok} Drafts generiert${fails.length > 0 ? `, ${fails.length} fehlgeschlagen` : ''}`);
        if (fails.length > 0) {
          console.error('Channel-Fails:', fails);
          fails.forEach((f) => toast.error(`${f.channel}: ${f.error?.slice(0, 80) ?? 'unknown'}`, { duration: 8000 }));
        }
      } else {
        toast.error(
          fails[0]?.error
            ? `Alle Channels fehlgeschlagen. ${fails[0].channel}: ${fails[0].error.slice(0, 100)}`
            : 'Generierung fehlgeschlagen — keine Antwort von Claude',
          { duration: 12000 },
        );
        console.error('All channel fails:', fails);
      }
      queryClient.invalidateQueries({ queryKey: ['content-drafts'] });
    } catch (e) {
      toast.error(`Netzwerk-Fehler: ${e instanceof Error ? e.message : 'unknown'}`);
    } finally {
      setGeneratingSlug(null);
    }
  }

  async function updateDraft(id: string, patch: Record<string, unknown>) {
    const r = await fetch('/api/admin/content', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...patch }),
    });
    if (r.ok) queryClient.invalidateQueries({ queryKey: ['content-drafts'] });
    else toast.error('Update fehlgeschlagen');
  }

  const articles = data?.articles ?? [];
  const draftsBySlug = (data?.drafts ?? []).reduce<Record<string, Draft[]>>((acc, d) => {
    (acc[d.blog_slug] ??= []).push(d);
    return acc;
  }, {});

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Admin Center
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Content-Maschine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          5 Themen-Pillars → Claude generiert Ideen → 1-Click → Full Blog + LinkedIn + Twitter + Reddit Drafts.
          Du reviewst, postest, oder editierst alles manuell vorher.
        </p>
      </div>

      <IdeasBacklog />

      <h2 className="mb-3 text-base font-semibold tracking-tight">Blog-Posts mit Drafts</h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : articles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Keine Blog-Posts gefunden. Erstelle einen Post unter src/app/blog/.
        </div>
      ) : (
        <div className="space-y-6">
          {articles.map((article) => {
            const drafts = draftsBySlug[article.slug] ?? [];
            const hasAny = drafts.length > 0;
            return (
              <div key={article.slug} className="rounded-xl border border-border bg-card p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/blog/${article.slug}`}
                      target="_blank"
                      className="text-base font-semibold hover:underline"
                    >
                      {article.title}
                    </Link>
                    <p className="mt-1 line-clamp-2 text-[13px] text-muted-foreground">{article.description}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {article.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                      <span className="text-[10px] text-muted-foreground">· {article.publishedAt}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={hasAny ? 'outline' : 'default'}
                    disabled={generatingSlug === article.slug}
                    onClick={() => generate(article.slug)}
                  >
                    {generatingSlug === article.slug ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {hasAny ? 'Neu generieren' : 'Drafts generieren'}
                  </Button>
                </div>

                {article.image_prompt && (
                  <ImagePromptCard prompt={article.image_prompt} alt={article.image_alt ?? null} title={article.title} />
                )}

                {hasAny && (
                  <div className="grid gap-3 md:grid-cols-3">
                    {(['linkedin', 'twitter', 'reddit'] as Channel[]).map((channel) => {
                      const draft = drafts.find((d) => d.channel === channel);
                      return (
                        <DraftCard
                          key={channel}
                          channel={channel}
                          draft={draft}
                          onUpdate={updateDraft}
                          onRegenerate={() => generate(article.slug)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DraftCard({
  channel,
  draft,
  onUpdate,
}: {
  channel: Channel;
  draft: Draft | undefined;
  onUpdate: (id: string, patch: Record<string, unknown>) => Promise<void>;
  onRegenerate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draftText, setDraftText] = useState(draft?.draft_text ?? '');
  const [copied, setCopied] = useState(false);

  if (!draft) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-center">
        <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: CHANNEL_COLORS[channel] }}>
          {CHANNEL_LABELS[channel]}
        </div>
        <div className="text-[11px] text-muted-foreground">noch nicht generiert</div>
      </div>
    );
  }

  function copy() {
    navigator.clipboard.writeText(draft!.draft_text);
    setCopied(true);
    toast.success('Draft kopiert');
    setTimeout(() => setCopied(false), 1500);
  }

  function openPublishWindow() {
    const text = draft!.draft_text;
    // Twitter unterstuetzt Pre-Fill via ?text= → Tweet erscheint vorbefuellt im Compose-Fenster.
    // LinkedIn + Reddit unterstuetzen das nicht zuverlaessig → Clipboard-Fallback.
    if (channel === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
        '_blank',
      );
      toast.success('Tweet ist im Compose-Fenster vorausgefüllt. Nur noch Post klicken.', {
        duration: 12000,
        action: {
          label: 'Als gepostet markieren',
          onClick: () => onUpdate(draft!.id, { status: 'posted' }),
        },
      });
    } else {
      navigator.clipboard.writeText(text);
      window.open(CHANNEL_PUBLISH_URLS[channel], '_blank');
      toast.success(`${CHANNEL_LABELS[channel]} offen — Strg+V zum Einfügen`, {
        duration: 12000,
        action: {
          label: 'Als gepostet markieren',
          onClick: () => onUpdate(draft!.id, { status: 'posted' }),
        },
      });
    }
  }

  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white"
            style={{ background: CHANNEL_COLORS[channel] }}
          >
            {CHANNEL_LABELS[channel]}
          </span>
          <StatusBadge status={draft.status} />
        </div>
        <button onClick={() => { setDraftText(draft.draft_text); setEditing(!editing); }} className="text-[10px] text-muted-foreground hover:text-foreground">
          {editing ? 'Abbrechen' : 'bearbeiten'}
        </button>
      </div>

      {editing ? (
        <div>
          <textarea
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={12}
            className="w-full rounded-md border border-border bg-background p-2 text-[12px] leading-relaxed"
          />
          <div className="mt-1 flex justify-between">
            <span className="text-[10px] text-muted-foreground">{draftText.length} Zeichen</span>
            <Button
              size="sm"
              onClick={() => {
                onUpdate(draft.id, { draft_text: draftText });
                setEditing(false);
              }}
            >
              Speichern
            </Button>
          </div>
        </div>
      ) : (
        <pre className="mb-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-border/40 bg-background/60 p-2 text-[12px] leading-relaxed font-sans">
          {draft.draft_text}
        </pre>
      )}

      {!editing && (
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" variant="default" onClick={openPublishWindow} className="text-white" style={{ background: CHANNEL_COLORS[channel] }}>
            <ExternalLink className="mr-1 h-3 w-3" />
            Posten →
          </Button>
          <Button size="sm" variant="outline" onClick={copy}>
            {copied ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
            Kopieren
          </Button>
          {draft.status !== 'posted' && draft.status !== 'skipped' && (
            <Button size="sm" variant="ghost" onClick={() => onUpdate(draft.id, { status: 'posted' })}>
              <Send className="mr-1 h-3 w-3" /> Gepostet
            </Button>
          )}
          {draft.status !== 'skipped' && draft.status !== 'posted' && (
            <Button size="sm" variant="ghost" onClick={() => onUpdate(draft.id, { status: 'skipped' })}>
              Skip
            </Button>
          )}
        </div>
      )}
      <div className="mt-2 flex items-center justify-between text-[10px]">
        <span className="text-muted-foreground">
          {draft.draft_text.length} Zeichen · {draft.model}
        </span>
        {channel === 'twitter' && (
          <span
            className={
              draft.draft_text.length <= 280
                ? 'rounded bg-green-500/15 px-1.5 py-0.5 font-medium text-green-400'
                : 'rounded bg-red-500/15 px-1.5 py-0.5 font-medium text-red-400'
            }
          >
            {draft.draft_text.length <= 280
              ? `Tweet-tauglich (${280 - draft.draft_text.length} übrig)`
              : `Tweet zu lang (${draft.draft_text.length - 280} zu viel)`}
          </span>
        )}
        {channel === 'linkedin' && (
          <span
            className={
              draft.draft_text.length <= 3000
                ? 'rounded bg-green-500/15 px-1.5 py-0.5 font-medium text-green-400'
                : 'rounded bg-amber-500/15 px-1.5 py-0.5 font-medium text-amber-400'
            }
          >
            {draft.draft_text.length <= 3000 ? 'LinkedIn ok' : 'gekürzt empfohlen'}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Status }) {
  const styles: Record<Status, string> = {
    draft: 'bg-muted text-muted-foreground',
    edited: 'bg-blue-500/15 text-blue-400',
    posted: 'bg-green-500/15 text-green-400',
    skipped: 'bg-muted text-muted-foreground/60',
  };
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide ${styles[status]}`}>
      {status}
    </span>
  );
}

function ImagePromptCard({ prompt, alt, title }: { prompt: string; alt: string | null; title: string }) {
  const [copied, setCopied] = useState(false);

  function copyPrompt() {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    toast.success('Image-Prompt kopiert. Jetzt in ChatGPT/DALL-E/Midjourney einfügen.');
    setTimeout(() => setCopied(false), 1800);
  }

  function openChatGPT() {
    navigator.clipboard.writeText(prompt);
    window.open('https://chatgpt.com/', '_blank');
    toast.success('Prompt in Clipboard. ChatGPT-Tab offen — Strg+V im Chat einfügen.', { duration: 10000 });
  }

  return (
    <div className="mb-3 rounded-lg border border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-300">
            Bild-Prompt
          </span>
          <span className="text-[10px] text-muted-foreground">Für ChatGPT / DALL-E / Midjourney</span>
        </div>
        <span className="text-[10px] text-muted-foreground">{prompt.length} Zeichen</span>
      </div>
      <p className="mb-2 max-h-32 overflow-auto whitespace-pre-wrap rounded border border-border/40 bg-background/40 p-2 text-[12px] leading-relaxed text-muted-foreground">
        {prompt}
      </p>
      {alt && (
        <p className="mb-2 text-[10.5px] text-muted-foreground/70">
          <span className="text-foreground">Alt-Text:</span> {alt}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="default" onClick={openChatGPT} className="bg-purple-500 text-white hover:bg-purple-500/90">
          <ExternalLink className="mr-1 h-3 w-3" />
          In ChatGPT öffnen
        </Button>
        <Button size="sm" variant="outline" onClick={copyPrompt}>
          {copied ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Copy className="mr-1 h-3 w-3" />}
          {copied ? 'Kopiert' : 'Prompt kopieren'}
        </Button>
        <span className="ml-auto self-center text-[10px] italic text-muted-foreground/60">
          {title.slice(0, 40)}
        </span>
      </div>
    </div>
  );
}
