import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';

type Step = {
  key: 'campaign' | 'qrcode' | 'scan' | 'distribute';
  title: string;
  hint: string;
  href: string;
  cta: string;
  done: boolean;
};

/**
 * 4-Schritt Activation-Checklist. Ersetzt die einfache OnboardingCard sobald
 * der User mindestens eine Kampagne angelegt hat — wir wollen ihn dann durch
 * die naechsten drei Schritte fuehren bis zum Aha-Moment (erster Scan + Print).
 *
 * Sichtbar bis ALLE 4 Schritte erledigt sind ODER der User bewusst dismissed.
 */
export async function ActivationChecklist() {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, { count: campaignCount }, { data: qrCodes }, { count: placementCount }] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('onboarding_dismissed_at')
        .eq('id', user.id)
        .maybeSingle(),
      supabase.from('campaigns').select('*', { count: 'exact', head: true }),
      supabase.from('qr_codes').select('id').limit(50),
      supabase.from('placements').select('*', { count: 'exact', head: true }),
    ]);

  const dismissed = Boolean(
    (profile as { onboarding_dismissed_at: string | null } | null)?.onboarding_dismissed_at,
  );
  if (dismissed) return null;

  const hasCampaign = (campaignCount ?? 0) > 0;
  const qrIds = (qrCodes ?? []).map((q) => q.id);
  const hasQrCode = qrIds.length > 0;
  const hasPlacement = (placementCount ?? 0) >= 2;

  // Bevor der User die erste Kampagne hat uebergibt die einfache OnboardingCard.
  // Sobald 1+ Kampagnen existiert wird die Checklist die fuehrende UI.
  if (!hasCampaign) return null;

  let hasScan = false;
  if (qrIds.length > 0) {
    const { count } = await supabase
      .from('redirect_events')
      .select('id', { count: 'exact', head: true })
      .in('qr_code_id', qrIds);
    hasScan = (count ?? 0) > 0;
  }

  const steps: Step[] = [
    {
      key: 'campaign',
      title: 'Kampagne anlegen',
      hint: 'Gib ihr einen Namen wie "Plakate Berlin" oder "Speisekarte".',
      href: '/campaigns/new',
      cta: 'Kampagne erstellen',
      done: hasCampaign,
    },
    {
      key: 'qrcode',
      title: 'Ersten QR-Code generieren',
      hint: 'Ziel-URL einfuegen, Code wird sofort fertig.',
      href: '/qr-codes',
      cta: 'QR-Code generieren',
      done: hasQrCode,
    },
    {
      key: 'scan',
      title: 'Mit Handy scannen',
      hint: 'Du siehst den Scan in unter einer Sekunde im Dashboard.',
      href: '/qr-codes',
      cta: 'QR-Codes ansehen',
      done: hasScan,
    },
    {
      key: 'distribute',
      title: 'Pro Platzierung einen Code',
      hint: 'Ein Code pro Plakat/Tisch — so siehst du welche Position wirklich liefert.',
      href: '/placements',
      cta: 'Platzierungen anlegen',
      done: hasPlacement,
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;

  const currentStep = steps.find((s) => !s.done)!;
  const pct = Math.round((doneCount / steps.length) * 100);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18),var(--shadow-sm)]">
            <Sparkles className="h-4 w-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight">
              Dein Spurig-Start
            </h3>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {doneCount === 0
                ? `${steps.length} Schritte bis zum ersten Insight.`
                : `${doneCount} von ${steps.length} Schritten geschafft — weiter so.`}
            </p>
          </div>
        </div>
        <span className="self-start rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold tabular-nums text-muted-foreground sm:self-auto">
          {pct}%
        </span>
      </div>

      <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-gradient-to-r from-brand/70 to-brand transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="mt-5 divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-background/50">
        {steps.map((step, i) => {
          const isCurrent = step.key === currentStep.key;
          return (
            <li
              key={step.key}
              className={
                'flex items-start gap-3 px-4 py-3.5 transition-colors ' +
                (step.done
                  ? 'bg-brand/[0.04]'
                  : isCurrent
                  ? 'bg-card'
                  : 'bg-background/30')
              }
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                {step.done ? (
                  <CheckCircle2 className="h-5 w-5 text-brand" aria-label="erledigt" />
                ) : (
                  <Circle
                    className={
                      isCurrent
                        ? 'h-5 w-5 text-brand'
                        : 'h-5 w-5 text-muted-foreground/40'
                    }
                    aria-label="offen"
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="font-mono text-[11px] font-semibold text-muted-foreground/70 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span
                    className={
                      step.done
                        ? 'text-[13.5px] font-medium text-foreground/70 line-through decoration-foreground/30 decoration-[1.5px]'
                        : 'text-[13.5px] font-semibold text-foreground'
                    }
                  >
                    {step.title}
                  </span>
                </div>
                {!step.done && (
                  <p className="mt-0.5 text-[12.5px] leading-snug text-muted-foreground">
                    {step.hint}
                  </p>
                )}
              </div>
              {isCurrent && !step.done && (
                <Link
                  href={step.href}
                  className="ml-2 inline-flex shrink-0 items-center gap-1 self-center rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-brand-foreground shadow-[var(--shadow-sm)] transition-all hover:-translate-y-px hover:brightness-105"
                >
                  {step.cta}
                  <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
