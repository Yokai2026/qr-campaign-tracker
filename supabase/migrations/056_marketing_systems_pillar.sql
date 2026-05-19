-- ============================================
-- 13. Pillar: marketing_systems (Marketing-Systeme)
-- ============================================
-- Strategischer Positionierungs-Cluster: David als Marketing-Praktiker
-- + KI-Systemdenker + Umsetzer. Online + Offline + Tracking + KI.
-- Ziel: Leser denken "Der versteht Marketing wirklich" → Buchungen ueber
-- LinkedIn / Anfrage-Formular. Tonalitaet: realistisch, sympathisch,
-- leicht provokant, bodenstaendig — NIE salesy.
--
-- Aenderungen in dieser Migration:
--   1. cluster_check Constraint um 'marketing_systems' erweitert.
--   2. Neue Spalte `secondary_clusters text[]` fuer Cross-Cluster-Tagging
--      (Idee kann mehreren Pillars zugeordnet sein — z.B. Marketing-Systeme
--      + QR-Realtalk + Tracking-Tricks).
--   3. 24 Seed-Ideen in 6 Blog-Arten (Beobachtung, Praxis, Fehler, KI,
--      Vertrauen, Unternehmer) — jede mit Hook, Outline, Zielgruppe,
--      CTA-Vorschlag und Cross-Cluster-Verknuepfung.
-- ============================================

-- 1) Constraint erweitern
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
    'marketing_systems'
  ));

-- 2) Cross-Cluster-Tagging
alter table public.content_ideas
  add column if not exists secondary_clusters text[] null;

comment on column public.content_ideas.secondary_clusters is
  'Sekundaere Cluster fuer Cross-Cluster-Tagging. Eine Idee kann zum Beispiel '
  'gleichzeitig zu marketing_systems, qr_realtalk und tracking_tricks gehoeren. '
  'Primaer-Cluster bleibt in `cluster`, dieses Array ist additiv.';

-- 3) Seed-Ideen — 24 Stueck in 6 Blog-Arten
--    Format-Konvention: hook_pattern = "observation" | "practical" | "mistake"
--                                       | "ai" | "trust" | "founder-positioning"

-- ---- A) Beobachtungs-Blogs (4) ----
insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'marketing_systems',
  'Der Flyer war schön. Nur niemand wusste, was er tun sollte.',
  'Design gewinnt Aufmerksamkeit. Aber Handlung entsteht erst, wenn der nächste Schritt klar ist.',
  'Lokale Printkampagne mit perfektem Design, aber ohne klaren Next-Step. Warum schoene Flyer ohne Call-to-Action-Logik und Tracking nichts bringen — und wie eine messbare Mini-Bruecke (QR → Landingpage → Anfrage) aus dem gleichen Budget Anfragen erzeugt.',
  'Lokale Geschaefte, Studios, Restaurants, Dienstleister',
  'Kampagne analysieren lassen',
  'observation',
  'beobachtungs-blog',
  array['print_lebt','qr_realtalk','tracking_tricks'],
  'sympathisch-direkt'
),
(
  'marketing_systems',
  'Warum schöne Flyer oft nichts bringen',
  'Auffaellig ist nicht dasselbe wie wirksam. Ein Flyer ohne klare Frage ist nur Papier.',
  'Die 3 Stellen an denen Print-Kampagnen lautlos sterben: kein klares Versprechen, keine Bruecke ins Digitale, keine Messung. Mit konkretem Vorher/Nachher-Beispiel aus dem DACH-Mittelstand.',
  'KMU-Inhaber, Marketing-Manager kleiner Teams',
  'Mini-Audit starten',
  'observation',
  'beobachtungs-blog',
  array['print_lebt','everyday_marketing'],
  'sympathisch-direkt'
),
(
  'marketing_systems',
  'Der QR-Code war da. Nur niemand hatte einen Grund zu scannen.',
  'Ein QR-Code ist keine Strategie. Er ist eine Tuer — und Tueren brauchen einen Grund, durchgegangen zu werden.',
  'Was zwischen "QR-Code ist drauf" und "Mensch scannt" passiert: die Versprechen-Luecke. Was steht NEBEN dem QR? Welche Frage beantwortet er? Beispiele aus Apotheken, Bestattern, Eisdielen — wann scannen Leute, wann nicht.',
  'Lokale KMU, Print-Designer, Eventbueros',
  'Tracking-Setup besprechen',
  'observation',
  'beobachtungs-blog',
  array['qr_realtalk','print_lebt'],
  'sympathisch-direkt'
),
(
  'marketing_systems',
  'Warum Kunden nicht klicken, obwohl alles richtig aussieht',
  'Es ist selten das Design. Es ist fast immer die Frage davor: "Was soll ich denken bevor ich klicke?"',
  'Landingpages, Newsletter, Anzeigen — wenn die unterschwellige Frage des Lesers nicht beantwortet wird, ist die schoenste UI nutzlos. Mini-Checkliste fuer "Warum klickt hier niemand?" mit 5 Diagnose-Fragen.',
  'Performance-Marketer, Newsletter-Betreiber, E-Commerce',
  'Kampagne analysieren lassen',
  'observation',
  'beobachtungs-blog',
  array['tracking_tricks','email_shortlinks'],
  'sympathisch-direkt'
);

