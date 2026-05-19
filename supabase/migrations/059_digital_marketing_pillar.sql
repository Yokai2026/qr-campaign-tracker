-- ============================================
-- 14. Pillar: digital_marketing (Digitales Marketing)
-- ============================================
-- Strategischer Komplementaer-Cluster zu marketing_systems:
--
--   marketing_systems  → Offline ↔ Online Brücke (Flyer, QR, Print, Events
--                         → Funnel)
--   digital_marketing  → rein digitale Kanaele (Website, Landingpage,
--                         Newsletter, Social, SEO, Ads, CRM, KI-Automation,
--                         Conversion, Tracking)
--
-- Beide ergaenzen sich, ueberschneiden sich aber nicht im Scope. Multi-
-- Cluster-Tagging via secondary_clusters macht Cross-Verweise sichtbar.
-- ============================================

-- 1) Cluster-Constraint erweitern
alter table public.content_ideas
  drop constraint if exists content_ideas_cluster_check;

alter table public.content_ideas
  add constraint content_ideas_cluster_check
  check (cluster in (
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
    'digital_marketing'
  ));

-- 2) Seed-Ideen (32 Stueck)

-- ---- A) User-Vorlagen (12) ----
insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'digital_marketing',
  'Deine Website sieht gut aus. Aber sie verkauft nichts.',
  'Schönes Design bringt wenig, wenn der nächste Schritt fehlt.',
  'Modern-aussehende Webseiten ohne klare Angebote, ohne CTAs, ohne Kontaktstrecke, ohne Tracking. Drei Diagnose-Fragen: (1) Welches Problem loest ich? (2) Was soll der Besucher tun? (3) Wie merken wir, ob es klappt? Konkrete Vorher/Nachher-Beispiele.',
  'Startups, Selbstständige, lokale Unternehmen, Dienstleister',
  'Website-Check anfragen',
  'observation',
  'digital-marketing',
  array['tracking_tricks','geld_business','marketing_systems'],
  'sympathisch-direkt'
),
(
  'digital_marketing',
  'Ein Post ist kein Marketing-System.',
  'Viele Unternehmen posten regelmäßig, aber bauen keinen Weg zur Anfrage.',
  'Wieso Social Media allein selten reicht. Wie Website + Newsletter + Angebot + Tracking zusammenspielen muessen, damit ein Post nicht in einer Sackgasse endet. Mini-System fuer Solo-Founder: 4 Touchpoints, 1 Trackingziel.',
  'Kleine Unternehmen, Creator, Dienstleister, Startups',
  'System gemeinsam aufbauen',
  'founder-positioning',
  'digital-marketing',
  array['marketing_systems','ai_marketing','everyday_marketing'],
  'unternehmer-realistisch'
),
(
  'digital_marketing',
  'Warum deine Landingpage nicht konvertiert.',
  'Meist fehlt nicht Traffic. Meist fehlt Klarheit.',
  'Conversion-Killer-Checkliste: schwache Headline, unklarer Nutzen, fehlende Vertrauenssignale, langsame Ladezeit, kein mobil-optimierter CTA, kein Tracking. Konkrete Fix-Reihenfolge die ohne A/B-Test-Stack auskommt.',
  'Startups, Coaches, lokale Dienstleister, SaaS-Projekte',
  'Landingpage prüfen lassen',
  'mistake',
  'digital-marketing',
  array['tracking_tricks','geld_business'],
  'leicht-provokant'
),
(
  'digital_marketing',
  'KI kann Texte schreiben. Aber sie kennt deine Kunden nicht.',
  'Gute Marketingtexte entstehen nicht aus Prompts, sondern aus echten Fragen.',
  'KI-Output ist nur so gut wie der Kunden-Kontext. Wie man Zielgruppe, echte Einwaende und Tonalitaet in Prompts uebersetzt. Mit Praxis-Beispiel: identischer Brief, einmal generisch, einmal mit Kunden-Kontext — Conversion-Differenz.',
  'Unternehmen, Selbstständige, Startups',
  'KI-Marketing-Setup prüfen',
  'ai',
  'digital-marketing',
  array['ai_marketing','marketing_systems'],
  'professionell-realistisch'
),
(
  'digital_marketing',
  'Newsletter sind nicht tot. Schlechte Newsletter sind tot.',
  'E-Mail funktioniert, wenn sie Vertrauen aufbaut und nicht nur Rabatt schreit.',
  'Newsletter-Aufbau ohne Mautic-Monster: Subject-Lines die nicht clickbaiten, Timing das niemanden nervt, Segmentierung mit 3 Tags statt 30, Follow-up-Logik die Vertrauen aufbaut. Messbar mit Klick + Reply-Rate.',
  'E-Commerce, lokale Geschäfte, Dienstleister, Creator',
  'Newsletter-Strecke planen',
  'practical',
  'digital-marketing',
  array['email_shortlinks','tracking_tricks'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Dein Google Analytics zeigt Zahlen. Aber keine Entscheidung.',
  'Tracking bringt nichts, wenn niemand weiß, welche Frage beantwortet werden soll.',
  'GA4-Dashboards die niemand auswertet. Statt 80 Metriken: 3 Kern-KPIs pro Geschaeftsmodell. Wie man Conversion-Events sauber definiert und Reporting in 10 Min/Woche schafft. Beispiel: lokaler Dienstleister mit 3 Kennzahlen.',
  'Startups, Mittelstand, lokale Unternehmen',
  'Tracking-Setup besprechen',
  'practical',
  'digital-marketing',
  array['tracking_tricks','geld_business'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Mehr Reichweite ist nicht automatisch mehr Umsatz.',
  'Viele Kampagnen verlieren Geld, weil sie Aufmerksamkeit mit Nachfrage verwechseln.',
  'Reichweite ohne klares Angebot = Verstaerker fuer Unklarheit. Drei Check-Schritte vor jedem Reichweiten-Push: (1) Stimmt das Angebot? (2) Stimmt der Funnel? (3) Erst dann skalieren. Echte Kampagnen-Beispiele mit Budget-Vergleich.',
  'Startups, lokale Unternehmen, Selbstständige',
  'Kampagne analysieren lassen',
  'mistake',
  'digital-marketing',
  array['geld_business','mittelstand','marketing_systems'],
  'leicht-provokant'
),
(
  'digital_marketing',
  'Der Kunde klickt. Und dann?',
  'Der wichtigste Moment im digitalen Marketing passiert nach dem ersten Klick.',
  'Was nach dem Klick passieren muss: Landingpage mit Antwort auf Erwartung, klares Sub-Step (Formular/WhatsApp/Buchung), automatisches Follow-up wenn kein Abschluss. Tool-Stack fuer Solo-Founder unter 50 EUR/Monat.',
  'Dienstleister, Praxen, Studios, lokale Unternehmen',
  'Kundenweg prüfen lassen',
  'practical',
  'digital-marketing',
  array['email_shortlinks','ai_marketing','marketing_systems'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Warum dein Angebot online unklar wirkt.',
  'Wenn Kunden nachdenken müssen, klicken sie weg.',
  'Angebotsklarheit-Check: Eine-Satz-Pitch, Preislogik sichtbar, Nutzen vor Feature, Differenzierung in 5 Sekunden lesbar. Mit Praxis-Beispielen aus Beratung, Coaching, Service.',
  'Selbstständige, Agenturen, lokale Anbieter, Startups',
  'Angebot schärfen lassen',
  'trust',
  'digital-marketing',
  array['geld_business','marketing_systems'],
  'bodenstaendig-ehrlich'
),
(
  'digital_marketing',
  'Digitale Werbung ohne Follow-up ist teuer.',
  'Der erste Klick kostet Geld. Der zweite Kontakt entscheidet.',
  'Ads ohne Retargeting + Newsletter + CRM = teuer in der Wiederholung. Mini-Follow-up-Stack: Pixel auf der Landingpage, Newsletter-Trigger nach Anfrage, einfache Automation in n8n. Was bei 500 EUR Ad-Budget aendert.',
  'Unternehmen mit Werbebudget, Startups, Dienstleister',
  'Follow-up-System planen',
  'practical',
  'digital-marketing',
  array['ai_marketing','geld_business','email_shortlinks'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Deine Website beantwortet nicht die wichtigste Frage.',
  'Warum sollte ich jetzt bei dir anfragen?',
  'Die 5-Sekunden-Regel: kann der Besucher Above-the-Fold beantworten "fuer wen, fuer was, warum jetzt"? Diagnose-Fragen, Social-Proof-Placement, Kontaktpunkte. Vorher/Nachher mit echtem Beispiel.',
  'Lokale Unternehmen, Dienstleister, Startups',
  'Website-Audit starten',
  'trust',
  'digital-marketing',
  array['marketing_systems','geld_business'],
  'bodenstaendig-ehrlich'
),
(
  'digital_marketing',
  'Digitales Marketing beginnt mit einer besseren Frage.',
  'Nicht: Was sollen wir posten? Sondern: Welche Entscheidung soll der Kunde treffen?',
  'Strategie-Mindshift: vom Output-Denken (was machen wir?) zum Decision-Denken (was soll Kunde entscheiden?). Drei Kampagnen-Beispiele mit beiden Sichten — Vergleich der Ergebnisse.',
  'Unternehmer, Gründer, Marketingverantwortliche',
  'Strategiegespräch anfragen',
  'founder-positioning',
  'digital-marketing',
  array['mittelstand','marketing_systems'],
  'unternehmer-realistisch'
);

-- ---- B) Bonus-Topics aus User-Liste (20) ----
insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'digital_marketing',
  'Lokales SEO ist nicht Magie. Es ist drei Sachen, die niemand zuende macht.',
  'Wer in der Stadt gefunden werden will, braucht keine Voodoo-Tricks — sondern drei sauber gepflegte Stellen.',
  'Google-Business-Profil aktuell, lokale Schema-Markup auf der Webseite, konsistente NAP-Daten (Name/Adresse/Telefon) ueber alle Verzeichnisse. Was 80% der lokalen Unternehmen versaeumen — und warum es Anfragen kostet.',
  'Friseure, Aerzte, Handwerker, lokale Dienstleister',
  'Mini-Audit starten',
  'practical',
  'digital-marketing',
  array['mittelstand','tracking_tricks'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Dein Google-Business-Profil ist deine zweite Webseite.',
  'Viele Kunden entscheiden in Google Maps, ob sie ueberhaupt klicken.',
  'Was im Google-Business-Profil 2026 wirklich zaehlt: aktuelle Fotos, Antwort-Quote auf Bewertungen, Q&A-Block gepflegt, Posts (ja, auch das), korrekte Oeffnungszeiten. Mini-Check fuer 15 Minuten pro Quartal.',
  'Lokale Geschaefte, Gastronomie, Praxen, Dienstleister',
  'Marketing-Check anfragen',
  'practical',
  'digital-marketing',
  array['mittelstand','everyday_marketing'],
  'sympathisch-direkt'
),
(
  'digital_marketing',
  'Warum Bewertungen wichtiger sind als deine Headline.',
  'Menschen lesen Bewertungen, bevor sie sich auf deinen Text einlassen.',
  'Online-Reputation als unterschaetzter Funnel-Hebel. Wie man systematisch Bewertungen einsammelt, schlechte Reviews als Vertrauenssignal nutzt, und das Ganze ohne nervige Bitte-Mails. Mini-Workflow fuer Solopreneure.',
  'Lokale Dienstleister, Coaches, Beratungen, Studios',
  'Idee gemeinsam prüfen',
  'trust',
  'digital-marketing',
  array['mittelstand','marketing_systems'],
  'bodenstaendig-ehrlich'
),
(
  'digital_marketing',
  'Ein Lead-Magnet ohne Versprechen ist nur ein Download.',
  'Niemand traegt sich in einen Newsletter ein fuer "spannende Tipps".',
  'Warum die meisten Lead-Magneten ins Leere laufen: vages Versprechen, generischer Titel, kein klarer naechster Schritt nach dem Download. Wie man einen Lead-Magneten baut der sich verkauft, nicht nur ladet.',
  'Coaches, Berater, B2B-Solopreneure, SaaS',
  'System gemeinsam aufbauen',
  'practical',
  'digital-marketing',
  array['email_shortlinks','marketing_systems'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'WhatsApp ist 2026 der ehrlichste Kontaktkanal.',
  'Wer kurz schreiben kann, baut Vertrauen schneller auf als jede Webseite.',
  'WhatsApp Business als niedrigschwelliger Erst-Kontakt: Wann ein WhatsApp-Button auf der Webseite mehr bringt als ein Formular, wie man DSGVO-konform bleibt, wie man nicht in der Inbox versinkt. Plus Tracking-Trick fuer WhatsApp-Klicks.',
  'Lokale Dienstleister, Berater, Solopreneure, kleine Teams',
  'Tracking-Setup besprechen',
  'practical',
  'digital-marketing',
  array['mittelstand','tracking_tricks','compliance_lite'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Social Media ist ein Einstieg. Kein Ziel.',
  'Likes sind keine Kunden. Aber sie koennen ein Pfad dahin werden.',
  'Wieso reine Reach-Metriken (Follower, Likes, Views) im Marketing-Kontext irrefuehrend sind. Wie man Social zu einem Top-of-Funnel-Channel macht — mit klarem Pfad zu Webseite, Newsletter, Anfrage. Drei Mini-Funnels die in 2 Std stehen.',
  'Solo-Founder, Creator, Marketing-Verantwortliche',
  'Marketing-Check anfragen',
  'observation',
  'digital-marketing',
  array['marketing_systems','everyday_marketing'],
  'leicht-provokant'
),
(
  'digital_marketing',
  'KI fuer Follow-Ups: was 2026 wirklich Sinn macht.',
  'Automation ersetzt keine Beziehung — aber sie kann den Anfang davon bauen.',
  'Realistische KI-Follow-up-Setups: automatische Erst-Mail nach Anfrage mit echtem Kontext, smarte Reminder fuer ueberfaellige Angebote, Lead-Scoring ohne 200-EUR-CRM. Was funktioniert, was floppt, was rechtlich heikel ist.',
  'B2B-Solopreneure, Coaches, Berater, kleine Sales-Teams',
  'Follow-up-System planen',
  'ai',
  'digital-marketing',
  array['ai_marketing','ai_risk','email_shortlinks'],
  'professionell-realistisch'
),
(
  'digital_marketing',
  'Du brauchst kein CRM. Du brauchst eine Liste die jemand pflegt.',
  'Ein 200-EUR-CRM hilft nicht, wenn niemand reinschaut.',
  'CRM-Grundlagen ohne Tool-Religion. Wann eine sauber gefuehrte Notion/Spreadsheet genug ist, wann ein echtes CRM sich lohnt, was zwischen "wir koennten" und "wir muessen" liegt. Plus: 3 Felder die jeder Lead-Eintrag haben sollte.',
  'Solopreneure, kleine Teams, Berater, Coaches',
  'Idee gemeinsam prüfen',
  'practical',
  'digital-marketing',
  array['geld_business','everyday_marketing'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Tracking ohne Datenchaos: 5 Events, mehr nicht.',
  'Wer alles trackt, wertet nichts aus.',
  'Anti-Tracking-Overload: statt 40 Events 5 saubere Conversion-Punkte definieren (Seitenbesuch, Lead-Form-Open, Form-Submit, Anfrage, Abschluss). Wie das in GA4 / Plausible / Spurig aussieht. Plus DSGVO-konforme Defaults.',
  'KMU-Marketing, Solopreneure, Marketing-Manager',
  'Tracking-Setup besprechen',
  'practical',
  'digital-marketing',
  array['tracking_tricks','compliance_lite'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Conversion-Optimierung ist nicht Button-Farbe. Es ist Klarheit.',
  '95% der Conversion-Probleme sind Frage-Probleme, nicht Design-Probleme.',
  'Die wirklichen Conversion-Hebel: klare Sub-Headline, sichtbarer Preis (oder warum nicht), kein Cookie-Banner-Drama, mobile Geschwindigkeit, eine einzige Frage pro Seite. Drei Mini-Audits zum Selbstanwenden.',
  'Marketing-Verantwortliche, KMU-Inhaber, SaaS-Founder',
  'Landingpage prüfen lassen',
  'mistake',
  'digital-marketing',
  array['marketing_systems','geld_business'],
  'leicht-provokant'
),
(
  'digital_marketing',
  'Die 7 Fehler die Landingpages lautlos verbrennen.',
  'Manche Landingpages sterben nicht laut — sie versickern.',
  'Konkrete Anti-Patterns: keine eindeutige Headline, mehrere CTAs konkurrieren, Vertrauenssignale unter dem Fold, Formular mit 8 Feldern, kein Mobile-Test, kein Conversion-Tracking, kein Follow-up-Plan. Mit Code-Snippets fuer schnelle Fixes.',
  'Marketing-Manager, Founder, Web-Verantwortliche',
  'Landingpage prüfen lassen',
  'mistake',
  'digital-marketing',
  array['tracking_tricks','geld_business','marketing_systems'],
  'leicht-provokant'
),
(
  'digital_marketing',
  'Warum dein Preis online keine Wirkung hat.',
  'Ein Preis ohne Kontext ist nur eine Zahl. Mit Kontext wird er Argument.',
  'Pricing-Display: wann anchor-Preis, wann Paket-Drei-Stufer, wann Auf-Anfrage. Wie man Vertrauen in Preisseiten baut ohne Rabatt-Reflex. B2B-Service vs Product-Beispiele.',
  'Berater, SaaS-Founder, Coaches, Service-Anbieter',
  'Angebot schärfen lassen',
  'trust',
  'digital-marketing',
  array['geld_business','marketing_systems'],
  'bodenstaendig-ehrlich'
),
(
  'digital_marketing',
  'Buchungsseiten: kleiner Schritt, grosser Conversion-Effekt.',
  'Wer "Termin vereinbaren" ueber Cal.com / Calendly anbietet, halbiert oft die Drop-Out-Rate.',
  'Buchungsseite vs Kontaktformular: psychologischer Unterschied. Wann was funktioniert, wie man Kalender-Tools auswaehlt, wie man sie sauber in Newsletter / Webseite / WhatsApp einbettet. Plus Tracking-Einrichtung.',
  'Solopreneure, Coaches, Berater, B2B-Sales',
  'System gemeinsam aufbauen',
  'practical',
  'digital-marketing',
  array['marketing_systems','tracking_tricks'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Digitale Kampagnen-Planung in einer Stunde.',
  'Du brauchst kein 30-Slide-Strategy-Deck. Du brauchst eine klare Antwort auf vier Fragen.',
  'Mini-Brief-Template: (1) Wer ist der Kunde + Problem? (2) Was ist der EINE Next-Step? (3) Welche Kanaele bedienen wir? (4) Wie messen wir Erfolg? Mit ausgefuelltem Beispiel fuer einen lokalen Optiker.',
  'KMU-Marketing, Founder, Solo-Marketer',
  'Strategiegespräch anfragen',
  'practical',
  'digital-marketing',
  array['marketing_systems','everyday_marketing'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Online-Reputation entsteht nicht zufaellig. Sie wird gebaut.',
  'Vertrauen online ist die Summe vieler kleiner Signale — kein einzelner Hebel.',
  'Reputation-Stack: Bewertungen aktiv einsammeln, Antworten ehrlich+freundlich, Branchenverzeichnisse konsistent, eigene Webseite mit Social-Proof, LinkedIn-Profil aktuell. Was zusammenarbeitet — und was Solo-Investment vergeudet.',
  'B2B-Solopreneure, Coaches, kleine Agenturen, Berater',
  'Marketing-Check anfragen',
  'trust',
  'digital-marketing',
  array['marketing_systems','founder_diary'],
  'bodenstaendig-ehrlich'
),
(
  'digital_marketing',
  'Content der verkauft, ohne zu verkaufen.',
  'Die besten Marketing-Texte fuehlen sich nicht nach Verkaufen an. Sie fuehlen sich nach Helfen an.',
  'Der Unterschied zwischen "wir bieten X" und "hier ist ein Problem, das viele uebersehen". Konkrete Vorher/Nachher-Beispiele aus LinkedIn-Posts, Blog-Intros, Newsletter-Anreissern. Plus: was sofort als "salesy" gelesen wird.',
  'Solopreneure, B2B-Founder, Marketing-Texter, Creator',
  'Idee gemeinsam prüfen',
  'trust',
  'digital-marketing',
  array['founder_diary','marketing_systems','ai_marketing'],
  'bodenstaendig-ehrlich'
),
(
  'digital_marketing',
  'Sichtbarkeit ohne Vertrauen ist nur Laerm.',
  'Wer gefunden wird aber kein Vertrauen aufbaut, wird ueberblaettert.',
  'Sichtbarkeit (SEO, Ads, Social) ohne Vertrauens-Layer (Bewertungen, klares Angebot, Reputation) verbrennt Klicks. Wieso Sichtbarkeit immer zweiter Schritt ist — und welche Vertrauenssignale online wirklich wirken.',
  'KMU-Marketing, Marketing-Verantwortliche, Founder',
  'Marketing-Check anfragen',
  'observation',
  'digital-marketing',
  array['marketing_systems','everyday_marketing'],
  'sympathisch-direkt'
),
(
  'digital_marketing',
  'Newsletter-Aufbau in 4 Schritten — ohne Hype.',
  'Mailchimp-Setup-Tutorials gibt es zuhauf. Newsletter-Strategie-Anleitungen fast keine.',
  'Strategie vor Tool: (1) Wer liest? (2) Was kriegen sie das es woanders nicht gibt? (3) Wie oft? (4) Wo melden sie sich an? Erst dann Tool-Wahl (Buttondown vs MailerLite vs Beehiiv). Plus DSGVO-Defaults.',
  'Solopreneure, Coaches, kleine Marken, B2B-Founder',
  'Newsletter-Strecke planen',
  'practical',
  'digital-marketing',
  array['email_shortlinks','compliance_lite'],
  'praxis-erfahren'
),
(
  'digital_marketing',
  'Warum dein Kontaktformular der Conversion-Killer ist.',
  'Acht Felder. Captcha. "Wie haben Sie von uns erfahren?" — und schon weg.',
  'Kontaktformular-Anatomie: Wieviele Felder noch Sinn machen, wie man das DSGVO-Sternchen nicht zur Hauptsache macht, wann WhatsApp-Button die bessere Wahl ist. Mit konkretem Vorher/Nachher-Conversion-Beispiel.',
  'Dienstleister, Berater, lokale Unternehmen, Coaches',
  'Kundenweg prüfen lassen',
  'mistake',
  'digital-marketing',
  array['marketing_systems','compliance_lite'],
  'leicht-provokant'
),
(
  'digital_marketing',
  'Retargeting ohne Tracking-Setup ist Geld in den Wind.',
  'Wer retargetet, ohne zu wissen wer abgesprungen ist, sprueht nur teurer in dieselbe Lampe.',
  'Retargeting-Grundlagen: was wirklich nachgewiesen werden muss bevor Geld in Pixel-Audiences fliesst (Conversion-Events, Audience-Hygiene, Frequenz-Caps). Plus: Cookie-less 2026 — was geht noch, was nicht.',
  'Marketing-Manager mit Ads-Budget, E-Commerce, B2B-Sales',
  'Tracking-Setup besprechen',
  'practical',
  'digital-marketing',
  array['tracking_tricks','geld_business','compliance_lite'],
  'praxis-erfahren'
);
