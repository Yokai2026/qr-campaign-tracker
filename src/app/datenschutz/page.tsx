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
            Verantwortlich im Sinne der DSGVO:<br />
            David da Silva Gornik<br />
            Weitere Angaben finden Sie im{' '}
            <a href="/impressum" className="underline underline-offset-2 hover:text-foreground">Impressum</a>.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">2. Welche Daten werden beim Scannen eines QR-Codes erfasst?</h2>
          <p>Beim Scannen eines QR-Codes werden folgende Daten anonymisiert verarbeitet:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Anonymisierter IP-Hash</strong> — Ihre IP-Adresse wird nicht gespeichert. Die letzten zwei Oktette (IPv4) bzw. die letzten 80 Bits (IPv6) werden zunächst genullt, anschließend wird ein täglicher SHA-256-Hash erzeugt, der keine Rückschlüsse auf Ihre tatsächliche IP-Adresse erlaubt.</li>
            <li><strong>Gerätetyp</strong> — Ob Sie ein Mobilgerät, Tablet oder Desktop nutzen (abgeleitet aus dem User-Agent).</li>
            <li><strong>Land</strong> — Das Land, aus dem der Scan erfolgt (ausschließlich via CDN-Edge-Header des Hosting-Anbieters, nicht über GPS oder externe Dienste).</li>
            <li><strong>Zeitpunkt</strong> — Datum und Uhrzeit des Scans.</li>
            <li><strong>Referrer</strong> — Die verweisende Seite, falls vorhanden.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">3. Was wird NICHT erfasst</h2>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>Keine Tracking-Cookies — Es werden keine Tracking- oder Werbe-Cookies gesetzt.</li>
            <li>Keine IP-Adressen — Nur ein anonymisierter, nicht umkehrbarer Hash nach Oktett-Nullung.</li>
            <li>Kein Browser-Fingerprinting — Keine Canvas-, WebGL- oder Font-Analyse.</li>
            <li>Keine Drittanbieter-Tracker — Kein Google Analytics, kein Facebook Pixel, keine externen Analyse-Dienste.</li>
            <li>Kein GPS/Standort — Das Land wird über Server-Header ermittelt, nicht über Geräte-GPS.</li>
            <li>Keine personenbezogenen Daten der Scan-Nutzer — Kein Name, keine E-Mail, keine Geräte-ID.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">4. Cookies</h2>
          <p>
            Diese Anwendung verwendet ausschließlich <strong>technisch notwendige Cookies</strong> für
            die Session-Verwaltung registrierter Nutzer (Authentifizierung via Supabase Auth).
            Diese Cookies sind für den Betrieb der Anwendung erforderlich und werden nicht für
            Tracking-Zwecke eingesetzt. Eine Einwilligung ist hierfür gemäß § 25 Abs. 2 Nr. 2 TDDDG
            nicht erforderlich.
          </p>
          <p>Beim Scannen eines QR-Codes werden <strong>keine Cookies</strong> gesetzt.</p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">5. Zweck der Datenverarbeitung</h2>
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
          <h2 className="text-[15px] font-semibold text-foreground mb-2">6. Rechtsgrundlage</h2>
          <p>
            Die Verarbeitung der anonymisierten Scan-Daten erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO
            (berechtigtes Interesse an der Erfolgsmessung von Marketing-Maßnahmen).
            Da ausschließlich anonymisierte Daten verarbeitet werden, ist ein Personenbezug nicht herstellbar.
          </p>
          <p>
            Die Verarbeitung der Kontodaten registrierter Nutzer (E-Mail, Benutzername) erfolgt auf
            Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">7. Speicherdauer</h2>
          <p>
            Die anonymisierten Scan-Daten werden für die Dauer der jeweiligen Kampagne gespeichert,
            maximal jedoch <strong>24 Monate</strong>. Ältere Daten werden automatisch gelöscht.
            Der tägliche Salt für die IP-Anonymisierung wird nach 24 Stunden verworfen,
            sodass eine Zuordnung von Scans über Tagesgrenzen hinweg nicht möglich ist.
          </p>
          <p>
            Kontodaten registrierter Nutzer werden bis zur Löschung des Kontos gespeichert.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">8. Ihre Rechte</h2>
          <p>Sie haben folgende Rechte gemäß DSGVO:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li><strong>Auskunft</strong> (Art. 15) — Recht auf Auskunft über Ihre gespeicherten Daten.</li>
            <li><strong>Berichtigung</strong> (Art. 16) — Recht auf Korrektur unrichtiger Daten.</li>
            <li><strong>Löschung</strong> (Art. 17) — Registrierte Nutzer können ihr Konto und alle zugehörigen
              Daten jederzeit in den Einstellungen löschen.</li>
            <li><strong>Einschränkung</strong> (Art. 18) — Recht auf Einschränkung der Verarbeitung.</li>
            <li><strong>Datenübertragbarkeit</strong> (Art. 20) — Recht auf Herausgabe Ihrer Daten in einem gängigen Format.</li>
            <li><strong>Widerspruch</strong> (Art. 21) — Recht auf Widerspruch gegen die Verarbeitung.</li>
            <li><strong>Beschwerde</strong> — Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren.</li>
          </ul>
          <p className="mt-2">
            Bei anonymisierten Scan-Daten ist eine Zuordnung zu einzelnen Personen technisch nicht möglich,
            weshalb Auskunfts- und Löschungsanfragen für diese Daten nicht umsetzbar sind.
          </p>
        </section>

        <section>
          <h2 className="text-[15px] font-semibold text-foreground mb-2">9. Hosting und Auftragsverarbeiter</h2>
          <p>Wir setzen folgende Dienstleister ein:</p>
          <ul className="list-disc pl-5 space-y-1 mt-2">
            <li>
              <strong>Vercel Inc.</strong> (San Francisco, USA) — Hosting der Anwendung.
              Vercel ist unter dem EU-US Data Privacy Framework (DPF) zertifiziert.
              Zusätzlich gelten Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO.
            </li>
            <li>
              <strong>Supabase Inc.</strong> (San Francisco, USA) — Datenbank und Authentifizierung.
              Supabase unterliegt Standardvertragsklauseln gemäß Art. 46 Abs. 2 lit. c DSGVO.
            </li>
            <li>
              <strong>Hetzner Online GmbH</strong> (Gunzenhausen, Deutschland) — E-Mail-Versand
              an registrierte Nutzer (Report-Scheduling, Scan-Alerts). Die Verarbeitung erfolgt
              nur auf Anforderung des Nutzers. Hetzner unterliegt der DSGVO als deutscher Anbieter.
            </li>
          </ul>
          <p className="mt-2">
            Schriftarten (Geist Sans/Mono) werden über Next.js optimiert und direkt vom
            Hosting-Server ausgeliefert — es erfolgt kein Abruf von Google-Servern durch den Browser.
          </p>
        </section>

        <div className="pt-4 border-t border-border text-[12px] text-muted-foreground">
          Stand: April 2026
        </div>
      </div>
    </div>
  );
}
