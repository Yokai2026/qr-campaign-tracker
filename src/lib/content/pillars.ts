/**
 * Content-Pillars für Spurig — REDESIGN 2026 (V2 mit 10 Pillars).
 *
 * Spurig = Multi-Channel-Tracking-Tool: QR-Codes + Links + Kurzlinks + E-Mail-
 * Tracking + Kampagnen. Die Pillars decken die volle Bandbreite ab — von
 * Marketing-Alltag bis KI-Hype, von Designer-Themen bis B2B-Business-Hacks.
 *
 * 6 ursprüngliche Pillars (Authority + Storytelling):
 *   qr_realtalk        - Alltagsbeobachtungen rund um QR-Codes
 *   print_lebt         - Offline-Marketing-ROI (DOOH, Plakat, Direktmail)
 *   compliance_lite    - DSGVO + EU-Datenschutz ohne Juristendeutsch
 *   mittelstand        - Customer-Spotlights aus DACH-Mittelstand
 *   tracking_tricks    - Hidden Tracking-Methoden für Praktiker
 *   founder_diary      - David-First-Person-Build-in-Public
 *
 * 4 neue Pillars (Reichweite + Vielfalt):
 *   ai_marketing       - KI im Marketing, KI-Agenten, Automatisierung
 *   email_shortlinks   - E-Mail-Tracking + Kurzlinks + Newsletter
 *   creator_design     - Designer + Creator + Visual-Marketing
 *   everyday_marketing - Marketing-Alltag, Business-Hacks, Vorher/Nachher,
 *                        "Was viele falsch machen", "So sparst du Zeit/Geld"
 *
 * Tonalität durchgehend: locker, direkt, ehrlich, leicht humorvoll, marketing-
 * erfahren, neugierig auf KI. NICHT botmäßig. NICHT werblich. Tool wird
 * organisch eingewoben, nicht plump beworben.
 */

export type ContentCluster =
  | 'qr_realtalk'
  | 'print_lebt'
  | 'compliance_lite'
  | 'mittelstand'
  | 'tracking_tricks'
  | 'founder_diary'
  | 'ai_marketing'
  | 'email_shortlinks'
  | 'creator_design'
  | 'everyday_marketing'
  | 'geld_business'
  | 'ai_risk'
  | 'marketing_systems';

export const CLUSTERS: ContentCluster[] = [
  'qr_realtalk',
  'print_lebt',
  'compliance_lite',
  'mittelstand',
  'tracking_tricks',
  'founder_diary',
  'ai_marketing',
  'email_shortlinks',
  'creator_design',
  'everyday_marketing',
  'geld_business',
  'ai_risk',
  'marketing_systems',
];

export const CLUSTER_LABEL: Record<ContentCluster, string> = {
  qr_realtalk: 'QR-Realtalk',
  print_lebt: 'Print lebt',
  compliance_lite: 'DSGVO ohne Anwalt',
  mittelstand: 'Mittelstand-Stories',
  tracking_tricks: 'Tracking-Tricks',
  founder_diary: 'Founder-Tagebuch',
  ai_marketing: 'KI & Automatisierung',
  email_shortlinks: 'E-Mail & Kurzlinks',
  creator_design: 'Designer & Creator',
  everyday_marketing: 'Marketing-Alltag',
  geld_business: 'Geld & Business',
  ai_risk: 'KI-Recht & Risiken',
  marketing_systems: 'Online & Offline Marketing',
};

