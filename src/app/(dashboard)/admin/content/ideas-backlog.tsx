'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Loader2, BookText, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Cluster = 'dsgvo_privacy' | 'offline_roi' | 'qr_practices' | 'attribution' | 'behind_scenes';

const CLUSTER_LABEL: Record<Cluster, string> = {
  dsgvo_privacy: 'DSGVO & Privacy',
  offline_roi: 'Offline-ROI',
  qr_practices: 'QR-Practices',
  attribution: 'Attribution',
  behind_scenes: 'Behind-Scenes',
};

const CLUSTER_COLOR: Record<Cluster, string> = {
  dsgvo_privacy: '#22d3ee',
  offline_roi: '#f59e0b',
  qr_practices: '#a855f7',
  attribution: '#10b981',
  behind_scenes: '#ec4899',
};

const ALL_CLUSTERS: Cluster[] = ['dsgvo_privacy', 'offline_roi', 'qr_practices', 'attribution', 'behind_scenes'];

type Idea = {
  id: string;
  cluster: Cluster;
  title: string;
  outline: string | null;
  angle: string | null;
  target_keywords: string | null;
  status: 'backlog' | 'expanded' | 'skipped';
  expanded_blog_id: string | null;
  created_at: string;
};

type Response = {
  ideas: Idea[];
  counts: Record<string, Record<string, number>>;
};

