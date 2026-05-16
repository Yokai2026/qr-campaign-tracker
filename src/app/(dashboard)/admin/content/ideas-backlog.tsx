'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Loader2, BookText, X, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type Cluster = 'qr_realtalk' | 'print_lebt' | 'compliance_lite' | 'mittelstand' | 'tracking_tricks' | 'founder_diary';

const CLUSTER_LABEL: Record<Cluster, string> = {
  qr_realtalk: 'QR-Realtalk',
  print_lebt: 'Print lebt',
  compliance_lite: 'DSGVO ohne Anwalt',
  mittelstand: 'Mittelstand-Stories',
  tracking_tricks: 'Tracking-Tricks',
  founder_diary: 'Founder-Tagebuch',
};

const CLUSTER_COLOR: Record<Cluster, string> = {
  qr_realtalk: '#a855f7',     // violett — playful entertainment
  print_lebt: '#f59e0b',      // amber — Print/Paper-Feeling
  compliance_lite: '#22d3ee', // cyan — clean educational
  mittelstand: '#10b981',     // emerald — community/customer
  tracking_tricks: '#ec4899', // pink — tactical hidden hacks
  founder_diary: '#fb7185',   // rose — honest/vulnerable
};

const ALL_CLUSTERS: Cluster[] = ['qr_realtalk', 'print_lebt', 'compliance_lite', 'mittelstand', 'tracking_tricks', 'founder_diary'];

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

type BatchProgress = {
  total: number;
  done: number;
  failed: number;
  current: string | null;
};