export const CLUSTER_DESCRIPTION: Record<ContentCluster, string> = {
  qr_realtalk:
    'IM SCOPE: QR-Code-Stories aus dem DACH-Alltag — Bratwurst, Hochzeitseinladung, Apotheke, Bestattungsinstitut, Hostel-WLAN, Pizza, Friedhof, Tankstelle. Eye-Tracking-Studien zu QR-Größe und Position, Scan-Verhalten verschiedener Smartphones, Print-Material-Wahrheiten (Glanzpapier vs Matt, Regen, Sonnenlicht), QR-Design-Anti-Patterns, Psychologie des Scannens. TOOL-BEZUG NATÜRLICH: Spurig trackt jeden Scan + Position + Gerät — "ein QR-Code ist nicht nur ein Bild, sondern ein Einstiegspunkt in Daten". NICHT IM SCOPE: Bitly-Pricing, reine Print-ROI-Statistiken, DSGVO-Verträge.',
  print_lebt:
    'IM SCOPE: Print/Offline-Marketing-ROI mit konkreten DACH-Zahlen. Plakate, Flyer, Postkarten, Visitenkarten, Direktmailing, Litfaßsäulen, U-Bahn-Werbung, Bus-Wartehäuschen, Tisch-Aufsteller, Eventstände. Studien aus Hamburg/Düsseldorf/Wien. Pro-Print UND ehrliche Anti-Print-Argumente. TOOL-BEZUG NATÜRLICH: Print + Spurig-QR-/Kurzlink = messbar — "wenn du nicht misst, rätst du". NICHT IM SCOPE: konkrete QR-Code-Design-Tipps (→ qr_realtalk), DSGVO-Fragen (→ compliance_lite).',
  compliance_lite:
    'IM SCOPE: DSGVO + EU-Datenschutz für Nicht-Juristen. AVV-Verträge, Schrems II 2026, US-Cloud-Tools im Check (Cloudflare, GA4, Hotjar, Calendly, Mailchimp, Slack, Notion). Aktuelle Bußgeld-Cases aus DACH-Aufsichtsbehörden. EU-AI-Act-Fakten. Cookie-Banner-Reality. Datenschutz-Audit-Anekdoten. TOOL-BEZUG NATÜRLICH: Spurig = EU-hosted, DSGVO-baseline, kein US-Cloud. NICHT IM SCOPE: Print-Marketing-ROI, QR-Code-Design, Founder-Stories.',
  mittelstand:
    'IM SCOPE: Customer-Spotlights aus DACH-Mittelstand. KONKRETE Personen + Branche + Stadt: Friseur Leipzig, Schreinerei Bayerischer Wald, Optikerin Wien, Tierarzt Zürich, Apotheker Hannover, Yoga-Studio Köln, Tattoo-Studio Berlin, Foodtruck München, Brauerei Franken, Imkerei Schwarzwald. Wie sie Marketing machen, wo es scheitert, was klappt. JEDE Idee MUSS eine konkrete Branche+Stadt-Kombo enthalten. TOOL-BEZUG NATÜRLICH: KMU nutzt Spurig für QR-/Link-/Mail-Tracking ohne Bitly-Enterprise-Pricing. NICHT IM SCOPE: David-Founder-Stories.',
  tracking_tricks:
    'IM SCOPE: Hidden Tracking-Methoden für Praktiker. UTM-Schema-Hacks, Multi-Touch-Attribution einfach, Cookie-less Tracking 2026, Server-Side-Pixel-Setup, Offline-Online-Bridge, Heatmap-Tricks, Newsletter-Klick-Forensik, Conversion-Pfad-Detektivarbeit. Spurig-Features als praktische Anwendung. JEDE Idee = ein konkreter umsetzbarer Trick. TOOL-BEZUG NATÜRLICH: "Tracking macht aus Bauchgefühl bessere Entscheidungen" — Spurig zeigt jeden Scan/Klick/Open ohne Cookie-Banner-Drama. NICHT IM SCOPE: Founder-Stories, Customer-Spotlights.',
  founder_diary:
    'IM SCOPE: David-Erste-Person-Build-in-Public. PFLICHT: Ich-Form. Konkrete Mini-Szene aus David-Solopreneur-Alltag. Pricing-Wechsel, Features die niemand wollte, MRR-Updates mit frischen Zahlen, Vercel-Bill-Schmerz, Customer-Support-Peinlichkeiten, Cousin-fragt-was-machst-du, Burnout-Mikro-Momente, Sales-Call-Fails, Stack-Entscheidungen, KI-Workflow-Experimente. TOOL-BEZUG: organisch aus David-Sicht ("Ich hab das gerade in Spurig eingebaut"). NICHT IM SCOPE: allgemeine Marketing-Tipps, QR-Code-Design, Customer-Stories.',
  ai_marketing:
    'IM SCOPE: KI im Marketing-Alltag — was wirklich Zeit spart vs Hype. **Kern-Tools 2026**: ChatGPT (Conversational/Multi-Modal), Claude Code (komplexe Tasks/Code/Analysen), Gemini (Datenanalyse/Web-Recherche), n8n (Self-Hosted AI-Agent-Plattform mit nativen Agent-Nodes, LangChain, RAG, Memory). Auch: DeepL, Midjourney, Sora für Localization + Visuals. KI-Agenten die Aufgaben übernehmen (Newsletter-Variants, Bild-Crops, Social-Posts, Reports). Prompt-Engineering-Best-Practices für Marketing-Kontext. KI-Aha-Momente vs KI-Fails ("Ich dachte ChatGPT spart mir Zeit — bis ich gemerkt habe..."). Welche KI-Tools 2026 echtes Geld sparen. KI + Tracking = Closed-Loop (Spurig-Daten in KI-Analyse). TOOL-BEZUG NATÜRLICH: Spurig-API + Webhooks integrieren in n8n-Flows. WICHTIG: n8n bevorzugen (self-host, EU-souverän, AI-first), Make.com nur sekundär oder bewusst kontrastieren (Make = visueller Einstieg, n8n = professional/scalable). NICHT IM SCOPE: reine Tech-Tutorials ohne Marketing-Bezug, AI-Coding-Themen.',
  email_shortlinks:
    'IM SCOPE: E-Mail-Marketing + Kurzlinks als Daten-Punkt. Newsletter-Klick-Tracking, Open-Rate-Reality (Gmail-Proxy-Problem, Apple-MPP), Subject-Line-A/B-Tests, Personalisierung, Cold-Email-Compliance, Kurzlink-Design (spurig.com/x vs bitly), Vanity-URLs, QR + Link + Mail als 3-Kanal-Setup, Drip-Sequences ohne 1.000€/Monat-Mautic, Bounce-Management, DOI-Reality. TOOL-BEZUG NATÜRLICH: Spurig-E-Mail-Tracking inkl. Klick-Forensik, Spurig-Kurzlinks mit eigener Domain. "Ein Kurzlink ist nicht nur kürzer, sondern messbarer." NICHT IM SCOPE: reine Email-Design-Tipps, Mail-Provider-Vergleiche ohne Tracking-Bezug.',
  creator_design:
    'IM SCOPE: Designer + Creator + Visual-Marketing. Wie Designer für Kampagnen-Assets denken — was tatsächlich tracked, was nicht. Branding-Konsistenz auf Print + Digital. Asset-Bau für Multi-Channel-Tests. Figma/Canva/Adobe-Workflow für KMU. Typografie auf Print + QR-Code-Design. Farbpsychologie auf Plakaten. Creator-Economy für DACH (Newsletter-Sponsorships, Affiliate-Tracking). Asset-Performance messen statt raten. TOOL-BEZUG NATÜRLICH: Designer baut visuell perfekten Flyer + Spurig misst was funktioniert. NICHT IM SCOPE: reine Tutorial-Themen wie "Wie nutze ich Figma".',
  everyday_marketing:
    'IM SCOPE: Marketing-Alltag, Business-Hacks, "Was viele falsch machen", "So sparst du Zeit/Geld", Vorher/Nachher-Cases, kleine Aha-Tricks, Kostenfallen, Tool-Audit-Geschichten, Setup-Hacks die 80% der KMU nicht kennen. Echte Mehrwert-Beiträge für Unternehmer + Marketer. Wie aus Misserfolg + Tracking ein Plus wurde. Konkrete Aufwand/Nutzen-Vergleiche. TOOL-BEZUG NATÜRLICH: Spurig spart 200€/Monat gegenüber Bitly Enterprise + ist messbar. "Tracking macht aus Bauchgefühl bessere Entscheidungen." NICHT IM SCOPE: Branche-spezifische Customer-Stories (→ mittelstand), reine David-Founder-Erlebnisse (→ founder_diary), reine Geld-/Cashflow-Themen (→ geld_business).',
  ai_risk:
    'IM SCOPE: KI-Recht + Risiken + Sicherheit + Compliance — modern, verständlich, OHNE Anwaltsdeutsch. Konkrete Sub-Topics: (1) **EU AI Act 2026** — was Marketer wirklich beachten müssen, ab wann verbindlich, Hochrisiko-Systeme. (2) **DSGVO + KI** — wenn ChatGPT/Claude/Gemini Kundendaten sehen, was darf rein, was nicht. (3) **Urheberrecht bei AI-Content** — wem gehört von Sora/Midjourney generierter Content, kommerziell nutzbar. (4) **Haftung bei KI-Fehlern** — wer zahlt wenn n8n-Agent falsche Mail an Kunden schickt, ChatGPT halluziniert Pricing-Fehler. (5) **Hallucinations & False Data** — wie KI-Modelle Fakten erfinden, Beispiele aus Marketing-Praxis. (6) **AI-Agent-Security** — KI-Agenten haben API-Zugriff, was bedeutet das für Datensicherheit. (7) **Kundendaten in ChatGPT** — was Microsoft/OpenAI/Anthropic mit Eingaben machen, Enterprise vs Privat. (8) **Deepfakes im Marketing** — was rechtlich + ethisch geht. (9) **Sichere AI-Workflows** — wie n8n-Self-Hosting + EU-LLMs (Mistral/Aleph Alpha) DSGVO-Risiko reduzieren. (10) **Transparenz-Pflicht** — wann müssen Marketing-Texte als KI-generiert gekennzeichnet werden. (11) **Risiken vs Chancen** — ehrliche Balance, KEIN Panikmodus, sondern smart navigieren. (12) **Praxis-Cases** — echte Bußgelder, Urheberrechts-Klagen, ChatGPT-Datenleaks bei großen Firmen. (13) **Mythen vs Realität** — was wirklich problematisch ist vs was Hype-Panik ist. TONALITÄT: locker + intelligent + ehrlich, NICHT panisch. David spricht über AI-Risiken wie jemand der täglich damit arbeitet — als smartes Risikomanagement, nicht als Bremsklotz. TOOL-BEZUG NATÜRLICH: Spurig = EU-hosted, DSGVO-baseline, n8n-Webhook-Integration ohne US-Cloud-Risiko. NICHT IM SCOPE: reine DSGVO-Themen ohne KI-Bezug (→ compliance_lite), reine AI-Tool-Reviews ohne Risk-Aspect (→ ai_marketing).',
  geld_business:
    'IM SCOPE: GELD-THEMEN für KMU + Marketer + Solopreneurs. Sowohl SPAREN als auch VERDIENEN. Konkrete Sub-Topics: (1) Cashflow-Optimierung für KMU — Working-Capital-Management, Debitorenmanagement, Rechnungsstellung-Hacks (PwC-Studie 2026: €75 Mrd Potenzial in DACH-Unternehmen). (2) Marketing-Budget-ROI — Rolling-Forecast statt Jahresbudget, Streuverluste reduzieren, CAC-Reduktion mit Tracking-Daten. (3) SaaS-Stack-Audit — welche Tools wirklich nutzen, Subscription-Audits, Tool-Konsolidierung, Lifetime-Deals vs Subscriptions. (4) Pricing-Strategien — Value-Based vs Cost-Plus, Anchor-Pricing, Pricing-Pivots, Preiserhöhung ohne Churn. (5) Fördermittel & Grants für DACH-KMU 2026 — Digitalisierungs-Förderung, BAFA, KfW, INVEST-Zuschuss, EXIST. (6) Revenue-Growth ohne Wachstum-um-jeden-Preis — Conversion-Optimierung, Upsell, Cross-Sell, Retention-Tricks. (7) KI-driven Cost-Saving — wie KI repetitive Aufgaben automatisiert + reale Stundensätze einspart. (8) Co-Marketing-Hacks — Cross-Promotion, geteilte Kampagnen, Affiliate-Setups, Partner-Newsletter. (9) Steueroptimierung für Selbstständige + KMU — was Steuerberater nicht erzählen, GWG, IAB, Reisekosten. (10) Werte-Diskussion — "Wie viel ist 1 Stunde deiner Zeit wirklich wert?", Stundensatz-Kalkulation für Solo-Founder. TOOL-BEZUG NATÜRLICH: Spurig zeigt was Marketing-Euro wirklich bringen — Tracking als CFO-Argument. "Tracking macht aus Bauchgefühl bessere Entscheidungen." NICHT IM SCOPE: persönliche David-Founder-Geld-Stories (→ founder_diary), Branche-spezifische Cases (→ mittelstand), reine KI-Tool-Reviews ohne Cost-Aspect (→ ai_marketing).',
  marketing_systems:
    'IM SCOPE: STRATEGISCHER POSITIONIERUNGS-CLUSTER. David versteht Online + Offline Marketing zusammen — Flyer, Plakate, Visitenkarten, QR-Codes, Schaufenster, Gutscheine, Events, Messen ↔ Websites, Landingpages, Newsletter, Kurzlinks, Tracking, CRM, Funnels, KI-Automation. KERNKOMPETENZ: die komplette Strecke sehen — Plakat → QR → Landingpage → Angebot → Eintrag → Mail → Termin → Tracking-Auswertung. Sub-Topics: (1) Print-Marketing messbar machen (Flyer + QR + Landingpage als geschlossener Loop). (2) Offline-Touchpoints → Online-Funnel (Schaufenster, Visitenkarte, Eventstand, Gutschein als Funnel-Einstieg). (3) QR-Codes, Kurzlinks, Landingpages als Einheit denken. (4) Wie lokale Unternehmen Offline-Kontakte digital weiterführen (Newsletter, Buchung, WhatsApp, Retargeting). (5) Multi-Touch-Customer-Journey für KMU ohne Enterprise-Stack. (6) KI-Automation für einfache Marketing-Aufgaben (Newsletter-Varianten, Asset-Quality-Check, Report-Zusammenfassungen) — aber Klarheit vor Automation. (7) Vertrauen offline → Abschluss online. (8) Klare Angebote, klare Fragen, klare Next-Steps. (9) Mini-Tests statt großer Launches. (10) Werbebudget sinnvoller einsetzen mit Tracking-Daten. (11) Marketing als wiederholbares System, nicht als einzelner Post. (12) blog_format="online-offline-bridge" für Ideen die explizit die Offline↔Online-Brücke zeigen. TONALITÄT: realistisch, sympathisch, leicht provokant, bodenständig, professionell — NIE Guru, NIE salesy, KEINE Reich-werden-Versprechen. CTAs subtil: "Marketing-Check anfragen", "Idee gemeinsam prüfen", "Kampagne analysieren lassen", "Mini-Audit starten", "System gemeinsam aufbauen", "Tracking-Setup besprechen". TOOL-BEZUG NATÜRLICH: Spurig als das Mess-Backbone für solche Systeme — verbindet Offline-Print mit Online-Conversion. POSITIONIERUNG: zeigt dass David Marketing als kompletten Kundenweg versteht — von der ersten physischen Wahrnehmung bis zur digitalen Buchung. NICHT IM SCOPE: reine Tool-Reviews (→ ai_marketing), reine Branchen-Cases (→ mittelstand), persönliche Founder-Erlebnisse ohne System-Lehre (→ founder_diary).',
};