export function IdeasBacklog() {
  const [activeCluster, setActiveCluster] = useState<Cluster>('dsgvo_privacy');
  const [generatingCluster, setGeneratingCluster] = useState<Cluster | null>(null);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Response>({
    queryKey: ['content-ideas'],
    queryFn: async () => {
      const r = await fetch('/api/admin/content/ideas');
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    },
    refetchInterval: 30_000,
  });

  async function generate(cluster: Cluster) {
    setGeneratingCluster(cluster);
    toast.info(`Generiere Ideen fuer ${CLUSTER_LABEL[cluster]} — kann 30-60 Sek dauern (Claude sucht im Web)…`);
    try {
      const r = await fetch('/api/admin/content/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cluster, count: 15 }),
      });
      // r.json() darf bei 504/Empty failen — abfangen
      let j: { generated?: number; duplicates?: number; error?: string } = {};
      try { j = await r.json(); } catch { /* ignore parse */ }

      if (!r.ok) {
        const msg = j.error ?? `HTTP ${r.status}`;
        toast.error(`Generierung fehlgeschlagen: ${msg.slice(0, 200)}`);
        return;
      }
      if ((j.generated ?? 0) > 0) {
        toast.success(`${j.generated} neue Ideen für ${CLUSTER_LABEL[cluster]}${(j.duplicates ?? 0) > 0 ? ` (${j.duplicates} Duplikate übersprungen)` : ''}`);
        queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      } else if ((j.duplicates ?? 0) > 0) {
        toast.info(`Alle ${j.duplicates} generierten Ideen waren Duplikate. Versuch's nochmal — Claude liefert beim 2. Anlauf andere.`);
      } else {
        toast.warning('Generierung lieferte 0 Ideen. Pruefe /admin/content Logs.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'unknown';
      toast.error(`Network/Timeout: ${msg.slice(0, 150)}`);
    } finally {
      setGeneratingCluster(null);
    }
  }

  async function expand(ideaId: string) {
    setExpandingId(ideaId);
    try {
      const r = await fetch('/api/admin/content/ideas/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId, autoRepurpose: true }),
      });
      const j = await r.json();
      if (r.ok && j.blog) {
        const successfulRepurpose = (j.repurposed ?? []).filter((x: { ok: boolean }) => x.ok).length;
        toast.success(`Blog "${j.blog.title}" geschrieben${successfulRepurpose > 0 ? ` + ${successfulRepurpose} Channel-Drafts` : ''}`);
        queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
        queryClient.invalidateQueries({ queryKey: ['content-drafts'] });
      } else {
        toast.error(j.error ?? 'Expand fehlgeschlagen');
      }
    } catch {
      toast.error('Expand fehlgeschlagen');
    } finally {
      setExpandingId(null);
    }
  }

  async function skip(ideaId: string) {
    const r = await fetch('/api/admin/content/ideas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ideaId, status: 'skipped' }),
    });
    if (r.ok) queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
    else toast.error('Skip fehlgeschlagen');
  }

  const counts = data?.counts ?? {};
  const ideas = (data?.ideas ?? []).filter((i) => i.cluster === activeCluster && i.status === 'backlog');

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-5">
      <div className="mb-4">
        <h2 className="text-lg font-semibold tracking-tight">Ideen-Backlog</h2>
        <p className="mt-0.5 text-[13px] text-muted-foreground">
          5 Content-Pillars. Claude generiert 15 Ideen pro Pillar. Click "Blog schreiben" → Full Blog-Draft + 3 Channel-Drafts werden automatisch erstellt.
        </p>
      </div>

      {/* Pillar-Tabs */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
        {ALL_CLUSTERS.map((cluster) => {
          const backlogCount = counts[cluster]?.backlog ?? 0;
          const expandedCount = counts[cluster]?.expanded ?? 0;
          const active = activeCluster === cluster;
          return (
            <button
              key={cluster}
              onClick={() => setActiveCluster(cluster)}
              className={`group rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ background: CLUSTER_COLOR[cluster] }} />
              {CLUSTER_LABEL[cluster]}
              <span className="ml-1.5 text-[10px] opacity-70">{backlogCount} / {expandedCount}✓</span>
            </button>
          );
        })}
      </div>

      {/* Generate-Button für aktiven Pillar */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="text-[12px] text-muted-foreground">
          <strong className="text-foreground">{CLUSTER_LABEL[activeCluster]}</strong>:
          {' '}{ideas.length} Ideen im Backlog
        </div>
        <Button
          size="sm"
          variant="default"
          disabled={generatingCluster === activeCluster}
          onClick={() => generate(activeCluster)}
        >
          {generatingCluster === activeCluster ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
          )}
          15 neue Ideen generieren
        </Button>
      </div>

      {/* Ideen-Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
          Kein Backlog für {CLUSTER_LABEL[activeCluster]}. Klick "15 neue Ideen generieren" oben.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              expanding={expandingId === idea.id}
              anyExpanding={expandingId !== null}
              onExpand={() => expand(idea.id)}
              onSkip={() => skip(idea.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IdeaCard({
  idea,
  expanding,
  anyExpanding,
  onExpand,
  onSkip,
}: {
  idea: Idea;
  expanding: boolean;
  anyExpanding: boolean;
  onExpand: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-3 hover:bg-muted/20 transition-colors">
      <h3 className="mb-1 text-[13.5px] font-semibold leading-snug">{idea.title}</h3>
      {idea.angle && (
        <p className="mb-1 text-[11.5px] italic text-muted-foreground">
          Hook: {idea.angle}
        </p>
      )}
      {idea.outline && (
        <p className="mb-2 line-clamp-2 text-[11.5px] text-muted-foreground">{idea.outline}</p>
      )}
      {idea.target_keywords && (
        <p className="mb-2 text-[10px] text-muted-foreground/80">
          SEO: {idea.target_keywords}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <Button size="sm" variant="default" disabled={anyExpanding} onClick={onExpand}>
          {expanding ? (
            <>
              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              Schreibe...
            </>
          ) : (
            <>
              <BookText className="mr-1 h-3 w-3" />
              Blog schreiben
            </>
          )}
        </Button>
        <Button size="sm" variant="ghost" disabled={anyExpanding} onClick={onSkip}>
          <X className="mr-1 h-3 w-3" />
          Skip
        </Button>
      </div>
    </div>
  );
}
