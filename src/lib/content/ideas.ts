/**
 * Content-Ideas-Generator + Blog-Expander via Claude.
 *
 * Pipeline:
 *  1. generateIdeasForCluster(cluster) -> 15 Social-Media-vibrierende Ideen
 *  2. expandIdeaToBlog(idea)            -> 900-1300 Worte Markdown-Blog
 *
 * Robust gegen Claude-JSON-Parse-Fails: Blog kommt im META/BODY-Block-Format
 * (separater Body statt JSON-embedded markdown).
 */

import { CLUSTER_DESCRIPTION, CLUSTER_LABEL, type ContentCluster } from './pillars';
import { SPURIG_VOICE } from './spurig-voice';

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

/**
 * Web-Search ist standardmaessig AN — schaltbar via CONTENT_DISABLE_WEB_SEARCH=1.
 * Bringt aktuelle DACH-Marketing-News / DSGVO-Urteile / Wettbewerbs-Pricing
 * in die Generation rein.
 */
const WEB_SEARCH_ENABLED = process.env.CONTENT_DISABLE_WEB_SEARCH !== '1';
const WEB_SEARCH_MAX_USES = Number(process.env.CONTENT_WEB_SEARCH_MAX_USES ?? '5');

/**
 * Server-side Web-Search-Tool (Anthropic built-in). Claude fuehrt die Search
 * selbst aus und faedelt die Ergebnisse in die Antwort ein. Der finale Text-Block
 * enthaelt die synthetisierte Antwort.
 *
 * Die Tool-Version 20250305 ist die aktuell stabile GA-Version.
 */
const WEB_SEARCH_TOOL = {
  type: 'web_search_20250305',
  name: 'web_search',
  max_uses: WEB_SEARCH_MAX_USES,
  user_location: {
    type: 'approximate',
    country: 'DE',
    timezone: 'Europe/Berlin',
  },
} as const;

type ClaudeContentBlock = {
  type: string;
  text?: string;
};

/**
 * Ruft Claude auf. Bei aktiviertem Web-Search wird das Tool mitgeschickt;
 * Claude fuehrt die Searches server-side aus und liefert am Ende den finalen
 * Text-Block.
 *
 * Bei Web-Search-Antworten gibt es mehrere Content-Blocks: server_tool_use,
 * web_search_tool_result und mehrere text-Blocks. Wir nehmen den LETZTEN
 * text-Block (= finale Antwort nach allen Searches).
 *
 * Faellt automatisch auf non-search-Call zurueck wenn Anthropic 4xx mit
 * tool-unbekannt zurueckliefert.
 */
async function callClaude(
  apiKey: string,
  prompt: string,
  opts: { maxTokens: number; useSearch?: boolean },
): Promise<string> {
  const useSearch = (opts.useSearch ?? true) && WEB_SEARCH_ENABLED;

  const body: Record<string, unknown> = {
    model: CLAUDE_MODEL,
    max_tokens: opts.maxTokens,
    messages: [{ role: 'user', content: prompt }],
  };
  if (useSearch) body.tools = [WEB_SEARCH_TOOL];

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    // Web-Search nicht verfuegbar / nicht freigeschaltet → Retry ohne Tool
    if (useSearch && (res.status === 400 || res.status === 403) && err.includes('web_search')) {
      return callClaude(apiKey, prompt, { ...opts, useSearch: false });
    }
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as { content?: ClaudeContentBlock[] };
  const textBlocks = (data.content ?? []).filter((c) => c.type === 'text' && c.text);
  if (textBlocks.length === 0) {
    throw new Error('Claude response contains no text blocks');
  }
  // Finale Antwort ist der LETZTE text-Block (nach allen Tool-Roundtrips)
  return textBlocks[textBlocks.length - 1].text!.trim();
}

export type GeneratedIdea = {
  title: string;
  outline: string;
  angle: string;
  target_keywords?: string;
};

export type ExpandedBlog = {
  slug: string;
  title: string;
  description: string;
  tags: string[];
  body_md: string;
  image_prompt: string;
  image_alt: string;
};

// ---------------------------------------------------------------------------
// Ideas-Generator
// ---------------------------------------------------------------------------