/**
 * Pro Pillar empfohlene Niche-Industries / Persona / Settings (für Idea-
 * Generierung). AI rotiert zwischen diesen → mehr Diversität.
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
  ai_marketing: [
    'Marketing-Manager mit ChatGPT-Workflow', 'Solopreneur mit n8n-Self-Host-Setup',
    'Agentur die KI-Agenten einsetzt', 'Newsletter-Schreiberin mit Claude Code',
    'KMU-Inhaber der Reports von Gemini generieren lässt', 'Performance-Marketer',
    'Content-Creator mit Sora/Midjourney', 'B2B-SaaS-Founder mit n8n-AI-Agent-Stack',
    'Builder der ChatGPT + Claude Code + Gemini parallel nutzt',
    'AI-Workflow-Designer (LangChain/RAG/Memory)', 'Indie-Hacker mit DIY-Automatisierung',
  ],
  email_shortlinks: [
    'Newsletter-Betreiber 1k-50k Abos', 'Cold-Outreach-Solopreneur',
    'B2B-Sales-Team', 'E-Commerce-Newsletter', 'Affiliate-Marketer mit Vanity-Domain',
    'Community-Manager mit Drip-Funnels', 'SaaS-Lifecycle-Email-Owner',
    'Podcast-Host mit Newsletter',
  ],
  creator_design: [
    'Freelance-Designerin', 'In-House-Designer KMU', 'Branding-Agentur',
    'Print-Designer aus Hamburg', 'Canva-Power-User', 'Figma-Designerin',
    'Newsletter-Designer', 'UGC-Creator', 'YouTuber DACH 10k-100k Abos',
    'Indie-Podcaster',
  ],
  everyday_marketing: [
    'Solo-Marketer', 'Marketing-Manager KMU 5-50 Mitarbeiter',
    'Inhaber Handwerksbetrieb', 'E-Commerce-Owner 10k-500k Umsatz',
    'Gastronom mit Marketing-Budget', 'Eventbüro', 'Coach mit Online-Programm',
    'Vertriebs-Leiter', 'Marketing-Praktikant in der Agentur',
  ],
  geld_business: [
    'KMU-CFO 50-200 Mitarbeiter', 'Solopreneur mit 6-stelligem Umsatz',
    'Marketing-Manager mit Budget-Verantwortung', 'Geschäftsführer Handwerk',
    'E-Commerce-Owner der SaaS-Stack reduziert', 'Bootstrapped-Founder',
    'Steuerberater für Selbstständige', 'Vertriebsleiter mit Pricing-Hoheit',
    'Förder-Beraterin', 'Working-Capital-Optimierer in Mittelstand',
    'Co-Marketing-Agentur', 'Pricing-Consultant',
  ],
  ai_risk: [
    'Marketing-Manager mit ChatGPT-Nutzung', 'KMU-Inhaber der Claude für Kundendaten nutzt',
    'Datenschutzbeauftragter im Mittelstand', 'Compliance-Officer KMU',
    'AI-Builder mit n8n-Self-Host-Setup', 'Agentur die KI-Content für Kunden schreibt',
    'Designer der mit Midjourney/Sora kommerziell arbeitet',
    'Solopreneur der ChatGPT für Vertragsentwürfe nutzt',
    'IT-Verantwortlicher der KI-Agent-Pipeline absichert',
    'Newsletter-Schreiber mit AI-Content',
    'B2B-SaaS-Founder der Kundendaten in OpenAI/Anthropic einspeist',
    'Datenschutz-Anwalt für SaaS', 'Customer-Success-Manager mit KI-Assistant',
  ],
  marketing_systems: [
    'Inhaber lokales Geschäft (Friseur, Blumenladen, Studio, Eisdiele)',
    'Solopreneur mit Beratungsgeschäft', 'B2B-Service-Anbieter Köln-Hamburg-Wien',
    'Marketing-Manager KMU 5-50 Mitarbeiter', 'Startup-Founder mit Pre-Seed-Budget',
    'Handwerksbetrieb mit Print-Mailing-Erfahrung', 'Coaching-Praxis mit Newsletter',
    'Agentur-Owner der KI-Workflows integriert', 'Geschäftsführer Mittelstand mit Marketing-Frust',
    'Vertriebsleiter mit Tracking-Lücke', 'Eventbüro / Foodtruck / Pop-Up-Anbieter',
    'Newsletter-Betreiber 500-5000 Abos', 'Indie-Founder ohne VC-Druck',
    'Designer der Kampagnen-Assets messbar machen will',
  ],
};
