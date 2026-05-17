'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Mail, Plus, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Campaign = {
  id: string;
  subject: string;
  status: 'draft' | 'sending' | 'sent' | 'failed';
  sent_at: string | null;
  recipient_count: number;
  open_count: number;
  human_open_count: number;
  click_count: number;
  created_at: string;
  updated_at: string;
};

export default function MailListPage() {
  const { data, isLoading } = useQuery<{ campaigns: Campaign[] }>({
    queryKey: ['mail-campaigns'],
    queryFn: async () => {
      const r = await fetch('/api/mail/campaigns');
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    },
    refetchInterval: 30_000,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-brand" />
            <h1 className="text-2xl font-semibold tracking-tight">Mail-Tracking</h1>
            <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-medium text-amber-300">BETA</span>
          </div>
          <p className="mt-1 text-[13.5px] text-muted-foreground">
            Versende Mails mit Tracking-Pixel + Click-Tracking. Sieh wer geöffnet + geklickt hat.
          </p>
        </div>
        <Link
          href="/mail/new"
          className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[13px] font-medium text-background transition hover:bg-brand/90"
        >
          <Plus className="h-4 w-4" />
          Neue Kampagne
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-border bg-card p-12 text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Lade Kampagnen...
        </div>
      ) : (data?.campaigns ?? []).length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          {data!.campaigns.map((c) => (
            <CampaignRow key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
      <Mail className="mx-auto h-10 w-10 text-muted-foreground/60" />
      <h2 className="mt-4 text-lg font-medium">Noch keine Kampagne</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Lege deine erste Mail-Tracking-Kampagne an — siehst dann wer öffnet + klickt.
      </p>
      <Link
        href="/mail/new"
        className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 text-[13px] font-medium text-background transition hover:bg-brand/90"
      >
        <Plus className="h-4 w-4" />
        Neue Kampagne
      </Link>
    </div>
  );
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const openRate = campaign.recipient_count > 0
    ? Math.round((campaign.human_open_count / campaign.recipient_count) * 100)
    : 0;
  const clickRate = campaign.recipient_count > 0
    ? Math.round((campaign.click_count / campaign.recipient_count) * 100)
    : 0;

  const statusBadge = {
    draft: { label: 'Entwurf', cls: 'bg-white/10 text-white/60' },
    sending: { label: 'Wird versandt', cls: 'bg-blue-500/20 text-blue-300' },
    sent: { label: 'Versandt', cls: 'bg-emerald-500/20 text-emerald-300' },
    failed: { label: 'Fehlgeschlagen', cls: 'bg-red-500/20 text-red-300' },
  }[campaign.status];

  return (
    <Link
      href={`/mail/${campaign.id}`}
      className="block rounded-xl border border-border bg-card p-4 transition hover:border-brand/40 hover:bg-card/80"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadge.cls}`}>
              {statusBadge.label}
            </span>
            <span className="text-[12px] text-muted-foreground">
              {campaign.sent_at
                ? new Date(campaign.sent_at).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })
                : `Entwurf · ${new Date(campaign.created_at).toLocaleDateString('de-DE')}`}
            </span>
          </div>
          <h3 className="mt-1.5 text-[15px] font-medium tracking-tight line-clamp-1">
            {campaign.subject || 'Ohne Betreff'}
          </h3>
        </div>
        {campaign.status === 'sent' && (
          <div className="flex gap-4 text-right">
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Empfänger</div>
              <div className="text-base font-semibold tabular-nums">{campaign.recipient_count}</div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Opens</div>
              <div className="text-base font-semibold tabular-nums">{openRate}%</div>
              <div className="text-[10px] text-muted-foreground">
                {campaign.human_open_count}/{campaign.recipient_count}
              </div>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Klicks</div>
              <div className="text-base font-semibold tabular-nums text-brand">{clickRate}%</div>
              <div className="text-[10px] text-muted-foreground">{campaign.click_count}</div>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
