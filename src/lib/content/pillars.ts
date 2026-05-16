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
    'Echte QR-Code-Stories aus dem DACH-Alltag — die absurden, peinlichen, lustigen und unerwarteten Sichtungen: QR auf der Bratwurst, auf der Hochzeitseinladung, im Apothekenrezept, am Bestattungsinstitut, im Hostel-WLAN, auf der Pizza. Eye-Tracking-Studien, Design-Wahrheiten, Platzierungs-Daten. Was wirklich gescannt wird — und was nicht. Plus: das psychologische Spiel hinter dem Scan-Verhalten.',
  print_lebt:
    'Pro-Print gegen die Digital-Marketing-Mehrheit. Warum Plakat, Flyer, Postkarte, Visitenkarte und Direktmailing 2026 zurück sind — mit konkreten DACH-Zahlen, Customer-Cases, Print-vs-Digital-ROI-Vergleichen, Studien aus Hamburg/Düsseldorf/Wien. Provokante Takes für die Pro-Print-Bubble + ehrliche Anti-Print-Argumente für Glaubwürdigkeit.',
  compliance_lite:
    'DSGVO + EU-Datenschutz in Klartext, nicht in Paragrafen. Aktuelle Bußgeld-Cases, US-Cloud-Tools im DSGVO-Check (Cloudflare, GA4, Hotjar, Calendly, Mailchimp), AVV-Vertrags-Geschichten, Schrems-II-Realität für Mittelständler, Datenschutz-Anekdoten (Schwiegermutter-Email, Datenschutz-Audit-Reality), neue EU-AI-Act-Fakten 2026.',
  mittelstand:
    'Underdog-Customer-Stories aus dem DACH-Mittelstand: Friseur in Leipzig, Schreinerei im Bayerischen Wald, Optikerin in Wien, Tierarzt in Zürich, Apotheker in Hannover, Yoga-Studio in Köln, Tattoo-Studio in Berlin. Wie sie wirklich Marketing machen, was funktioniert (oder peinlich scheitert), und welche Tracking-Hacks zu ihrem Budget passen. Echte Zahlen, echte Sätze, echte Personen.',
  tracking_tricks:
    'Hidden Tracking-Hacks für Praktiker: 1 QR pro Tag statt pro Kampagne (Wochentag-Muster), UTM-Strategien die niemand kennt, Multi-Touch-Attribution für Solopreneurs, Cookie-less Tracking 2026, Server-Side-Pixel-Setup einfach, Offline-Online-Bridge-Tricks, "wie messe ich was ich nicht messen kann"-Probleme, Heatmap-Hacks, Conversion-Pfad-Detektivarbeit.',
  founder_diary:
    'Solopreneur-Realität pur — Davids Build-in-Public-Journey: Pricing-Wechsel die schiefgingen, Features die niemand wollte, MRR-Updates mit ehrlichen Zahlen, Cousin-fragt-was-machst-du-eigentlich-Momente, Vercel-Bill-Schmerz, Customer-Support-Peinlichkeiten, Burnout-Mikro-Momente, der eine Sales-Call wo alles schiefging, Konkurrenz-Beobachtungen. Müde-ehrlich, selbstironisch, kein Hype.',
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