-- ---- B) Praxis-Blogs (4) ----
insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'marketing_systems',
  'So würde ich ein lokales Geschäft in 7 Tagen messbarer machen',
  'Tag 1 ist nicht Werbung schalten. Tag 1 ist verstehen, was der Kunde tut bevor er reinkommt.',
  '7-Tage-Plan ohne Buzzwords: Tag 1 Touchpoint-Audit, Tag 2 eine klare Frage formulieren, Tag 3 QR + Landingpage, Tag 4 Tracking-Hygiene, Tag 5 erster Test mit 50 Flyern, Tag 6 Messung, Tag 7 Anpassung. Praxis-Beispiel: Friseur Leipzig.',
  'Inhaber lokaler Geschaefte, Solo-Marketer',
  'System gemeinsam aufbauen',
  'practical',
  'praxis-blog',
  array['mittelstand','tracking_tricks','print_lebt'],
  'praxis-erfahren'
),
(
  'marketing_systems',
  'Ein Mini-Funnel für Blumenläden, Friseure und Studios',
  'Du brauchst kein HubSpot. Du brauchst drei Schritte und eine ehrliche Frage am Anfang.',
  'Mini-Funnel-Bauplan: Touchpoint (Schaufenster, Flyer, Visitenkarte) → Bruecke (QR/Kurzlink) → Landingpage mit EINER klaren Frage → Anfrage oder Newsletter. Konkrete Beispiele und CTA-Texte zum Kopieren.',
  'Blumenlaeden, Friseure, Yoga-Studios, kleine Dienstleister',
  'Mini-Audit starten',
  'practical',
  'praxis-blog',
  array['mittelstand','email_shortlinks'],
  'praxis-erfahren'
),
(
  'marketing_systems',
  'Wie man aus einer Visitenkarte eine messbare Kampagne macht',
  'Eine Visitenkarte ist 8,5×5,5 cm Werbeflaeche, die du verschenkst. Schade, sie ungenutzt zu lassen.',
  'Visitenkarte als Mini-Funnel-Einstieg: personalisierter Kurzlink statt nackter Website, klare Sub-Frage ("Soll ich dir das Konzept als 1-Pager schicken?"), Tracking welche Karte wann scannt. ROI-Beispielrechnung.',
  'Solopreneure, Berater, Freelancer, Vertriebler',
  'Tracking-Setup besprechen',
  'practical',
  'praxis-blog',
  array['print_lebt','email_shortlinks','tracking_tricks'],
  'praxis-erfahren'
),
(
  'marketing_systems',
  'Die 4 Touchpoints, die zwischen "gefällt mir" und "ich frage an" liegen',
  'Zwischen Interesse und Anfrage liegen vier kleine Bruecken. Wenn eine bricht, faellt der Kunde lautlos durch.',
  'Touchpoint 1: erste Wahrnehmung. 2: Verstaendnis was du machst. 3: Vertrauen dass du es kannst. 4: Reibungslose Anfrage. Pro Touchpoint: was schiefgeht, was hilft, wie man es misst.',
  'KMU-Inhaber, Marketing-Manager, B2B-Sales',
  'System gemeinsam aufbauen',
  'practical',
  'praxis-blog',
  array['tracking_tricks','everyday_marketing'],
  'praxis-erfahren'
);

