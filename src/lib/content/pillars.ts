/**
 * Content-Pillars für Spurig — REDESIGN 2026.
 *
 * 6 Pillars die für Social-Media-Virality + B2B-SaaS-Authority gleichermassen
 * funktionieren. Jedes Pillar deckt eine andere "Mood" ab:
 *
 *   qr_realtalk     — Entertainment + Aha-Moment ("Alltagsbeobachtung")
 *   print_lebt      — Contrarian + Data ("gegen den Digital-Hype")
 *   compliance_lite — Educational + Schadenfreude ("DSGVO ohne Anwaltsdeutsch")
 *   mittelstand     — Community + Customer-Spotlight ("echte DACH-SMB-Stories")
 *   tracking_tricks — Tactical + Hidden-Hack ("Methoden, die niemand kennt")
 *   founder_diary   — Vulnerability + Build-in-Public ("Solopreneur-Realität")
 *
 * Ziel: Leser:innen sollen sich in den Blog VERLIEBEN — nicht nur lesen.
 * Mischung aus Entertainment + Education + Authenticity.
 */

export type ContentCluster =
  | 'qr_realtalk'
  | 'print_lebt'
  | 'compliance_lite'
  | 'mittelstand'
  | 'tracking_tricks'
  | 'founder_diary';

export const CLUSTERS: ContentCluster[] = [
  'qr_realtalk',
  'print_lebt',
  'compliance_lite',
  'mittelstand',
  'tracking_tricks',
  'founder_diary',
];

export const CLUSTER_LABEL: Record<ContentCluster, string> = {
  qr_realtalk: 'QR-Realtalk',
  print_lebt: 'Print lebt',
  compliance_lite: 'DSGVO ohne Anwalt',
  mittelstand: 'Mittelstand-Stories',
  tracking_tricks: 'Tracking-Tricks',
  founder_diary: 'Founder-Tagebuch',
};

export const CLUSTER_DESCRIPTION: Record<ContentCluster, string> = {
  qr_realtalk:
    'IM SCOPE: QR-Code-Stories aus dem DACH-Alltag — Bratwurst, Hochzeitseinladung, Apotheke, Bestattungsinstitut, Hostel-WLAN, Pizza, Friedhof, Tankstelle. Eye-Tracking-Studien zu QR-Größe und Position, Scan-Verhalten verschiedener Smartphones, Print-Material-Wahrheiten (Glanzpapier vs Matt, Regen, Sonnenlicht), QR-Design-Anti-Patterns, Psychologie des Scannens. NICHT IM SCOPE: Bitly-Pricing, Print-ROI-Statistiken, DSGVO-Verträge, Founder-Diary-Inhalte — dafür sind andere Pillars zuständig.',
  print_lebt:
    'IM SCOPE: Print/Offline-Marketing-ROI mit konkreten DACH-Zahlen. Plakat-Standorte, Flyer-Aktionen, Postkarten, Visitenkarten, Direktmailing, Litfaßsäulen, U-Bahn-Werbung, Bus-Wartehäuschen, Tisch-Aufsteller. Print-vs-Digital-Vergleiche. Studien aus Hamburg/Düsseldorf/Wien. Pro-Print-Argumente UND ehrliche Anti-Print. NICHT IM SCOPE: konkrete QR-Code-Design-Tipps (→ qr_realtalk), DSGVO-Fragen (→ compliance_lite), Tracking-Methoden (→ tracking_tricks).',
  compliance_lite:
    'IM SCOPE: DSGVO + EU-Datenschutz für Nicht-Juristen. AVV-Verträge, Schrems II 2026, US-Cloud-Tools im Check (Cloudflare, GA4, Hotjar, Calendly, Mailchimp, Slack, Notion). Aktuelle Bußgeld-Cases aus DACH-Aufsichtsbehörden. EU-AI-Act-Fakten. Cookie-Banner-Reality. Datenschutz-Audit-Anekdoten. Schwiegermutter-DSGVO-Email-Comedy. NICHT IM SCOPE: Print-Marketing-ROI (→ print_lebt), QR-Code-Design (→ qr_realtalk), Founder-Mein-Steuerberater-Geschichten (→ founder_diary).',
  mittelstand:
    'IM SCOPE: Customer-Spotlights aus DACH-Mittelstand. KONKRETE Personen + Branche + Stadt: Friseur Leipzig, Schreinerei Bayerischer Wald, Optikerin Wien, Tierarzt Zürich, Apotheker Hannover, Yoga-Studio Köln, Tattoo-Studio Berlin, Foodtruck München, Brauerei Franken, Imkerei Schwarzwald. Wie sie Marketing machen, wo es scheitert, was klappt. JEDE Idee MUSS eine konkrete Branche+Stadt-Kombo enthalten. NICHT IM SCOPE: David-Founder-Stories (→ founder_diary), abstrakte Marketing-Tipps, Bitly/Tool-Comparisons.',
  tracking_tricks:
    'IM SCOPE: Hidden Tracking-Methoden für Praktiker. 1 QR pro Tag statt pro Kampagne, UTM-Schema-Hacks, Multi-Touch-Attribution einfach, Cookie-less Tracking 2026, Server-Side-Pixel-Setup, Offline-Online-Bridge, Heatmap-Tricks, Newsletter-Klick-Forensik, Conversion-Pfad-Detektivarbeit. JEDE Idee = ein konkreter umsetzbarer Trick. NICHT IM SCOPE: persönliche Founder-Geschichten (→ founder_diary), Customer-Spotlights (→ mittelstand), reine DSGVO-Fragen (→ compliance_lite).',
  founder_diary:
    'IM SCOPE: David-Erste-Person-Build-in-Public. PFLICHT: Ich-Form. Konkrete Mini-Szene aus David-Solopreneur-Alltag. Pricing-Wechsel, Features die niemand wollte, MRR-Updates mit frischen Zahlen, Vercel-Bill-Schmerz, Customer-Support-Peinlichkeiten, Cousin-fragt-was-machst-du, Burnout-Mikro-Momente, Sales-Call-Fails, Konkurrenz-Beobachtungen, Stack-Entscheidungen. NICHT IM SCOPE: allgemeine Marketing-Tipps, QR-Code-Design, Print-Statistiken, Customer-Stories (→ mittelstand). Alles ANDERE als persönliche David-Story = falscher Pillar.',
};

