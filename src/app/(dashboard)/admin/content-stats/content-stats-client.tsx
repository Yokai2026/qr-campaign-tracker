'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, Loader2, Users, Euro } from 'lucide-react';

type Row = { signups: number; paid: number };
type ChannelRow = { drafts: number; posted: number };

type Response = {
  totals: { tracked_signups: number; tracked_paid: number };
  bySource: Record<string, Row>;
  byMedium: Record<string, Row>;
  byCampaign: Record<string, Row>;
  byChannel: Record<string, ChannelRow>;
  timeline: Record<string, Record<string, number>>;
};

const SOURCE_COLOR: Record<string, string> = {
  cold_email: '#22d3ee',
  cold_dm: '#0a66c2',
  linkedin: '#0a66c2',
  twitter: '#1d9bf0',
  reddit: '#ff4500',
  trial_upsell: '#7c3aed',
  organic: '#10b981',
  unknown: '#71717a',
};

export function ContentStatsClient() {
  const { data, isLoading, error } = useQuery<Response>({
    queryKey: ['content-stats'],
    queryFn: async () => {
      const r = await fetch('/api/admin/content-stats');
      if (!r.ok) throw new Error('fetch failed');
      return r.json();
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !data) {
    return <div className="container mx-auto max-w-7xl px-4 py-10 text-sm text-muted-foreground">Konnte Stats nicht laden.</div>;
  }

  const sortedSources = Object.entries(data.bySource).sort((a, b) => b[1].signups - a[1].signups);
  const sortedCampaigns = Object.entries(data.byCampaign).sort((a, b) => b[1].signups - a[1].signups).slice(0, 15);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-6 md:py-10">
      <div className="mb-6">
        <Link href="/admin" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3 w-3" /> Admin Center
        </Link>
        <h1 className="mt-2 flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <TrendingUp className="h-6 w-6" /> Content-Performance
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welche Channels + Posts wirklich Trials und Paid bringen. UTM-Attribution mit First-Touch-Logic.
        </p>
      </div>

      {/* Totals */}
      <div className="mb-6 grid gap-3 md:grid-cols-2">
        <Stat icon={Users} label="Getrackte Signups" value={data.totals.tracked_signups} sub="mit attribution_source" />
        <Stat icon={Euro} label="Getrackte Paid-Conversions" value={data.totals.tracked_paid} sub={`${data.totals.tracked_signups > 0 ? Math.round((data.totals.tracked_paid / data.totals.tracked_signups) * 100) : 0}% Conversion-Rate`} />
      </div>

      {/* Channels-Funnel */}
      <section className="mb-8 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold">Pro Channel — Signups → Paid</h2>
        {sortedSources.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Noch keine attribution_source-Daten. Sobald jemand mit UTM-Link signed-up, erscheinen hier Daten.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedSources.map(([source, row]) => {
              const conv = row.signups > 0 ? Math.round((row.paid / row.signups) * 100) : 0;
              return (
                <div key={source} className="grid grid-cols-12 items-center gap-3 text-[13px]">
                  <div className="col-span-3 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: SOURCE_COLOR[source] ?? '#71717a' }} />
                    <span className="font-medium">{source}</span>
                  </div>
                  <div className="col-span-7 h-6 overflow-hidden rounded-full bg-muted/40">
                    <div
                      className="h-full"
                      style={{
                        width: `${Math.min(100, (row.signups / sortedSources[0][1].signups) * 100)}%`,
                        background: SOURCE_COLOR[source] ?? '#71717a',
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <div className="col-span-2 text-right tabular-nums">
                    <span className="font-semibold">{row.signups}</span>{' '}
                    <span className="text-muted-foreground">→ {row.paid} paid ({conv}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Campaigns */}
      <section className="mb-8 rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold">Top 15 Campaigns (Blog-Slug / Segment)</h2>
        {sortedCampaigns.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            Noch keine Campaign-Daten.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead className="text-[10px] uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="pb-2 text-left">Campaign</th>
                <th className="pb-2 text-right">Signups</th>
                <th className="pb-2 text-right">Paid</th>
                <th className="pb-2 text-right">Conv-Rate</th>
              </tr>
            </thead>
            <tbody>
              {sortedCampaigns.map(([camp, row]) => {
                const conv = row.signups > 0 ? Math.round((row.paid / row.signups) * 100) : 0;
                return (
                  <tr key={camp} className="border-t border-border/40">
                    <td className="py-2 font-mono text-[12px]">{camp}</td>
                    <td className="py-2 text-right tabular-nums">{row.signups}</td>
                    <td className="py-2 text-right tabular-nums">{row.paid}</td>
                    <td className="py-2 text-right tabular-nums">{conv}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {/* Channel-Drafts Status */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-base font-semibold">Content-Output pro Channel</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(data.byChannel).map(([ch, row]) => (
            <div key={ch} className="rounded-lg border border-border/60 bg-muted/10 p-3">
              <div className="text-[10px] uppercase tracking-wide" style={{ color: SOURCE_COLOR[ch] }}>
                {ch}
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-semibold tabular-nums">{row.posted}</span>
                <span className="text-[12px] text-muted-foreground">/ {row.drafts} Drafts</span>
              </div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">
                {row.drafts > 0 ? Math.round((row.posted / row.drafts) * 100) : 0}% gepostet
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: number; sub: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </div>
      <div className="mt-1 text-3xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
