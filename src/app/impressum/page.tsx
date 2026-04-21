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

      <div className="flex items-center gap-3 mb-10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18),var(--shadow-sm)]">
          <Scale className="h-4.5 w-4.5" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.015em] sm:text-[24px]">Impressum</h1>
      </div>

      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-6 text-[14px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">Angaben gemäß § 5 DDG</h2>
          <p>
            <strong>DSG Studio</strong><br />
            Inhaber: David da Silva Gornik<br />
            Rahel-Varnhagen-Promenade 2<br />
            10969 Berlin<br />
            Deutschland
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">Kontakt</h2>
          <p>
            E-Mail: <a href="mailto:info@spurig.com" className="underline underline-offset-2">info@spurig.com</a>
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">Umsatzsteuer</h2>
          <p>
            Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG: <em>wird nach Zuteilung durch das Bundeszentralamt für Steuern ergänzt</em>.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h2>
          <p>
            David da Silva Gornik<br />
            Rahel-Varnhagen-Promenade 2<br />
            10969 Berlin
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">Online-Streitbeilegung</h2>
          <p>
            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              https://ec.europa.eu/consumers/odr/
            </a>
            . Unsere E-Mail-Adresse findest du oben.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">Verbraucherstreitbeilegung</h2>
          <p>
            Wir sind nicht bereit und nicht verpflichtet, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen (§ 36 VSBG).
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
