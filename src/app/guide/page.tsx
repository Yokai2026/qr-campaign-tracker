import type { Metadata } from 'next';
import {
  QrCode, Link2, BarChart3, Globe, Sparkles,
  Mail, Bot, Printer,
} from 'lucide-react';
import { PrintButton } from './print-button';

export const metadata: Metadata = {
  title: 'Spurig — Kompletter Leitfaden',
  description: 'Schritt-für-Schritt-Anleitung: QR-Codes & Kurzlinks anlegen, eigene Domain einrichten, Analytics auswerten, mit KI steuern.',
  robots: { index: true, follow: true },
};

const PRINT_CSS = `
@media print {
  .no-print { display: none !important; }
  body { background: white !important; color: black !important; }
  .guide-page { padding: 0 !important; max-width: none !important; }
  .guide-section { page-break-inside: avoid; }
  h2, h3 { page-break-after: avoid; }
  a { color: #0066cc !important; text-decoration: none !important; }
  code, pre { background: #f4f4f4 !important; color: #000 !important; }
  .cover-page { page-break-after: always; }
}
@page { size: A4; margin: 20mm 18mm; }
`;

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Print-spezifische Styles: für sauberen PDF-Export */}
      <style>{PRINT_CSS}</style>

      <div className="guide-page mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">

        {/* Action bar (versteckt im Print) */}
        <div className="no-print mb-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Spurig Leitfaden</p>
            <h1 className="text-[20px] font-semibold tracking-tight mt-0.5">So holst du das Maximum raus</h1>
          </div>
          <PrintButton />
        </div>

        {/* COVER */}
        <section className="cover-page mb-12 rounded-3xl border border-border bg-gradient-to-br from-brand/5 via-card to-card p-8 sm:p-12">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-brand">
            Leitfaden · Komplett
          </div>
          <h1 className="mt-5 font-heading text-[40px] font-semibold leading-[1.1] tracking-[-0.025em] sm:text-[48px]">
            Spurig in 30 Minuten.
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground max-w-xl">
            Komplette Anleitung: QR-Codes & Kurzlinks erstellen, eigene Domain einrichten,
            Scans live tracken, und Spurig per API von KI-Agenten (Claude, GPT, n8n) steuern lassen.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {[
              { icon: QrCode, t: 'QR & Kurzlink in 60 Sek.' },
              { icon: Globe, t: 'Eigene Domain einrichten' },
              { icon: BarChart3, t: 'Analytics verstehen' },
              { icon: Bot, t: 'KI-Steuerung via API' },
            ].map(({ icon: Icon, t }) => (
              <li key={t} className="flex items-center gap-2.5 text-[14px]">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <Icon className="h-3.5 w-3.5" />
                </span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* TOC */}
        <nav className="guide-section mb-12 rounded-2xl border border-border bg-muted/20 p-5">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">Inhalt</h2>
          <ol className="mt-3 space-y-1.5 text-[14px]">
            <li><a href="#was-ist-spurig" className="text-foreground hover:text-brand">1. Was ist Spurig?</a></li>
            <li><a href="#schnellstart" className="text-foreground hover:text-brand">2. Schnellstart in 5 Schritten</a></li>
            <li><a href="#struktur" className="text-foreground hover:text-brand">3. Struktur: Kampagnen & Orte</a></li>
            <li><a href="#qr-codes" className="text-foreground hover:text-brand">4. QR-Codes erstellen</a></li>
            <li><a href="#kurzlinks" className="text-foreground hover:text-brand">5. Kurzlinks erstellen</a></li>
            <li><a href="#domain" className="text-foreground hover:text-brand">6. Eigene Domain einrichten</a></li>
            <li><a href="#analytics" className="text-foreground hover:text-brand">7. Analytics verstehen</a></li>
            <li><a href="#ki" className="text-foreground hover:text-brand">8. Spurig mit KI steuern</a></li>
            <li><a href="#tipps" className="text-foreground hover:text-brand">9. Tipps & Best Practices</a></li>
            <li><a href="#support" className="text-foreground hover:text-brand">10. Support & Kontakt</a></li>
          </ol>
        </nav>

        {/* 1. Was ist Spurig */}
        <Section id="was-ist-spurig" num={1} title="Was ist Spurig?">
          <p>
            Spurig ist deine zentrale Plattform für QR-Codes und Kurzlinks mit eingebauter Analytik —
            DSGVO-konform, EU-gehostet, ohne Cookie-Banner.
          </p>
          <h3>Typische Anwendungsfälle</h3>
          <ul>
            <li><strong>Print-Werbung:</strong> QR-Code auf Plakat → Scans pro Standort tracken</li>
            <li><strong>Email-Kampagnen:</strong> Kurzlinks in Newslettern → Klickrate, Geräteverteilung</li>
            <li><strong>Restaurant/Café:</strong> QR-Code auf Tisch → Menü-Aufrufe pro Filiale</li>
            <li><strong>Event:</strong> Eintritts-QR → wie viele Gäste sind tatsächlich da?</li>
          </ul>
        </Section>

        {/* 2. Schnellstart */}
        <Section id="schnellstart" num={2} title="Schnellstart in 5 Schritten">
          <ol className="space-y-3 !list-none !pl-0">
            <Step n={1} title="Konto bestätigen">
              Du hast bei der Registrierung eine Mail mit 6-stelligem Code bekommen. Eingeben → fertig.
            </Step>
            <Step n={2} title="Erste Kampagne anlegen">
              Im Dashboard auf <strong>„Erste Kampagne anlegen"</strong> klicken. Name vergeben (z.B. „Sommer 2026"),
              optional Start-/Enddatum.
            </Step>
            <Step n={3} title="QR-Code oder Kurzlink erstellen">
              Auf <strong>QR-Codes → Neu</strong> klicken (oder <strong>Kurzlinks → Neu</strong>).
              Ziel-URL eintragen, optional UTM-Parameter, Farben für QR.
            </Step>
            <Step n={4} title="Verteilen">
              QR-Code als PNG/SVG herunterladen und drucken — oder Kurzlink in Mailing/Social verwenden.
            </Step>
            <Step n={5} title="Scans verfolgen">
              <strong>Analytik</strong>-Tab öffnen. Live-Daten pro Tag, Gerät, Land, Conversion.
            </Step>
          </ol>
        </Section>

        {/* 3. Struktur */}
        <Section id="struktur" num={3} title="Struktur: Kampagnen & Orte">
          <p>Spurig nutzt 3 Ebenen damit Auswertung präzise wird:</p>
          <div className="my-5 rounded-xl border border-border bg-muted/20 p-4">
            <pre className="font-mono text-[13px] leading-relaxed text-foreground">{`Kampagne ("Sommer 2026")
   ├── Standort ("Café Berlin Mitte")
   │     └── Platzierung ("Plakat im Eingang")
   │           └── QR-Code (Scans landen hier)
   └── Standort ("Messe Hamburg")
         └── Platzierung ("Banner Halle 5")
               └── QR-Code`}</pre>
          </div>
          <p>
            <strong>In der App:</strong> Standorte und Platzierungen findest du gemeinsam unter
            „<strong>Orte &amp; Platzierungen</strong>". Jeder Standort lässt sich aufklappen und zeigt
            seine Platzierungen direkt darunter — inkl. Scans pro Platzierung und Schnellzugriff zum
            Anlegen neuer QR-Codes.
          </p>
          <p>
            <strong>Vereinfachung möglich:</strong> Wenn du nur einen QR-Code ohne Standort brauchst,
            kannst du den als <em>freistehenden QR</em> ohne Platzierung anlegen.
          </p>
        </Section>

        {/* 4. QR-Codes */}
        <Section id="qr-codes" num={4} title="QR-Codes erstellen" icon={QrCode}>
          <ol>
            <li>Im Sidebar auf <strong>QR-Codes → Neu</strong></li>
            <li>
              <strong>Kurz-URL-Typ:</strong> Standard (<code>spurig.com/r/abc</code>) oder eigene Domain
              (<code>s.deinedomain.de/r/abc</code>) wenn du eine eingerichtet hast.
            </li>
            <li><strong>Platzierung:</strong> Optional einer Platzierung zuordnen, oder freistehend lassen.</li>
            <li><strong>Ziel-URL:</strong> Wohin der Scan führt (z.B. <code>https://deineseite.de/angebot</code>).</li>
            <li>
              <strong>Tracking:</strong> UTM-Parameter werden auto-befüllt (utm_source=qr, utm_medium=offline).
              Manuell überschreibbar.
            </li>
            <li>
              <strong>QR-Design:</strong> Farben anpassen (z.B. Markenfarbe statt schwarz).
              Transparenter Hintergrund optional.
            </li>
            <li>
              <strong>Scan-Limit:</strong> Optional „Nur erste 100 Scans aktiv" für limitierte Aktionen.
            </li>
            <li>Speichern → PNG (für Web/Digital) oder SVG (für Print, beliebig skalierbar) herunterladen.</li>
          </ol>
        </Section>

        {/* 5. Kurzlinks */}
        <Section id="kurzlinks" num={5} title="Kurzlinks erstellen" icon={Link2}>
          <p>
            Genau wie QR-Codes, nur ohne Bild. Beispiel: <code>https://spurig.com/r/sommer2026</code>{' '}
            statt einer langen URL mit UTM-Parametern.
          </p>
          <ul>
            <li><strong>Custom Short-Code möglich:</strong> Statt random <code>abc123</code> z.B. <code>sommer-de</code></li>
            <li><strong>Eigene Domain:</strong> Wenn eingerichtet, wird <code>s.deinedomain.de/sommer-de</code> draus</li>
            <li><strong>UTM-Parameter:</strong> Werden auto an Ziel-URL angehängt</li>
            <li><strong>Ablauf-Datum:</strong> Link wird nach Datum X inaktiv → Weiterleitung auf andere URL</li>
          </ul>
        </Section>

        {/* 6. Eigene Domain */}
        <Section id="domain" num={6} title="Eigene Domain einrichten" icon={Globe}>
          <p>
            <strong>Was bringt&apos;s:</strong> Statt <code>spurig.com/r/abc</code> erscheint beim Scan
            <code>s.deinemarke.de/abc</code>. Wirkt professioneller, schafft Vertrauen, stärkt deine Marke.
          </p>

          <h3>Schritt 1: Subdomain auswählen</h3>
          <p><strong>Wichtig:</strong> nimm eine <em>Subdomain</em>, nicht die Hauptdomain. Beispiele:</p>
          <ul>
            <li><code>s.deinemarke.de</code> (kürzest)</li>
            <li><code>go.deinemarke.de</code> (klassisch)</li>
            <li><code>qr.deinemarke.de</code> (selbsterklärend)</li>
          </ul>
          <div className="my-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-[13px]">
            <strong>Warnung:</strong> Wenn du deine Hauptdomain (z.B. <code>deinemarke.de</code>) nimmst,
            geht die existierende Website kaputt. <strong>Immer Subdomain wählen.</strong>
          </div>

          <h3>Schritt 2: Bei Spurig eintragen</h3>
          <p>
            Settings → Integrationen → <strong>Eigene Kurz-Domains</strong> → „Domain hinzufügen" →
            Subdomain eingeben (z.B. <code>s.deinemarke.de</code>).
          </p>

          <h3>Schritt 3: DNS-Records anlegen</h3>
          <p>Spurig zeigt dir 2 Records zum Anlegen bei deinem Domain-Provider:</p>
          <div className="my-4 overflow-x-auto rounded-xl border border-border bg-muted/20 p-3">
            <pre className="font-mono text-[12px] leading-relaxed">{`Record 1 (TXT):
  Name:  _spurig-verify.s
  Wert:  <Token aus Spurig-UI>

Record 2 (CNAME):
  Name:  s
  Wert:  cname.vercel-dns.com`}</pre>
          </div>
          <p>
            Wo? Bei <strong>Cloudflare</strong>, <strong>IONOS</strong>, <strong>Strato</strong>, <strong>GoDaddy</strong> etc.
            Spurig erkennt deinen Provider automatisch und zeigt eine spezifische Anleitung.
          </p>

          <h3>Schritt 4: Warten (max. 30 Min)</h3>
          <p>
            Spurig prüft alle 15 Sekunden automatisch. Sobald DNS aktiv ist → grüner Haken,
            SSL wird automatisch eingerichtet. Du musst nichts manuell anklicken.
          </p>

          <h3>Schritt 5: Bei QR-Codes auswählen</h3>
          <p>
            Beim Erstellen eines QR-Codes oder Kurzlinks erscheint die neue Domain im Dropdown.
            Du kannst eine als „Primär" markieren — die wird dann Default.
          </p>

          <div className="my-4 rounded-md border border-emerald-500/30 bg-emerald-500/10 p-3 text-[13px]">
            <strong>Mehrere Domains möglich:</strong> Du kannst beliebig viele Domains hinzufügen
            (z.B. <code>s.marke1.de</code>, <code>s.marke2.de</code>) — z.B. wenn du verschiedene Brands betreibst.
          </div>
        </Section>

        {/* 7. Analytics */}
        <Section id="analytics" num={7} title="Analytics verstehen" icon={BarChart3}>
          <h3>Die wichtigsten Zahlen</h3>
          <ul>
            <li><strong>Aufrufe gesamt:</strong> Alle Scans und Klicks zusammen</li>
            <li><strong>QR-Scans:</strong> Nur Scans (Print-Performance)</li>
            <li><strong>Link-Klicks:</strong> Nur Klicks auf Kurzlinks (Digital-Performance)</li>
            <li><strong>Eindeutige Besucher:</strong> Wie viele verschiedene Personen (anonym, kein Tracking-ID)</li>
          </ul>

          <h3>Filter</h3>
          <ul>
            <li><strong>Zeitraum:</strong> Heute, 7/30/90 Tage, YTD oder Custom</li>
            <li><strong>Quelle:</strong> Nur QR-Codes oder nur Kurzlinks</li>
            <li><strong>Kampagne:</strong> Eine spezifische Kampagne isolieren</li>
            <li><strong>Bezirk:</strong> Geografische Filterung (wenn Standorte angelegt)</li>
          </ul>

          <h3>Drill-Down</h3>
          <p>
            Klick auf eine KPI-Karte (z.B. „QR-Scans") → Liste aller QR-Codes mit Scan-Anzahl.
            Klick auf einen QR-Code → Detail mit Scan-Verlauf, Geräten, Ländern.
          </p>

          <h3>Export</h3>
          <ul>
            <li><strong>CSV:</strong> Rohdaten für Excel, Power BI etc.</li>
            <li><strong>PDF:</strong> Schöner Bericht zum Weitergeben an Stakeholder</li>
          </ul>
        </Section>

        {/* 8. KI */}
        <Section id="ki" num={8} title="Spurig mit KI steuern" icon={Bot}>
          <p>
            Spurig hat eine <strong>Public REST API</strong> — damit kann eine KI (Claude, GPT-4, etc.)
            oder ein Workflow-Tool (n8n, Make, Zapier) direkt Kampagnen, QR-Codes und Kurzlinks anlegen.
          </p>

          <h3>Schritt 1: API-Token erstellen</h3>
          <ol>
            <li>Settings → <strong>Integrationen</strong></li>
            <li>Card „<strong>API-Tokens</strong>" → „Token erstellen"</li>
            <li>Namen vergeben (z.B. „Claude-Agent"), optional Ablauf-Datum</li>
            <li>Token wird <strong>einmal angezeigt</strong> — sofort kopieren und sicher speichern</li>
          </ol>

          <h3>Schritt 2: KI nutzt den Token</h3>
          <p>Beispiel-Prompt für Claude/GPT:</p>
          <div className="my-4 rounded-xl border border-border bg-muted/20 p-4">
            <pre className="font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap">{`Du hast Zugriff auf die Spurig API.
Base-URL: https://spurig.com/api/v1
Auth: Header "Authorization: Bearer spr_live_xxx"
Dokumentation: https://spurig.com/api-docs

Bitte:
1. Lege eine Kampagne "Black Friday 2026" an
2. Erstelle einen QR-Code dafür, Ziel:
   https://meineshop.de/black-friday
3. Erstelle einen Kurzlink mit Slug "bf2026"`}</pre>
          </div>
          <p>
            Die KI macht 3 POST-Requests an die API und du bekommst Bestätigung mit den IDs zurück.
          </p>

          <h3>Schritt 3: n8n-Integration</h3>
          <p>In n8n den <strong>HTTP-Request</strong>-Node nutzen mit:</p>
          <ul>
            <li>Method: <code>POST</code></li>
            <li>URL: <code>https://spurig.com/api/v1/qr-codes</code></li>
            <li>Headers: <code>Authorization: Bearer spr_live_xxx</code></li>
            <li>Body (JSON): <code>{`{ "target_url": "...", "title": "..." }`}</code></li>
          </ul>

          <h3>Was die API kann</h3>
          <ul>
            <li>Kampagnen anlegen, lesen, ändern, löschen</li>
            <li>QR-Codes erstellen + PNG live abrufen</li>
            <li>Kurzlinks managen</li>
            <li>Analytics abrufen (KPIs, Zeitreihen, Länder, Geräte)</li>
          </ul>
          <p>
            Vollständige Dokumentation mit Beispielen unter{' '}
            <a href="https://spurig.com/api-docs" className="text-brand hover:underline">spurig.com/api-docs</a>.
          </p>

          <h3>Rate-Limit</h3>
          <p>
            100 Requests pro Minute pro Token. Bei Überschreitung bekommst du <code>429</code> mit{' '}
            <code>Retry-After</code> Header.
          </p>
        </Section>

        {/* 9. Tipps */}
        <Section id="tipps" num={9} title="Tipps & Best Practices" icon={Sparkles}>
          <h3>QR-Code Design</h3>
          <ul>
            <li><strong>Mindestgröße auf Plakaten:</strong> 3×3 cm, besser 5×5 cm</li>
            <li><strong>Hoher Kontrast:</strong> Schwarz auf Weiß ist am sichersten</li>
            <li><strong>Quiet Zone:</strong> Mindestens 4 Module Weißraum drumherum</li>
            <li><strong>SVG für Print</strong> (skalierbar), PNG für Digital (sofort nutzbar)</li>
          </ul>

          <h3>UTM-Parameter</h3>
          <p>Konsistente UTM-Strategie macht Analytics aussagekräftig:</p>
          <ul>
            <li><code>utm_source</code> = woher (qr, instagram, newsletter)</li>
            <li><code>utm_medium</code> = wie (offline, social, email)</li>
            <li><code>utm_campaign</code> = welche Aktion (sommer-2026, bf-2026)</li>
            <li><code>utm_content</code> = welche Variante (a, b, plakat-bahn, plakat-cafe)</li>
          </ul>

          <h3>Kampagnen-Struktur</h3>
          <ul>
            <li>Eine Kampagne = eine zusammenhängende Aktion (nicht „2026" sondern „Sommer 2026")</li>
            <li>Standort = der physische Ort (eine Filiale, eine Stadt, eine Messe)</li>
            <li>Platzierung = das konkrete Asset (ein Plakat, ein Tischaufsteller)</li>
          </ul>
        </Section>

        {/* 10. Support */}
        <Section id="support" num={10} title="Support & Kontakt" icon={Mail}>
          <p>Bei Fragen oder Problemen:</p>
          <ul>
            <li><strong>E-Mail:</strong> <a href="mailto:support@spurig.com" className="text-brand hover:underline">support@spurig.com</a></li>
            <li><strong>API-Dokumentation:</strong> <a href="https://spurig.com/api-docs" className="text-brand hover:underline">spurig.com/api-docs</a></li>
            <li><strong>Domain-Setup-Hilfe:</strong> Im UI gibt&apos;s einen „Hilfe anfordern"-Button — wir helfen direkt</li>
          </ul>
          <p className="mt-4 text-[13px] text-muted-foreground">
            Antwortzeit: i.d.R. innerhalb eines Werktags.
          </p>
        </Section>

        {/* Footer */}
        <footer className="guide-section mt-16 border-t border-border pt-6 text-center text-[12px] text-muted-foreground">
          <p>
            Spurig — DSGVO-konformes QR-Code- und Link-Tracking. EU-Hosting. Ohne Cookie-Banner.
          </p>
          <p className="mt-2">
            DSG Studio · Rahel-Varnhagen-Promenade 2 · 10969 Berlin
          </p>
        </footer>
      </div>
    </div>
  );
}

function Section({
  id, num, title, icon: Icon, children,
}: {
  id: string;
  num: number;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="guide-section mb-12 scroll-mt-12">
      <header className="mb-5 flex items-center gap-3 border-b border-border pb-3">
        {Icon ? (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Icon className="h-4 w-4" />
          </span>
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-[12px] font-semibold text-muted-foreground tabular-nums">
            {num}
          </span>
        )}
        <h2 className="text-[22px] font-semibold tracking-tight">{title}</h2>
      </header>
      <div className="prose prose-sm prose-neutral max-w-none [&_p]:text-[14.5px] [&_p]:leading-relaxed [&_ul]:my-3 [&_li]:text-[14px] [&_li]:leading-relaxed [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[12.5px] [&_code]:font-mono [&_h3]:mt-6 [&_h3]:text-[16px] [&_h3]:font-semibold [&_strong]:font-semibold [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_ul]:list-disc [&_ul]:pl-5 dark:prose-invert">
        {children}
      </div>
    </section>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/15 text-[12px] font-semibold text-brand tabular-nums">
        {n}
      </span>
      <div>
        <div className="text-[14px] font-semibold">{title}</div>
        <div className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </li>
  );
}