-- ---- C) Fehler-Blogs (4) ----
insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'marketing_systems',
  'Der teuerste Marketingfehler ist nicht schlechtes Design',
  'Schlechtes Design kostet Sympathie. Ein fehlendes System kostet Kunden.',
  'Warum Unternehmen Tausende fuer Rebrandings ausgeben aber nicht 20 Minuten fuer eine klare Kunden-Frage. Drei reale (anonymisierte) Faelle in denen Design-Geld verbrannt wurde, waehrend die Konversions-Luecke offen blieb.',
  'Geschaeftsfuehrer KMU, Marketing-Entscheider',
  'Marketing-Check anfragen',
  'mistake',
  'fehler-blog',
  array['everyday_marketing','geld_business'],
  'leicht-provokant'
),
(
  'marketing_systems',
  'Warum 800 € Budget verschwinden, ohne dass jemand es merkt',
  'Wenn niemand misst, merkt auch keiner dass das Geld weg ist. Werbebudget ohne Tracking ist Spenden mit Logo.',
  'Konkretes Beispiel: 800 EUR Print + Social-Mix bei einem Handwerker. Ohne UTM, ohne QR-Tracking, ohne Landingpage-Logging. Was am Monatsende uebrig blieb (Erkenntnis: nichts) und was fuer 30 Minuten Setup anders gewesen waere.',
  'Handwerksbetriebe, lokale Dienstleister, Solo-Marketer',
  'Mini-Audit starten',
  'mistake',
  'fehler-blog',
  array['tracking_tricks','geld_business','print_lebt'],
  'leicht-provokant'
),
(
  'marketing_systems',
  'Der Kunde wollte Reichweite. Gebraucht hätte er Klarheit.',
  'Mehr Reichweite verstaerkt nur, was schon da ist. Wenn die Botschaft unklar ist, hoeren mehr Leute nichts.',
  'Warum "Wir brauchen mehr Sichtbarkeit" fast nie das echte Problem ist. Diagnostik: zuerst Botschaft pruefen, dann Funnel pruefen, dann Reichweite. Anekdotisches Beispiel aus einem Coaching-Gespraech.',
  'Startup-Founder, Agentur-Kunden, KMU mit Marketing-Frust',
  'Marketing-Check anfragen',
  'mistake',
  'fehler-blog',
  array['everyday_marketing','founder_diary'],
  'leicht-provokant'
),
(
  'marketing_systems',
  'Was passiert, wenn niemand die Ergebnisse der Kampagne misst',
  'Eine Kampagne ohne Messung ist eine Meinung. Mit Messung wird sie ein Argument.',
  'Drei Szenarien: (1) Kampagne lief gut, niemand weiss es — Wiederholung scheitert; (2) Kampagne floppte, niemand weiss warum — Geld doppelt verbrannt; (3) Kampagne lief mittel, Tracking zeigt EINEN Touchpoint mit 4x-Conversion — Hebel gefunden. Minimaler Tracking-Stack der ueberall passt.',
  'Marketing-Manager, KMU-Inhaber, Agentur-Owner',
  'Tracking-Setup besprechen',
  'mistake',
  'fehler-blog',
  array['tracking_tricks','everyday_marketing'],
  'leicht-provokant'
);

