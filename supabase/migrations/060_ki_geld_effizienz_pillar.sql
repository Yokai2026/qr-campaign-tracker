-- ============================================
-- 15. Pillar: ki_geld_effizienz (KI, Geld & Effizienz)
-- ============================================
-- Komplementaerer Wirtschafts-Cluster zu ai_marketing + geld_business:
--
--   ai_marketing      → KI-Tools im Marketing-Alltag, was Zeit spart vs Hype
--   geld_business     → Geld-Themen (Pricing, Cashflow, Foerder, ROI)
--   ki_geld_effizienz → KI als Effizienz-Hebel: wo spart KI Zeit/Geld im
--                        Unternehmen, Prozess-Automation, Lead-Follow-up,
--                        Tool-Audit, KI-ROI realistisch berechnen
--
-- Kernbotschaft: "KI verdient kein Geld von allein. Aber sie kann Systeme
-- bauen, die Zeit sparen, Kosten senken und bessere Entscheidungen
-- ermoeglichen."
-- ============================================

-- 1) Cluster-Constraint erweitern
alter table public.content_ideas
  drop constraint if exists content_ideas_cluster_check;

alter table public.content_ideas
  add constraint content_ideas_cluster_check
  check (cluster in (
    'qr_realtalk', 'print_lebt', 'compliance_lite', 'mittelstand',
    'tracking_tricks', 'founder_diary', 'ai_marketing', 'email_shortlinks',
    'creator_design', 'everyday_marketing', 'geld_business', 'ai_risk',
    'marketing_systems', 'digital_marketing', 'ki_geld_effizienz'
  ));

-- 2) Seed-Ideen (32 Stueck)

