import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Sparkles, Megaphone, MapPin, ClipboardList, QrCode } from 'lucide-react';
import { DismissibleOnboarding } from './dismissible-onboarding';

/**
 * Renders the four-step onboarding guide ONLY for accounts with no data yet.
 * Once the user has any campaign or any scan, the guide stops appearing
 * unless they re-open it via /help.
 */
export async function OnboardingCard() {
  noStore();
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ count: campaignCount }, { count: scanCount }, { data: profile }] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('redirect_events').select('*', { count: 'exact', head: true }).limit(1),
    supabase.from('profiles').select('onboarding_dismissed_at').eq('id', user.id).maybeSingle(),
  ]);

  const hasData = (campaignCount ?? 0) > 0 || (scanCount ?? 0) > 0;
  const dismissed = Boolean((profile as { onboarding_dismissed_at: string | null } | null)?.onboarding_dismissed_at);

  if (hasData || dismissed) return null;

  return (
    <DismissibleOnboarding>
      <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <div className="mb-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18),var(--shadow-sm)]">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold">So funktioniert Spurig</h3>
            <p className="text-[12px] text-muted-foreground">In 4 einfachen Schritten zum trackbaren QR-Code</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <OnboardingStep n="1" icon={Megaphone} title="Kampagne erstellen" href="/campaigns/new">
            Dein Projekt — z.B. &quot;Sommerfest 2026&quot; oder &quot;Newsletter-Aktion&quot;. Alles wird hier gebündelt.
          </OnboardingStep>
          <OnboardingStep n="2" icon={MapPin} title="Standort anlegen" href="/locations/new">
            Wo hängen deine QR-Codes? Z.B. Café, Schule, Büro. So siehst du welcher Ort am besten performt.
          </OnboardingStep>
          <OnboardingStep n="3" icon={ClipboardList} title="Platzierung erstellen" href="/placements/new">
            Der genaue Spot — z.B. &quot;Poster am Eingang&quot;. Verknüpft Kampagne und Standort.
          </OnboardingStep>
          <OnboardingStep n="4" icon={QrCode} title="QR-Code generieren" href="/qr-codes/new">
            Fertiger QR-Code — zum Ausdrucken oder digital teilen. Jeder Scan wird getrackt.
          </OnboardingStep>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-border bg-subtle px-4 py-2.5">
          <p className="text-[12px] text-muted-foreground">
            <span className="font-medium text-foreground">Tipp:</span> Starte mit Schritt 1 — die anderen bauen darauf auf. Oder direkt einen{' '}
            <Link href="/links/new" className="text-foreground hover:text-brand transition-colors">Kurzlink anlegen</Link> ohne Kampagne.
          </p>
        </div>
      </div>
    </DismissibleOnboarding>
  );
}

function OnboardingStep({
  n, icon: Icon, title, href, children,
}: {
  n: string;
  icon: typeof Megaphone;
  title: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group relative rounded-2xl border border-border p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/[0.04] hover:shadow-[var(--shadow-sm)]"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[11px] font-semibold text-brand-foreground">
          {n}
        </span>
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <h4 className="text-[13px] font-semibold transition-colors group-hover:text-brand">{title}</h4>
      <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{children}</p>
    </Link>
  );
}
