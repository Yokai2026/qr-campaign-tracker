'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  ArrowLeft,
  Copy,
  CheckCircle2,
  CircleDashed,
  Send,
  MessageSquareReply,
  XCircle,
  ExternalLink,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type DmStatus = 'pending' | 'ready' | 'sent' | 'replied' | 'skipped';

type Lead = {
  id: string;
  name: string;
  segment: string;
  city: string | null;
  region: string | null;
  website: string | null;
  rating: number | null;
  rating_count: number | null;
  status: string;
  email: string | null;
  contacted_at: string | null;
  linkedin_url: string | null;
  linkedin_first_name: string | null;
  dm_opener: string | null;
  dm_opener_model: string | null;
  dm_opener_generated_at: string | null;
  dm_status: DmStatus;
  dm_sent_at: string | null;
  dm_replied_at: string | null;
};

type ListResponse = {
  leads: Lead[];
  counts: Record<string, number>;
};

const STATUS_TABS: { key: DmStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'Alle' },
  { key: 'pending', label: 'Noch ohne Opener' },
  { key: 'ready', label: 'Bereit zum DM' },
  { key: 'sent', label: 'Gesendet' },
  { key: 'replied', label: 'Geantwortet' },
  { key: 'skipped', label: 'Skipped' },
];

const SEGMENT_LABELS: Record<string, string> = {
  marketing_agency: 'Marketing',
  gastronomy: 'Gastro',
  crafts_sme: 'Handwerk',
  events_tourism: 'Events',
};

/**
 * Saeubert Firmennamen fuer LinkedIn-Suche.
 * Entfernt Bullets, Stadt-Suffixe und Rechtsformen die in LinkedIn-Profilen
 * meistens nicht stehen und sonst zu 0 Treffern fuehren.
 */
