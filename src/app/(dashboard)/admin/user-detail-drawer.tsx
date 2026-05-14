'use client';

import { useEffect, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  X,
  Crown,
  Mail,
  ExternalLink,
  Megaphone,
  MapPin,
  QrCode,
  Link2,
  Eye,
  MousePointerClick,
  Clock,
} from 'lucide-react';

type UserDetail = {
  id: string;
  email: string;
  username: string | null;
  role: string | null;
  createdAt: string;
  lastSeenAt: string | null;
  trialEndsAt: string | null;
  isAdmin: boolean;
  subscription: {
    id: string;
    status: string;
    stripeSubscriptionId: string | null;
    stripeCustomerId: string | null;
    stripePriceId: string | null;
    cancelAt: string | null;
    currentPeriodEnd: string | null;
    createdAt: string;
    updatedAt: string;
    cancellationReason: string | null;
    cancellationFeedback: string | null;
  } | null;
  stats: {
    campaignCount: number;
    placementCount: number;
    qrCodeCount: number;
    shortLinkCount: number;
    qrScansTotal: number;
    linkClicksTotal: number;
  };
  recentActivity: Array<{
    type: 'signup' | 'sub_created' | 'sub_cancelled' | 'sub_updated' | 'login_recent';
    at: string;
    detail: string;
  }>;
};

type Props = {
  userId: string;
  open: boolean;
  onClose: () => void;
};

export function UserDetailDrawer({ userId, open, onClose }: Props) {
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/users/${userId}`, { cache: 'no-store' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((d: UserDetail) => setData(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId, open]);

  // ESC schließt
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <aside
        role="dialog"
        aria-label="User-Details"
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[480px] flex-col border-l border-border bg-background shadow-2xl animate-in slide-in-from-right"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="truncate text-[14.5px] font-semibold tracking-tight">
              {data?.email ?? (loading ? 'Lädt…' : 'User')}
            </h2>
            {data?.isAdmin && <Crown className="h-3.5 w-3.5 text-brand" strokeWidth={2.2} />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-border bg-background p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Schließen"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading && <div className="text-[12.5px] text-muted-foreground">Lädt User-Details…</div>}
          {error && <div className="text-[12.5px] text-destructive">Fehler: {error}</div>}
          {data && (
            <>
              {/* Profile-Block */}
              <section>
                <SectionTitle>Profil</SectionTitle>
                <dl className="grid grid-cols-2 gap-2 text-[12px]">
                  <DetailField label="Username" value={data.username ? `@${data.username}` : '—'} />
                  <DetailField label="Rolle" value={data.role ?? 'user'} />
                  <DetailField
                    label="Registriert"
                    value={format(new Date(data.createdAt), 'dd.MM.yyyy HH:mm', { locale: de })}
                  />
                  <DetailField
                    label="Letzte Aktivität"
                    value={
                      data.lastSeenAt
                        ? `vor ${formatDistanceToNow(new Date(data.lastSeenAt), { locale: de })}`
                        : 'nie'
                    }
                  />
                  {data.trialEndsAt && (
                    <DetailField
                      label="Trial endet"
                      value={format(new Date(data.trialEndsAt), 'dd.MM.yyyy', { locale: de })}
                      className="col-span-2"
                    />
                  )}
                </dl>
              </section>

              {/* Subscription-Block */}
              {data.subscription && (
                <section>
                  <SectionTitle>Abo</SectionTitle>
                  <dl className="grid grid-cols-2 gap-2 text-[12px]">
                    <DetailField label="Status" value={data.subscription.status} />
                    <DetailField
                      label="Erstellt"
                      value={format(new Date(data.subscription.createdAt), 'dd.MM.yyyy', { locale: de })}
                    />
                    {data.subscription.currentPeriodEnd && (
                      <DetailField
                        label="Nächste Abrechnung"
                        value={format(new Date(data.subscription.currentPeriodEnd), 'dd.MM.yyyy', { locale: de })}
                      />
                    )}
                    {data.subscription.cancelAt && (
                      <DetailField
                        label="Endet am"
                        value={format(new Date(data.subscription.cancelAt), 'dd.MM.yyyy', { locale: de })}
                      />
                    )}
                    {data.subscription.cancellationReason && (
                      <DetailField
                        label="Kündigungsgrund"
                        value={data.subscription.cancellationReason}
                        className="col-span-2"
                      />
                    )}
                    {data.subscription.cancellationFeedback && (
                      <div className="col-span-2 rounded-md border border-border/60 bg-muted/30 p-2 text-[11px] italic text-muted-foreground">
                        &bdquo;{data.subscription.cancellationFeedback}&ldquo;
                      </div>
                    )}
                  </dl>
                  <div className="mt-2 flex gap-1.5">
                    {data.subscription.stripeCustomerId && (
                      <a
                        href={`https://dashboard.stripe.com/customers/${data.subscription.stripeCustomerId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium transition-colors hover:bg-muted"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        Stripe-Customer
                      </a>
                    )}
                    {data.subscription.stripeSubscriptionId && (
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${data.subscription.stripeSubscriptionId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-[11px] font-medium transition-colors hover:bg-muted"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                        Stripe-Sub
                      </a>
                    )}
                  </div>
                </section>
              )}

              {/* Stats-Grid */}
              <section>
                <SectionTitle>Aktivität</SectionTitle>
                <div className="grid grid-cols-3 gap-2">
                  <StatTile icon={Megaphone} label="Kampagnen" value={data.stats.campaignCount} />
                  <StatTile icon={MapPin} label="Platzierungen" value={data.stats.placementCount} />
                  <StatTile icon={QrCode} label="QR-Codes" value={data.stats.qrCodeCount} />
                  <StatTile icon={Link2} label="Kurzlinks" value={data.stats.shortLinkCount} />
                  <StatTile icon={Eye} label="QR-Scans" value={data.stats.qrScansTotal} accent />
                  <StatTile icon={MousePointerClick} label="Klicks" value={data.stats.linkClicksTotal} accent />
                </div>
              </section>

              {/* Timeline */}
              <section>
                <SectionTitle>Verlauf</SectionTitle>
                <ol className="space-y-1.5 border-l border-border pl-3">
                  {data.recentActivity.map((ev, i) => (
                    <li key={i} className="relative pl-1 text-[11.5px]">
                      <span className="absolute -left-[15px] top-1.5 h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
                      <div className="text-foreground">{ev.detail}</div>
                      <div className="text-[10.5px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {format(new Date(ev.at), 'dd.MM.yyyy HH:mm', { locale: de })}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            </>
          )}
        </div>

        {/* Footer Actions */}
        {data && (
          <div className="border-t border-border bg-muted/20 px-4 py-3 flex flex-wrap gap-2">
            <a
              href={`mailto:${data.email}`}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1.5 text-[11.5px] font-medium transition-colors hover:bg-muted"
            >
              <Mail className="h-3 w-3" />
              Direkt mailen
            </a>
          </div>
        )}
      </aside>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </h3>
  );
}

function DetailField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-[12px] font-medium">{value}</dd>
    </div>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Mail;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-2.5">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" strokeWidth={1.8} />
        {label}
      </div>
      <div className={`mt-1 tabular-nums text-[18px] font-semibold leading-none ${accent ? 'text-brand' : ''}`}>
        {value.toLocaleString('de-DE')}
      </div>
    </div>
  );
}