-- ---- A) User-Vorlagen (12) ----
insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'ki_geld_effizienz',
  'KI spart kein Geld. Schlechte Prozesse kosten Geld.',
  'Bevor KI hilft, muss klar sein, wo im Unternehmen Zeit verloren geht.',
  'KI als Verstaerker — sie automatisiert, was sie sieht. Wenn der Prozess kaputt ist, automatisiert sie Chaos. Drei Diagnose-Fragen vor jedem KI-Projekt: (1) Welche Aufgabe wiederholt sich? (2) Wer macht sie heute? (3) Was sind die echten Kosten in Stunden? Praxis-Beispiel aus dem Mittelstand.',
  'Mittelstand, Startups, lokale Unternehmen, kleine Teams',
  'KI-Prozess-Check anfragen',
  'observation',
  'ki-geld-effizienz',
  array['ai_marketing','geld_business','everyday_marketing'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'Der teuerste Mitarbeiter ist der manuelle Ablauf.',
  'Nicht Menschen sind das Problem. Wiederholbare Aufgaben ohne System sind das Problem.',
  'Die haeufigsten Zeit-Killer in KMU: E-Mails sortieren, Leads nachfassen, Angebote vorbereiten, Kundendaten uebertragen, Reports manuell schreiben. Mini-Audit-Template: wo verlieren wir 5+ Stunden pro Woche? Jeweils KI-Hebel mit realistischem Aufwand/Nutzen.',
  'Dienstleister, lokale Unternehmen, Praxen, Agenturen',
  'Automationspotenzial prüfen',
  'mistake',
  'ki-geld-effizienz',
  array['ai_marketing','geld_business'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'Wie viel kostet dich eine unbeantwortete Anfrage?',
  'Viele Unternehmen verlieren nicht an Konkurrenz, sondern an zu spätem Nachfassen.',
  'Lead-Verlust-Rechnung: Studio mit 30 Anfragen/Monat, 40% kommen nie zur Antwort, durchschnittlicher Customer-Lifetime 800 EUR → 9.600 EUR verloren pro Monat. Mini-Follow-up-Stack: WhatsApp-Auto-Reply + Mail-Trigger nach 24h + Kalendly-Buchung. Bei 50 EUR/Monat Tool-Kosten ROI in Tagen.',
  'Studios, Praxen, lokale Dienstleister, B2B-Unternehmen',
  'Follow-up-System besprechen',
  'mistake',
  'ki-geld-effizienz',
  array['digital_marketing','email_shortlinks','geld_business'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'KI kann Umsatz vorbereiten. Verkaufen musst du trotzdem.',
  'Automatisierung ersetzt kein Vertrauen — aber sie kann den richtigen Moment vorbereiten.',
  'KI-Hebel im Vertriebs-Vorlauf: Angebots-Drafts auf Basis Lead-Daten, automatische Recherche zur Firma vor dem Call, Nachfass-Mails mit konkretem Kontext statt Template. Was Mensch + KI gemeinsam besser machen als beide allein. Konkrete n8n-Setup-Skizze.',
  'Selbstständige, Vertriebsteams, Agenturen, Startups',
  'Vertriebsprozess prüfen',
  'ai',
  'ki-geld-effizienz',
  array['ai_marketing','digital_marketing'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'Deine Tools kosten mehr als dein Problem.',
  'Viele Unternehmen zahlen für Software, bevor sie ihren Prozess verstanden haben.',
  'SaaS-Abo-Audit fuer KMU: durchschnittliches 20-MA-Unternehmen zahlt 4.800 EUR/Jahr fuer Tools die niemand nutzt. Audit-Template: Tool-Inventar, Login-Frequenz, doppelte Funktionen, Ersatz durch ein konsolidiertes System. Drei Praxis-Cases mit Einsparung 30-60%.',
  'Startups, kleine Teams, Mittelstand',
  'Tool-Audit starten',
  'practical',
  'ki-geld-effizienz',
  array['geld_business','tracking_tricks','everyday_marketing'],
  'leicht-provokant'
),
(
  'ki_geld_effizienz',
  'Ein KI-Agent ist kein Mitarbeiter.',
  'Er ist nur so gut wie der Prozess, den du ihm gibst.',
  'KI-Agenten-Grenzen ehrlich: was geht (strukturierte Aufgaben, Datenextraktion, Erstentwurf), was nicht geht (Urteil, Entscheidung, Kundenkontakt-Nuancen). Wo menschliche Freigabe-Punkte zwingend sind. Praxis-Setup mit n8n + Approval-Step.',
  'Gründer, Unternehmen, Operations-Teams',
  'KI-Agent sicher planen',
  'observation',
  'ki-geld-effizienz',
  array['ai_marketing','ai_risk'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'Der erste KI-Gewinn ist Zeit.',
  'Bevor KI Umsatz bringt, sollte sie Wiederholungen entfernen.',
  'Realistische KI-Einstiegspunkte fuer Solopreneurs + kleine Teams: Mail-Zusammenfassungen, Antwortentwuerfe, Datenaufbereitung aus PDFs, Content-Recycling (Blog → LinkedIn → Newsletter), Wochenreport-Automation. Jeweils mit Stunden-Ersparnis pro Woche.',
  'Selbstständige, lokale Unternehmen, kleine Teams',
  'Zeitfresser finden',
  'practical',
  'ki-geld-effizienz',
  array['ai_marketing','everyday_marketing'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'Warum KI-Projekte scheitern, obwohl das Tool gut ist.',
  'Meist fehlt nicht die Technologie. Meist fehlt die Entscheidung, was besser werden soll.',
  'Die haeufigsten KI-Projekt-Failures: keine messbare Erfolgsdefinition, niemand verantwortlich, kein Vergleich zu Vorher-Stand, kein Stopp-Kriterium. Anti-Pattern + Checkliste fuer Projekt-Setup: SMART-Ziel, Owner, Baseline, Review-Termin.',
  'Startups, Mittelstand, Agenturen',
  'KI-Projekt prüfen',
  'mistake',
  'ki-geld-effizienz',
  array['geld_business','tracking_tricks'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'Der 30-Minuten-Report, der vorher 4 Stunden dauerte.',
  'KI lohnt sich dort, wo wiederkehrende Arbeit messbar kürzer wird.',
  'Reporting-Automation in der Praxis: Daten aus GA4/Spurig/CRM → KI-Zusammenfassung → Slack-Channel. Setup-Skizze fuer einen Marketing-Wochenreport: was rein, was raus, wo Mensch noch drueberschaut. Sparzeit: 14 Std/Monat.',
  'Marketingteams, Gründer, Geschäftsführung',
  'Reporting automatisieren',
  'practical',
  'ki-geld-effizienz',
  array['tracking_tricks','digital_marketing','ai_marketing'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'KI macht keinen schlechten Funnel gut.',
  'Wenn Angebot und Kundenweg unklar sind, automatisiert KI nur Chaos.',
  'Reihenfolge bei KI-Marketing-Automationen: erst Angebot klaeren, dann Landingpage fixen, dann Tracking sauber, dann Follow-up bauen, dann KI dazuschalten. Wer es umgekehrt macht, automatisiert seine Probleme. Mini-Setup-Reihenfolge mit Beispielen.',
  'Startups, Dienstleister, lokale Unternehmen',
  'Funnel prüfen lassen',
  'mistake',
  'ki-geld-effizienz',
  array['digital_marketing','marketing_systems','ai_marketing'],
  'leicht-provokant'
),
(
  'ki_geld_effizienz',
  'Wo KI im Unternehmen zuerst Geld spart.',
  'Nicht beim großen Zukunftsprojekt. Sondern bei den nervigen Aufgaben von jeden Tag.',
  'Top-7-Quick-Wins fuer KMU 2026: E-Mail-Vorlagen, Angebotsentwuerfe, FAQ-Antworten, Termin-Vorbereitung, Mail-Zusammenfassungen, Content-Repurposing, Lead-Recherche. Jeweils geschaetzte Sparzeit + Tool-Kosten + Komplexitaet.',
  'Mittelstand, Praxen, Studios, lokale Unternehmen',
  'KI-Einstieg planen',
  'practical',
  'ki-geld-effizienz',
  array['mittelstand','ai_marketing'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'Mehr Umsatz durch KI? Erstmal weniger Reibung.',
  'Der einfachste Gewinn entsteht oft nicht durch mehr Werbung, sondern durch weniger Verlust im Prozess.',
  'Conversion-Verlust-Stellen vor mehr-Budget-Denken: langsame Antworten, Nicht-Nachfassen, unklare Angebote, gebrochene Uebergaben Sales→Onboarding. KI an genau diesen Bruchstellen — wo realistisch, wo nicht. Mini-ROI-Rechnung pro Bruchstelle.',
  'Dienstleister, E-Commerce, Startups, lokale Unternehmen',
  'Kundenweg analysieren',
  'observation',
  'ki-geld-effizienz',
  array['digital_marketing','tracking_tricks','marketing_systems'],
  'seriös-praxisnah'
);

-- ---- B) Bonus-Topics (20) ----
insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'ki_geld_effizienz',
  'KI im Kundenservice: was geht, was geht nicht.',
  'Chatbots sind keine Loesung. Aber KI-Erstantworten plus menschliche Eskalation koennen Service-Kosten halbieren.',
  'Realistisches Kundenservice-Setup 2026: KI klassifiziert Anfragen, schlaegt Antwort vor, Mensch reviewed + sendet. Was nie automatisiert werden sollte (Reklamationen, sensible Daten, emotional). Praxis-Skizze + DSGVO-Fallstricke.',
  'KMU mit hohem Support-Aufkommen, E-Commerce, SaaS',
  'KI-Einstieg planen',
  'ai',
  'ki-geld-effizienz',
  array['ai_marketing','ai_risk','compliance_lite'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'Angebotserstellung mit KI: das 80%-Template.',
  'Angebote schreiben kostet im Mittel 90 Minuten. Mit Template + KI: 15 Minuten.',
  'Angebots-Generator-Setup: Brief-Notes + Standard-Template + KI fuer Anpassung an Kunden-Sprache → 80%-Erstentwurf. Was im Template stehen muss, wo Mensch immer drueberschaut, wie man Pricing-Logik nicht der KI ueberlaesst.',
  'Berater, Agenturen, Service-Anbieter, Freelancer',
  'Automationspotenzial prüfen',
  'practical',
  'ki-geld-effizienz',
  array['ai_marketing','geld_business'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'Newsletter mit KI: weniger Schreibzeit, mehr Klick-Rate.',
  'KI generiert keine besseren Newsletter — aber sie kann Varianten testen die Menschen nicht baut.',
  'KI-Workflow fuer Newsletter: 3 Subject-Line-Varianten, 2 Intro-Hooks, 1 Preview-Snippet — pro Send. Test-Setup ohne 200-EUR-A/B-Tool. Was funktioniert, was nur Output-Lawine erzeugt.',
  'Newsletter-Betreiber, Solopreneure, Content-Teams',
  'Newsletter-Strecke planen',
  'practical',
  'ki-geld-effizienz',
  array['email_shortlinks','ai_marketing','digital_marketing'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'Content-Wiederverwertung: ein Blog → fünf Kanäle.',
  'Wer einen guten Blog hat, hat ohne KI zwei Wochen Output. Mit KI: zwei Monate.',
  'Repurposing-Pipeline: Blog → LinkedIn-Post + Twitter-Thread + Newsletter-Section + Reddit-Diskussion + Podcast-Outline. Welche Schritte KI macht, wo Mensch entscheidet, wie man Tone konsistent haelt. Zeit pro Stueck: 8 Min statt 90.',
  'Solo-Founder, Content-Creator, Marketing-Verantwortliche',
  'System gemeinsam aufbauen',
  'practical',
  'ki-geld-effizienz',
  array['ai_marketing','digital_marketing','creator_design'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'CRM-Pflege mit KI: das Drecks-Job-Hindernis loesen.',
  'Niemand pflegt CRM gerne. Genau deshalb verlieren Unternehmen Anfragen.',
  'KI-CRM-Hygiene: Lead-Eintraege automatisch anreichern (Linkedin-Profile, Firma, Kontext), Folge-Aufgaben generieren, Stale-Leads markieren, Wochenuebersicht "wer braucht Beruehrung". Tool-Stack: HubSpot Free + n8n + KI. Setup-Skizze.',
  'B2B-Sales, Solopreneure, kleine Sales-Teams',
  'System gemeinsam aufbauen',
  'practical',
  'ki-geld-effizienz',
  array['ai_marketing','digital_marketing'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'KI-ROI realistisch berechnen.',
  'Nicht "spart 80% Zeit". Sondern: kostet X EUR/Monat, spart Y Stunden, bringt Z Anfragen.',
  'Drei-Spalten-ROI-Rechner: Kosten (Tools, Setup, Wartung) — Sparzeit pro Woche × Stundensatz — zusaetzliche Umsatz/Conversion-Effekte. Mit ausgefuelltem Beispiel: Mail-Automation in Beratungsagentur, 60-Tage-Amortisation.',
  'KMU-Geschaeftsfuehrung, CFOs, Marketing-Manager',
  'KI-Projekt prüfen',
  'practical',
  'ki-geld-effizienz',
  array['geld_business','tracking_tricks'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'Lokale Unternehmen + KI: drei Hebel die wirklich wirken.',
  'KMU brauchen kein 50.000-EUR-KI-Projekt. Sie brauchen drei Dinge, die ab Tag 1 funktionieren.',
  'Praxis-Hebel fuer lokale Geschaefte: (1) Bewertungen automatisiert anfragen + KI-Antwortvorschlaege, (2) Wiederkehrende Kunden-Fragen als FAQ-Bot mit menschlicher Eskalation, (3) Termin-Erinnerungen mit Kontext (Hund/Kind/Anlass aus letzter Visite).',
  'Friseure, Praxen, Aerzte, lokale Dienstleister',
  'KI-Einstieg planen',
  'practical',
  'ki-geld-effizienz',
  array['mittelstand','ai_marketing'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'Agenturen + KI: skalieren ohne Mitarbeiter-Burnout.',
  'Die Agentur die KI nicht nutzt, verliert in 2026 — die Agentur die nur auf KI setzt, verliert auch.',
  'Wie Agenturen KI als Co-Pilot statt Ersatz nutzen: Konzept-Drafts, Recherche, Asset-Varianten, Reporting. Was bei Kunden ankommt vs was sie merken. Pricing-Frage: KI-Sparzeit als Margin oder als Preis-Hebel?',
  'Agentur-Owner, Studio-Leiter, Beratungs-Teams',
  'Marketing-Check anfragen',
  'observation',
  'ki-geld-effizienz',
  array['ai_marketing','geld_business'],
  'unternehmer-realistisch'
),
(
  'ki_geld_effizienz',
  'Prozess-Audit in 60 Minuten.',
  'Du weisst nicht wo KI helfen wuerde? Schreib eine Stunde lang auf, was du heute manuell gemacht hast.',
  'Selbst-Audit-Template: Wochenlog ueber 5 Tage — Aufgabe, Dauer, "wuerde Mensch das wirklich brauchen?". Auswertung: Top 3 Zeit-Killer. Pro Top-3-Aufgabe: KI-Hebel oder Prozess-Fix. Beispiel: Werbe-Agentur, 12 Std/Woche entdeckt.',
  'KMU-Inhaber, Marketing-Manager, Solo-Marketer',
  'Automationspotenzial prüfen',
  'practical',
  'ki-geld-effizienz',
  array['everyday_marketing','geld_business'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'Was du auf keinen Fall automatisieren solltest.',
  'Nicht alles was automatisierbar ist, sollte automatisiert werden.',
  'Anti-Automation-Liste: Reklamationen, Pricing-Verhandlungen, sensible Kundengespraeche, Krisenkommunikation, alles wo Empathie entscheidet. Wieso KI hier nicht nur schlechter ist sondern Schaden anrichtet. Beispiele aus echten Vorfaellen.',
  'Geschaeftsfuehrer, Customer-Success, Support-Leiter',
  'KI-Agent sicher planen',
  'mistake',
  'ki-geld-effizienz',
  array['ai_risk','everyday_marketing'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'DSGVO + KI: die versteckten Kostenrisiken.',
  'Eine ChatGPT-Anfrage kann mehr kosten als das Abo — wenn Kundendaten reinwandern.',
  'Praxis-DSGVO-Check fuer KI-Nutzung: was darf in OpenAI/Anthropic-Konten, was nur EU-LLM, was nie. Welche Buss-Beispiele 2026 schon publiziert sind. Mini-Policy-Vorlage fuer Mitarbeiter-KI-Nutzung im KMU.',
  'KMU-Inhaber, Datenschutzbeauftragte, IT-Verantwortliche',
  'KI-Agent sicher planen',
  'observation',
  'ki-geld-effizienz',
  array['ai_risk','compliance_lite'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'Wenn die KI halluziniert: was es kosten kann.',
  'Eine falsche Pricing-Aussage von ChatGPT an einen Kunden ist ein Vertrag. Niemand weiss das vorher.',
  'Drei echte Faelle: KI-Agent verspricht falschen Liefertermin, KI-Antwort gibt nicht-vorhandenen Rabatt, KI-Setup schickt Mail an falsche Liste. Was rechtlich passiert, was technisch verhindert, wo menschliche Freigabe nicht verhandelbar ist.',
  'Marketing-Manager, Sales, Customer-Service-Verantwortliche',
  'KI-Agent sicher planen',
  'mistake',
  'ki-geld-effizienz',
  array['ai_risk','geld_business'],
  'leicht-provokant'
),
(
  'ki_geld_effizienz',
  'Drei Tools statt zehn: das KI-Stack-Update.',
  'Viele KMU kaufen mehr Tools, weil keines wirklich passt. KI macht Konsolidierung moeglich.',
  '2026-Stack-Vorschlag fuer KMU: ein LLM (Claude oder ChatGPT Team), ein Automation-Tool (n8n self-host), ein CRM-Light (Notion oder Attio). Was die Kombi kann was 10 Einzeltools nicht koennen. Migrationspfad pro Quartal.',
  'Geschaeftsfuehrer, Operations-Leiter, IT-Verantwortliche',
  'Tool-Audit starten',
  'practical',
  'ki-geld-effizienz',
  array['geld_business','ai_marketing'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'Termin-Vorbereitung mit KI: 20 Minuten zu 3 Minuten.',
  'Vor jedem Sales-Call recherchierst du dieselben fuenf Sachen. KI macht das in einem Atemzug.',
  'KI-Briefing-Setup: vor Call automatisch LinkedIn-Profile, Firma-News, letzte Berührungen aus CRM, mögliche Einwaende. Mensch schaut 2 Min drueber, geht informiert in den Call. Setup mit n8n + Claude.',
  'B2B-Sales, Berater, Coaches',
  'System gemeinsam aufbauen',
  'practical',
  'ki-geld-effizienz',
  array['ai_marketing','digital_marketing'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'KI fuer Solopreneure: ein Mensch, zehn Rollen.',
  'Solo-Founder sind Marketing, Sales, Support, Buchhaltung. KI ist nicht Mitarbeiter — sie ist Mehrhirn.',
  'Solo-Setup: morning-Routine mit KI-Mail-Triage, Mittag Lead-Follow-up-Drafts, Nachmittag Content-Repurpose, Abend Wochen-Reflektion mit KI-Analyse. Was realistisch geht, was Buzzword bleibt.',
  'Solopreneure, Indie-Hacker, Solo-Berater',
  'KI-Einstieg planen',
  'founder-positioning',
  'ki-geld-effizienz',
  array['founder_diary','ai_marketing'],
  'unternehmer-realistisch'
),
(
  'ki_geld_effizienz',
  'Der KI-Praktikant: wo Junior-Aufgaben verschwinden.',
  'Manche Aufgaben die Praktikanten machen, kann KI besser. Das ist nicht Bedrohung — das ist Verschiebung.',
  'Wo KI Junior-Arbeit ersetzt (Daten-Aufbereitung, Erst-Recherche, Routine-Texte), wo Junior-Arbeit unersetzbar bleibt (Lernen durch Tun, Beziehungen, Kontext aufbauen). Was Agentur-Models sich umbauen muessen.',
  'Agenturen, Beratungen, kleine Teams mit Junior-Pipeline',
  'Strategiegespräch anfragen',
  'observation',
  'ki-geld-effizienz',
  array['ai_marketing','founder_diary'],
  'unternehmer-realistisch'
),
(
  'ki_geld_effizienz',
  'Reporting ohne Tools: KI macht Excel zur Entscheidungsmaschine.',
  'Wer GA4 nicht lesen will, kann jetzt fragen statt klicken.',
  'KI auf Excel/CSV: "Was hat sich diese Woche veraendert?" — bekommst du eine Antwort statt 12 Tabs. Setup mit Claude + Daten-Upload, Datenschutz-Defaults, was geht/was nicht. Plus Anti-Pattern: KI als Wahrsager-Ersatz.',
  'KMU-Marketing, Geschaeftsfuehrer, Solo-Marketer',
  'Reporting automatisieren',
  'practical',
  'ki-geld-effizienz',
  array['tracking_tricks','ai_marketing'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'Lead-Follow-up mit KI: respektvoll automatisch.',
  'Auto-Follow-Ups die nach Auto-Follow-Up riechen, brennen Vertrauen. Es geht auch anders.',
  'KI-Personalisierung im Nachfassen: aus Lead-Quelle + LinkedIn-Profil + erster Mail-Antwort einen 3-Satz-Kontext-Pull, der die Follow-up-Mail nicht wie Spam liest. Beispiel-Strecke und A/B-Vergleich zu Template.',
  'B2B-Sales, Coaches, Berater, Solo-Founder',
  'Follow-up-System besprechen',
  'practical',
  'ki-geld-effizienz',
  array['email_shortlinks','ai_marketing','digital_marketing'],
  'praxis-erfahren'
),
(
  'ki_geld_effizienz',
  'Warum dein KI-Projekt nach 3 Monaten stehen blieb.',
  'Anfangs-Hype + kein Owner + kein Vergleich zur Vorher-Welt = Projekt im Limbo.',
  'Post-Mortem-Pattern bei KI-Initiativen: niemand verantwortlich, kein Baseline-Tracking, keine Stop-Kriterien. Wie man das von Anfang an vermeidet — Owner-Card, Baseline-Metrik, 30-/60-/90-Tage-Review. Plus: wann ein KI-Projekt stoppen ist die richtige Entscheidung.',
  'Geschaeftsfuehrer, Projekt-Owner, KMU-IT',
  'KI-Projekt prüfen',
  'mistake',
  'ki-geld-effizienz',
  array['geld_business','tracking_tricks'],
  'seriös-praxisnah'
),
(
  'ki_geld_effizienz',
  'KI-Kosten 2026: die ehrliche Rechnung.',
  'Das Abo ist nie das ganze Bild. Setup, Wartung, Mitarbeiter-Lernkurve, Fehler-Kosten — alles dazu.',
  'Total-Cost-of-Ownership fuer KI-Tools: Lizenzkosten + Setup-Stunden + Wartung pro Monat + Mitarbeiter-Lernzeit + Fehler-Kosten (KI-Halluzination, falsche Daten). Mit realer Rechnung fuer drei typische Setups (Mail-Automation, Content-Pipeline, Reporting).',
  'CFOs, Geschaeftsfuehrer, IT-Budget-Verantwortliche',
  'KI-Projekt prüfen',
  'practical',
  'ki-geld-effizienz',
  array['geld_business','ai_marketing'],
  'seriös-praxisnah'
);
