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
 * Web-Search ist standardmaessig AUS — schaltbar via CONTENT_ENABLE_WEB_SEARCH=1.
 * Reason: auf Vercel Hobby (60s maxDuration) sind Web-Search-Calls riskant
 * (40s+ pro Generation). Auf Pro mit 300s maxDuration kann man's einschalten.
 * Auch ohne Web-Search hat der Prompt Gold-Standard-Hooks + 8-Punkt-Arc.
 */
const WEB_SEARCH_ENABLED = process.env.CONTENT_ENABLE_WEB_SEARCH === '1';
const WEB_SEARCH_MAX_USES = Number(process.env.CONTENT_WEB_SEARCH_MAX_USES ?? '2');

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
HOOK-ABSATZ (Zeile 1-4) — CATCH-LEVEL: MAXIMAL HART
----------------------------------------

Die ersten 5-12 Worte entscheiden, ob der Leser weiterscrollt.
Wenn der Hook nicht VISZERAL trifft — Blog ist tot.

PFLICHT-CHECKLISTE fuer den ERSTEN SATZ (jede Box muss erfuellt sein):

  [ ] (1) Maximal 12 Worte
  [ ] (2) Enthaelt mind. EIN viszerales Wort:
          [Muell, Asche, weg, verbrannt, kaputt, blind, tot, leer, vergessen,
           verloren, draufgegangen, verpufft, geplatzt, leer, Papierkorb,
           verschwunden, eiskalt, schockiert]
  [ ] (3) Enthaelt mind. eines:
          - Konkrete Zahl (47, 50.000, 6 Wochen, 18%)
          - Konkreter Ort (Duesseldorf, Frankfurt, Hannover)
          - Pattern-Break ("...und keiner traut sich")
          - Direkter Dialog ("'Keine Ahnung', sagte sie.")
  [ ] (4) Triggert MINDESTENS 1 Emotion sofort:
          [Schock, Empoerung, Verlustangst, Mitleid, Identifikation]

REFERENZ-OPENER (David's echter LinkedIn-Post, 171 Impressions + Quality-Discussion):

  "Dein Plakat-Budget verschwindet grade in der Luft. Und niemand traut sich,
  es auszusprechen."

  Warum es hittet:
  - Wort 1-3: "Dein Plakat-Budget" → direkte Adressierung
  - Wort 4-7: "verschwindet grade in der Luft" → viszerales Bild
  - Wort 8-12: "niemand traut sich, es auszusprechen" → Tabubruch + Identifikation

Weitere Beispiele die ALLE Boxen abhaken:

  GUT:
  "Drei Wochen. 500 Postkarten. Muell."
  "120 Euro Druck. 180 Euro Porto. Resultat: vielleicht."
  "Dein Budget sitzt grade im Papierkorb. Du weisst es."
  "Dein Mailing landet im Muell. Bevor jemand es gesehen hat."
  "47 Plakate. Drei funktionieren. 44 verbrennen Geld."
  "Vier Wochen Print-Kampagne. 0 Anfragen. Du auch?"
  "Eine Marketing-Direktorin gestern: 'Wir laufen seit Jahren blind.'"
  "Sechs Jahre Daten. Falsches Land. Und keiner fragte."

  SCHLECHT (zu zahm, neu schreiben):
  "Print-Marketing in Deutschland steht vor Herausforderungen." → BORING
  "Viele Marketer haben das Problem, dass..." → ABSTRAKT
  "Lass uns ueber Plakatwerbung sprechen." → SCHWACH
  "Ein interessanter Fall aus der Praxis..." → MARKETING-FLOSKEL

----------------------------------------
SATZ 2-4 (Druck halten)
----------------------------------------
Nach dem Killer-Opener: SOFORT konkret werden.
Wer? Wo? Wann? Mit welcher Zahl? Mit welchem Zitat?

PFLICHT:
- Satz 2 oder 3 enthaelt direkten Dialog in Anfuehrungszeichen
- Satz 2-4 enthaelt mind. 1 konkrete Zahl
- Satz 2-4 enthaelt mind. 1 konkreten Ort (Stadt) ODER Rolle (Sanitaerbetrieb,
  Marketing-Chefin, B2B-SaaS, Restaurant-Inhaber, etc.)

VIBE:
- Kurze Saetze (3-12 Worte). Wechsel mit 1-Wort-Punchlines ("Muell.")
- Wirkt wie gesprochen, nicht wie geschrieben
- Frust + Beobachtung + Faktum mischen

REFERENZ (aus David's Post):
"Mein Kunde zahlte 50.000 Euro monatlich fuer 47 Plakat-Standorte. Dann fragte
ich: 'Welche drei funktionieren am besten?' Antwort: 'Keine Ahnung.' Das war
der Moment, wo mir klar wurde — Print-Marketing laeuft in Deutschland komplett
blind."

Beachte:
- Satz 1 = konkrete Zahl + Person (50k € + 47 Plakate + Kunde)
- Satz 2 = direkte Frage in Anfuehrungszeichen
- Satz 3 = direkte Antwort ("Keine Ahnung.")
- Satz 4 = Insight-Pivot ("Das war der Moment, wo mir klar wurde...")

Genau dieser Vier-Satz-Bogen — mach das in DEINEM Blog gleich.

VERBOTEN (Instant-Fail):
- "In diesem Artikel zeige ich dir..."
- "Hast du dich schon mal gefragt..."
- "In der heutigen Zeit ist es wichtig..."
- "Lass uns gemeinsam einen Blick werfen..."
- "Hier sind 5 Tipps..."
- Lange einleitende Saetze ueber das Thema im Allgemeinen
- "Bevor wir in die Details gehen, lass uns kurz festhalten..."

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

==========================================
IMAGE-PROMPT — CLICKBAIT-THUMBNAIL-STYLE
==========================================
Generiere einen ENGLISCHEN Image-Prompt (60-120 Worte) fuer einen Bild-Generator
(ChatGPT/DALL-E 3 / Midjourney / Gemini Imagen).

ZIEL: Ein THUMBNAIL das aussieht wie eine virale YouTube/LinkedIn-Vorschau.
Nicht editorial-Fotografie. Nicht Stockfoto. Nicht "premium SaaS dashboard".

ES SOLL HITTEN. Wenn jemand auf LinkedIn scrollt und das Bild sieht, soll er
stoppen. Konkret. Visuell. Emotional. Mit einem Wow-Moment.

----------------------------------------
WAS EIN CATCHY THUMBNAIL HAT (alle 7 Punkte einbauen)
----------------------------------------

1) **EINE klare zentrale Idee** — der Bildinhalt sollte sich in 1 Satz erklaeren
   lassen ("Geld brennt", "Mann schockiert vor Bildschirm", "Plakat im Muelleimer")

2) **HOHE EMOTION** — wenn Person im Bild: starke Mimik
   [shocked face / mouth slightly open / wide eyes / facepalm / disbelief]
   Wenn kein Mensch: dramatische Bewegung
   [paper mid-tear / coins falling / fire crackling / spotlight cutting darkness]