function cleanCompanyName(name: string): string {
  const cities = '(Köln|Koeln|Graz|München|Muenchen|Berlin|Hamburg|Frankfurt|Wien|Salzburg|Stuttgart|Düsseldorf|Duesseldorf|Bremen|Hannover|Leipzig|Dresden|Nürnberg|Nuernberg|Linz|Innsbruck|Klagenfurt|Zürich|Zuerich|Basel|Bern)';
  return name
    .replace(/["“”„″]/g, '')
    .replace(/[•·]/g, ' ')
    .replace(/\s*[\-–—]\s*/g, ' ')
    .replace(new RegExp(`\\s+${cities}\\s*$`, 'i'), '')
    .replace(/\s+(GmbH|AG|UG|KG|OHG|e\.K\.?|Ltd\.?|GbR|LLC|Inc\.?)\b.*$/i, '')
    .replace(/\s+(Restaurant|Café|Cafe|Bar|Bistro|Hotel|Boutique|Studio|Salon)\s+/i, ' $1 ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function LinkedinDmsClient() {
  const [tab, setTab] = useState<DmStatus | 'all'>('ready');
  // Default: nur Marketing-Agenturen — Gastro/Handwerk/Events haben meist kein
  // LinkedIn-Profil. Fuer diese laeuft Email-Outbound autonom (siehe /admin/outbound).
  const [segment, setSegment] = useState<string | null>('marketing_agency');
  const [generating, setGenerating] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ListResponse>({
    queryKey: ['linkedin-dms', tab, segment],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('dm_status', tab);
      if (segment) params.set('segment', segment);
      params.set('limit', '100');
      const r = await fetch('/api/admin/linkedin-dms?' + params.toString());
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    },
    refetchInterval: 30_000,
  });

  async function generateBatch(size: number) {
    setGenerating(true);
    try {
      const r = await fetch('/api/admin/linkedin-dms/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchSize: size }),
      });
      const j = await r.json();
      if (j.generated > 0) {
        toast.success(`${j.generated} Opener generiert`);
        queryClient.invalidateQueries({ queryKey: ['linkedin-dms'] });
      } else {
        toast.info('Keine pending-Leads zum Generieren');
      }
    } catch {
      toast.error('Generierung fehlgeschlagen');
    } finally {
      setGenerating(false);
    }
  }

  async function updateLead(leadId: string, patch: Record<string, unknown>) {
    const r = await fetch('/api/admin/linkedin-dms/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId, ...patch }),
    });
    if (r.ok) queryClient.invalidateQueries({ queryKey: ['linkedin-dms'] });
    else toast.error('Update fehlgeschlagen');
  }

  const counts = data?.counts ?? {};
  const leads = data?.leads ?? [];

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Admin Center
          </Link>
          <Link
            href="/admin/outbound"
            className="ml-3 mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" /> Email Outbound
          </Link>
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-[#0a66c2] text-[11px] font-bold text-white">in</span>
            LinkedIn-DM-Helper
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Default: <strong>Marketing-Agenturen</strong> (höchste LinkedIn-Trefferquote). Für Gastro/Handwerk läuft <Link href="/admin/outbound" className="underline hover:text-foreground">Email-Outbound autonom</Link>{' '}— da brauchst du nichts klicken.{' '}
            <button
              onClick={() => setShowHelp((v) => !v)}
              className="ml-1 underline underline-offset-2 hover:text-foreground"
            >
              {showHelp ? 'Hinweise ausblenden' : 'Wie funktioniert das?'}
            </button>
          </p>
          {showHelp && (
            <div className="mt-3 max-w-2xl rounded-md border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground">
              <p>
                <strong className="text-foreground">Cold-Outreach Workflow:</strong>{' '}
                "Nachricht" geht nur an 1st-degree Connections. Für Cold-Outreach: <strong>Vernetzen → Notiz hinzufügen → Opener einfügen → Senden</strong>. Opener mit ~170 Zeichen passt ins 300-Zeichen-Notiz-Limit.
              </p>
              <p className="mt-2">
                <strong className="text-foreground">Anonymisierung umgehen:</strong>{' '}
                Bei 3rd-degree zeigt LinkedIn "LinkedIn Mitglied" + Sales-Nav-Paywall. Der Button öffnet automatisch Google-Suche (<code>site:linkedin.com/in/</code>) — Google indexiert Profile öffentlich, du landest auf der echten Person mit funktionierendem "Vernetzen"-Button.
              </p>
              <p className="mt-2">
                <strong className="text-foreground">Limit:</strong>{' '}
                Neue LinkedIn-Konten ~100 Connection-Requests/Woche — 15-20/Tag bleibt safe.
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={generating}
            onClick={() => generateBatch(10)}
          >
            {generating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            10 generieren
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={generating}
            onClick={() => generateBatch(25)}
          >
            {generating ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
            )}
            25 generieren
          </Button>
        </div>
      </div>

      {/* Status-Tabs */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-border pb-3">
        {STATUS_TABS.map((t) => {
          const count = t.key === 'all'
            ? Object.values(counts).reduce((a, b) => a + b, 0)
            : (counts[t.key] ?? 0);
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-foreground text-background'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-[10px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {/* Segment-Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          onClick={() => setSegment(null)}
          className={`text-[11px] rounded-md px-2 py-1 ${
            segment === null ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Alle Segmente
        </button>
        {Object.entries(SEGMENT_LABELS).map(([k, v]) => (
          <button
            key={k}
            onClick={() => setSegment(k)}
            className={`text-[11px] rounded-md px-2 py-1 ${
              segment === k ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Lead-Liste */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card py-16 text-center text-sm text-muted-foreground">
          Keine Leads in diesem Filter. Generiere Opener für pending-Leads über die Buttons oben.
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onUpdate={updateLead} />
          ))}
        </div>
      )}
    </div>
  );
}

function LeadCard({
  lead,
  onUpdate,
}: {
  lead: Lead;
  onUpdate: (leadId: string, patch: Record<string, unknown>) => Promise<void>;
}) {
  const [editingFirstName, setEditingFirstName] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [editingOpener, setEditingOpener] = useState(false);
  const [draftOpener, setDraftOpener] = useState(lead.dm_opener ?? '');
  const [draftFirstName, setDraftFirstName] = useState(lead.linkedin_first_name ?? '');
  const [draftUrl, setDraftUrl] = useState(lead.linkedin_url ?? '');
  const [copied, setCopied] = useState(false);

  function copyOpener() {
    if (!lead.dm_opener) return;
    navigator.clipboard.writeText(lead.dm_opener);
    setCopied(true);
    toast.success('Opener kopiert');
    setTimeout(() => setCopied(false), 1500);
  }

  /**
   * Google-bypass fuer LinkedIn-Profile.
   *
   * LinkedIn anonymisiert 3rd-degree-Profile als "LinkedIn Mitglied" + Sales-Nav-
   * Paywall. Google indexiert die Profile aber oeffentlich. Mit site:linkedin.com/in/
   * landen wir auf direkten Profil-URLs der Inhaber/Gruender.
   *
   * Cleanup-Regeln (kritisch -- "Café Fotter • Graz" findet 0 Resultate wegen Bullet
   * + Stadt-Suffix als Phrase):
   *  - Bullets/Dashes/Stadt-Suffixe entfernen
   *  - Rechtsform-Suffixe (GmbH/AG/UG/KG) entfernen
   *  - Deutsche Umlaute beibehalten (Profile schreiben "Gruender" mit Umlaut)
   */
  function searchLinkedIn() {
    const cleanName = cleanCompanyName(lead.name);
    // Phrase-Match nur fuer distinctive Namen (>= 2 Wörter, eindeutig).
    // Sonst lockere AND-Suche damit Google fuzzy matchen kann.
    const distinctive = cleanName.split(/\s+/).filter((w) => w.length > 3).length >= 2;
    const namePart = distinctive ? `"${cleanName}"` : cleanName;
    const cityPart = lead.city ? ` ${lead.city}` : '';
    const rolePart = ' (Inhaber OR Gründer OR Founder OR Owner OR CEO)';
    const q = encodeURIComponent(`site:linkedin.com/in/ ${namePart}${cityPart}${rolePart}`);
    window.open(`https://www.google.com/search?q=${q}`, '_blank');
  }

  /**
   * 1-Click-Sender: kopiert Opener in Clipboard + oeffnet LinkedIn-Profil (oder
   * Google-Suche falls URL fehlt) in neuem Tab. Toast bietet "Als gesendet"-Action
   * fuer einklick-Confirmation wenn User vom LinkedIn-Tab zurueckkommt.
   */
  async function startDm() {
    if (!lead.dm_opener) return;
    try {
      await navigator.clipboard.writeText(lead.dm_opener);
    } catch {
      toast.error('Clipboard-Zugriff blockiert — manuell kopieren');
      return;
    }
    const hasDirectUrl = !!lead.linkedin_url;
    if (hasDirectUrl) {
      window.open(lead.linkedin_url!, '_blank');
    } else {
      searchLinkedIn();
    }
    toast.success(
      hasDirectUrl
        ? 'Opener kopiert. Auf LinkedIn: Vernetzen → Notiz hinzufügen → Strg+V → Senden.'
        : 'Opener kopiert. Google-Suche offen: ersten LinkedIn-Treffer klicken → Vernetzen → Notiz hinzufügen → Strg+V → Senden.',
      {
        duration: 16000,
        action: {
          label: 'Als gesendet markieren',
          onClick: () => onUpdate(lead.id, { dm_status: 'sent' }),
        },
      },
    );
  }

  const segLabel = SEGMENT_LABELS[lead.segment] ?? lead.segment;
  const cityLabel = [lead.city, lead.region].filter(Boolean).join(', ');

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{lead.name}</h3>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary-foreground">
              {segLabel}
            </span>
            {lead.rating && (
              <span className="text-[11px] text-muted-foreground">
                ★ {lead.rating} · {lead.rating_count} Reviews
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            {cityLabel && <span>{cityLabel}</span>}
            {lead.website && (
              <a
                href={lead.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 hover:text-foreground"
              >
                {lead.website.replace(/^https?:\/\//, '').slice(0, 40)} <ExternalLink className="h-2.5 w-2.5" />
              </a>
            )}
            {lead.email && <span>· {lead.email}</span>}
          </div>
        </div>
        <DmStatusBadge status={lead.dm_status} />
      </div>

      {/* Vorname + LinkedIn-URL */}
      <div className="mb-3 grid gap-2 md:grid-cols-2">
        <div className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 text-muted-foreground">Vorname:</span>
          {editingFirstName ? (
            <input
              autoFocus
              value={draftFirstName}
              onChange={(e) => setDraftFirstName(e.target.value)}
              onBlur={() => {
                setEditingFirstName(false);
                if (draftFirstName !== (lead.linkedin_first_name ?? '')) {
                  onUpdate(lead.id, { linkedin_first_name: draftFirstName });
                }
              }}
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
              placeholder="z.B. Anna"
            />
          ) : (
            <button
              onClick={() => setEditingFirstName(true)}
              className="flex-1 text-left text-foreground hover:underline"
            >
              {lead.linkedin_first_name || <span className="italic text-muted-foreground">+ Vorname</span>}
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="w-20 shrink-0 text-muted-foreground">LinkedIn:</span>
          {editingUrl ? (
            <input
              autoFocus
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              onBlur={() => {
                setEditingUrl(false);
                if (draftUrl !== (lead.linkedin_url ?? '')) {
                  onUpdate(lead.id, { linkedin_url: draftUrl });
                }
              }}
              className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
              placeholder="https://linkedin.com/in/…"
            />
          ) : (
            <div className="flex flex-1 items-center gap-1">
              {lead.linkedin_url ? (
                <a
                  href={lead.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 truncate text-[#0a66c2] hover:underline"
                >
                  {lead.linkedin_url.replace(/^https?:\/\//, '')}
                </a>
              ) : (
                <button
                  onClick={searchLinkedIn}
                  className="flex-1 text-left italic text-muted-foreground hover:text-foreground"
                >
                  + Profil suchen (Google)
                </button>
              )}
              <button
                onClick={() => setEditingUrl(true)}
                className="text-[10px] text-muted-foreground hover:text-foreground"
              >
                bearbeiten
              </button>
            </div>
          )}
        </div>
      </div>

      {/* DM-Opener */}
      {lead.dm_opener && !editingOpener && (
        <div className="mb-3 rounded-md border border-border bg-muted/30 p-3">
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wide text-muted-foreground">
            <span>
              Opener · {lead.dm_opener_model ?? 'unknown'} ·{' '}
              {lead.dm_opener_generated_at &&
                formatDistanceToNow(new Date(lead.dm_opener_generated_at), { locale: de, addSuffix: true })}
            </span>
            <button
              onClick={() => {
                setEditingOpener(true);
                setDraftOpener(lead.dm_opener ?? '');
              }}
              className="text-[10px] hover:text-foreground"
            >
              bearbeiten
            </button>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{lead.dm_opener}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{lead.dm_opener.length}/280</p>
        </div>
      )}

      {editingOpener && (
        <div className="mb-3">
          <textarea
            value={draftOpener}
            onChange={(e) => setDraftOpener(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-background p-2 text-sm"
            maxLength={500}
          />
          <div className="mt-1 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditingOpener(false)}>
              Abbrechen
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setEditingOpener(false);
                onUpdate(lead.id, { dm_opener: draftOpener });
              }}
            >
              Speichern
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {lead.dm_opener && lead.dm_status !== 'sent' && lead.dm_status !== 'replied' && (
          <Button size="sm" variant="default" onClick={startDm} className="bg-[#0a66c2] text-white hover:bg-[#0a66c2]/90">
            <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
            Vernetzen + Opener → LinkedIn
          </Button>
        )}
        {lead.dm_opener && (
          <Button size="sm" variant="outline" onClick={copyOpener}>
            {copied ? <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            {copied ? 'Kopiert' : 'Nur kopieren'}
          </Button>
        )}
        {lead.dm_status !== 'sent' && lead.dm_status !== 'replied' && lead.dm_opener && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onUpdate(lead.id, { dm_status: 'sent' })}
          >
            <Send className="mr-1.5 h-3.5 w-3.5" />
            Als gesendet markieren
          </Button>
        )}
        {lead.dm_status === 'sent' && (
          <Button
            size="sm"
            variant="default"
            onClick={() => onUpdate(lead.id, { dm_status: 'replied' })}
          >
            <MessageSquareReply className="mr-1.5 h-3.5 w-3.5" />
            Reply erhalten
          </Button>
        )}
        {lead.dm_status !== 'skipped' && lead.dm_status !== 'replied' && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onUpdate(lead.id, { dm_status: 'skipped' })}
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Skip
          </Button>
        )}
        {lead.dm_sent_at && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            DM gesendet {formatDistanceToNow(new Date(lead.dm_sent_at), { locale: de, addSuffix: true })}
          </span>
        )}
      </div>
    </div>
  );
}

function DmStatusBadge({ status }: { status: DmStatus }) {
  const styles: Record<DmStatus, { label: string; cls: string; Icon: typeof CircleDashed }> = {
    pending: { label: 'pending', cls: 'bg-muted text-muted-foreground', Icon: CircleDashed },
    ready: { label: 'ready', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30', Icon: Sparkles },
    sent: { label: 'sent', cls: 'bg-amber-500/15 text-amber-400 border-amber-500/30', Icon: Send },
    replied: { label: 'replied', cls: 'bg-green-500/15 text-green-400 border-green-500/30', Icon: MessageSquareReply },
    skipped: { label: 'skipped', cls: 'bg-muted text-muted-foreground', Icon: XCircle },
  };
  const s = styles[status];
  const Icon = s.Icon;
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-transparent px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${s.cls}`}>
      <Icon className="h-3 w-3" /> {s.label}
    </span>
  );
}
