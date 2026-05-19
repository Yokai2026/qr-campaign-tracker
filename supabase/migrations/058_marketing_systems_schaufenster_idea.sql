-- ============================================
-- Marketing-Systeme: Schaufenster-Website-Bruecke ergaenzen
-- ============================================
-- User wuenschte das Beispiel "Dein Schaufenster arbeitet. Deine Website schläft."
-- Wir hatten bisher die Variante "Warum dein Schaufenster mehr ueber deine Website
-- verraet als du denkst." — diese laesst die kritische Spannung weg.
-- Diese Migration fuegt die zugespitzte Variante zusaetzlich ein. Beide bleiben
-- erhalten (User kann selbst aussortieren).
-- ============================================

insert into public.content_ideas (
  cluster, title, angle, outline, target_audience, cta_suggestion,
  hook_pattern, blog_format, secondary_clusters, tonality
) values (
  'marketing_systems',
  'Dein Schaufenster arbeitet. Deine Website schläft.',
  'Viele Kunden entscheiden offline, ob sie online überhaupt klicken.',
  'Lokale Geschaefte haben oft das beste Marketing direkt an der Strasse — und versenken es online. Schaufenster ist klar, einladend, aktuell. Webseite: alt, langsam, ohne klares Versprechen. Drei Fragen die Schaufenster und Webseite synchronisieren: (1) Welches Versprechen sehen Passanten? (2) Wird es online gehalten? (3) Was ist der naechste konkrete Schritt? Praxis-Beispiele: Optiker, Floristen, Friseure.',
  'Laeden, Optiker, Floristen, Friseure, Studios',
  'Marketing-Check anfragen',
  'observation',
  'online-offline-bridge',
  array['print_lebt','mittelstand','everyday_marketing'],
  'sympathisch-direkt'
);