3) **HOHE FARBSAETTIGUNG + KONTRAST** — Thumbnail-Look, nicht subtil
   - Mind. EINE knall-Farbe (warm fire-orange / electric cyan / hazard yellow /
     deep red)
   - Dunkler Hintergrund (black, deep navy, dark wood) fuer Pop
   - Strong rim light auf Hauptmotiv

4) **VISUELLE METAPHER zum Blog-Thema** — das Bild "uebersetzt" den Hook
   - Wenn Hook "Budget verbrennt" → physisches Feuer / Asche
   - Wenn Hook "blind laufen" → Augen geschlossen / Augenbinde / Dunkelheit
   - Wenn Hook "Schreddert Geld" → Geldscheine in Schredder
   - Wenn Hook "Daten in USA" → US-Flagge mit Pixeln / Datenstrom transatlantisch
   - Wenn Hook "QR-Code unsichtbar" → winzige QR auf riesiger Werbeflaeche

5) **EIN UNERWARTETES DETAIL** — der "Wait, what?"-Effekt
   - Brennende Geldscheine in der Hand einer Person
   - Plakatwand komplett leer ausser einem einzigen QR-Code
   - Marketing-Manager schlaeft im Buero, Bildschirm zeigt rote Zahlen
   - Schredder spuckt Asche statt Papier

6) **CAMERA + LIGHTING SPEC** (Pflicht in jedem Prompt)
   Waehle pro Bild einen Stil:
   - "shot on Sony A7 IV, 35mm lens, shallow depth of field"
   - "cinematic wide angle, 24mm, dramatic golden-hour rim light"
   - "macro shot 100mm, soft natural window light"
   - "low-angle dramatic shot, 14mm wide, hard noon shadow"

7) **BLOG-KONSISTENZ** — Das Bild MUSS zum Blog-Hook passen
   - Hook nennt "Postkarten" → Postkarten visualisieren
   - Hook nennt "Plakat" → Plakatwand
   - Hook nennt "Datenschutz" → Schloss / EU-Flagge / Frankfurt-Server
   - Hook nennt "Restaurant" → Tisch / QR-Karte / Service
   Generiere NIE generische Bilder die zum Hook nicht passen.

----------------------------------------
KONZEPT-FAMILIEN (waehle 1, kombiniere wenn moeglich)
----------------------------------------

