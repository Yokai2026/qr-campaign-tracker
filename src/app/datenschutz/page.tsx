import Link from 'next/link';
import { Shield, ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Datenschutzerklärung — Spurig',
  description: 'Informationen zum Datenschutz beim Kampagnen-Tracking',
};

export default function DatenschutzPage() {
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
          <Shield className="h-4.5 w-4.5 text-primary" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Datenschutzerklärung</h1>
      </div>

      <div className="prose prose-sm prose-neutral dark:prose-invert max-w-none space-y-6 text-[14px] leading-relaxed text-muted-foreground">
        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">1. Verantwortlicher</h2>
          <p>
            Diese Anwendung wird als internes Marketing-Tool betrieben. Für Fragen zum Datenschutz
            wenden Sie sich bitte an den Betreiber der jeweiligen QR-Code-Kampagne.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">2. Welche Daten werden beim Scannen eines QR-Codes erfasst?</h2>
          <p>Beim Scannen eines QR-Codes werden folgende Daten anonymisiert verarbeitet:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Anonymisierter IP-Hash</strong> — Ihre IP-Adresse wird nicht gespeichert. Stattdessen wird ein täglicher Hash erzeugt, der keine Rückschlüsse auf Ihre tatsächliche IP-Adresse erlaubt. Die letzten zwei Oktette werden vor dem Hashing genullt.</li>
            <li><strong>Gerätetyp</strong> — Ob Sie ein Mobilgerät, Tablet oder Desktop nutzen (abgeleitet aus dem User-Agent).</li>
            <li><strong>Land</strong> — Das Land, aus dem der Scan erfolgt (via Server-Header, nicht GPS).</li>
            <li><strong>Zeitpunkt</strong> — Datum und Uhrzeit des Scans.</li>
            <li><strong>Referrer</strong> — Die verweisende Seite, falls vorhanden.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">3. Was wird NICHT erfasst</h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Keine Cookies — Es werden keine Tracking-Cookies gesetzt.</li>
            <li>Keine IP-Adressen — Nur ein anonymisierter, nicht umkehrbarer Hash.</li>
            <li>Kein Browser-Fingerprinting — Keine Canvas-, WebGL- oder Font-Analyse.</li>
            <li>Keine Drittanbieter-Tracker — Kein Google Analytics, kein Facebook Pixel, keine externen Dienste.</li>
            <li>Kein GPS/Standort — Das Land wird über Server-Header ermittelt, nicht über Geräte-GPS.</li>
            <li>Keine personenbezogenen Daten — Kein Name, keine E-Mail, keine Geräte-ID.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">4. Zweck der Datenverarbeitung</h2>
          <p>
            Die anonymisierten Daten dienen ausschließlich der statistischen Auswertung von
            Offline-Marketing-Kampagnen. Dies umfasst:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Messung der Scan-Häufigkeit pro QR-Code und Kampagne</li>
            <li>Geräteverteilung (Mobil vs. Desktop)</li>
            <li>Geografische Verteilung der Scans</li>
            <li>Zeitliche Verteilung (Tagesverlauf, Wochentage)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">5. Rechtsgrundlage</h2>
          <p>
            Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse).
            Das berechtigte Interesse liegt in der Erfolgsmessung von Marketing-Maßnahmen.
            Da ausschließlich anonymisierte Daten verarbeitet werden, ist ein Personenbezug nicht herstellbar.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">6. Speicherdauer</h2>
          <p>
            Die anonymisierten Scan-Daten werden für die Dauer der jeweiligen Kampagne gespeichert,
            maximal jedoch 24 Monate. Der tägliche Salt für die IP-Anonymisierung wird nach 24 Stunden verworfen,
            sodass eine Zuordnung von Scans über Tagesgrenzen hinweg nicht möglich ist.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">7. Ihre Rechte</h2>
          <p>
            Da keine personenbezogenen Daten gespeichert werden, ist eine Auskunft, Berichtigung
            oder Löschung individueller Datensätze technisch nicht möglich — es gibt keinen
            Personenbezug. Sie haben dennoch das Recht, sich bei einer Aufsichtsbehörde zu beschweren.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">8. Hosting und Technik</h2>
          <p>
            Die Anwendung wird auf <strong>Vercel</strong> (Vercel Inc., San Francisco, USA) gehostet.
            Die Datenbank wird von <strong>Supabase</strong> (Supabase Inc., San Francisco, USA) bereitgestellt.
            Für beide Dienste gelten Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO
            für die Datenübermittlung in Drittländer.
          </p>
        </section>

        <div className="pt-4 border-t border-border text-[12px] text-muted-foreground">
          Stand: April 2026
        </div>
      </div>
    </div>
  );
}