-- ---- D) KI-Blogs (4) ----
insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'marketing_systems',
  'Was KI im Marketing kann — und was sie nicht entscheiden sollte',
  'KI ist ein guter Praktikant. Sie fuehrt aus, sie entscheidet nicht. Den Unterschied zu verwischen kostet Vertrauen.',
  'Konkrete Aufgaben-Matrix: Texte ja, Strategie nein. Personalisierung ja, Kundenversprechen nein. Reports ja, Pricing-Entscheidung nein. Mit n8n-Praxis-Beispiel: KI-Agent erstellt Newsletter-Varianten, Mensch wahlt aus.',
  'Marketing-Manager, Solopreneure mit KI-Workflow',
  'Idee gemeinsam prüfen',
  'ai',
  'ki-blog',
  array['ai_marketing','ai_risk'],
  'professionell-realistisch'
),
(
  'marketing_systems',
  'Warum ChatGPT keine Marketingstrategie ersetzt',
  'ChatGPT formuliert Antworten zu Fragen, die du schon hast. Strategie ist die Frage zu finden, die noch keiner gestellt hat.',
  'Was ein LLM gut kann (variieren, formulieren, zusammenfassen) und was Strategie ausmacht (Positionierung, Trade-offs, Mut zur Auslassung). Beispiel: ChatGPT-generierter Pitch vs Pitch mit echter Entscheidung. Wo KI hilft, wo sie nur Output liefert.',
  'Startup-Founder, Marketing-Verantwortliche, Agenturen',
  'Marketing-Check anfragen',
  'ai',
  'ki-blog',
  array['ai_marketing','founder_diary'],
  'professionell-realistisch'
),
(
  'marketing_systems',
  'KI spart Zeit. Aber nur, wenn der Prozess stimmt.',
  'KI auf einen schlechten Prozess gibt dir denselben schlechten Output — nur schneller. Erst der Prozess, dann der Agent.',
  'Vorher: 3 Stunden Newsletter bauen. KI dazu: 2,5 Stunden. Erst nach Prozess-Refactor (Templates, Quellen, Freigabe-Pfad): 35 Minuten. Was zwischen Pre/Post-KI-Workflow stand und wie man es findet.',
  'Solopreneure, Marketing-Praktiker, Agentur-Teams',
  'System gemeinsam aufbauen',
  'ai',
  'ki-blog',
  array['ai_marketing','everyday_marketing'],
  'professionell-realistisch'
),
(
  'marketing_systems',
  'Drei Marketing-Aufgaben, die KI heute schon zuverlässig übernimmt',
  'Nicht alles ist Magie. Aber drei Dinge erledigt KI bereits so gut, dass Menschen sie nicht mehr machen sollten.',
  '(1) Subject-Line-Varianten + Vorschau-Text, (2) Marketing-Asset-Quality-Check (Tonalitaet, Tippfehler, Klarheit), (3) Daten-Zusammenfassung aus Tracking-Reports. Praxis-Beispiele mit n8n + ChatGPT-Setup, was es kostet, wo Grenzen liegen.',
  'KMU-Marketing, Solo-Marketer, Newsletter-Betreiber',
  'Idee gemeinsam prüfen',
  'ai',
  'ki-blog',
  array['ai_marketing','email_shortlinks'],
  'professionell-realistisch'
);

-- ---- E) Vertrauens-Blogs (4) ----
insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'marketing_systems',
  'Warum Kunden nicht scannen, wenn sie dir nicht vertrauen',
  'Vertrauen kommt vor Klick. Wer das Verhaeltnis dreht, ruiniert beide.',
  'Scan-Verhalten ist Vertrauens-Verhalten. Was zwischen "ich sehe einen QR" und "ich scanne" passiert: Kontext, Versprechen, Domain-Optik. Drei reale Mini-Faelle in denen Vertrauen die Conversion-Differenz war.',
  'Lokale KMU, Print-Marketer, Eventbueros',
  'Mini-Audit starten',
  'trust',
  'vertrauens-blog',
  array['qr_realtalk','print_lebt'],
  'bodenstaendig-ehrlich'
),
(
  'marketing_systems',
  'Ein gutes Angebot beginnt nicht mit Rabatt',
  'Rabatt ist die Antwort, wenn du nicht weisst, was dein Angebot wirklich loest. Klarheit kostet weniger und wirkt laenger.',
  'Warum 20%-Rabatt-Kampagnen kurzfristig Reichweite und langfristig Margen ruinieren. Statt Rabatt: praeziseres Versprechen, klarerer Problem-Fokus, niedrigschwelliger Einstieg ("Lass uns 20 Minuten reden").',
  'Berater, Solopreneure, KMU mit Service-Modell',
  'Marketing-Check anfragen',
  'trust',
  'vertrauens-blog',
  array['geld_business','founder_diary'],
  'bodenstaendig-ehrlich'
),
(
  'marketing_systems',
  'Marketing funktioniert erst, wenn die Frage klar ist',
  'Die meisten Marketing-Probleme sind Frage-Probleme. Klare Frage → klare Antwort → klare Conversion.',
  'Drei Diagnose-Fragen die jede Kampagne ueberlebt: Welche Frage hat der Leser im Kopf bevor er sieht? Welche Frage will ich beantworten? Welche Frage soll danach uebrig bleiben? Mit Beispielen aus Print, Newsletter und Landingpage.',
  'Marketing-Praktiker, KMU-Marketing-Verantwortliche',
  'Idee gemeinsam prüfen',
  'trust',
  'vertrauens-blog',
  array['everyday_marketing','email_shortlinks'],
  'bodenstaendig-ehrlich'
),
(
  'marketing_systems',
  'Was passiert zwischen "gehört" und "gebucht" — und warum das messbar sein muss',
  'Zwischen Erstkontakt und Buchung sind im Schnitt 7 Beruehrungen. Wer nur die letzte misst, dankt der falschen Person.',
  'Customer-Journey aus Sicht eines kleinen Beratungs-Geschaefts: LinkedIn-Post, Newsletter, Webseite, Empfehlung, zweite Webseiten-Visite, QR auf Visitenkarte, Anfrage. Wie man Multi-Touch ohne Enterprise-Stack tracked.',
  'B2B-Service-Anbieter, Coaches, Solopreneure',
  'Tracking-Setup besprechen',
  'trust',
  'vertrauens-blog',
  array['tracking_tricks','email_shortlinks'],
  'bodenstaendig-ehrlich'
);