K1 — **HUMAN-REACTION-CLOSEUP** (sehr stark fuer LinkedIn)
   "Close-up portrait of a [age + role + setting], face expressing [emotion],
   eyes [reaction detail], lit by [single dramatic light source], background
   [out of focus context detail]."
   Beispiel: "Close-up portrait of a 50-year-old male small-business owner in a
   Hannover-style workshop, face expressing tired disbelief, eyes staring at a
   pile of unopened postcards on the desk, lit by single overhead industrial
   lamp, background blurred workshop tools, shot on Sony A7 IV 50mm f/1.4,
   moody warm color grading."

K2 — **MONEY-DESTRUCTION** (fuer Budget/Verschwendung-Topics)
   "[Bills/coins] [physical action: burning, shredding, falling, blowing away,
   torn], shot at [camera angle], [lighting], with [unexpected detail]."
   Beispiel: "Stack of 50 EUR bills crumbling into burning ash inside a metal
   industrial trash bin, low-angle close-up shot, harsh orange flame light
   contrasting with cool blue office fluorescent reflection on the bin's edge,
   one half-burnt euro note floating mid-air with the EU stars still visible,
   shot on Canon EOS R5 24mm f/2.8."

K3 — **OBJECT-IN-WRONG-CONTEXT** (sehr LinkedIn-thumbnail-friendly)
   "[Object normally seen in business context] placed in [contrasting wrong
   environment], visual joke that visualizes the article's point."
   Beispiel: "A clean printed marketing report carefully placed inside a
   household trash bin among coffee grounds and orange peels, top-down shot,
   harsh fluorescent overhead light, single fly hovering above, photorealistic
   editorial-news photography style."

K4 — **SPLIT-SCREEN BEFORE/AFTER** (fuer Vergleichs-Topics)
   "Split-screen composition: left half shows [chaos/old way], right half shows
   [clean/new way], dividing line is [creative element], same lighting style
   on both sides, photographed straight-on."
   Beispiel: "Split-screen composition: left half shows 47 disorganized paper
   marketing reports piled on a chaotic desk, right half shows a single clean
   tablet displaying a sharp analytics chart, divided by a vertical beam of
   warm light, identical eye-level perspective on both halves, shot on
   Hasselblad medium format."

K5 — **MACRO-VISIBLE-DETAIL** (fuer Tech / QR / Data-Topics)
   "Extreme macro shot of [specific small object], showing [unexpected detail],
   shallow depth of field, [light source], [color contrast]."
   Beispiel: "Extreme macro shot of a single QR code printed on a torn corner
   of a German A1 advertising poster, showing fine paper fibers and slight ink
   bleed, deep depth of field that reveals out-of-focus city street in
   background, lit by overcast natural daylight, cool blue tones contrasting
   with poster's red ink."

K6 — **PHYSICAL-METAPHOR-FOR-DATA** (fuer DSGVO / Privacy / Tracking-Topics)
   "[Physical object representing data/privacy] in [setting that makes the
   metaphor clear], [unexpected detail showing the problem]."
   Beispiel: "An open suitcase filled with hundreds of small photo prints of
   anonymous faces being loaded onto a transatlantic cargo plane on a foggy
   tarmac, suitcase has 'Bitly Inc.' stenciled subtly on the side, shot from
   low angle in dramatic blue-hour light with American flag silhouette in
   background, cinematic 35mm."

K7 — **HIGH-EMOTION-MOMENT-CAPTURED** (fuer Behind-Scenes / Founder-Stories)
   "Person in middle of [authentic emotional moment], [body posture/gesture],
   [environment context that explains the moment], [lighting that emphasizes
   emotion]."
   Beispiel: "A bearded male founder in his early 30s sits on the floor of an
   empty office at 2am, laptop open on his lap displaying a single red dropped-
   to-zero analytics chart, head in one hand, single desk lamp casting long
   shadow, cinematic chiaroscuro lighting in warm tungsten color, shot on
   Leica M11 28mm f/1.4."

----------------------------------------
PFLICHT-ATTRIBUTE FUER JEDEN PROMPT (alle 8 erfuellen)
----------------------------------------

  [ ] (a) Konkrete sichtbare Person ODER konkretes sichtbares Objekt
  [ ] (b) Konkrete Emotion ODER konkrete Action im Bild
  [ ] (c) Konkrete Camera-Spec (Kamera + Brennweite + Blende)
  [ ] (d) Konkrete Lichtquelle / Lichtrichtung benannt
  [ ] (e) Konkrete Farbpalette benannt (mind. 2 Farben mit Kontrast)
  [ ] (f) Mindestens 1 unerwartetes Detail / Wow-Moment
  [ ] (g) Klare Verbindung zum Blog-Hook erkennbar
  [ ] (h) "no text visible", "no logos visible" am Ende — AI macht sonst
          haessliche Buchstaben

----------------------------------------
PILLAR → KONZEPT-EMPFEHLUNG
----------------------------------------

