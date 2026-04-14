import Link from 'next/link';
import { Scale, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Impressum',
  description: 'Impressum und Anbieterkennzeichnung — Spurig QR-Code Tracking.',
  alternates: { canonical: '/impressum' },
};

export default function ImpressumPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <Scale className="h-4.5 w-4.5 text-primary" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Impressum</h1>
      </div>

      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-6 text-[14px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">Angaben gemäß § 5 DDG</h2>
          <p>
            <strong>David da Silva Gornik</strong><br />
            E-Mail: <a href="mailto:info@spurig.com" className="underline underline-offset-2">info@spurig.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>
            David da Silva Gornik
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">Haftungsausschluss</h2>
          <h3 className="text-[14px] font-medium text-foreground mt-3 mb-1">Haftung für Inhalte</h3>
          <p>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit,
            Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten
            nach den allgemeinen Gesetzen verantwortlich.
          </p>
          <h3 className="text-[14px] font-medium text-foreground mt-3 mb-1">Haftung für Links</h3>
          <p>
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte wir keinen
            Einfluss haben. Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
            Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber
            der Seiten verantwortlich.
          </p>
        </section>

        <div className="pt-4 border-t border-border text-[12px] text-muted-foreground">
          Stand: April 2026
        </div>
      </div>
    </div>
  );
}
