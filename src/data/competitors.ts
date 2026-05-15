/**
 * Competitor-Comparison-Daten fuer /vergleich/<competitor>-alternative Pages.
 * SEO-Goldmines: hoher Such-Intent (User googelt aktiv "Bitly Alternative").
 */

export type FeatureCompare = {
  feature: string;
  spurig: boolean | string;
  competitor: boolean | string;
  note?: string;
};

export type Competitor = {
  slug: string;                 // "bitly", "yourls", etc.
  name: string;                 // "Bitly", "YOURLS"
  domain: string;               // "bitly.com"
  oneLine: string;              // SEO-Description
  category: 'kurzlink' | 'qr_code' | 'beides';
  origin: string;               // "USA, New York", "Open-Source", etc.
  founded: string;              // year or "Open-Source seit 2009"
  pricing: string;              // "ab $8/Monat" or "Self-hosted (gratis)"
  ourPositioning: string;       // Hook fuer den Vergleich
  dsgvoIssues: string[];        // 2-4 konkrete DSGVO-Probleme
  whyMigrate: string[];         // 3-5 Konkrete Gruende
  features: FeatureCompare[];
  faqs: Array<{ q: string; a: string }>;
};

const PRICE_SPURIG = 'ab 8,99 € / Monat';

export const COMPETITORS: Competitor[] = [
  {
    slug: 'bitly',
    name: 'Bitly',
    domain: 'bitly.com',
    oneLine: 'Bekanntester US-Kurzlink-Dienst, ~70% Marktanteil global',
    category: 'beides',
    origin: 'USA, New York',
    founded: '2008',
    pricing: 'ab $8 / Monat',
    ourPositioning:
      'Bitly speichert deine Klick-Daten auf US-Servern und unterliegt dem CLOUD Act. Seit Schrems II ist das fuer deutsche Unternehmen rechtlich heikel.',
    dsgvoIssues: [
      'US-Hosting + CLOUD Act = Behoerden-Zugriff auf Daten ohne EU-Schutz',
      'Schrems-II-Urteil 2020 macht Standardvertragsklauseln allein unzureichend',
      'Bitly-AVV deckt die Risiken nicht ab — DPA-Pflichten bleiben beim Kunden',
      'Tracking-Cookies + Geo-Daten + IP-Adressen = personenbezogene Daten',
    ],
    whyMigrate: [
      'EU-Hosting (Frankfurt) — kein Drittlandtransfer, kein Schrems-II-Risiko',
      'Eigene Custom-Domain fuer Branded-Links (z.B. xyz.de/aktion)',
      'QR-Codes UND Kurzlinks in einer Plattform statt Bitly + QR-Tool',
      'Transparente Preise auf Deutsch, deutscher Support',
      'Migration kostenlos: Bulk-Import deiner bestehenden Bitly-Links',
    ],
    features: [
      { feature: 'EU-Hosting (Frankfurt)', spurig: true, competitor: false },
      { feature: 'DSGVO-AVV ohne Standardvertragsklauseln', spurig: true, competitor: false, note: 'Bitly AVV verweist auf US-Recht' },
      { feature: 'Custom-Domain fuer Branded-Links', spurig: true, competitor: 'Premium-Plan', note: 'Bei Spurig ab Start' },
      { feature: 'QR-Code Generation + Tracking', spurig: true, competitor: 'separater Dienst', note: 'Spurig: alles in 1 Plattform' },
      { feature: 'Click-Tracking (Land, Geraet, Browser)', spurig: true, competitor: true },
      { feature: 'API-Zugriff', spurig: true, competitor: 'ab Premium' },
      { feature: 'Cookie-Banner-Pflicht', spurig: 'nein (kein Tracking)', competitor: 'ja' },
      { feature: 'Bulk-Import bestehender Links', spurig: true, competitor: false, note: 'Migration in unter 5 Min' },
      { feature: 'Preis pro Monat', spurig: PRICE_SPURIG, competitor: 'ab $8 (Basic)' },
      { feature: 'Sprache + Support', spurig: 'Deutsch', competitor: 'Englisch' },
    ],
    faqs: [
      {
        q: 'Ist Bitly in Deutschland DSGVO-konform nutzbar?',
        a: 'Streng genommen nein — seit Schrems II 2020 reichen Standardvertragsklauseln allein nicht. Bitly speichert Daten in den USA und unterliegt dem CLOUD Act. Deutsche Aufsichtsbehoerden haben mehrfach signalisiert, dass solche US-Tools im B2B-Marketing-Stack pruefungsrelevant sind.',
      },
      {
        q: 'Wie migriere ich von Bitly zu Spurig?',
        a: 'Du exportierst deine Links aus Bitly als CSV und importierst sie in Spurig. Bestehende kurze Bitly-URLs (bit.ly/abc) bleiben aktiv — du musst sie nur in zukuenftigen Materialien durch deine Spurig-Custom-Domain ersetzen. Dauer: 5-15 Min je nach Anzahl.',
      },
      {
        q: 'Was kostet der Wechsel?',
        a: 'Migration ist gratis (DIY oder mit unserem Setup-Support). Spurig kostet ab 8,99 € / Monat. Wenn du Bitly-Premium nutzt (45 $/Mo), sparst du sofort. Wenn du Bitly-Free nutzt, bezahlst du fuer DSGVO-Sicherheit.',
      },
      {
        q: 'Bekomme ich die gleiche Funktionalitaet?',
        a: 'Ja, plus QR-Codes (bei Bitly extra). Click-Tracking, Custom-Domain, Bulk-Operations, API, Reports — alles drin. Spezielle Bitly-Features wie deren Mobile-App haben wir bewusst nicht — wir setzen auf Browser-First.',
      },
    ],
  },

  {
    slug: 'yourls',
    name: 'YOURLS',
    domain: 'yourls.org',
    oneLine: 'Open-Source Self-Hosted Kurzlink-Dienst, beliebt bei Developers',
    category: 'kurzlink',
    origin: 'Open-Source, weltweit',
    founded: 'Open-Source seit 2009',
    pricing: 'Self-hosted (Server-Kosten + Dev-Zeit)',
    ourPositioning:
      'YOURLS ist kostenlos — wenn du Server, Dev-Zeit und Wartung umsonst hast. In der Praxis kostet ein selbst gehosteter YOURLS-Setup pro Jahr mehr als ein SaaS, weil DevOps + Updates + DSGVO-Compliance bei dir bleiben.',
    dsgvoIssues: [
      'AVV-Verantwortung liegt bei dir (Datenschutz-Folgenabschaetzung selbst durchfuehren)',
      'Updates + Security-Patches musst du selbst einspielen',
      'Cookie-Banner-Logik manuell programmieren oder Plugin patchen',
      'Bei Server-Ausfall: Links tot, Reputation kaputt — kein 24/7-Support',
    ],
    whyMigrate: [
      'Kein Server, kein DevOps, kein PHP-Update-Stress',
      'DSGVO-Verantwortung trägt Spurig (Auftragsverarbeitungsvertrag inklusive)',
      'Echte Hochverfuegbarkeit (CDN, Failover, 99.9% SLA)',
      'QR-Code Generation eingebaut (bei YOURLS nur via Plugin)',
      'Modernes Dashboard statt PHP-Admin aus 2010',
    ],
    features: [
      { feature: 'Setup-Aufwand', spurig: '5 Min', competitor: '2-4 Std (Server, DB, PHP, SSL)' },
      { feature: 'Wartungs-Aufwand', spurig: '0 (managed)', competitor: 'PHP/DB-Updates monatlich' },
      { feature: 'EU-Hosting + DSGVO-AVV', spurig: true, competitor: 'selbst zustaendig' },
      { feature: 'Hochverfuegbarkeit (99.9% SLA)', spurig: true, competitor: 'abhaengig von deinem Server' },
      { feature: 'QR-Code Generation', spurig: true, competitor: 'Plugin noetig' },
      { feature: 'Mobile-friendly Admin-UI', spurig: true, competitor: 'PHP-Klassiker aus 2010' },
      { feature: 'Versteckte Kosten', spurig: 'keine', competitor: 'Server + Dev-Zeit + Updates + Backup' },
      { feature: 'Real-Cost / Jahr', spurig: '~108 €', competitor: '~200-500 €+ inkl. Dev-Zeit', note: 'YOURLS scheinbar gratis' },
    ],
    faqs: [
      {
        q: 'Spart Self-Hosted YOURLS wirklich Geld?',
        a: 'Nur wenn du Server, Dev-Zeit, Backups und Security-Updates als "umsonst" rechnest. Realistisch: 50-100 € / Monat fuer einen ordentlichen Setup, mehr wenn du Dev-Zeit fair bewertest. Dazu DSGVO-Verantwortung allein bei dir.',
      },
      {
        q: 'Bringt mir Spurig was bei kleinem Volumen?',
        a: 'Wenn du < 100 Links / Monat machst, ist YOURLS okay. Sobald du Custom-Domain, QR-Codes, Print-Tracking oder mehrere Team-Member willst, wird YOURLS Setup-aufwendig. Spurig ist ab Tag 1 sofort einsatzbereit.',
      },
      {
        q: 'Kann ich von YOURLS migrieren?',
        a: 'Ja, wir importieren deine YOURLS-Datenbank (CSV-Export der yourls_url-Tabelle). Bestehende Links koennen via Redirect-Layer weitergeleitet werden.',
      },
    ],
  },

  {
    slug: 'rebrandly',
    name: 'Rebrandly',
    domain: 'rebrandly.com',
    oneLine: 'Italienisches Kurzlink-SaaS, Fokus auf Branded-Links + Custom-Domain',
    category: 'kurzlink',
    origin: 'Italien, San Francisco',
    founded: '2014',
    pricing: 'ab 13 $ / Monat (Starter)',
    ourPositioning:
      'Rebrandly ist eines der besseren Tools — aber teurer, mit US-Backend (AWS US-East), und QR-Codes erst im Premium-Plan. Fuer DACH-Teams gibt es einen direkteren Pfad.',
    dsgvoIssues: [
      'Backend auf AWS US-East — gleiche Schrems-II-Probleme wie Bitly',
      'Daten-Verarbeitungsvertraege auf Englisch, italienisches Recht',
      'Cookies werden gesetzt (Tracking-Pflicht via Banner)',
    ],
    whyMigrate: [
      'EU-Hosting (Frankfurt) statt AWS US',
      'QR-Codes bereits im Starter-Plan (bei Rebrandly Premium)',
      'Preis ca 30 % guenstiger bei vergleichbarem Feature-Set',
      'Deutscher AVV + Support',
      'Eingebautes Print-Tracking (Plakat-/Flyer-Standorte)',
    ],
    features: [
      { feature: 'EU-Hosting', spurig: 'Frankfurt', competitor: 'US-East' },
      { feature: 'QR-Codes inklusive', spurig: 'ab Start', competitor: 'ab Premium ($39/Mo)' },
      { feature: 'Custom-Domain', spurig: true, competitor: true },
      { feature: 'Preis pro Monat', spurig: PRICE_SPURIG, competitor: 'ab 13 $' },
      { feature: 'Print-Standort-Tracking', spurig: true, competitor: false },
      { feature: 'Deutscher Support', spurig: true, competitor: 'Englisch' },
    ],
    faqs: [
      {
        q: 'Ist Rebrandly DSGVO-besser als Bitly?',
        a: 'Etwas — italienische Firma mit DSGVO-Bewusstsein. Aber: Hosting auf AWS US bedeutet gleiches Schrems-II-Risiko. Echte DSGVO-Souveraenitaet kriegst du nur mit EU-Hosting.',
      },
      {
        q: 'Was bietet Spurig was Rebrandly nicht hat?',
        a: 'Print-Standort-Tracking (welche Plakatwand bringt welche Scans), eingebautes QR-Modul ab Start statt erst im Premium-Plan, und deutsche Brand-Pages.',
      },
    ],
  },

  {
    slug: 'short-io',
    name: 'Short.io',
    domain: 'short.io',
    oneLine: 'US-Kurzlink-Dienst mit Fokus auf Marketer & Affiliate-Teams',
    category: 'kurzlink',
    origin: 'USA, Estland',
    founded: '2017',
    pricing: 'ab 20 $ / Monat',
    ourPositioning:
      'Short.io ist Feature-stark fuer Affiliate-Marketer — aber Hosting in den USA + komplexe Pricing + QR-Codes erst in hoeheren Plaenen. Fuer reine DACH-B2B-Marketing-Teams ist Spurig der direktere Pfad.',
    dsgvoIssues: [
      'US-Hosting (gleiche Schrems-II-Story)',
      'Tracking-Cookies setzen Cookie-Banner-Pflicht voraus',
      'Daten-Schutz nach US-Recht primaer (EU-Klauseln im Anhang)',
    ],
    whyMigrate: [
      'Spurig EU-Hosting + Deutsches DPA',
      'Einfache Preisstruktur statt Short.io-Tier-Komplexitaet',
      'QR-Codes von Anfang an inklusive',
      'Fokus auf DACH-B2B statt globaler Affiliate-Scene',
    ],
    features: [
      { feature: 'EU-Hosting', spurig: true, competitor: false },
      { feature: 'QR-Codes inklusive', spurig: 'ab Start', competitor: 'ab 35 $/Mo' },
      { feature: 'Custom-Domain', spurig: true, competitor: true },
      { feature: 'Preis-Komplexitaet', spurig: '1 klarer Plan', competitor: '4 Tiers + Add-ons' },
      { feature: 'DACH-spezifische Features', spurig: true, competitor: false },
    ],
    faqs: [
      {
        q: 'Lohnt Short.io fuer DACH-Marketing?',
        a: 'Wenn du global Affiliate-Marketing machst: ja. Wenn du primaer DACH-B2B/Print/Gastro/Events machst: nein — du zahlst fuer Features die du nicht nutzt und akzeptierst US-Hosting unnoetig.',
      },
    ],
  },

  {
    slug: 'qr-code-monkey',
    name: 'QR Code Monkey',
    domain: 'qrcode-monkey.com',
    oneLine: 'Gratis QR-Code-Generator ohne Tracking',
    category: 'qr_code',
    origin: 'Deutschland (offiziell)',
    founded: '2014',
    pricing: 'Gratis',
    ourPositioning:
      'QR Code Monkey generiert Codes — aber das ist nur die halbe Miete. Ohne Tracking weisst du nie ob ein Plakat funktioniert, welche Stelle scannt wird oder ob deine Kampagne ROI bringt.',
    dsgvoIssues: [
      'Die generierten Codes verweisen direkt auf deine Ziel-URL ohne Tracking-Layer',
      'Keine Click-Statistik = kein Beleg fuer DSGVO-konformes Nutzungsverhalten',
      'Wenn du QR-Code Monkey + separates Tracking-Tool nutzt: 2x Datenfluss = mehr DSGVO-Komplexitaet',
    ],
    whyMigrate: [
      'QR-Generation + Tracking in EINEM Tool — keine Bastel-Loesung',
      'Echte Scan-Statistik pro Standort, pro Zeit, pro Geraet',
      'A/B-Tests zwischen Plakatwaenden moeglich',
      'Eigene Custom-Domain im QR-Code (sicherer + Brand-Trust)',
      'DSGVO-Layer in einem Dienst statt zwei',
    ],
    features: [
      { feature: 'QR-Code-Generation', spurig: true, competitor: true },
      { feature: 'Scan-Statistik', spurig: true, competitor: false, note: 'QRCM hat kein Tracking' },
      { feature: 'Standort-Tracking', spurig: true, competitor: false },
      { feature: 'Custom-Domain im QR', spurig: true, competitor: false },
      { feature: 'A/B-Tests', spurig: true, competitor: false },
      { feature: 'Preis', spurig: PRICE_SPURIG, competitor: 'Gratis (ohne Tracking)' },
    ],
    faqs: [
      {
        q: 'Wenn QR-Code Monkey gratis ist, wozu Spurig zahlen?',
        a: 'Weil QR-Codes ohne Tracking blind sind. Du druckst sie und hoffst dass es klappt. Mit Tracking weisst du nach 7 Tagen welcher Standort scannt wird und welcher Geld verbrennt. Bei 27 € pro Plakat-Standort kann Spurig sich nach 1 Kampagne refinanzieren.',
      },
      {
        q: 'Kann ich QR Code Monkey + extra Tracking-Tool nutzen?',
        a: 'Technisch ja — du machst QR mit URL "kunde.de/r/xyz" und betreibst eigene Redirect-Logik. Aber: mehr DSGVO-Komplexitaet, mehr Maintenance, kein gemeinsames Dashboard. Spurig macht beides in einem Schritt.',
      },
    ],
  },
];

export function getCompetitorBySlug(slug: string): Competitor | null {
  return COMPETITORS.find((c) => c.slug === slug) ?? null;
}