- DSGVO/Privacy: K6 (Physical-Metaphor-for-Data) ODER K1 (Human-Reaction)
- Offline-ROI: K2 (Money-Destruction) ODER K3 (Object-in-wrong-context)
- QR-Practices: K5 (Macro-visible-detail) ODER K3 (Object-in-context)
- Attribution: K4 (Split-screen) ODER K3 (Object-in-context)
- Behind-Scenes: K7 (High-emotion-moment) ODER K1 (Human-Reaction)

ABER: lies zuerst den Hook deines Blogs und ueberleg welches Konzept am
staerksten zum konkreten Bild passt. Pillar-Empfehlung ist nur Default.

----------------------------------------
VERBOTEN IM IMAGE-PROMPT
----------------------------------------
- "Editorial photography" als alleinige Beschreibung (zu vage)
- "Premium SaaS landing-page" als Style (das ist Layout, kein Bildmotiv)
- "Marketing analyst at desk reviewing dashboard" (default, langweilig)
- "Person looking at laptop" ohne Emotion / Kontext
- "Modern office setting" (generisch)
- Keine Specs (Kamera/Licht/Farbe muss IMMER drin sein)
- Cartoon, illustration, isometric, 3D-render, flat-design (nicht thumbnail-ish)
- "Beautiful", "stunning", "amazing" (KI-Floskeln, keine Information)
- Text/Logos im Bild ("avoid all text, no logos visible" muss am Ende stehen)

----------------------------------------
LAENGE
----------------------------------------
60-120 Worte. Lieber zu lang als zu kurz.
Konkrete Details > vage Adjektive.

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
  // Clickbait-Thumbnail-Style Fallback. Hash auf Titel waehlt Konzept-Familie
  // damit Fallbacks variieren wenn Claude keinen image_prompt liefert.
  const concepts = [
    // K2 — Money destruction
    `Stack of 50 EUR bills mid-burn in an industrial metal trash bin, half-burnt euro note floating mid-air with EU stars still visible, harsh orange flame light contrasting cool blue office fluorescent reflection, low-angle close-up, shot on Canon EOS R5 24mm f/2.8, dramatic shallow depth of field, photorealistic editorial style`,
    // K1 — Human reaction
    `Close-up portrait of a 50-year-old male small-business owner in a Hannover-style workshop, face expressing tired disbelief and slight resignation, eyes staring down at a stack of unopened postcards on a worn wooden workbench, single overhead industrial pendant lamp casting hard shadow, background blurred workshop tools in warm tungsten light, shot on Sony A7 IV 50mm f/1.4, moody color grading with orange skin tones against deep teal background`,
    // K3 — Object in wrong context
    `A neatly printed marketing report carefully placed inside a household kitchen trash bin among coffee grounds and orange peels, top-down 90-degree overhead shot, harsh fluorescent overhead light, one fly hovering above, photorealistic news-editorial style, shot on Sony A7R V 35mm f/4, high contrast between clean white paper and dark organic waste`,
    // K4 — Split-screen
    `Split-screen composition: left half shows 47 disorganized paper marketing reports piled chaotically on a wooden desk, right half shows a single clean tablet displaying a sharp green analytics chart, divided by a vertical beam of warm golden light, identical eye-level perspective on both halves, shot on Hasselblad medium format 80mm f/2.8, photorealistic`,
    // K5 — Macro detail
    `Extreme macro shot of a single QR code printed on a torn corner of a German A1 advertising poster, showing fine paper fibers and slight ink bleed, deep depth of field revealing out-of-focus city street in background, overcast natural daylight, cool blue tones contrasting with poster's red ink, shot on Sony 100mm macro lens f/8`,
    // K6 — Data metaphor
    `An open vintage suitcase filled with hundreds of small photo prints of anonymous faces being loaded onto a transatlantic cargo plane on a foggy tarmac, low-angle dramatic shot in deep blue-hour light, distant American flag silhouette in background, suitcase has subtle 'Data' stenciled on side, shot on Canon R5 35mm f/2.8 cinematic style`,
    // K7 — Founder moment
    `A bearded male founder in his early 30s sits on the floor of an empty office at 2am, laptop open on his lap displaying a single red dropped-to-zero analytics chart, head in one hand, single desk lamp casting long shadow across dusty floor, cinematic chiaroscuro lighting in warm tungsten color, shot on Leica M11 28mm f/1.4 photorealistic`,
  ];
  let hash = 0;
  for (let i = 0; i < title.length; i++) hash = (hash * 31 + title.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % concepts.length;
  return `Clickbait-style 16:9 thumbnail image, photorealistic, high contrast, saturated color palette. Subject: ${concepts[idx]}. The image visually represents the blog headline "${title.slice(0, 80)}". No text visible, no logos visible, no watermarks.`;
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