export function IdeasBacklog() {
  const [activeCluster, setActiveCluster] = useState<Cluster>('qr_realtalk');
  const [generatingCluster, setGeneratingCluster] = useState<Cluster | null>(null);
  const [expandingId, setExpandingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null);
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
    const loadingId = toast.loading(`Generiere Ideen für ${CLUSTER_LABEL[cluster]} — kann 20-60 Sek dauern…`);
    try {
      const r = await fetch('/api/admin/content/ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ cluster, count: 10 }),
        redirect: 'manual',
        credentials: 'include',
      });
      if (r.type === 'opaqueredirect' || r.status === 0) {
        toast.dismiss(loadingId);
        toast.error('Session abgelaufen. Lade die Seite neu.');
        return;
      }
      let j: { generated?: number; duplicates?: number; error?: string; message?: string } = {};
      try { j = await r.json(); } catch { /* ignore */ }
      toast.dismiss(loadingId);
      if (r.status === 401 || r.status === 403) {
        toast.error(j.message || j.error || `Auth-Fehler ${r.status}`);
        return;
      }
      if (!r.ok) {
        toast.error(`Fehlgeschlagen: ${(j.error ?? `HTTP ${r.status}`).slice(0, 200)}`);
        return;
      }
      if ((j.generated ?? 0) > 0) {
        toast.success(`${j.generated} neue Ideen für ${CLUSTER_LABEL[cluster]}${(j.duplicates ?? 0) > 0 ? ` (${j.duplicates} Duplikate übersprungen)` : ''}`);
        queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      } else if ((j.duplicates ?? 0) > 0) {
        toast.info(`Alle ${j.duplicates} waren Duplikate. Nochmal klicken für andere.`);
      } else {
        toast.warning('0 Ideen erzeugt. Nochmal versuchen.');
      }
    } catch (e) {
      toast.dismiss(loadingId);
      toast.error(`Netzwerk: ${(e instanceof Error ? e.message : 'unknown').slice(0, 150)}`);
    } finally {
      setGeneratingCluster(null);
    }
  }

  async function expandOne(ideaId: string, title: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const r = await fetch('/api/admin/content/ideas/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ideaId, autoRepurpose: true }),
        credentials: 'include',
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.blog) return { ok: true };
      return { ok: false, error: j.error ?? `HTTP ${r.status} bei "${title.slice(0, 30)}"` };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
    }
  }

  async function expand(ideaId: string) {
    const ideaTitle = (data?.ideas ?? []).find((i) => i.id === ideaId)?.title ?? '?';
    setExpandingId(ideaId);
    const result = await expandOne(ideaId, ideaTitle);
    if (result.ok) {
      toast.success(`Blog "${ideaTitle.slice(0, 50)}" geschrieben + Channel-Drafts`);
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      queryClient.invalidateQueries({ queryKey: ['content-drafts'] });
    } else {
      toast.error(result.error || 'Expand fehlgeschlagen');
    }
    setExpandingId(null);
  }

  async function batchExpand() {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      toast.info('Keine Ideen ausgewählt');
      return;
    }
    const ideasMap = new Map((data?.ideas ?? []).map((i) => [i.id, i]));
    setBatchProgress({ total: ids.length, done: 0, failed: 0, current: null });

    let done = 0;
    let failed = 0;
    for (const id of ids) {
      const idea = ideasMap.get(id);
      if (!idea) continue;
      setBatchProgress({ total: ids.length, done, failed, current: idea.title });
      const result = await expandOne(id, idea.title);
      if (result.ok) {
        done++;
        toast.success(`✓ "${idea.title.slice(0, 40)}…"`);
      } else {
        failed++;
        toast.error(`✗ "${idea.title.slice(0, 40)}…" — ${result.error?.slice(0, 80)}`);
      }
      setBatchProgress({ total: ids.length, done, failed, current: null });
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      queryClient.invalidateQueries({ queryKey: ['content-drafts'] });
    }
    setBatchProgress(null);
    setSelected(new Set());
    toast.success(`Batch fertig: ${done} Blogs erstellt${failed ? `, ${failed} fehlgeschlagen` : ''}`);
  }

  async function skip(ideaId: string) {
    const r = await fetch('/api/admin/content/ideas', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: ideaId, status: 'skipped' }),
      credentials: 'include',
    });
    if (r.ok) {
      queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(ideaId);
        return next;
      });
    } else toast.error('Skip fehlgeschlagen');
  }

  async function batchSkip() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    const loadingId = toast.loading(`Skippe ${ids.length} Ideen…`);
    let done = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const r = await fetch('/api/admin/content/ideas', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: 'skipped' }),
          credentials: 'include',
        });
        if (r.ok) done++; else failed++;
      } catch {
        failed++;
      }
    }
    toast.dismiss(loadingId);
    queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
    setSelected(new Set());
    toast.success(`${done} geskippt${failed ? `, ${failed} fehlgeschlagen` : ''}`);
  }

  async function batchDelete() {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    if (!confirm(`${ids.length} Ideen WIRKLICH löschen? Geht nicht rückgängig.`)) return;
    const loadingId = toast.loading(`Lösche ${ids.length} Ideen…`);
    let done = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const r = await fetch(`/api/admin/content/ideas?id=${encodeURIComponent(id)}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        if (r.ok) done++; else failed++;
      } catch {
        failed++;
      }
    }
    toast.dismiss(loadingId);
    queryClient.invalidateQueries({ queryKey: ['content-ideas'] });
    setSelected(new Set());
    toast.success(`${done} gelöscht${failed ? `, ${failed} fehlgeschlagen` : ''}`);
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectAllInActive() {
    const ids = (data?.ideas ?? []).filter((i) => i.cluster === activeCluster && i.status === 'backlog').map((i) => i.id);
    setSelected((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  function clearSelection() {
    setSelected(new Set());
  }

  const counts = data?.counts ?? {};
  const ideas = (data?.ideas ?? []).filter((i) => i.cluster === activeCluster && i.status === 'backlog');
  const selectedAcrossClusters = (data?.ideas ?? []).filter((i) => selected.has(i.id) && i.status === 'backlog');
  const batchActive = batchProgress !== null;
  const progressPct = batchProgress
    ? Math.round(((batchProgress.done + batchProgress.failed) / batchProgress.total) * 100)
    : 0;

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Ideen-Backlog</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            Ideen ankreuzen → „Blogs für Auswahl schreiben". Funktioniert clusterübergreifend.
          </p>
        </div>
      </div>

      {/* Pillar-Tabs */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
        {ALL_CLUSTERS.map((cluster) => {
          const backlogCount = counts[cluster]?.backlog ?? 0;
          const expandedCount = counts[cluster]?.expanded ?? 0;
          const active = activeCluster === cluster;
          const selectedHere = (data?.ideas ?? []).filter((i) => i.cluster === cluster && selected.has(i.id)).length;
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
              {selectedHere > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">
                  {selectedHere}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Batch-Bar — sichtbar wenn etwas ausgewählt ist */}
      {selectedAcrossClusters.length > 0 && !batchActive && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-blue-500/30 bg-blue-500/5 p-3">
          <div className="text-[13px] font-medium">
            <span className="text-blue-500">{selectedAcrossClusters.length}</span> Idee
            {selectedAcrossClusters.length > 1 ? 'n' : ''} ausgewählt
            <span className="ml-2 text-muted-foreground">· ~{selectedAcrossClusters.length * 30}s Generierung</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={clearSelection}>
              Auswahl aufheben
            </Button>
            <Button size="sm" variant="ghost" onClick={batchSkip} className="text-amber-500 hover:bg-amber-500/10">
              <X className="mr-1.5 h-3.5 w-3.5" />
              {selectedAcrossClusters.length} skippen
            </Button>
            <Button size="sm" variant="ghost" onClick={batchDelete} className="text-destructive hover:bg-destructive/10">
              <X className="mr-1.5 h-3.5 w-3.5" />
              {selectedAcrossClusters.length} löschen
            </Button>
            <Button size="sm" variant="default" onClick={batchExpand}>
              <BookText className="mr-1.5 h-3.5 w-3.5" />
              Blogs für {selectedAcrossClusters.length} Auswahl schreiben
            </Button>
          </div>
        </div>
      )}

      {/* Batch-Progress-Bar */}
      {batchActive && batchProgress && (
        <div className="mb-4 rounded-lg border border-blue-500/40 bg-blue-500/10 p-4">
          <div className="mb-2 flex items-center justify-between text-[13px] font-medium">
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              Batch-Generierung läuft… ({batchProgress.done + batchProgress.failed} / {batchProgress.total})
            </span>
            <span className="tabular-nums text-blue-500">{progressPct}%</span>
          </div>
          <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-blue-500/20">
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {batchProgress.current && (
            <div className="text-[11.5px] text-muted-foreground line-clamp-1">
              Aktuell: <span className="text-foreground">{batchProgress.current}</span>
            </div>
          )}
          {batchProgress.failed > 0 && (
            <div className="mt-1 text-[11px] text-destructive">
              {batchProgress.failed} fehlgeschlagen
            </div>
          )}
        </div>
      )}

      {/* Generate + Bulk-Select Bar */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-[12px] text-muted-foreground">
          <strong className="text-foreground">{CLUSTER_LABEL[activeCluster]}</strong>:
          {' '}{ideas.length} Ideen im Backlog
        </div>
        <div className="flex flex-wrap gap-2">
          {ideas.length > 0 && (
            <Button size="sm" variant="ghost" onClick={selectAllInActive} disabled={batchActive}>
              <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
              Alle in {CLUSTER_LABEL[activeCluster]}
            </Button>
          )}
          <Button
            size="sm"
            variant="default"
            disabled={generatingCluster === activeCluster || batchActive}
            onClick={() => generate(activeCluster)}
          >
            {generatingCluster === activeCluster ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            10 neue Ideen generieren
          </Button>
        </div>
      </div>

      {/* Ideen-Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : ideas.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 py-10 text-center text-sm text-muted-foreground">
          Kein Backlog für {CLUSTER_LABEL[activeCluster]}. Klick „10 neue Ideen generieren" oben.
        </div>
      ) : (
        <div className="grid gap-2 md:grid-cols-2">
          {ideas.map((idea) => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              expanding={expandingId === idea.id}
              anyExpanding={expandingId !== null || batchActive}
              isSelected={selected.has(idea.id)}
              onToggleSelect={() => toggleSelect(idea.id)}
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
  isSelected,
  onToggleSelect,
  onExpand,
  onSkip,
}: {
  idea: Idea;
  expanding: boolean;
  anyExpanding: boolean;
  isSelected: boolean;
  onToggleSelect: () => void;
  onExpand: () => void;
  onSkip: () => void;
}) {
  return (
    <div
      className={`relative rounded-lg border p-3 transition-colors ${
        isSelected
          ? 'border-blue-500/50 bg-blue-500/5 hover:bg-blue-500/10'
          : 'border-border bg-muted/10 hover:bg-muted/20'
      }`}
    >
      {/* Checkbox top-left */}
      <button
        type="button"
        onClick={onToggleSelect}
        className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
        aria-label={isSelected ? 'Auswahl entfernen' : 'Idee auswählen'}
      >
        {isSelected ? (
          <CheckSquare className="h-4 w-4 text-blue-500" />
        ) : (
          <Square className="h-4 w-4" />
        )}
      </button>

      <h3 className="mb-1 pr-7 text-[13.5px] font-semibold leading-snug">{idea.title}</h3>
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