-- ---- F) Unternehmer-Blogs (4) ----
insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'marketing_systems',
  'Startups bauen Features. Kunden kaufen Lösungen.',
  'Jedes Feature-Update fuehlt sich produktiv an. Aber Kunden zahlen nicht fuer Features — sie zahlen fuer ein erledigtes Problem.',
  'Klassische Bauen-statt-Verkaufen-Falle. Wie man die Kommunikation umdreht: nicht "Wir haben X gebaut", sondern "Du hast Problem Y und das ist jetzt geloest". Mit Vorher/Nachher Landingpage-Texten.',
  'Startup-Founder, SaaS-Founder, Indie-Hacker',
  'Idee gemeinsam prüfen',
  'founder-positioning',
  'unternehmer-blog',
  array['founder_diary','ai_marketing'],
  'unternehmer-realistisch'
),
(
  'marketing_systems',
  'Warum dein Produkt nicht erklärt, welches Problem es löst',
  'Produkte beschreiben sich selbst. Marketing erklaert, was sich fuer den Kunden veraendert.',
  'Der "Feature-Liste-Trap": Bullet-Points was das Produkt KANN, statt was es VERAENDERT. Konkretes Beispiel mit Tool-Webseite vorher/nachher, mit dem Test: kann man in 5 Sekunden sagen, fuer wen es ist und was sich aendert?',
  'Founder, Produktmanager, Marketing-Verantwortliche',
  'Marketing-Check anfragen',
  'founder-positioning',
  'unternehmer-blog',
  array['founder_diary','everyday_marketing'],
  'unternehmer-realistisch'
),
(
  'marketing_systems',
  'Marketing ist kein Post. Marketing ist ein System.',
  'Ein Post ist ein Versuch. Ein System ist eine Maschine, die aus Versuchen Erkenntnisse macht.',
  'Drei Ebenen: (1) Inhalt — was wird gesagt; (2) Verteilung — wer sieht es wo; (3) Messung — was passiert danach. Ohne Ebene 3 ist Marketing Hoffnung. Mit allen drei wird es ein wiederholbares System.',
  'KMU-Inhaber, Marketing-Manager, Agentur-Strategen',
  'System gemeinsam aufbauen',
  'founder-positioning',
  'unternehmer-blog',
  array['tracking_tricks','everyday_marketing'],
  'unternehmer-realistisch'
),
(
  'marketing_systems',
  'Der Tag, an dem ich gemerkt habe: Reichweite ohne Tracking ist nur Glück',
  'Ich hatte gute Posts und gute Wochen. Was fehlte, war zu wissen warum. Ohne das ist Wachstum Zufall.',
  'David-Ich-Erzaehlung: Phase mit gutem Output ohne Mess-Disziplin. Dann ein Quartal mit konsequentem UTM + Spurig-Tracking — und der erste Moment in dem "warum" eine Antwort hatte. Was sich danach im Wochenrhythmus aenderte.',
  'Solopreneure, Indie-Founder, Marketing-Praktiker',
  'Tracking-Setup besprechen',
  'founder-positioning',
  'unternehmer-blog',
  array['founder_diary','tracking_tricks'],
  'unternehmer-realistisch'
);
