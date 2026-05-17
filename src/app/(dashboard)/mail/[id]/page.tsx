'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Mail, Send, Eye, MousePointerClick, CheckCircle2, Circle, Loader2, ExternalLink } from 'lucide-react';

type Campaign = {
  id: string;
  subject: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_at: string | null;
  recipient_count: number;
  open_count: number;
  human_open_count: number;
  click_count: number;
  body_html: string;
};

type Recipient = {
  id: string;
  email: string;
  name: string | null;
  status: string;
  sent_at: string | null;
  first_open_at: string | null;
  last_open_at: string | null;
  open_count: number;
  human_open_count: number;
  click_count: number;
  first_click_at: string | null;
};

type LinkRow = {
  id: string;
  original_url: string;
  click_count: number;
};

type Detail = {
  campaign: Campaign;
  recipients: Recipient[];
  links: LinkRow[];
};

export default function MailDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id } = use(props.params);

  const { data, isLoading } = useQuery<Detail>({
    queryKey: ['mail-campaign', id],
    queryFn: async () => {
      const r = await fetch(`/api/mail/campaigns/${id}`);
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    },
    refetchInterval: 15_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center px-4 py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const { campaign, recipients, links } = data;
  const openRate = campaign.recipient_count > 0
    ? Math.round((campaign.human_open_count / campaign.recipient_count) * 100)
    : 0;
  const clickRate = campaign.recipient_count > 0
    ? Math.round((campaign.click_count / campaign.recipient_count) * 100)
    : 0;
  const ctor = campaign.human_open_count > 0
    ? Math.round((campaign.click_count / campaign.human_open_count) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
      <Link
        href="/mail"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück zur Liste
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand" />
            <h1 className="text-2xl font-semibold tracking-tight line-clamp-1">{campaign.subject}</h1>
          </div>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {campaign.sent_at
              ? `Versandt: ${new Date(campaign.sent_at).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}`
              : 'Entwurf'}
            {' · '}{campaign.status}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={<Send className="h-3.5 w-3.5" />} label="Empfänger" value={campaign.recipient_count} />
        <StatCard
          icon={<Eye className="h-3.5 w-3.5" />}
          label="Opens (echt)"
          value={`${openRate}%`}
          sub={`${campaign.human_open_count} von ${campaign.recipient_count} · raw: ${campaign.open_count}`}
          tooltip="Apple-MPP-Filter aktiv — 'echt' = ohne Apple-Mail-Pre-Loads"
        />
        <StatCard
          icon={<MousePointerClick className="h-3.5 w-3.5" />}
          label="Klicks"
          value={`${clickRate}%`}
          sub={`${campaign.click_count} Klicks`}
          accent="brand"
        />
        <StatCard
          icon={<MousePointerClick className="h-3.5 w-3.5" />}
          label="CTOR"
          value={`${ctor}%`}
          sub="Click-to-Open-Rate"
        />
      </div>

      {/* Links Performance */}
      {links.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            Top-Links ({links.length})
          </h2>
          <div className="space-y-1.5">
            {links.map((l) => (
              <div key={l.id} className="flex items-center gap-3 rounded-md bg-background/40 px-3 py-2">
                <a
                  href={l.original_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-0 truncate text-[13px] text-muted-foreground transition hover:text-foreground"
                >
                  {l.original_url}
                  <ExternalLink className="ml-1.5 inline h-3 w-3 opacity-50" />
                </a>
                <div className="shrink-0 text-right">
                  <div className="text-base font-semibold tabular-nums text-brand">{l.click_count}</div>
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Klicks</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recipients */}
      <div className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
          Empfänger ({recipients.length})
        </h2>
        <div className="space-y-1">
          {recipients.map((r) => (
            <RecipientRow key={r.id} recipient={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon, label, value, sub, accent, tooltip,
}: {
  icon: React.ReactNode; label: string; value: string | number; sub?: string;
  accent?: 'brand'; tooltip?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4" title={tooltip}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1.5 text-2xl font-semibold tabular-nums ${accent === 'brand' ? 'text-brand' : ''}`}>
        {value}
      </div>
      {sub && <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

function RecipientRow({ recipient }: { recipient: Recipient }) {
  // WhatsApp-style status: sent → opened → clicked
  const sent = recipient.status === 'sent' || recipient.status === 'delivered';
  const opened = recipient.human_open_count > 0;
  const clicked = recipient.click_count > 0;

  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-background/40">
      <div className="flex shrink-0 items-center gap-0.5">
        <CheckIcon active={sent} title={sent ? 'Gesendet' : 'Nicht gesendet'} />
        <CheckIcon active={opened} title={opened ? 'Geöffnet' : 'Nicht geöffnet'} />
        <CheckIcon active={clicked} title={clicked ? 'Geklickt' : 'Nicht geklickt'} brand />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px]">
          {recipient.name ? <span className="font-medium">{recipient.name}</span> : null}
          {recipient.name ? <span className="ml-1.5 text-muted-foreground">{recipient.email}</span> : recipient.email}
        </div>
        {(recipient.first_open_at || recipient.first_click_at) && (
          <div className="text-[10.5px] text-muted-foreground">
            {recipient.first_open_at && (
              <>Erstes Open: {new Date(recipient.first_open_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</>
            )}
            {recipient.first_click_at && (
              <> · Klick: {new Date(recipient.first_click_at).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}</>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right text-[11px] text-muted-foreground tabular-nums">
        {recipient.human_open_count > 0 && <span>{recipient.human_open_count}× geöffnet</span>}
        {recipient.click_count > 0 && <span className="ml-2 text-brand">{recipient.click_count} Klick{recipient.click_count > 1 ? 's' : ''}</span>}
      </div>
    </div>
  );
}

function CheckIcon({ active, brand, title }: { active: boolean; brand?: boolean; title?: string }) {
  return active ? (
    <CheckCircle2
      className={`h-3.5 w-3.5 ${brand ? 'text-brand' : 'text-emerald-500'}`}
      aria-label={title}
    />
  ) : (
    <Circle className="h-3.5 w-3.5 text-white/15" aria-label={title} />
  );
}