/**
 * Pro Pillar empfohlene Niche-Industries (für Idea-Generierung).
 * AI rotiert zwischen diesen Branchen → mehr Diversität, weniger Print-Trampelpfad.
 */
export const CLUSTER_NICHE_INDUSTRIES: Record<ContentCluster, string[]> = {
  qr_realtalk: [
    'Bratwurststand', 'Hochzeitsplaner', 'Bestattungsinstitut', 'Apotheke',
    'Tierarzt', 'Foodtruck', 'Eisdiele', 'Brauerei', 'Tattoo-Studio',
    'Friseur', 'Hostel', 'Berliner Späti', 'Hochzeit', 'Restaurant',
  ],
  print_lebt: [
    'Schreinerei', 'Tischlerei', 'Floristen', 'Optiker', 'Sanitätshaus',
    'Schneiderei', 'Anwaltskanzlei', 'Steuerberater', 'Versicherung',
    'Immobilienmakler', 'Autohaus', 'Bäckerei',
  ],
  compliance_lite: [
    'Marketing-Agentur', 'Mittelständler 50-200 Mitarbeiter', 'Online-Shop',
    'B2B-SaaS', 'Verein', 'Bildungsanbieter', 'Coaching-Praxis',
    'Arztpraxis', 'Kanzlei',
  ],
  mittelstand: [
    'Friseur Leipzig', 'Schreinerei Bayerischer Wald', 'Optikerin Wien',
    'Tierarzt Zürich', 'Apotheker Hannover', 'Yoga-Studio Köln',
    'Tattoo-Studio Berlin', 'Foodtruck München', 'Brauerei Franken',
    'Floristin Hamburg', 'Imkerei Schwarzwald', 'Co-Working Stuttgart',
  ],
  tracking_tricks: [
    'Performance-Marketer', 'Growth-Manager', 'Affiliate-Marketer',
    'Newsletter-Betreiber', 'Podcast-Host', 'E-Commerce-Owner',
    'Solo-Founder', 'Agency-Owner',
  ],
  founder_diary: [
    'Solo-Founder', 'Indie-Hacker', 'Bootstrapper', 'Build-in-Public',
    'DACH-SaaS', 'No-VC-Founder',
  ],
};
