'use client';

import { useEffect, useState } from 'react';
import { Copy, Gift, MousePointer, UserPlus, CreditCard, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

type ReferralData = {
  code: string;
  shareUrl: string;
  stats: {
    clicks: number;
    signups: number;
    conversions: number;
    rewards: number;
    monthsEarned: number;
  };
};

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/referrals/me');
        const json = await res.json();
        if (!cancelled && res.ok) setData(json as ReferralData);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} kopiert`);
    });
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Empfehlungs-Programm</h1>
        <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Lade...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <h1 className="text-2xl font-semibold">Empfehlungs-Programm</h1>
        <div className="rounded-xl border border-border bg-card p-6 text-muted-foreground">
          Konnte Code nicht laden. Bitte Seite neu laden.
        </div>
      </div>
    );
  }

  const linkedInText = `Ich nutze Spurig für QR-Code- und Link-Tracking (EU-hosted, DSGVO-konform, kostet einen Bruchteil von Bitly). Falls du auch Tracking ohne Cookie-Banner-Drama suchst: ${data.shareUrl}\n\nBeide kriegen 1 Monat gratis.`;
  const emailText = `Hey,\n\nfalls du Tracking für QR-Codes oder Marketing-Links brauchst und Bitly zu teuer geworden ist: Ich nutze Spurig — EU-hosted, ohne Cookie-Banner-Pflicht.\n\nÜber meinen Link kriegen wir beide 1 Monat gratis:\n${data.shareUrl}\n\nGruß`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Empfehlungs-Programm</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Teile deinen Link. Wenn jemand über deinen Link zahlender Kunde wird,
          bekommst du <strong>1 Monat gratis</strong>. Der neue Kunde auch.
        </p>
      </div>

      {/* Share-Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-start gap-3">
          <Gift className="mt-0.5 h-5 w-5 text-brand" />
          <div className="flex-1">
            <h2 className="text-sm font-medium">Dein Empfehlungs-Link</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Beide Seiten bekommen 1 Monat gratis bei der ersten zahlenden Abo-Rechnung.
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-stretch gap-2">
          <input
            readOnly
            value={data.shareUrl}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 font-mono text-[13px]"
          />
          <Button onClick={() => copy(data.shareUrl, 'Link')} variant="outline" size="sm">
            <Copy size={14} className="mr-1.5" /> Kopieren
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            onClick={() => copy(linkedInText, 'LinkedIn-Text')}
            className="rounded-lg border border-border bg-background p-3 text-left hover:bg-muted transition-colors"
          >
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">LinkedIn-Vorlage</div>
            <p className="mt-1 line-clamp-3 text-[12.5px] text-foreground">{linkedInText}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand">
              <Copy size={11} /> Klicken zum Kopieren
            </span>
          </button>
          <button
            onClick={() => copy(emailText, 'Email-Text')}
            className="rounded-lg border border-border bg-background p-3 text-left hover:bg-muted transition-colors"
          >
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Email-Vorlage</div>
            <p className="mt-1 line-clamp-3 text-[12.5px] text-foreground">{emailText}</p>
            <span className="mt-2 inline-flex items-center gap-1 text-[11px] text-brand">
              <Copy size={11} /> Klicken zum Kopieren
            </span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={<MousePointer size={14} />} label="Klicks" value={data.stats.clicks} />
        <StatCard icon={<UserPlus size={14} />} label="Anmeldungen" value={data.stats.signups} />
        <StatCard icon={<CreditCard size={14} />} label="Zahlende" value={data.stats.conversions} accent />
        <StatCard icon={<CheckCircle2 size={14} />} label="Eingelöst" value={data.stats.rewards} />
        <StatCard icon={<Gift size={14} />} label="Monate verdient" value={data.stats.monthsEarned} accent />
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-sm font-medium">So funktioniert's</h2>
        <ol className="mt-3 space-y-2 text-[13px]">
          <li className="flex gap-3"><span className="font-mono text-brand">1.</span> Du teilst deinen Link (oben).</li>
          <li className="flex gap-3"><span className="font-mono text-brand">2.</span> Jemand klickt drauf und registriert sich bei Spurig.</li>
          <li className="flex gap-3"><span className="font-mono text-brand">3.</span> Wenn die Person nach dem Trial zum bezahlten Plan wechselt, bekommen <strong>beide</strong> 1 Monat gratis.</li>
          <li className="flex gap-3"><span className="font-mono text-brand">4.</span> Der Rabatt wird automatisch auf eure nächste Stripe-Rechnung gebucht.</li>
        </ol>
        <p className="mt-3 text-[12px] text-muted-foreground">
          Self-Referrals (denselben Account mit eigenem Code anmelden) werden automatisch erkannt und nicht belohnt.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${accent ? 'ring-1 ring-brand/30' : ''}`}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        {icon}
        <span className="text-[11px] uppercase tracking-wide">{label}</span>
      </div>
      <div className={`mt-1.5 text-2xl font-semibold ${accent ? 'text-brand' : ''}`}>{value}</div>
    </div>
  );
}
