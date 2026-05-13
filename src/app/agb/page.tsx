import Link from 'next/link';
import { FileText, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Allgemeine Geschäftsbedingungen',
  description: 'AGB für die Nutzung von Spurig — QR-Code-Tracking & Kampagnen-Analytics.',
  alternates: { canonical: '/agb' },
  robots: { index: true, follow: true },
};

const LAST_UPDATED = '14. Mai 2026';
const VERSION = '1.0';

export default function AgbPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück
      </Link>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-[inset_0_1px_0_oklch(1_0_0/0.18),var(--shadow-sm)]">
          <FileText className="h-4.5 w-4.5" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-[-0.015em] sm:text-[24px]">
          Allgemeine Geschäftsbedingungen
        </h1>
      </div>
      <p className="mb-10 text-[12px] text-muted-foreground">
        Stand: {LAST_UPDATED} · Version {VERSION}
      </p>

      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-7 text-[14px] leading-relaxed text-muted-foreground">

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 1 Geltungsbereich</h2>
          <p>
            (1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB“) gelten für die Nutzung der
            Software-as-a-Service-Anwendung „Spurig“ (nachfolgend „Dienst“ oder „Spurig“), die unter
            <Link href="/" className="underline underline-offset-2"> spurig.com </Link>
            durch das DSG Studio, Inhaber David da Silva Gornik, Rahel-Varnhagen-Promenade 2, 10969 Berlin
            (nachfolgend „Anbieter“, „wir“) angeboten wird.
          </p>
          <p>
            (2) Vertragspartner sind sowohl Verbraucher im Sinne des § 13 BGB als auch Unternehmer im Sinne
            des § 14 BGB (nachfolgend „Kunde“, „du“). Soweit AGB nur für eine Gruppe gelten, ist dies kenntlich gemacht.
          </p>
          <p>
            (3) Abweichende Bedingungen des Kunden gelten nur, wenn der Anbieter ihrer Geltung ausdrücklich
            schriftlich zustimmt.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 2 Vertragsgegenstand</h2>
          <p>
            (1) Spurig ist eine cloud-basierte Anwendung zur Erstellung, Verwaltung und Auswertung von
            QR-Codes und Kurzlinks für Print- und Multi-Channel-Kampagnen. Der Funktionsumfang ist auf
            <Link href="/" className="underline underline-offset-2"> spurig.com </Link>
            sowie unter
            <Link href="/pricing" className="underline underline-offset-2"> /pricing </Link>
            beschrieben.
          </p>
          <p>
            (2) Der Anbieter behält sich das Recht vor, den Funktionsumfang weiterzuentwickeln, neue
            Funktionen hinzuzufügen oder bestehende Funktionen zu verbessern. Bestehende Kernfunktionen
            werden nicht ohne Vorankündigung entfernt.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 3 Vertragsschluss</h2>
          <p>
            (1) Mit der Registrierung auf{' '}
            <Link href="/signup" className="underline underline-offset-2">/signup</Link>
            {' '}gibt der Kunde ein Angebot zum Abschluss eines kostenlosen 14-tägigen Testzeitraums ab.
            Die Annahme erfolgt durch Bestätigung der Registrierung per E-Mail (PIN-Code).
          </p>
          <p>
            (2) Der kostenpflichtige Vertrag kommt erst zustande, wenn der Kunde nach Ablauf der Trial
            aktiv einen Plan auswählt und die Zahlung über den Zahlungsdienstleister Stripe Payments Europe,
            Ltd. abschließt. Es findet keine automatische Umwandlung von Trial in einen kostenpflichtigen Plan statt.
          </p>
          <p>
            (3) Die Vertragssprache ist Deutsch. Der Vertragstext (AGB + Bestelldaten) wird dem Kunden
            per E-Mail bestätigt.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 4 Leistungsumfang & Verfügbarkeit</h2>
          <p>
            (1) Der Anbieter stellt den Dienst mit einer angestrebten Verfügbarkeit von 99 % im Jahresmittel zur
            Verfügung, gemessen am Zeitraum eines Kalenderjahres. Geplante Wartungsfenster sowie Ausfälle
            durch höhere Gewalt oder Probleme bei vorgelagerten Diensten (Vercel, Supabase, Stripe, Cloudflare)
            sind hiervon ausgenommen.
          </p>
          <p>
            (2) Der Dienst wird ausschließlich auf Servern in der Europäischen Union betrieben (Frankfurt am
            Main / London).
          </p>
          <p>
            (3) Der Anbieter ist berechtigt, Wartungsarbeiten durchzuführen. Geplante Wartungsfenster mit zu
            erwartender Auswirkung werden dem Kunden mindestens 24 Stunden vorher per E-Mail oder im
            Dashboard angekündigt.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 5 Preise & Zahlung</h2>
          <p>
            (1) Es gilt der zum Zeitpunkt der Buchung auf
            <Link href="/pricing" className="underline underline-offset-2"> /pricing </Link>
            ausgewiesene Preis. Aktuelle Preise (Stand {LAST_UPDATED}):
          </p>
          <ul className="ml-5 list-disc space-y-1">
            <li>Monatsabo: 12,99 € netto / Monat (= 15,46 € brutto inkl. 19 % USt)</li>
            <li>
              Aktion: Die ersten 3 Monate des Monatsabos werden mit 5,99 € netto / Monat (= 7,13 € brutto)
              berechnet. Diese Aktion gilt nur für Neukunden. Die Vergünstigung wird automatisch beim Stripe-Checkout angewendet.
            </li>
            <li>
              Jahresabo: 8,99 € netto / Monat = 107,88 € netto / Jahr (= 128,38 € brutto inkl. 19 % USt),
              vollständig im Voraus zu zahlen.
            </li>
          </ul>
          <p>
            (2) Die Zahlung wird über den Zahlungsdienstleister Stripe Payments Europe, Ltd. abgewickelt.
            Akzeptiert werden u. a. Kreditkarte, PayPal, Klarna, Amazon Pay, Apple Pay und Google Pay
            (verfügbare Methoden je nach Endgerät).
          </p>
          <p>
            (3) Rechnungen werden ausschließlich elektronisch per E-Mail an die hinterlegte Adresse zugestellt
            sowie im Stripe-Kundenportal bereitgestellt.
          </p>
          <p>
            (4) Bei Zahlungsverzug ist der Anbieter berechtigt, den Zugang nach vorheriger Mahnung
            einzuschränken oder zu sperren. Bei Verbraucherverträgen gelten die gesetzlichen Verzugszinsen
            (§ 288 Abs. 1 BGB), bei Unternehmerverträgen § 288 Abs. 2 BGB.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 6 Vertragslaufzeit & Kündigung</h2>
          <p>
            (1) Der Trial-Zeitraum beträgt 14 Tage und endet automatisch ohne weitere Verpflichtung des Kunden.
          </p>
          <p>
            (2) Das Monatsabo verlängert sich automatisch um jeweils einen Monat, sofern es nicht spätestens am
            letzten Tag der laufenden Periode gekündigt wird. Die Kündigung erfolgt einfach im Dashboard über
            das Stripe-Kundenportal.
          </p>
          <p>
            (3) Das Jahresabo verlängert sich automatisch um jeweils ein Jahr, sofern es nicht spätestens am
            letzten Tag der laufenden Vertragsperiode gekündigt wird.
          </p>
          <p>
            (4) Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 7 Widerrufsrecht (nur Verbraucher)</h2>
          <p>
            (1) Verbrauchern steht ein gesetzliches Widerrufsrecht von 14 Tagen ab Vertragsschluss zu. Die
            Widerrufsbelehrung wird dem Verbraucher beim Vertragsschluss separat zur Verfügung gestellt.
          </p>
          <p>
            (2) Das Widerrufsrecht erlischt vorzeitig, wenn der Verbraucher dem Anbieter ausdrücklich zugestimmt
            hat, dass mit der Vertragsausführung vor Ablauf der Widerrufsfrist begonnen wird, und der Verbraucher
            seine Kenntnis davon bestätigt hat, dass er durch seine Zustimmung sein Widerrufsrecht verliert
            (§ 356 Abs. 4 BGB).
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 8 Pflichten des Kunden</h2>
          <p>
            (1) Der Kunde ist verpflichtet, den Dienst nur im Rahmen geltender Gesetze und nur für rechtmäßige
            Zwecke zu nutzen. Insbesondere darf der Kunde keine QR-Codes oder Kurzlinks erstellen, die auf
            rechtswidrige, jugendgefährdende, urheberrechtsverletzende, gewaltverherrlichende, pornografische,
            beleidigende oder Phishing-/Malware-Inhalte verlinken.
          </p>
          <p>
            (2) Der Kunde verpflichtet sich, den Dienst nicht für unaufgeforderte Werbung (Spam) zu missbrauchen.
          </p>
          <p>
            (3) Der Kunde ist für die Sicherheit seiner Zugangsdaten selbst verantwortlich. Bei begründetem
            Verdacht auf Missbrauch ist der Anbieter unverzüglich zu informieren.
          </p>
          <p>
            (4) Bei Verstoß gegen die Nutzungspflichten ist der Anbieter berechtigt, die Nutzung des Dienstes
            ganz oder teilweise zu sperren. Schadensersatzansprüche bleiben unberührt.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 9 Datenschutz</h2>
          <p>
            (1) Der Anbieter verarbeitet personenbezogene Daten gemäß der
            <Link href="/datenschutz" className="underline underline-offset-2"> Datenschutzerklärung</Link>.
            Diese ist Bestandteil dieser AGB.
          </p>
          <p>
            (2) Soweit der Kunde im Rahmen seiner Nutzung personenbezogene Daten Dritter (z. B. seiner
            Endkunden) verarbeitet, schließen Anbieter und Kunde einen Auftragsverarbeitungsvertrag (AVV)
            nach Art. 28 DSGVO. Der Anbieter stellt dem Kunden auf Anfrage einen Mustervertrag zur Verfügung.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 10 Gewährleistung</h2>
          <p>
            (1) Es gelten die gesetzlichen Gewährleistungsrechte. Der Kunde ist verpflichtet, Mängel
            unverzüglich nach deren Feststellung dem Anbieter unter
            {' '}<a href="mailto:info@spurig.com" className="underline underline-offset-2">info@spurig.com</a>{' '}
            zu melden.
          </p>
          <p>
            (2) Bei Unternehmern beträgt die Gewährleistungsfrist abweichend hiervon 12 Monate.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 11 Haftung</h2>
          <p>
            (1) Der Anbieter haftet uneingeschränkt für Vorsatz und grobe Fahrlässigkeit sowie nach den
            Vorschriften des Produkthaftungsgesetzes. Bei leicht fahrlässiger Verletzung wesentlicher
            Vertragspflichten (Kardinalpflichten) ist die Haftung auf den vertragstypischen, vorhersehbaren
            Schaden begrenzt.
          </p>
          <p>
            (2) Die Haftung für leicht fahrlässige Verletzung nicht-wesentlicher Vertragspflichten ist
            ausgeschlossen, soweit gesetzlich zulässig.
          </p>
          <p>
            (3) Im Übrigen ist die Haftung des Anbieters gegenüber Unternehmern für Vermögensschäden auf
            die in den letzten 12 Monaten vor dem schadensauslösenden Ereignis tatsächlich gezahlten
            Nutzungsentgelte begrenzt.
          </p>
          <p>
            (4) Die Haftung für Datenverlust ist auf den Aufwand begrenzt, der bei ordnungsgemäßer Datensicherung
            durch den Kunden zur Wiederherstellung der Daten erforderlich gewesen wäre. Der Anbieter sichert
            die Datenbank täglich. Der Kunde ist verpflichtet, eigene Daten regelmäßig per CSV-/PDF-Export
            (im Dashboard verfügbar) zu sichern.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 12 Änderung dieser AGB</h2>
          <p>
            (1) Der Anbieter ist berechtigt, diese AGB mit Wirkung für die Zukunft zu ändern, soweit dies
            zur Anpassung an geänderte Rechtslage, höchstrichterliche Rechtsprechung oder zur
            Berücksichtigung neuer Funktionen erforderlich ist und der Kunde dadurch nicht unangemessen
            benachteiligt wird.
          </p>
          <p>
            (2) Der Kunde wird über Änderungen mindestens 4 Wochen vor deren Inkrafttreten per E-Mail
            informiert. Widerspricht der Kunde nicht innerhalb dieser Frist, gelten die geänderten AGB
            als angenommen. Auf dieses Widerspruchsrecht und die Rechtsfolgen wird in der
            Änderungsmitteilung gesondert hingewiesen.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">§ 13 Schlussbestimmungen</h2>
          <p>
            (1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts. Bei
            Verbrauchern bleibt zwingendes Recht ihres gewöhnlichen Aufenthaltsstaates unberührt.
          </p>
          <p>
            (2) Gerichtsstand für alle Streitigkeiten aus diesem Vertrag ist Berlin, soweit der Kunde
            Kaufmann, juristische Person des öffentlichen Rechts oder öffentlich-rechtliches Sondervermögen
            ist oder im Inland keinen allgemeinen Gerichtsstand hat.
          </p>
          <p>
            (3) Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:{' '}
            <a
              href="https://ec.europa.eu/consumers/odr/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              ec.europa.eu/consumers/odr/
            </a>.
            Der Anbieter ist nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer
            Verbraucherschlichtungsstelle teilzunehmen.
          </p>
          <p>
            (4) Sollte eine Bestimmung dieser AGB unwirksam sein oder werden, bleibt die Wirksamkeit der
            übrigen Bestimmungen unberührt. An die Stelle der unwirksamen Bestimmung tritt die gesetzliche
            Regelung.
          </p>
        </section>

        <div className="mt-12 rounded-2xl border border-dashed border-border bg-muted/20 p-5">
          <p className="text-[12px] text-muted-foreground">
            Bei Fragen zu diesen AGB:{' '}
            <a href="mailto:info@spurig.com" className="font-medium text-foreground hover:text-brand">
              info@spurig.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
