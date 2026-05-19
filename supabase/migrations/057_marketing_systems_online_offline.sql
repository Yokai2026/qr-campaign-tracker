-- ============================================
-- Marketing-Systeme: 18 Blog-Ideen "Online trifft Offline"
-- ============================================
-- Strategische Erweiterung: David soll nicht nur als KI-/Online-Marketing-
-- Person wirken, sondern als jemand der Online + Offline Marketing zusammen
-- versteht. Diese 18 Ideen zeigen die komplette Strecke:
--
--   Plakat → QR-Code → Landingpage → Angebot → Eintrag → E-Mail → Termin
--   → Tracking-Auswertung.
--
-- Alle Ideen gehoeren zu cluster='marketing_systems' und nutzen
-- secondary_clusters[] um die Bruecke zu Print/QR/Tracking/Email/KI zu zeigen.
-- "Online trifft Offline" als separater Cluster bewusst NICHT angelegt —
-- statt einem neuen Pillar zu erfinden, koppeln wir es als Tagging-Layer in
-- den bestehenden marketing_systems-Cluster. Das vermeidet Daten-Fragmentierung
-- und bleibt UX-konsistent (User scrollt einen Cluster, nicht zwei).
--
-- blog_format='online-offline-bridge' macht diese Ideen als Sub-Familie
-- queryable, falls spaeter ein Sub-Filter gewuenscht ist.
-- ============================================

insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values
(
  'marketing_systems',
  'Der Flyer war offline. Der Fehler war online.',
  'Viele Kampagnen scheitern nicht am Druck, sondern an der Seite, auf die sie führen.',
  'Print-Kampagne mit gutem Design, aber die Landingpage laedt langsam, Versprechen passt nicht, Call-to-Action fehlt. Wie man Print + Landingpage als Einheit denkt: identische Botschaft, schneller Mobile-Load, EIN klares Next-Step.',
  'Lokale Unternehmen, Print-Werber, Marketing-Manager KMU',
  'Kampagne analysieren lassen',
  'observation',
  'online-offline-bridge',
  array['print_lebt','tracking_tricks','qr_realtalk'],
  'sympathisch-direkt'
),
(
  'marketing_systems',
  'Dein QR-Code ist kein Ziel. Er ist der Anfang.',
  'Wer scannt, braucht danach einen klaren nächsten Schritt.',
  'QR-Code als Tuer, nicht als Endpunkt. Was hinter dem Scan passieren muss: passende Seite, klares Angebot, niedrigschwellige Anfrage. Beispiele: Apotheke, Eisdiele, Tierarzt — wo Scans ins Leere laufen und wie man das fixt.',
  'Lokale Geschaefte, Print-Designer, Eventbueros',
  'Tracking-Setup besprechen',
  'practical',
  'online-offline-bridge',
  array['qr_realtalk','print_lebt','tracking_tricks'],
  'sympathisch-direkt'
),
(
  'marketing_systems',
  'Warum dein Schaufenster mehr über deine Website verrät als du denkst.',
  'Offline entscheidet oft, ob online überhaupt Vertrauen entsteht.',
  'Wer im Schaufenster Klarheit sieht, erwartet Klarheit online. Wer offline Chaos sieht, klickt online schon mit Skepsis. Wie Schaufenster, Tuerschild, Visitenkarte das Vertrauens-Niveau VORHER festlegen — und was Webseiten daraus lernen koennen.',
  'Inhaber lokaler Geschaefte, Marketing-Manager, Berater',
  'Marketing-Check anfragen',
  'observation',
  'online-offline-bridge',
  array['print_lebt','creator_design','everyday_marketing'],
  'bodenstaendig-ehrlich'
),
(
  'marketing_systems',
  'Ein Plakat ohne Landingpage ist nur Dekoration.',
  'Sichtbarkeit ist gut. Messbarkeit ist besser.',
  'Out-of-Home (Plakat, Bus, Litfass) ohne digitalen Abschluss kann man nicht auswerten. Mini-Bauanleitung: jeder Plakatmotiv-Variante eigener Kurzlink, jeweils eigene Landingpage-Variante, klare Conversion-Definition. ROI-Beispielrechnung.',
  'Marketing-Manager mit OOH-Budget, Mittelstand, Agenturen',
  'Tracking-Setup besprechen',
  'practical',
  'online-offline-bridge',
  array['print_lebt','tracking_tricks','email_shortlinks'],
  'sympathisch-direkt'
),
(
  'marketing_systems',
  'Der Kunde stand im Laden. Danach war er weg.',
  'Warum lokale Unternehmen Offline-Kontakte digital weiterführen müssen.',
  'Vor-Ort-Gespraech endet in "Schauen Sie sich gerne um" — und der Kontakt ist verloren. Mini-System: QR auf Tresen, Empfehlung-Newsletter, Termin-Buchungslink auf Quittung. Wie aus Laden-Besuchern wiederkehrende Kunden werden, ohne CRM-Monster.',
  'Einzelhandel, Gastronomie, Studios, Praxen, Werkstaetten',
  'System gemeinsam aufbauen',
  'practical',
  'online-offline-bridge',
  array['mittelstand','email_shortlinks','tracking_tricks'],
  'praxis-erfahren'
),
(
  'marketing_systems',
  'Print lebt. Aber nur, wenn online etwas passiert.',
  'Flyer, Karten und Gutscheine können funktionieren — wenn sie Teil eines Systems sind.',
  'Print isoliert ist Hoffnung. Print + digitaler Anschluss ist Marketing. Drei Mini-Stacks: (1) Flyer + QR + Landingpage, (2) Visitenkarte + Kurzlink + Lead-Form, (3) Gutschein + Code + Tracking. Was kostet, was bringt es.',
  'Print-Werber, KMU, Eventbueros, lokale Dienstleister',
  'Mini-Audit starten',
  'practical',
  'online-offline-bridge',
  array['print_lebt','tracking_tricks','qr_realtalk'],
  'praxis-erfahren'
),
(
  'marketing_systems',
  'Warum QR-Codes ohne Angebot niemanden interessieren.',
  'Menschen scannen nicht wegen Technik. Sie scannen wegen einem Grund.',
  'Der "leere QR" — auf der Visitenkarte, im Schaufenster, auf dem Flyer, ohne Versprechen daneben. Was Leser sehen muessen BEVOR sie scannen: ein konkretes Nutzen-Versprechen in 5 Woertern. Beispiele die funktionieren vs Beispiele die ignoriert werden.',
  'Lokale Werber, Print-Designer, Eventbueros',
  'Idee gemeinsam prüfen',
  'observation',
  'online-offline-bridge',
  array['qr_realtalk','print_lebt','creator_design'],
  'sympathisch-direkt'
),
(
  'marketing_systems',
  'Vom Messestand zur Anfrage: Die 5-Minuten-Strecke.',
  'Wie ein Gespräch auf einer Messe nicht im Papierstapel endet.',
  'Klassischer Messe-Fail: Visitenkarten gesammelt, drei Wochen spaeter weggeworfen. Statt dessen 5-Minuten-Strecke: persoenliches Gespraech → QR-Visitenkarte mit Mini-Form → automatischer Follow-Up-Mail-Trigger → Kalendly-Termin. Komplette Toolkette unter 50 EUR/Monat.',
  'B2B-Sales, Messe-Aussteller, Eventbueros, Solopreneure',
  'System gemeinsam aufbauen',
  'practical',
  'online-offline-bridge',
  array['email_shortlinks','tracking_tricks','ai_marketing'],
  'praxis-erfahren'
),
(
  'marketing_systems',
  'Was ein Friseur, ein Blumenladen und ein Startup gemeinsam falsch machen.',
  'Sie wollen Aufmerksamkeit, aber bauen keinen sauberen nächsten Schritt.',
  'Drei sehr unterschiedliche Branchen, derselbe Fehler: Reichweite-Fokus statt Funnel-Logik. Friseur postet auf Instagram ohne Buchungs-CTA. Blumenladen verteilt Flyer ohne Landingpage. Startup baut Sales-Page ohne klaren Sub-Step. Jeweils ein 30-Minuten-Fix.',
  'Solopreneure, lokale Geschaefte, Startup-Founder',
  'Marketing-Check anfragen',
  'mistake',
  'online-offline-bridge',
  array['mittelstand','founder_diary','everyday_marketing'],
  'leicht-provokant'
),
(
  'marketing_systems',
  'Deine Visitenkarte kann mehr als Name und Nummer.',
  'Sie kann ein Einstieg in einen messbaren Kundenprozess sein.',
  'Standard-Visitenkarte = totes Papier. Smart-Visitenkarte = Funnel-Einstieg: personalisierter Kurzlink statt nackter Domain, EINE klare Sub-Frage auf der Rueckseite ("Soll ich dir das 1-Pager-Konzept senden?"), Lead-Form mit 2 Feldern. Welche Visitenkarte wann scannt.',
  'Berater, Freelancer, Solopreneure, B2B-Vertrieb',
  'Tracking-Setup besprechen',
  'practical',
  'online-offline-bridge',
  array['print_lebt','email_shortlinks','tracking_tricks'],
  'praxis-erfahren'
),
(
  'marketing_systems',
  'Offline Vertrauen. Online Abschluss.',
  'Warum viele Käufe schon im echten Leben beginnen, aber digital abgeschlossen werden.',
  'Hybrid-Customer-Journey: Empfehlung von Freund (offline) → Google-Suche → Webseite → Anfrage. Oder: Messe-Gespraech → Webseiten-Recheck → Email-Anfrage. Der Online-Abschluss misst nur den letzten Schritt — das echte Geschehen liegt davor. Wie man die Offline-Quellen sichtbar macht.',
  'B2B-Service-Anbieter, Beratungen, Coaches',
  'Tracking-Setup besprechen',
  'trust',
  'online-offline-bridge',
  array['tracking_tricks','founder_diary','everyday_marketing'],
  'bodenstaendig-ehrlich'
),
(
  'marketing_systems',
  'Der Gutschein wurde verteilt. Niemand weiß, ob er funktioniert hat.',
  'Wie man lokale Aktionen messbar macht, ohne kompliziert zu werden.',
  'Klassiker: 2.000 Gutscheine verteilt, am Monatsende keine Auswertung. Drei Wege zur Messung ohne Kassen-System-Umbau: (1) Unique-Codes pro Verteilkanal, (2) QR-Code auf Gutschein zu Tracking-Landingpage, (3) Mini-Form bei Einloesung. Was am einfachsten skaliert.',
  'Einzelhandel, Gastronomie, Eventveranstalter, KMU',
  'Mini-Audit starten',
  'practical',
  'online-offline-bridge',
  array['print_lebt','tracking_tricks','mittelstand'],
  'praxis-erfahren'
),
(
  'marketing_systems',
  'Warum lokale Unternehmen kein größeres Budget brauchen, sondern bessere Fragen.',
  'Vor jeder Kampagne muss klar sein, was eigentlich getestet wird.',
  'Mehr Budget verstaerkt eine unklare Frage nur lauter. Drei Diagnose-Fragen vor jeder Kampagne: (1) Welcher Kunde, welches Problem? (2) Was soll als naechstes passieren? (3) Wie merken wir, ob es funktioniert? Beispiel: Frisoer Leipzig spart 600 EUR durch eine bessere Frage.',
  'Inhaber lokaler Geschaefte, KMU mit Marketing-Frust',
  'Marketing-Check anfragen',
  'mistake',
  'online-offline-bridge',
  array['mittelstand','geld_business','everyday_marketing'],
  'leicht-provokant'
),
(
  'marketing_systems',
  'KI schreibt Texte. Aber sie kennt deinen Laden nicht.',
  'Warum KI im Marketing erst stark wird, wenn echte Kundenerfahrung dazukommt.',
  'ChatGPT-Output ohne Kundenerfahrung = generischer Text. ChatGPT-Output mit konkretem Kundenwissen (Gespraechsfetzen vom Tresen, Einwaende aus Verkaufsgespraechen, Anekdoten aus dem Laden) = Texte die wirken. Wie man Offline-Kundenwissen systematisch fuer KI-Prompts sammelt.',
  'KMU-Marketing, Solopreneure, Agentur-Texter',
  'Idee gemeinsam prüfen',
  'ai',
  'online-offline-bridge',
  array['ai_marketing','mittelstand','everyday_marketing'],
  'professionell-realistisch'
),
(
  'marketing_systems',
  'Der Kunde fragt nicht nach KI. Er fragt nach Klarheit.',
  'Automatisierung ist nur wertvoll, wenn das Angebot vorher verständlich ist.',
  'KI-Automation rettet keine unklare Botschaft — sie skaliert sie nur. Drei Beispiele: (1) Newsletter-Automation ohne klaren Use-Case → Output ohne Effekt. (2) Chatbot ohne klares Angebot → frustrierte Leser. (3) KI-Personalisierung ohne Kunden-Differenzierung. Erst klare Botschaft, dann Automation.',
  'KMU-Marketing, B2B-Founder, Marketing-Verantwortliche',
  'Marketing-Check anfragen',
  'ai',
  'online-offline-bridge',
  array['ai_marketing','ai_risk','everyday_marketing'],
  'professionell-realistisch'
),
(
  'marketing_systems',
  'Der QR-Code war gut. Die Seite war langsam.',
  'Offline-Werbung verliert, wenn online der erste Eindruck bricht.',
  'Print + QR + Landingpage muessen als Einheit performen. Wenn die Landingpage in 4 Sekunden nicht laedt, ist der Print-Spend verbrannt. Konkrete Performance-Checkliste: Mobile-First, < 2s LCP, Above-the-Fold-Versprechen, KEIN Cookie-Banner-Drama vor dem Versprechen.',
  'Marketing-Manager, Web-Verantwortliche, Print-Werber',
  'Kampagne analysieren lassen',
  'mistake',
  'online-offline-bridge',
  array['print_lebt','qr_realtalk','tracking_tricks'],
  'sympathisch-direkt'
),
(
  'marketing_systems',
  'Warum dein Newsletter schon im Laden beginnt.',
  'Der beste E-Mail-Kontakt entsteht oft nicht online, sondern im echten Gespräch.',
  'Online-Lead-Gen kostet 5-15 EUR pro Subscriber. Offline-Lead-Gen im echten Gespraech: nahezu null. Wie man Vor-Ort-Touchpoints fuer Newsletter-Anmeldung nutzt: Tresenkarte mit QR, Bon-Footer-Code, Visitenkarten-Rueckseite. Plus DSGVO-konformer Double-Opt-In ohne Reibung.',
  'Einzelhandel, Gastronomie, Praxen, Studios, Friseure',
  'System gemeinsam aufbauen',
  'practical',
  'online-offline-bridge',
  array['email_shortlinks','mittelstand','compliance_lite'],
  'praxis-erfahren'
),
(
  'marketing_systems',
  'Online-Marketing beginnt nicht im Browser.',
  'Es beginnt dort, wo Menschen dich zum ersten Mal wahrnehmen.',
  'Der erste Touchpoint ist fast nie online. Es ist eine Empfehlung, ein Schaufenster, ein Gespraech, eine Visitenkarte, ein Plakat. Online faengt dort an, wo Vertrauen schon entstanden ist — oder eben nicht. Mental-Model fuer Marketing-Verantwortliche: Wahrnehmen → Verstehen → Vertrauen → Klicken.',
  'Marketing-Manager, Founder, Marketing-Strategen',
  'Idee gemeinsam prüfen',
  'founder-positioning',
  'online-offline-bridge',
  array['print_lebt','founder_diary','everyday_marketing'],
  'unternehmer-realistisch'
);