export async function generateIdeasForCluster(
  cluster: ContentCluster,
  count = 15,
): Promise<GeneratedIdea[]> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const prompt = `${SPURIG_VOICE}

========================================
DEINE AUFGABE — IDEEN-GENERIERUNG FUER PILLAR "${CLUSTER_LABEL[cluster]}"
========================================

Pillar-Scope: ${CLUSTER_DESCRIPTION[cluster]}

Generiere ${count} CONTENT-IDEEN nach dem Elite-Psychologie-Framework oben.
Jede Idee muss Hook-Quality-Test (PART 7) bestehen und mind. 3 psychologische
Hebel (PART 3) einbauen.

----------------------------------------
RESEARCH-FIRST-PROTOKOLL (Pflicht — vor jeder Idee)
----------------------------------------
Du hast Zugriff auf web_search. **Nutze es BEVOR du Ideen generierst.**

Fuer den Pillar "${CLUSTER_LABEL[cluster]}" fuehre 3-5 gezielte Searches durch.
Suche nach AKTUELLEN, KONKRETEN, DEUTSCHEN Themen — nicht generischen Konzepten.

Such-Beispiele je nach Pillar:
- DSGVO/Privacy: "DSGVO Bußgeld 2026 Tracking", "Schrems II URTEIL 2026 marketing",
  "BfDI Bitly Verfahren", "Bayerisches Landesamt fuer Datenschutz Marketing"
- Offline-ROI: "Plakatwerbung ROI 2026 DACH", "Out-of-Home Werbung Effekt Messung",
  "DOOH Marktanteile Deutschland 2026"
- QR-Practices: "QR Code Scan Statistik DACH 2026", "QR Code Plakat Conversion Rate",
  "QR-Code in der Gastronomie 2026"
- Attribution: "Last-Click Attribution Tot 2026", "Multi-Touch DACH Marketing",
  "Cookie-less Tracking DACH"
- Behind-Scenes: "DACH Solopreneur SaaS 2026", "Indie Hacker Deutschland Stripe",
  "Build in Public DACH"

Ziel der Searches:
- 3 KONKRETE Fakten / Zahlen / News-Geschichten der LETZTEN 90 TAGE finden
- 2 echte Firmen / Behoerden / Personen die zitiert werden koennen
- 1 aktuelle Debatte / Kontroverse / Urteil das gerade laeuft
- Wettbewerbs-Pricing-Updates (Bitly Preisaenderungen, Rebrandly Pricing Changes)
- Reale Bußgeld-Faelle / DSGVO-Verfahren der letzten Monate

VERWENDE die Such-Ergebnisse in den Ideen:
- Zitiere konkrete Quellen, Daten, Behoerden in den "outline"-Feldern
- Mache Ideen TOPICAL ("Die ['Bußgeld-Fall XYZ'] zeigt: jeder DACH-Marketer mit
  Bitly hat ein Problem.")
- Wenn ein konkreter Fall in den News ist → eine Idee MUSS darauf basieren

NICHT generische Konzept-Ideen ohne aktuellen Bezug generieren wenn echte News
verfuegbar sind.

----------------------------------------
PRE-WRITING-ANALYSE (denk SELBER durch, vor dem Generieren)
----------------------------------------
NACH der Web-Research, mit den Ergebnissen im Kopf:
- 5 echte Situationen die ein DACH-Marketer / Founder / Restaurant-Besitzer wirklich erlebt
- 3 Mainstream-Annahmen die FALSCH sind (kontroverse Takes), idealerweise durch
  News-Findings belegt
- 3 konkrete Zahlen / Marken / Fakten aus der Web-Research die ueberraschen
- 2 Original-Saetze die ein Profi-Insider sagen wuerde
Erst dann: Ideen formulieren.

----------------------------------------
HOOK-QUALITAETS-SCHWELLE PRO IDEE
----------------------------------------
Bevor du eine Idee aufnimmst, pruefe den Titel gegen DIESEN Test:

Wuerde ein DACH-Marketer beim Scrollen auf LinkedIn / Reddit anhalten und denken
EINEN dieser Saetze:
  - "Das fuehle ich gerade."
  - "Das ist mir auch passiert."
  - "Wait, mache ich das auch?"
  - "Krass, daran hatte ich nie gedacht."
  - "Das wuerd ich kommentieren wollen."

Wenn NEIN → Idee verwerfen, neu schreiben.
Wenn JA → behalten.

----------------------------------------
TITEL-PATTERNS (Pflicht: nutze unterschiedliche Patterns ueber die ${count} Ideen verteilt)
----------------------------------------

PATTERN A — Echter Dialog (sehr stark):
- "Ein Anwalt sagte mir gestern einen Satz, der mich nicht loslaesst."
- "Eine Marketing-Chefin: 'Wir nutzen das seit 6 Jahren. Niemand weiss, ob das legal ist.'"

PATTERN B — Persoenlicher Fail / Selbstkritik:
- "Ich hab 8 Wochen das falsche Feature gebaut. Hier was ich uebersah."
- "27 Euro pro Plakat. Vier Standorte. Ich war schockiert."

PATTERN C — Konkrete Zahl + Pattern-Break:
- "23 von 47 Marketing-Teams: kein AV-Vertrag mit Bitly."
- "Drei Minuten Stille. Dann sagte sie: 'Ashburn, Virginia.'"

PATTERN D — Verlustangst + Specificity:
- "Sechs Jahre Klick-Daten. Ueber den Atlantik. Ohne Vertrag."
- "Was bei einem Bitly-Klick im Hintergrund passiert, bevor du auf der Seite landest."

PATTERN E — Provokante Behauptung:
- "Cookie-Banner sind nicht das DSGVO-Problem in deinem Marketing."
- "Bitly ist eine Falle. Jeder weiss es. Keiner sagt's."

PATTERN F — Hyper-spezifische Mini-Story:
- "Donnerstag 14:30. Ihr Buero in Duesseldorf. Sie konnte die Frage nicht beantworten."
- "Ein Restaurant-Besitzer aus Koeln zeigte mir seine QR-Code-Statistik. Eine Spalte fehlte."

NICHT generieren (Instant-Fail):
- "5 Tipps fuer besseres DSGVO-Tracking" (Listicle)
- "Was ist QR-Code-Tracking?" (Anfaenger-Frage)
- "Datensparsamkeit im modernen Marketing" (Whitepaper-Tone)
- "Tracking 101" / "Der ultimative Guide zu..." / "Alles was du wissen musst"
- Alles mit "innovativ", "revolutionaer", "Game Changer", "Spoiler:"

----------------------------------------
PRO IDEE LIEFERST DU 4 FELDER
----------------------------------------

* **title** (max 80 Zeichen):
  - Folgt einem der Patterns A-F
  - Besteht den Hook-Quality-Test (PART 7)
  - Hyper-spezifisch (Zahl ODER Ort ODER Marke ODER Rolle ODER Zeitpunkt)

* **angle** (Story-Hook fuer Intro, 1-2 Saetze):
  - Persoenliche Beobachtung mit echtem konkreten Moment
  - Idealerweise mit Dialog ("Sie sagte gestern: '...'")
  - Format: "Letzte Woche saß ich mit...", "Ein Kunde rief an...", "Bis vor drei Monaten dachte ich..."
  - NIE: generisches "In der heutigen Zeit..." oder "Viele Marketer fragen sich..."

* **outline** (3-5 Saetze):
  - WAS konkret im Post drin steht (mit konkreten Zahlen, Marken, Beispielen)
  - MINDESTENS eine kontroverse Aussage oder Anti-Mainstream-These
  - MINDESTENS einen "Aha"-Moment den der Leser nicht erwartet
  - Konkrete Action-Steps oder Insider-Wissen
  - Schluss-Frage / Diskussions-Trigger

* **target_keywords** (2-4 SEO-Keywords kommagetrennt):
  - Natuerlich, nicht stuffed
  - DACH-Suchterme (deutsch wo moeglich)
  - Long-Tail bevorzugt ("DSGVO-konformes Link-Tracking" > "Tracking")

----------------------------------------
VARIATIONS-PFLICHT
----------------------------------------
Ueber die ${count} Ideen verteilt:
- NICHT alle mit "Bitly" im Titel (max 30%)
- NICHT alle als "Ich"-Story (max 50%, Rest echter Dialog / Kunden-Story)
- NICHT alle mit Zahl am Anfang (max 30%)
- Variiere Hook-Patterns A-F
- Mische emotionale Trigger (Wut, Neugier, Identifikation, Status, Verlustangst)

----------------------------------------
OUTPUT-FORMAT (strikt einhalten — Parser bricht sonst)
----------------------------------------

NUR JSON-Array. Keine Markdown-Fences. Kein Vorwort. Kein Nachwort.

[
  {"title": "...", "angle": "...", "outline": "...", "target_keywords": "..."},
  {"title": "...", "angle": "...", "outline": "...", "target_keywords": "..."},
  ...
]

Jetzt liefere die ${count} besten Ideen — und mach sie so, dass sie den
HOOK-QUALITY-TEST jedes einzeln bestehen.`;

  const text = await callClaude(apiKey, prompt, { maxTokens: 4000, useSearch: true });

  // Robust-Parse
  let jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  // Falls Claude doch Pre-Text: ersten [ bis letzten ] extrahieren
  const firstBracket = jsonText.indexOf('[');
  const lastBracket = jsonText.lastIndexOf(']');
  if (firstBracket > 0 && lastBracket > firstBracket) {
    jsonText = jsonText.slice(firstBracket, lastBracket + 1);
  }

  let ideas: GeneratedIdea[];
  try {
    ideas = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Ideas JSON parse failed: ${(e as Error).message}. First 200 chars: ${jsonText.slice(0, 200)}`);
  }
  if (!Array.isArray(ideas)) throw new Error('Ideas response is not an array');

  return ideas.filter((i) => i.title && i.outline).slice(0, count);
}

// ---------------------------------------------------------------------------
// Blog-Expander (META/BODY-Block-Format fuer Parse-Robustheit)
// ---------------------------------------------------------------------------

export async function expandIdeaToBlog(idea: {
  title: string;
  outline: string;
  angle: string;
  target_keywords?: string | null;
  cluster: ContentCluster;
}): Promise<ExpandedBlog> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const prompt = `${SPURIG_VOICE}

========================================
DEINE AUFGABE — BLOG-POST SCHREIBEN
========================================

Thema: "${idea.title}"
Story-Hook: ${idea.angle}
Outline: ${idea.outline}
SEO-Keywords: ${idea.target_keywords ?? 'keine vorgegeben'}
Pillar: ${CLUSTER_LABEL[idea.cluster]}

Schreibe einen 900-1300 Worte deutschen Markdown-Blog-Post nach dem 8-Punkt-
Storytelling-Arc (PART 6 oben) und mit MASSIVER Retention (PART 8 oben).

----------------------------------------
RESEARCH-FIRST-PROTOKOLL (Pflicht — vor dem Schreiben)
----------------------------------------
Du hast Zugriff auf web_search. **Nutze es BEVOR du den Blog schreibst.**

Such 2-4 mal gezielt nach:
- AKTUELLEN Fakten / Zahlen / Faellen zum Thema (letzte 6 Monate)
- KONKRETEN Namen von Behoerden / Firmen / Studien die du zitieren kannst
- ECHTEN News / Urteilen / Pricing-Updates der Wettbewerber
- Sub-Topics die im Outline nicht stehen aber stark relevant sind

Was du finden willst:
- Mindestens 2 zitierbare konkrete Fakten aus echten Quellen
- Mindestens 1 News-Geschichte die du als Aufhaenger nutzen kannst
- Wettbewerbs-Pricing-Updates wenn Topic Bitly/Rebrandly betrifft
- Konkrete Bußgeld-Faelle / Behoerden-Verfahren wenn DSGVO-Topic

Verwende die Findings:
- Webe sie natuerlich in den Text ein (nicht als Zitate-Liste)
- Mach den Blog TOPICAL ("Letzte Woche hat das LfDI Niedersachsen..." statt
  "Es gibt Faelle wo...")
- Verlinke nicht — der Leser kommt auf den Blog, nicht auf externe Seiten
- Wenn du keinen konkreten News findest: weiter mit Story-Mode, kein Problem

----------------------------------------
PRE-WRITING-PRUEFUNG (mental durchspielen)
----------------------------------------
Bevor du loslegst, beantworte dir SELBST:
1. Welche EINE Emotion will ich primaer triggern? (Empoerung, Identifikation,
   Verlustangst, Aha-Moment, Neugier)
2. Wer ist die EINE konkrete Person im Mittelpunkt der Story?
   (Name oder Rolle + Ort. KEINE "viele Marketer".)
3. Welcher konkrete Moment ist das Hook? (Tag, Uhrzeit, Ort, direkter Satz)
4. Was ist die punchige Schluss-Zeile, an die der Leser sich morgen noch erinnert?
5. Welche Diskussions-Frage am Ende provoziert echte Antworten?

----------------------------------------
HOOK-ABSATZ (Zeile 1-4)
----------------------------------------
PFLICHT: Erster Satz folgt einem der 6 Patterns aus PART 7 (Hook-Quality-Test).
PFLICHT: Mindestens ein direkter Satz in Anfuehrungszeichen ("...") im ersten Drittel.
PFLICHT: Konkreter Ort, Tag, Person oder Zahl in den ersten 4 Saetzen.

Beispiel-Eroeffnungen (nach diesem Vibe schreiben):

  "Eine Marketing-Chefin gestern: 'Wir nutzen das seit 6 Jahren. Keiner weiss,
  ob das legal ist.' Sie hatte recht.

  Wir sassen in ihrem Buero in Duesseldorf. ..."

  "Donnerstag, 14:30, Buero eines Mittelstaendlers in Hamburg.

  Sie zeigte mir ihre Tracking-Statistik — sauber, alles vermessen. Dann
  stellte ich eine Frage. Drei Minuten Stille. ..."

  "Ich hatte sechs Wochen gebraucht, um eine Sache zu verstehen, die mir ein
  Anwalt in 90 Sekunden erklaerte. ..."

VERBOTEN (Instant-Fail):
- "In diesem Artikel zeige ich dir..."
- "Hast du dich schon mal gefragt..."
- "In der heutigen Zeit ist es wichtig..."
- "Lass uns gemeinsam einen Blick werfen..."
- "Hier sind 5 Tipps..."

----------------------------------------
STRUKTUR
----------------------------------------

1. **HOOK-ABSATZ** (siehe oben — 2-4 Saetze, mit Specificity + Dialog)

2. **RELATABLE-MOMENT-ABSATZ** (3-5 Saetze):
   Ausweitung der Situation. Der Leser denkt: "Das koennte mir genauso passieren."
   Konkret bleiben. Eine Person, ein Ort, eine Beobachtung.

3. **4-5 H2-UNTERABSCHNITTE** mit ## Headlines:
   - Headlines max 50 Zeichen
   - Headlines folgen Pattern: Frage ("Wo stehen eure Server?") ODER Behauptung
     ("Sechs Jahre. Niemand fragte.") ODER Pattern-Break ("Das eigentliche Problem
     ist nicht Bitly.")
   - Headlines DUERFEN provokant / kontrovers sein
   - KEINE Headlines wie "Was ist X?" / "Die Vorteile von X" / "Tipps fuer X"

4. **PRO H2-ABSCHNITT (Inhalt)**:
   - 2-4 kurze Absaetze
   - MINDESTENS 1 konkrete Zahl / Name / Zitat pro Abschnitt
   - MINDESTENS 1 Mini-Cliffhanger oder Open-Loop
   - MINDESTENS 1 direkte Leser-Adresse ("du", "fragst du jetzt...")
   - Saetze meist kurz (3-12 Worte), gelegentlich 1-Wort-Punchlines ("Klingt absurd.")

5. **MITTE-DES-TEXTES-BOLD-LINE**: irgendwo in der Mitte EIN fett gesetzter Satz
   (mit **...**) der zentralen Insight zusammenfasst und visuell den Lesefluss bricht.

6. **PRAKTISCHER MEHRWERT**: irgendwo ein Block mit konkreten Action-Steps (nicht als
   stumpfe Liste mit "1, 2, 3" — sondern als Empfehlung im Erzaehlfluss).
   Beispiel: "Falls du jetzt selbst kurz tippst — frag dein Marketing-Team drei
   Dinge. Welches Tool. Wo Server. Gibt's einen AV-Vertrag. Das reicht."

7. **SCHLUSS-ABSCHNITT** (## Headline, gerne ohne klassische Floskel):
   - Punchige Schluss-Zeile, memorable
   - ENDET mit ECHTER Diskussions-Frage die zum Kommentieren zwingt
   - KEINE rhetorische Frage ("Was meint ihr?")
   - KEINE Werbe-CTA
   - Optional: PS mit dezenter Einladung ("PS. Falls dich das Setup interessiert
     — schreib einfach.")

----------------------------------------
RETENTION-PFLICHT (PART 8 anwenden)
----------------------------------------

Pro 200 Worte mindestens EIN Retention-Hebel:
  - Cliffhanger ("Drei Minuten Stille. Dann:")
  - Offene Frage ("Was sie als naechstes sagte, war neu fuer mich.")
  - Mini-Pattern-Interrupt ("Ich dachte das Gegenteil. Bis...")
  - 1-Wort-Satz ("Stille.")
  - Konkrete Andeutung ("Eine einzige Frage hat alles geaendert.")

Wenn ein Absatz auch ohne den naechsten verstanden werden kann — er ist zu rund.
Umschreiben mit Cliffhanger am Ende.

----------------------------------------
SPEZIFITAETS-CHECKLISTE (vor finalem Output)
----------------------------------------

Pruefe nach dem Schreiben:
[ ] Mind. 2 konkrete Zahlen im Text (47 Mitarbeiter, 6 Jahre, etc.)
[ ] Mind. 1 konkreter Ort (Duesseldorf, Frankfurt, Ashburn Virginia)
[ ] Mind. 1 direkter Satz in Anfuehrungszeichen
[ ] Mind. 1 namentlich benannte Rolle (Marketing-Chefin, DSGVO-Anwalt, CMO)
[ ] Mind. 1 Marke / Tool / Service konkret genannt (Bitly, Ashburn AWS, Rebrandly)
[ ] Mind. 1 konkrete Zeitangabe (Donnerstag, gestern, vor 6 Wochen)

Wenn irgendwas davon fehlt — Text ist zu generisch. Spezifik einbauen.

ZUSAETZLICH generiere einen DALL-E/Midjourney-tauglichen ENGLISCHEN Image-Prompt fuer ein **clickbait-Hero-Bild** das auf Social-Media stoppen laesst.

**WICHTIG — Wiederhol-Verbot:** GENERIERE NICHT IMMER "marketing analyst at desk reviewing dashboard". WAEHLE BEWUSST eine andere visuelle Konzept-Familie passend zum Topic:

VISUAL-KONZEPT-POOL (waehle 1, optional kombiniert):

A. **Cinematic Detail-Shot** — Macro-Closeup einer relevanten Sache (z.B. "extreme close-up of finger pointing at single tiny QR code on cluttered street poster wall, shallow depth of field, neon-purple street reflection")

B. **Dramatic Portrait** — Person mit starker Emotion (z.B. "tired marketing manager rubbing forehead at 11pm office desk, frustrated expression, glowing screen reflected in glasses, cinematic chiaroscuro")

C. **Wide-Shot Berlin/DACH Cityscape** — Plakatwaende, Strassen-Werbung, Tracking-Theme (z.B. "rainy Berlin underground station with row of backlit advertising posters, lone person scanning one with smartphone, moody blue-purple lighting")

D. **Conceptual Money/Burning** — wenn Budget/Verschwendung-Topic (z.B. "stack of 50 EUR notes catching fire in glass ashtray, paper edges curling, smoke wisp, dark wooden table, candlelit warm tones contrasted with cyan screen glow")

E. **Before/After Split** — wenn Vergleichs-Topic (z.B. "split-screen composition: left side chaotic paper documents covering desk, right side single clean glowing tablet with charts, dramatic divider")

F. **Tech-Macro / Isometric** — fuer technisch/DSGVO-Themen (z.B. "isometric view of stylized server rack glowing cyan in a dark room with EU flag stars subtly visible in background bokeh")

G. **Symbolic Object** — abstrakte Bedeutung (z.B. "single magnifying glass over physical printed receipt on dark wooden table, purple desk lamp casting circular light, mystery noir feel")

H. **Busy Scene** — Restaurant/Event/Office mit Leuten (z.B. "bustling restaurant evening service, server holding qr-code menu, candle-lit ambiance, depth of field on the menu detail, warm cinematic tone")

DURCHGAENGIGE REGELN fuer JEDES Konzept:
- 16:9, photorealistic (NICHT illustration/cartoon — ausser explizit B/F)
- Cinematische Belichtung: weiches Light, Bokeh wo passend
- Subtile lila (#7C3AED) ODER cyan (#22d3ee) Akzent-Highlights (nicht beide)
- "Editorial photography style" oder "premium SaaS landing-page" feel
- NO TEXT visible (sonst macht KI haessliche Letter)
- Hat einen "Wow-Moment" — ein unerwartetes Detail (z.B. brennende Notenscheine, einsame Person, dramatic light)
- Auf englisch fuer beste KI-Resultate

VARIATION-CHECK: Wenn der Pillar/Topic Marketing-ROI ist → bevorzuge D oder E.
Wenn DSGVO-Privacy → F oder G.
Wenn QR-Practices → A oder H.
Wenn Behind-Scenes → B.
Wenn Attribution → E oder G.

NICHT immer A oder default-"laptop-with-dashboard" nehmen — das ist langweilig und repetitiv.

Output-Format — KRITISCH WICHTIG (Parser haengt sonst):

---META---
slug: kurz-knackig-url-friendly
description: 1-2 Saetze SEO max 155 Zeichen, mit Wow-Hook
tags: Tag1, Tag2, Tag3
image_prompt: [ENGLISCHER DALL-E/Midjourney-Prompt, ein zusammenhaengender Satz, ~50-80 Worte, KEINE Quotes]
image_alt: [deutscher Alt-Text fuer Accessibility, max 120 Zeichen]
---BODY---
[FULL MARKDOWN HIER, ohne ## Titel-Headline am Anfang]

WICHTIG:
- Antworte mit GENAU diesem META/BODY-Format
- Keine Code-Fences (\`\`\`) um den Body
- Keine Quotes um die Werte
- Nichts vor oder nach dem ---META--- und ---BODY---`;

  const text = await callClaude(apiKey, prompt, { maxTokens: 5000, useSearch: true });
  return parseMetaBodyBlock(text, idea.title);
}

/**
 * Parser fuer ---META---...---BODY---...-Format.
 * Tolerant gegenueber leichten Format-Abweichungen.
 */
function parseMetaBodyBlock(text: string, fallbackTitle: string): ExpandedBlog {
  const metaIdx = text.indexOf('---META---');
  const bodyIdx = text.indexOf('---BODY---');
  if (metaIdx < 0 || bodyIdx < 0 || bodyIdx <= metaIdx) {
    throw new Error(
      `Blog parse failed: META/BODY markers not found. First 200 chars: ${text.slice(0, 200)}`,
    );
  }

  const metaBlock = text.slice(metaIdx + '---META---'.length, bodyIdx).trim();
  let body = text.slice(bodyIdx + '---BODY---'.length).trim();

  // Strip optional code-fence around body
  body = body.replace(/^```(?:markdown|md)?\s*\n?/i, '').replace(/\s*```\s*$/i, '').trim();

  const meta: Record<string, string> = {};
  for (const line of metaBlock.split('\n')) {
    const m = line.match(/^([a-z_]+):\s*(.+)$/i);
    if (m) meta[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, '');
  }

  if (!meta.slug || !body) {
    throw new Error(`Blog parse failed: missing slug or body. Meta keys: ${Object.keys(meta).join(',')}, body len: ${body.length}`);
  }

  const tags = (meta.tags ?? '')
    .split(/[,;]/)
    .map((t) => t.trim().replace(/^["']|["']$/g, ''))
    .filter(Boolean)
    .slice(0, 6);

  return {
    slug: slugify(meta.slug),
    title: fallbackTitle,
    description: (meta.description ?? '').slice(0, 200),
    tags,
    body_md: body,
    image_prompt: meta.image_prompt ?? fallbackImagePrompt(fallbackTitle),
    image_alt: (meta.image_alt ?? fallbackTitle).slice(0, 160),
  };
}

function fallbackImagePrompt(title: string): string {
  // Rotierende Konzepte damit auch Fallbacks variieren (Hash auf Titel waehlt Konzept)
  const concepts = [
    `extreme close-up shot of a single tiny QR code on a weathered Berlin street poster, shallow depth of field, cyan neon street reflection — symbolizes "${title.slice(0, 60)}"`,
    `tired marketing manager rubbing forehead at 11pm office desk, frustrated expression, glowing laptop screen reflected in glasses, cinematic chiaroscuro, purple-accent lamp`,
    `stack of 50 EUR notes catching fire in glass ashtray, paper edges curling, smoke wisp, dark wooden surface, candlelit warm tones contrasted with cyan screen glow in background`,
    `split-screen composition: chaotic paper documents covering left half of desk, single clean glowing tablet with sharp analytics on right half, dramatic divider`,
    `single magnifying glass over a printed receipt on dark wooden table, single purple desk lamp casting circular light, noir mystery aesthetic`,
    `rainy Berlin underground station with row of backlit advertising posters, lone person scanning one with smartphone, moody blue-purple lighting, cinematic`,
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % concepts.length;
  return `Photorealistic 16:9 editorial hero image: ${concepts[idx]}. Premium SaaS landing-page feel, no text visible, cinematic light.`;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
