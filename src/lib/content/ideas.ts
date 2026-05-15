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
 * Server-side Web-Search-Tool (Anthropic built-in). Claude führt die Search
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
 * Claude führt die Searches server-side aus und liefert am Ende den finalen
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

  const researchSection = WEB_SEARCH_ENABLED ? `
----------------------------------------
RESEARCH-FIRST-PROTOKOLL (Pflicht — vor jeder Idee)
----------------------------------------
Du hast Zugriff auf web_search. **Nutze es BEVOR du Ideen generierst.**

Für den Pillar "${CLUSTER_LABEL[cluster]}" fuehre 2-3 gezielte Searches durch.
Suche nach AKTUELLEN, KONKRETEN, DEUTSCHEN Themen — nicht generischen Konzepten.

Such-Beispiele je nach Pillar:
- DSGVO/Privacy: "DSGVO Bußgeld 2026 Tracking", "Schrems II 2026 marketing"
- Offline-ROI: "Plakatwerbung ROI 2026 DACH", "DOOH Deutschland 2026"
- QR-Practices: "QR Code Scan Statistik DACH 2026"
- Attribution: "Last-Click Attribution 2026", "Cookie-less Tracking DACH"
- Behind-Scenes: "DACH Solopreneur SaaS 2026"

Ziel der Searches:
- Konkrete Fakten / Zahlen / News-Geschichten der letzten 90 Tage
- Echte Firmen / Behörden / Personen zum Zitieren
- Wettbewerbs-Pricing-Updates wenn relevant
- Reale Bußgeld-Faelle / DSGVO-Verfahren wenn DSGVO-Topic

VERWENDE die Such-Ergebnisse in den outline-Feldern (zitiere Quellen, Daten,
Behörden). Mach Ideen TOPICAL ("Die [Bußgeld-Fall XYZ] zeigt:...").
` : '';

  const prompt = `${SPURIG_VOICE}

========================================
DEINE AUFGABE — IDEEN-GENERIERUNG FUER PILLAR "${CLUSTER_LABEL[cluster]}"
========================================

Pillar-Scope: ${CLUSTER_DESCRIPTION[cluster]}

Generiere ${count} CONTENT-IDEEN nach dem Elite-Psychologie-Framework oben.
Jede Idee muss Hook-Quality-Test (PART 7) bestehen und mind. 3 psychologische
Hebel (PART 3) einbauen.
${researchSection}
----------------------------------------
PRE-WRITING-ANALYSE (denk SELBER durch, vor dem Generieren)
----------------------------------------
Bevor du Ideen formulierst, überlege intern:
- 5 echte Situationen die ein DACH-Marketer / Founder / Restaurant-Besitzer wirklich erlebt
- 3 Mainstream-Annahmen die FALSCH sind (kontroverse Takes)
- 3 konkrete Zahlen / Marken / Fakten die ueberraschen
- 2 Original-Sätze die ein Profi-Insider sagen würde
Erst dann: Ideen formulieren.

----------------------------------------
HOOK-QUALITAETS-SCHWELLE PRO IDEE
----------------------------------------
Bevor du eine Idee aufnimmst, prüfe den Titel gegen DIESEN Test:

Würde ein DACH-Marketer beim Scrollen auf LinkedIn / Reddit anhalten und denken
EINEN dieser Sätze:
  - "Das fühle ich gerade."
  - "Das ist mir auch passiert."
  - "Wait, mache ich das auch?"
  - "Krass, daran hatte ich nie gedacht."
  - "Das wuerd ich kommentieren wollen."

Wenn NEIN → Idee verwerfen, neu schreiben.
Wenn JA → behalten.

----------------------------------------
TITEL-PATTERNS (Pflicht: nutze unterschiedliche Patterns über die ${count} Ideen verteilt)
----------------------------------------

PATTERN A — Echter Dialog (sehr stark):
- "Ein Anwalt sagte mir gestern einen Satz, der mich nicht loslässt."
- "Eine Marketing-Chefin: 'Wir nutzen das seit 6 Jahren. Niemand weiss, ob das legal ist.'"

PATTERN B — Persoenlicher Fail / Selbstkritik:
- "Ich hab 8 Wochen das falsche Feature gebaut. Hier was ich uebersah."
- "27 Euro pro Plakat. Vier Standorte. Ich war schockiert."

PATTERN C — Konkrete Zahl + Pattern-Break:
- "23 von 47 Marketing-Teams: kein AV-Vertrag mit Bitly."
- "Drei Minuten Stille. Dann sagte sie: 'Ashburn, Virginia.'"

PATTERN D — Verlustangst + Specificity:
- "Sechs Jahre Klick-Daten. Über den Atlantik. Ohne Vertrag."
- "Was bei einem Bitly-Klick im Hintergrund passiert, bevor du auf der Seite landest."

PATTERN E — Provokante Behauptung:
- "Cookie-Banner sind nicht das DSGVO-Problem in deinem Marketing."
- "Bitly ist eine Falle. Jeder weiss es. Keiner sagt's."

PATTERN F — Hyper-spezifische Mini-Story:
- "Donnerstag 14:30. Ihr Büro in Düsseldorf. Sie konnte die Frage nicht beantworten."
- "Ein Restaurant-Besitzer aus Köln zeigte mir seine QR-Code-Statistik. Eine Spalte fehlte."

PATTERN G — "Geld-verbrennt + niemand traut sich":
- "Dein Plakat-Budget verschwindet grade in der Luft. Und niemand traut sich, es auszusprechen."
- "38.000 Euro pro Monat für Plakate, die fast nichts bringen."

PATTERN H — "Common-Advice-Is-Wrong":
- "Alle predigen kleine QR-Codes sind eleganter. Eye-Tracking sagt: 78% seltener gescannt."
- "Marketing-Berater sagen: Print-Tracking ist kompliziert. Falsch. Ein QR pro Standort."

PATTERN I — "Stop-Doing-This":
- "Hör auf, QR-Codes unten rechts zu platzieren. Hamburger Studie 2026 zeigt warum."
- "Hör auf, deine Druckkosten pro Plakat zu rechnen. Rechne pro Anfrage."

PATTERN J — "Outcome-Then-Tease":
- "47 Plakatstandorte auf 3 reduziert. 22.000 Euro/Monat gespart. So gings:"
- "0 auf 47 Euro MRR in 8 Wochen. Eine einzige Sache hat den Unterschied gemacht:"

PATTERN K — "Unpopular-Opinion":
- "Unpopular: 90% der DACH-Cookie-Banner sind nicht DSGVO-konform. Hier was kommt:"
- "Unbequem: Bitly ist nicht das Problem. Du bist es."

PATTERN L — "Vulnerability-Reveal":
- "Ich gebe zu: 3 Wochen an einem Feature gebaut, das niemand wollte."
- "Mein peinlichster Sales-Call: ich habe Spurig nicht erklären können."

PATTERN M — "Question-That-Hits":
- "Hand aufs Herz: weißt du, wo deine Tracking-Daten von letztem Monat liegen?"
- "Schnelle Umfrage: AVV-Vertrag mit deinem Link-Tool — ja, nein, keine Ahnung?"

NICHT generieren (Instant-Fail):
- "5 Tipps für besseres DSGVO-Tracking" (Listicle)
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

* **angle** (Story-Hook für Intro, MAX 200 Zeichen / 1-2 Sätze):
  - Persoenliche Beobachtung mit echtem konkreten Moment
  - Idealerweise mit Dialog ("Sie sagte gestern: '...'")
  - NIE: generisches "In der heutigen Zeit..." oder "Viele Marketer fragen sich..."

* **outline** (MAX 350 Zeichen / 2-3 sehr knappe Sätze):
  - WAS konkret im Post drin steht (mit konkreten Zahlen, Marken)
  - 1 kontroverse Aussage ODER 1 "Aha"-Moment
  - Schluss-Frage / Diskussions-Trigger
  - KEIN Brei. KEINE 8 Sätze. Storyboard-knapp.

* **target_keywords** (2-4 SEO-Keywords kommagetrennt):
  - Natuerlich, nicht stuffed
  - DACH-Suchterme (deutsch wo möglich)
  - Long-Tail bevorzugt ("DSGVO-konformes Link-Tracking" > "Tracking")

==========================================
IDEA-CATEGORY-WHEEL — PFLICHT-DIVERSITY (14 Kategorien)
==========================================
Über die ${count} Ideen MUSS Diversität herrschen. MAX 1 Idee pro Kategorie
(bei count>14 max 2). Mind. (count - 2) verschiedene Kategorien benutzen.

  C1 — HIDDEN COST / WAS DICH WIRKLICH KOSTET
       "Was dich Bitly tatsächlich pro Jahr kostet (nicht der Preis auf der Webseite)"
       "Die 800 Euro im Monat, die deine Print-Kampagnen versteckt verbrennen"

  C2 — COUNTER-INTUITIVE FACT / GEGEN ALLE ERWARTUNG
       "Warum große QR-Codes weniger gescannt werden als kleine (Eye-Tracking-Daten)"
       "Cookie-Banner senken deine Conversion um 23%. Niemand redet darüber."

  C3 — FUNNY FAILURE / LUSTIGE PEINLICHKEIT (Pflicht: 1-2 Ideen)
       "Mein erster Sales-Call: ich habe 'Frankfurt' dreimal falsch ausgesprochen"
       "Mein Kunde hat Bitly drei Jahre lang als 'Bittlee' ausgesprochen"
       "Mein Lieblings-Feature hab ich nach 2 Wochen gekillt. Niemand hatte es benutzt."

  C4 — INDUSTRY-INSIDER REVEAL / WAS NIEMAND SAGT
       "Was Marketing-Agenturen ihren Kunden NICHT über Bitly erzählen"

  C5 — DID YOU KNOW? / FAKTEN-REVEAL (Pflicht: 1-2 Ideen)
       "Wusstest du: Plakatwerbung kommt für 17% der DACH-Online-Conversions auf"

  C6 — COMPARISON / DIREKTER VERGLEICH
       "Bitly Free vs Spurig: das eine kostet 0 Euro. Das andere 800 Euro pro Jahr verstecktes Risiko."

  C7 — PERSONAL REVEAL / DAVID-STORY
       "Ich habe Spurig in 8 Wochen gebaut. 3 Sachen die mich fast aufgeben ließen"

  C8 — DATA / NUMBERS-PUNCH
       "8.247 QR-Code-Scans in 30 Tagen. Hier was wir gelernt haben."

  C9 — CONTRARIAN TAKE / KONTROVERSE
       "QR-Codes sind nicht 'wieder' im Trend. Sie waren nie weg."

  C10 — BEHIND-THE-SCENES / HOW IT REALLY WORKS
       "So bauen wir die Tracking-Pipeline bei Spurig (öffentlich)"

  C11 — MONEY-REVEAL / TRANSPARENTE ZAHLEN (Pflicht: 1-2 Ideen)
       "Mein Stripe-Dashboard nach Monat 1: 47 Euro MRR. Hier was ich draus gelernt habe."
       "Was Spurig im Monat kostet zu betreiben — die echten Zahlen"
       "Mein Vercel-Hobby-Bill diesen Monat: 0 Euro. Aber 4 Stunden Debug pro Woche."
       "12.000 Euro Anwaltskosten für DSGVO. Aber ich war einfach zu paranoid."
       "Wie ich aus 47 Euro MRR auf 800 in 4 Monaten kam — und was nicht funktioniert hat"

  C12 — ALLTAGSDUSSELHEIT / RELATABLE EVERYDAY-FAIL (Pflicht: 1-2 Ideen)
       "Mein peinlichster Customer-Support-Moment: ich habe die Mail an mich selbst geschickt"
       "Die DSGVO-Email an meine Schwiegermutter — und ihre Antwort"
       "Mein Kunde fragte mich gestern: 'Kann das auch Faxe tracken?' Ich war kurz still."
       "Ich hab 3 Wochen für eine Funktion gebraucht, die mein Praktikant in 2h gebaut hätte"
       "Was ich falsch über deutsche Steuerberater gedacht habe (Spoiler: alles)"

  C13 — MICRO-DOCUMENTARY / ZOOM IN ON ONE TINY MOMENT
       "Die 23 Sekunden nach dem ersten echten Kunden-Klick — was bei mir im Kopf passierte"
       "Eine E-Mail, die ich seit 6 Wochen aufschiebe — und warum sie wichtig ist"
       "Der Moment beim 4. Kaffee, als ich realisierte, dass ich Bitly nicht hasse — ich hasse den Default"

  C14 — TIKTOK-STYLE QUICK-REVEAL / 2-SEKUNDEN-PAYOFF
       "Du machst Marketing? Du machst wahrscheinlich diesen Fehler. Hier wie du's testet."
       "Eine Sache, die deinen Print-ROI verdoppelt. Spoiler: es ist NICHT Design."
       "Drei Worte, die jeder DACH-Marketer einmal pro Jahr hören sollte: 'Wir messen es.'"

WICHTIG: Markiere im "angle"-Feld in eckigen Klammern die Kategorie:
"[C5: Did-you-know] Wusstest du, dass..."
"[C11: Money-Reveal] Mein Stripe-Dashboard zeigte..."
"[C12: Alltagsdusselheit] Mein peinlichster Moment..."

PFLICHT-ANTEILE pro Batch (count=10):
  - Mind. 1 Idee aus C3 (Funny Failure)
  - Mind. 1 Idee aus C5 (Did-you-know)
  - Mind. 1 Idee aus C11 (Money-Reveal)
  - Mind. 1 Idee aus C12 (Alltagsdusselheit)
  - Mind. 1 Idee aus C13 oder C14 (Micro-Doc oder TikTok-Quick)
  - Mind. 1 Idee mit CLEVER-TRICK-Charakter (Hidden Hack der "ahh wusste
    ich nicht, das ist clever, muss ich probieren" auslöst —
    z.B. "1 QR pro TAG statt pro Kampagne — siehst Wochentag-Muster"
    oder "Stripe-Coupon einmal/Quartal statt Permanent — gleiche Conversion,
    kein MRR-Verlust"). Markiere den Trick im outline-Feld klar erkennbar:
    "CLEVER-TRICK: [Beschreibung]"

==========================================
HOOK-PATTERN-ROTATION (NEU — Research-validiert)
==========================================
Über die ${count} Ideen MUSS Claude die Hook-Patterns A-M (13 verschiedene)
ROTIEREN.

Regel:
  - MAX 2 Ideen pro Pattern
  - Mind. (count - 3) verschiedene Patterns benutzen
  - Markiere den verwendeten Pattern im "angle"-Feld:
    "[C5 / PATTERN-J Outcome-Then-Tease] ..."

Verfügbare Hook-Patterns (siehe PART 7 im Voice oben):
  A — Echter Dialog
  B — Persönlicher Fail / Selbstkritik
  C — Konkrete Zahl + Pattern-Break
  D — Verlustangst + Specificity
  E — Provokante Behauptung
  F — Hyper-spezifische Mini-Story
  G — Geld-verbrennt + niemand traut sich
  H — Common-Advice-Is-Wrong (Research 2026)
  I — Stop-Doing-This (Research 2026)
  J — Outcome-Then-Tease (Research 2026)
  K — Unpopular-Opinion (Research 2026)
  L — Vulnerability-Reveal (Research 2026)
  M — Question-That-Hits (Research 2026)

Beispiele frischer Rotation für 10 Ideen:
  Idee 1: PATTERN-G (Geld verbrennt)
  Idee 2: PATTERN-J (Outcome-Tease)
  Idee 3: PATTERN-L (Vulnerability)
  Idee 4: PATTERN-H (Common-Advice-Wrong)
  Idee 5: PATTERN-F (Mini-Story)
  Idee 6: PATTERN-M (Question)
  Idee 7: PATTERN-K (Unpopular)
  Idee 8: PATTERN-A (Dialog)
  Idee 9: PATTERN-I (Stop-Doing-This)
  Idee 10: PATTERN-C (Zahl + Break)

→ 10 verschiedene Patterns. Keine Wiederholung. Jede Idee fühlt sich anders an.

ANTI-WIEDERHOLUNG (zusätzlich):
  - KEINE zwei Ideen mit demselben Sub-Thema (z.B. NICHT 2x "Bitly speichert Daten in
    den USA")
  - JEDE Idee MUSS einen anderen Sub-Aspekt anpacken
  - Wenn der Pillar DSGVO ist: variiere — manchmal Cookie-Banner, manchmal AVV-Vertrag,
    manchmal Schrems-II, manchmal IP-Hashing, manchmal Server-Standort, manchmal Audit-
    Behörde, manchmal Bußgeld-Höhe, manchmal Beschäftigten-Pflichten
  - Wenn Pillar Offline-ROI: variiere — Plakat / Flyer / Visitenkarte / Postkarte /
    Speisekarte / Mailing / Tankstelle / Veranstaltung / Tisch-Aufsteller / Plastik-Tüte
  - Wenn Pillar QR-Practices: variiere — Größe / Position / Logo / Farbe / Print-Material
    / Lichtverhältnis / Smartphone-Modell / Scanner-Verhalten / Print-Qualität /
    Anti-Pattern / Edge-Case

----------------------------------------
HOOK-FIRST-WORDS-TEST (Pflicht pro Idee)
----------------------------------------
Die ersten 5 Wörter des Titels MÜSSEN ALLEINE schon catchen.

Schau dir die ersten 5 Wörter deines Titels an. Wenn jemand NUR die liest — bleibt
er hängen? Will er weiterlesen?

STARK (erste 5 Wörter packen):
  - "500 Postkarten. Drei Anrufe. Niemand."
  - "Dein Plakat-Budget verschwindet grade."
  - "Ein Anwalt sagte mir gestern:"
  - "Sechs Jahre. Falsches Land. Vergessen."
  - "47 Standorte. 3 funktionierten. Null"

SCHWACH (erste 5 Wörter zu generisch):
  - "Die wichtigsten Tipps für besseres..."  → BORING
  - "Wie du mit QR-Codes..."  → BORING
  - "Warum es so wichtig ist..."  → BORING
  - "Eine Marketing-Strategie die hilft..."  → BORING

REGEL: Wenn deine ersten 5 Wörter ohne den Rest des Titels schon nicht
fesseln, hast du den Hook-Test nicht bestanden. Neuer Titel.

----------------------------------------
VARIATIONS-PFLICHT (zusätzlich zum Category-Wheel)
----------------------------------------
- NICHT alle mit "Bitly" im Titel (max 30%)
- NICHT alle als "Ich"-Story (max 40%)
- NICHT alle mit Zahl am Anfang (max 30%)
- Variiere Hook-Patterns A-F
- Mische emotionale Trigger (Wut, Neugier, Identifikation, Status, Verlustangst, Humor)
- Mind. 2 Ideen mit Humor / Selbstironie (C3 oder C7-Vibe)
- Mind. 3 Ideen mit "Did-you-know"-Reveal-Charakter (C2/C5/C10)

==========================================
OUTPUT-FORMAT (STRIKT EINHALTEN — sonst Parser-Crash)
==========================================

ANTWORTE AUSSCHLIESSLICH MIT JSON.
KEIN Vorwort. KEIN "Ich starte mit...". KEINE Research-Notes.
KEINE Markdown-Code-Fences (kein \`\`\`json).
KEIN Erklärungstext nach dem JSON.

Format (genau so):
[
  {"title": "...", "angle": "...", "outline": "...", "target_keywords": "..."},
  {"title": "...", "angle": "...", "outline": "...", "target_keywords": "..."}
]

Dein erster ausgegebener Charakter MUSS "[" sein.
Dein letzter ausgegebener Charakter MUSS "]" sein.

Jetzt liefere die ${count} besten Ideen.`;

  // 8000 max_tokens gibt Buffer für 10-15 Ideen mit knappem Outline.
  // Bei tighten outline-cap (350 chars) ist eine Idee ca. 200-300 output-tokens.
  const text = await callClaude(apiKey, prompt, { maxTokens: 8000, useSearch: true });

  const ideas = parseIdeasJson(text);
  return ideas.filter((i) => i.title && i.outline).slice(0, count);
}

/**
 * Robust-Parser: erst clean parse versuchen, dann Code-Fences/Pre-Text strippen,
 * dann Salvage-Mode (truncierte JSON-Arrays).
 */
function parseIdeasJson(text: string): GeneratedIdea[] {
  let jsonText = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();

  // Pre-Text strippen — finde das echte Array-Start
  const arrayStart = jsonText.search(/\[\s*\{/);
  const lastBracket = jsonText.lastIndexOf(']');
  if (arrayStart >= 0 && lastBracket > arrayStart) {
    jsonText = jsonText.slice(arrayStart, lastBracket + 1);
  } else if (arrayStart >= 0) {
    jsonText = jsonText.slice(arrayStart);
  }

  // Versuch 1: clean parse
  try {
    const parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) return parsed as GeneratedIdea[];
  } catch {
    // fallthrough zum Salvage
  }

  // Versuch 2: Salvage — bei Truncation finde letztes vollstaendiges }-Objekt,
  // schliesse Array dort. Behebt 'Unterminated string in JSON'-Fehler.
  const salvaged = salvageTruncatedArray(jsonText);
  if (salvaged) {
    try {
      const parsed = JSON.parse(salvaged);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed as GeneratedIdea[];
      }
    } catch {
      // weiter unten in throw
    }
  }

  throw new Error(
    `Ideas JSON parse failed (truncated or malformed). First 200 chars: ${jsonText.slice(0, 200)}`,
  );
}

/**
 * Wenn die API-Response mid-string abgeschnitten wurde, finde das letzte
 * vollstaendige Idee-Objekt (durch passende geschlossene Quote-States und }
 * Klammern) und schliesse das Array dort.
 */
function salvageTruncatedArray(jsonText: string): string | null {
  if (!jsonText.startsWith('[')) return null;

  // Scanne durch und tracke balance + ob wir gerade in einem String sind.
  // Merke uns die Position des letzten validen "}" das auf top-level steht
  // (depth === 1, also ein Array-Element).
  let depth = 0;
  let inString = false;
  let escape = false;
  let lastTopLevelObjectEnd = -1;

  for (let i = 0; i < jsonText.length; i++) {
    const c = jsonText[i];

    if (inString) {
      if (escape) escape = false;
      else if (c === '\\') escape = true;
      else if (c === '"') inString = false;
      continue;
    }

    if (c === '"') { inString = true; continue; }
    if (c === '{' || c === '[') depth++;
    else if (c === '}' || c === ']') {
      depth--;
      // Nach Array-Start (depth 1 nach '[') ist ein Objekt-Ende auf depth=1
      if (c === '}' && depth === 1) lastTopLevelObjectEnd = i;
    }
  }

  if (lastTopLevelObjectEnd < 0) return null;
  return jsonText.slice(0, lastTopLevelObjectEnd + 1) + ']';
}

// ---------------------------------------------------------------------------
// Blog-Expander (META/BODY-Block-Format für Parse-Robustheit)
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

  const blogResearchSection = WEB_SEARCH_ENABLED ? `
----------------------------------------
RESEARCH-FIRST-PROTOKOLL (Pflicht — vor dem Schreiben)
----------------------------------------
Du hast Zugriff auf web_search. **Nutze es BEVOR du den Blog schreibst.**

Such 2-3 mal gezielt nach aktuellen Fakten / News-Geschichten / Behörden-Verfahren
zum Thema. Webe Findings natuerlich in den Text ein (kein Zitate-Listen-Format).
Wenn du keinen konkreten News findest: weiter mit Story-Mode, kein Problem.
` : '';

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
${blogResearchSection}

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

PFLICHT-CHECKLISTE für den ERSTEN SATZ (jede Box muss erfüllt sein):

  [ ] (1) Maximal 12 Worte
  [ ] (2) Enthaelt mind. EIN viszerales Wort:
          [Muell, Asche, weg, verbrannt, kaputt, blind, tot, leer, vergessen,
           verloren, draufgegangen, verpufft, geplatzt, leer, Papierkorb,
           verschwunden, eiskalt, schockiert]
  [ ] (3) Enthaelt mind. eines:
          - Konkrete Zahl (47, 50.000, 6 Wochen, 18%)
          - Konkreter Ort (Düsseldorf, Frankfurt, Hannover)
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
  "Lass uns über Plakatwerbung sprechen." → SCHWACH
  "Ein interessanter Fall aus der Praxis..." → MARKETING-FLOSKEL

----------------------------------------
SATZ 2-4 (Druck halten)
----------------------------------------
Nach dem Killer-Opener: SOFORT konkret werden.
Wer? Wo? Wann? Mit welcher Zahl? Mit welchem Zitat?

PFLICHT:
- Satz 2 oder 3 enthaelt direkten Dialog in Anführungszeichen
- Satz 2-4 enthaelt mind. 1 konkrete Zahl
- Satz 2-4 enthaelt mind. 1 konkreten Ort (Stadt) ODER Rolle (Sanitaerbetrieb,
  Marketing-Chefin, B2B-SaaS, Restaurant-Inhaber, etc.)

VIBE:
- Kurze Sätze (3-12 Worte). Wechsel mit 1-Wort-Punchlines ("Muell.")
- Wirkt wie gesprochen, nicht wie geschrieben
- Frust + Beobachtung + Faktum mischen

REFERENZ (aus David's Post):
"Mein Kunde zahlte 50.000 Euro monatlich für 47 Plakat-Standorte. Dann fragte
ich: 'Welche drei funktionieren am besten?' Antwort: 'Keine Ahnung.' Das war
der Moment, wo mir klar wurde — Print-Marketing läuft in Deutschland komplett
blind."

Beachte:
- Satz 1 = konkrete Zahl + Person (50k € + 47 Plakate + Kunde)
- Satz 2 = direkte Frage in Anführungszeichen
- Satz 3 = direkte Antwort ("Keine Ahnung.")
- Satz 4 = Insight-Pivot ("Das war der Moment, wo mir klar wurde...")

Genau dieser Vier-Satz-Bogen — mach das in DEINEM Blog gleich.

VERBOTEN (Instant-Fail):
- "In diesem Artikel zeige ich dir..."
- "Hast du dich schon mal gefragt..."
- "In der heutigen Zeit ist es wichtig..."
- "Lass uns gemeinsam einen Blick werfen..."
- "Hier sind 5 Tipps..."
- Lange einleitende Sätze über das Thema im Allgemeinen
- "Bevor wir in die Details gehen, lass uns kurz festhalten..."

----------------------------------------
STRUKTUR
----------------------------------------

1. **HOOK-ABSATZ** (siehe oben — 2-4 Sätze, mit Specificity + Dialog)

2. **RELATABLE-MOMENT-ABSATZ** (3-5 Sätze):
   Ausweitung der Situation. Der Leser denkt: "Das könnte mir genauso passieren."
   Konkret bleiben. Eine Person, ein Ort, eine Beobachtung.

3. **4-5 H2-UNTERABSCHNITTE** mit ## Headlines:
   - Headlines max 50 Zeichen
   - Headlines folgen Pattern: Frage ("Wo stehen eure Server?") ODER Behauptung
     ("Sechs Jahre. Niemand fragte.") ODER Pattern-Break ("Das eigentliche Problem
     ist nicht Bitly.")
   - Headlines DUERFEN provokant / kontrovers sein
   - KEINE Headlines wie "Was ist X?" / "Die Vorteile von X" / "Tipps für X"

4. **PRO H2-ABSCHNITT (Inhalt)**:
   - 2-4 kurze Absätze
   - MINDESTENS 1 konkrete Zahl / Name / Zitat pro Abschnitt
   - MINDESTENS 1 Mini-Cliffhanger oder Open-Loop
   - MINDESTENS 1 direkte Leser-Adresse ("du", "fragst du jetzt...")
   - Sätze meist kurz (3-12 Worte), gelegentlich 1-Wort-Punchlines ("Klingt absurd.")

5. **MITTE-DES-TEXTES-BOLD-LINE**: irgendwo in der Mitte EIN fett gesetzter Satz
   (mit **...**) der zentralen Insight zusammenfasst und visuell den Lesefluss bricht.

6. **PRAKTISCHER MEHRWERT**: irgendwo ein Block mit konkreten Action-Steps (nicht als
   stumpfe Liste mit "1, 2, 3" — sondern als Empfehlung im Erzählfluss).
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
  - Offene Frage ("Was sie als nächstes sagte, war neu für mich.")
  - Mini-Pattern-Interrupt ("Ich dachte das Gegenteil. Bis...")
  - 1-Wort-Satz ("Stille.")
  - Konkrete Andeutung ("Eine einzige Frage hat alles geändert.")

Wenn ein Absatz auch ohne den nächsten verstanden werden kann — er ist zu rund.
Umschreiben mit Cliffhanger am Ende.

----------------------------------------
SPEZIFITAETS-CHECKLISTE (vor finalem Output)
----------------------------------------

Prüfe nach dem Schreiben:
[ ] Mind. 2 konkrete Zahlen im Text (47 Mitarbeiter, 6 Jahre, etc.)
[ ] Mind. 1 konkreter Ort (Düsseldorf, Frankfurt, Ashburn Virginia)
[ ] Mind. 1 direkter Satz in Anführungszeichen
[ ] Mind. 1 namentlich benannte Rolle (Marketing-Chefin, DSGVO-Anwalt, CMO)
[ ] Mind. 1 Marke / Tool / Service konkret genannt (Bitly, Ashburn AWS, Rebrandly)
[ ] Mind. 1 konkrete Zeitangabe (Donnerstag, gestern, vor 6 Wochen)

Wenn irgendwas davon fehlt — Text ist zu generisch. Spezifik einbauen.

==========================================
IMAGE-PROMPT — VIRAL THUMBNAIL (KEIN STOCKFOTO)
==========================================
Generiere einen ENGLISCHEN Image-Prompt (80-130 Worte) für ChatGPT/DALL-E 3/
Midjourney/Gemini Imagen.

═══════════════════════════════════════════
KRITISCHES VERBOT — NIE GENERIEREN:
═══════════════════════════════════════════
Diese Image-Konzepte sind STANDARD-AI-FALLBACK und uniformlangweilig:

  ✗ "Close-up portrait of a [marketing director] in [office], face expressing
    shocked disbelief, staring at [papers/screen/laptop], lit by overhead lamp"
  ✗ "Person at desk with laptop, dramatic chiaroscuro lighting"
  ✗ "Marketing analyst reviewing dashboard, glasses reflecting screen"
  ✗ "Tired/frustrated/shocked professional in dimly lit office at night"
  ✗ "Business person looking at documents with worried expression"

WENN dein Image-Prompt mit "Close-up portrait of a [age]-year-old [role]" anfängt
ODER "Person at desk" enthält ODER "office lighting" als Hauptmotiv hat → FALSCH.
NEU SCHREIBEN mit einem anderen Konzept.

═══════════════════════════════════════════
KONZEPT-AUSWAHL: ZWANG ZU VARIATION
═══════════════════════════════════════════
1) Lies den Blog-Hook nochmal.
2) Frage dich: Was ist das KONKRETE Objekt / die KONKRETE Szene in der Story?
   (Postkarten, Plakatwand, QR-Codes, Schredder, Server, Restaurant-Tisch,
    Suitcase mit Daten, brennende Geldscheine, Papierberg, leere Plakatwand)
3) Bildidee MUSS dieses Objekt ZENTRAL zeigen, nicht eine Person die darüber
   nachdenkt.
4) WAEHLE BEWUSST eine Konzept-Familie K2-K7 (NICHT K1). K1 nur wenn der Hook
   explizit eine emotionale Reaktion eines Menschen ist.

ZIEL: Wenn jemand auf LinkedIn scrollt und das Bild sieht, soll er stoppen.
Konkret. Visuell. Emotional. Mit einem Wow-Moment. Wie ein YouTube-Thumbnail
mit hoher CTR — nicht wie ein Stockfoto.

═══════════════════════════════════════════
ZIELSTIL: PHOTOJOURNALISMUS, NICHT INFOGRAFIK
═══════════════════════════════════════════
Stell dir vor, ein VICE-Magazin-Fotograf oder NATIONAL GEOGRAPHIC-Reporter
fotografiert die Szene aus dem Blog-Hook. Gritty. Real. Physisch. Mit Tonwerten
und Schmutz. Mit echten Objekten in echten Umgebungen.

NIE: "visualization", "infographic", "icon", "chart", "graph", "diagram",
"map representation", "stylized illustration", "symbolic representation"

NIE: Etwas das aussieht wie aus einer McKinsey-Praesentation, einem SaaS-
Marketing-Deck oder einem LinkedIn-Karussell. WIR WOLLEN PHOTO. ECHT. GRITTY.

═══════════════════════════════════════════
REFERENZ-STYLE — DEIN OUTPUT MUSS SO AUSSEHEN
═══════════════════════════════════════════

REF 1 — Money-Destruction (Hook "Budget verbrennt"):
"A stack of 50 EUR bills mid-burn inside a rust-streaked industrial trash bin
in a workshop yard, flames curling and blackening the paper edges, ash
particles suspended in golden afternoon light filtering through a chain-link
fence, a single half-burnt bill floating mid-air with the EU stars still
visible, low-angle close-up shot at 30cm distance, harsh diagonal shadow
across the rusty bin, shot on Canon EOS R5 24mm f/2.8, deep amber-and-
charcoal color grade, photorealistic gritty documentary style, no text
visible, no logos visible."

REF 2 — Wrong-Context-Object (Hook "deine Mailings landen im Muell"):
"Aerial top-down 90 degree shot of approximately 500 unopened glossy A5
postcards thrown into an open household kitchen trash bin among coffee
grounds, eggshells, orange peels, and crumpled receipts, harsh fluorescent
overhead kitchen light, a single housefly hovering above one card, shot on
Sony A7R V 35mm f/4 from directly above on a tripod, high-contrast pure
white postcard backs against dark organic waste, sharp focus throughout, no
text visible, no logos visible, photorealistic editorial documentary style."

REF 3 — Macro-Detail (Hook "QR-Code zu klein auf Plakat"):
"Extreme close-up macro shot of a single tiny QR code printed on the bottom
corner of a weathered Berlin street poster, paper fibers and ink bleed
visible, raindrops on the surface, deep depth of field revealing the empty
urban underpass behind the poster in soft bokeh, single overhead sodium-
vapor street lamp casting orange-amber light, shot on Sony 100mm macro
lens f/8 from 5cm distance, high contrast between the tiny black QR squares
and the pale wet poster paper, no text visible (other than the QR code
itself), no logos visible."

REF 4 — Data-Metaphor (Hook "Daten ueber den Atlantik"):
"An open vintage leather suitcase tipped sideways on a foggy tarmac at dusk,
hundreds of small printed photos of anonymous faces spilling out across the
wet concrete, a transatlantic cargo plane visible in the deep-blue distance
taking off, harsh single industrial floodlight casting a long diagonal
shadow, the suitcase has 'BL Inc.' stenciled in faded white on its side,
shot low-angle on Canon R5 35mm f/2.8, deep-blue-hour with single warm-
amber light source, cinematic documentary style, no text visible (other
than the stenciled side), no logos visible."

REF 5 — High-Emotion-Moment (Hook "Founder-Story"):
"A bearded man in his early 30s sitting cross-legged on the dusty concrete
floor of a completely empty office space at 2am, an open laptop balanced
on his lap showing a single red analytics line dropping to zero, head in
one hand, single overturned coffee mug beside him with a small puddle, one
warm desk lamp casting his long shadow across the bare floor, broken
ceiling tiles visible above, shot low-angle 25cm from the floor on Leica
M11 28mm f/1.4, warm tungsten color grade against deep navy shadows,
cinematic chiaroscuro, no text visible, no logos visible."

═══════════════════════════════════════════
HARTE VERBOTSLISTE — DIESE WORTE NICHT IN DEN PROMPT
═══════════════════════════════════════════
Wenn dein image-Prompt EINES dieser Worte enthält, IST ER FALSCH. Neu schreiben.

  ✗ "visualization", "infographic", "data visualization", "stylized chart"
  ✗ "icons", "icon", "symbolic representation", "abstract representation"
  ✗ "diagram", "chart", "graph", "bar chart", "stacked bar"
  ✗ "minimalist", "clean modern", "professional photography style"
  ✗ "corporate", "business", "marketing context", "marketing analytics"
  ✗ "modern office", "boardroom", "conference table", "meeting room"
  ✗ "stock-photo", "editorial photography" (alleinstehend, zu vage)
  ✗ "Cartoon", "illustration", "isometric", "3D-render", "flat-design"
  ✗ "Person standing/sitting/looking" als einzige Aktion (zu vage)
  ✗ "Mountains/cityscape/skyline" als Hauptmotiv (zu generisch)
  ✗ "Split-screen visual metaphor" (zu konzeptionell, zu LinkedIn-Karussell)
  ✗ "Map of Germany" / "geographic representation" (zu Infografik)
  ✗ "Server racks" als sterile Tech-Visualisierung (nur in echter
    photorealistischer Umgebung mit Drama erlaubt)

═══════════════════════════════════════════
PFLICHT-ELEMENTE — MIND. 3 davon im Prompt
═══════════════════════════════════════════
Das Bild MUSS mindestens 3 dieser Elemente enthalten:

  PHYSISCHE-AKTION/-ZUSTAND:
    fire crackling, smoke wisp, ash, charred, burning, melting,
    torn paper mid-tear, ripped edges, paper shredder mid-action,
    falling coins/bills, scattered documents,
    crumpled paper, mountainous pile of paperwork,
    submerged, soaked, water damage, mud, dust cloud,
    sealed envelope being torn, postcards mid-flight,
    glass shattering, bottle exploding,
    overflowing trash bin, dumpster, garbage truck

  DRAMATIC-LIGHT:
    "harsh single overhead spotlight cutting through darkness",
    "low-angle dramatic backlight",
    "neon-orange flame illumination",
    "blue police-light strobe effect",
    "single beam of light through warehouse window dust",
    "golden hour rim light through fog"

  SATURIERTE-FARB-CONTRAST:
    "deep red against pale blue",
    "neon orange against charcoal black",
    "electric cyan against blood red",
    "hazard yellow against deep navy",
    "burnt orange against forest green"

  KAMERA-WINKEL (NICHT eye-level):
    "extreme top-down aerial 90 degrees", "worm's-eye low-angle 15cm above ground",
    "macro shot 5cm distance", "dutch tilt 30 degrees", "fisheye lens 14mm"

  CAMERA-SPEC (Pflicht):
    "shot on Canon EOS R5 24mm f/2.8", "Sony A7R V 100mm macro f/4",
    "Hasselblad H6D 80mm f/4", "RED Komodo cinema camera 35mm"

----------------------------------------
WAS EIN CATCHY THUMBNAIL HAT (alle 7 Punkte einbauen)
----------------------------------------

1) **EINE klare zentrale Idee** — der Bildinhalt sollte sich in 1 Satz erklären
   lassen ("Geld brennt", "Mann schockiert vor Bildschirm", "Plakat im Muelleimer")

2) **HOHE EMOTION** — wenn Person im Bild: starke Mimik
   [shocked face / mouth slightly open / wide eyes / facepalm / disbelief]
   Wenn kein Mensch: dramatische Bewegung
   [paper mid-tear / coins falling / fire crackling / spotlight cutting darkness]

3) **HOHE FARBSAETTIGUNG + KONTRAST** — Thumbnail-Look, nicht subtil
   - Mind. EINE knall-Farbe (warm fire-orange / electric cyan / hazard yellow /
     deep red)
   - Dunkler Hintergrund (black, deep navy, dark wood) für Pop
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
   - Marketing-Manager schlaeft im Büro, Bildschirm zeigt rote Zahlen
   - Schredder spuckt Asche statt Papier

6) **CAMERA + LIGHTING SPEC** (Pflicht in jedem Prompt)
   Wähle pro Bild einen Stil:
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
KONZEPT-FAMILIEN (wähle 1, kombiniere wenn möglich)
----------------------------------------

K1 — **HUMAN-REACTION-CLOSEUP** (sehr stark für LinkedIn)
   "Close-up portrait of a [age + role + setting], face expressing [emotion],
   eyes [reaction detail], lit by [single dramatic light source], background
   [out of focus context detail]."
   Beispiel: "Close-up portrait of a 50-year-old male small-business owner in a
   Hannover-style workshop, face expressing tired disbelief, eyes staring at a
   pile of unopened postcards on the desk, lit by single overhead industrial
   lamp, background blurred workshop tools, shot on Sony A7 IV 50mm f/1.4,
   moody warm color grading."

K2 — **MONEY-DESTRUCTION** (für Budget/Verschwendung-Topics)
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

K4 — **SPLIT-SCREEN BEFORE/AFTER** (für Vergleichs-Topics)
   "Split-screen composition: left half shows [chaos/old way], right half shows
   [clean/new way], dividing line is [creative element], same lighting style
   on both sides, photographed straight-on."
   Beispiel: "Split-screen composition: left half shows 47 disorganized paper
   marketing reports piled on a chaotic desk, right half shows a single clean
   tablet displaying a sharp analytics chart, divided by a vertical beam of
   warm light, identical eye-level perspective on both halves, shot on
   Hasselblad medium format."

K5 — **MACRO-VISIBLE-DETAIL** (für Tech / QR / Data-Topics)
   "Extreme macro shot of [specific small object], showing [unexpected detail],
   shallow depth of field, [light source], [color contrast]."
   Beispiel: "Extreme macro shot of a single QR code printed on a torn corner
   of a German A1 advertising poster, showing fine paper fibers and slight ink
   bleed, deep depth of field that reveals out-of-focus city street in
   background, lit by overcast natural daylight, cool blue tones contrasting
   with poster's red ink."

K6 — **PHYSICAL-METAPHOR-FOR-DATA** (für DSGVO / Privacy / Tracking-Topics)
   "[Physical object representing data/privacy] in [setting that makes the
   metaphor clear], [unexpected detail showing the problem]."
   Beispiel: "An open suitcase filled with hundreds of small photo prints of
   anonymous faces being loaded onto a transatlantic cargo plane on a foggy
   tarmac, suitcase has 'Bitly Inc.' stenciled subtly on the side, shot from
   low angle in dramatic blue-hour light with American flag silhouette in
   background, cinematic 35mm."

K7 — **HIGH-EMOTION-MOMENT-CAPTURED** (für Behind-Scenes / Founder-Stories)
   "Person in middle of [authentic emotional moment], [body posture/gesture],
   [environment context that explains the moment], [lighting that emphasizes
   emotion]."
   Beispiel: "A bearded male founder in his early 30s sits on the floor of an
   empty office at 2am, laptop open on his lap displaying a single red dropped-
   to-zero analytics chart, head in one hand, single desk lamp casting long
   shadow, cinematic chiaroscuro lighting in warm tungsten color, shot on
   Leica M11 28mm f/1.4."

----------------------------------------
PFLICHT-ATTRIBUTE FUER JEDEN PROMPT (alle 8 erfüllen)
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
PILLAR → KONZEPT-PFLICHT (K1 fast immer verboten)
----------------------------------------

- DSGVO/Privacy:   K6 (Daten-Metapher: Suitcase, Flugzeug, Atlantik, Server-Raum)
                   ODER K3 (Object-in-wrong-context: Akten in Karton "Air Freight USA")
                   K1 NUR wenn Blog explizit ueber Anwalt-Gespraech / Compliance-Officer

- Offline-ROI:     K2 (Money-Destruction: brennende Geldscheine, Schredder, Asche)
                   ODER K3 (Object-in-wrong-context: Plakat im Mülleimer, Flyer auf
                   Schrottplatz, Postkarten in Reisswolf)
                   K1 verboten — wer Geld brennt, sieht man brennen, nicht traurig sein

- QR-Practices:    K5 (Macro-detail: einzelner QR auf riesiger Plakatwand, riesiger
                   QR mit Logo-Mitte aufgerissen, QR auf Wäsche-Etikett, QR-Tattoo)
                   ODER K3 (QR-Code in absurder Umgebung: auf Berg, auf Eisberg,
                   unter Wasser, auf Pizza)

- Attribution:     K4 (Split-Screen: chaotische Spuren links / saubere Daten rechts)
                   ODER K3 (Detektiv-Lupe ueber Pinwand mit roten Faeden)
                   ODER K6 (Datenstrom als physisches Objekt)

- Behind-Scenes:   K7 (High-emotion-moment: Founder auf Boden um 2 Uhr nachts)
                   K1 erlaubt — aber dann SEHR konkret und mit Wow-Detail

K1 (Human-Reaction-Closeup) ist die LETZTE Option. Wenn du sie waehlst, MUSS
das Bild ein massives Wow-Detail haben (z.B. ein einzelner brennender Geldschein
in der Hand, eine Plakatwand komplett leer hinter der Person, etc.) — kein
"Mann starrt auf Laptop".

═══════════════════════════════════════════
KONZEPT-DIVERSITY-CHECK
═══════════════════════════════════════════
Wenn der Output beginnen wuerde mit "Close-up portrait" oder "Person at desk" —
STOP. Schreibe das Image-Prompt mit einem K2/K3/K5/K6 Konzept neu.

Beispiel: Blog ueber "Sanitaerbetrieb verschickt 500 Postkarten — 0 Anfragen".
  - SCHLECHT (K1): "Close-up portrait of a 50-year-old plumber, face expressing
    disbelief, staring at postcards on desk."
  - GUT (K3): "Aerial top-down shot of 500 unopened printed postcards thrown
    into a large industrial paper shredder, mid-action, golden afternoon light
    streaming through warehouse windows, paper scraps and dust particles
    suspended in beams of light, deep red shredder housing contrasting against
    pale-yellow postcards, shot from directly above on Hasselblad H6D 80mm
    f/4, photorealistic editorial style, no text visible, no logos visible."
  - GUT (K2): "Stack of 500 colorful A5 postcards burning in an industrial
    metal trash bin in a workshop yard, flames curling paper edges, ash
    floating in golden hour rays, dropped clipboard with marketing-budget
    spreadsheet visible foreground, shot low-angle on Canon EOS R5 24mm f/2.8,
    saturated orange-and-blue color grade, no text visible, no logos visible."

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

═══════════════════════════════════════════
4-AKT-BILD-KOMPOSITION (YOUTUBE-THUMBNAIL-STYLE)
═══════════════════════════════════════════
Dein image-Prompt muss aus 4 Akten bestehen, in dieser Reihenfolge:

AKT 1 — DAS HAUPTMOTIV (40-60 Worte)
  Was sieht der Betrachter zuerst? Konkretes Objekt oder Szene.
  Inkl. exakte Position (vorne, mitte, rechts oben), Material (rusty,
  weathered, glossy, charred), Zustand (mid-burn, falling, scattered,
  half-buried), Anzahl (5, 23, hundreds).

AKT 2 — DIE UMGEBUNG + STIMMUNG (30-50 Worte)
  Wo spielt das Bild? Konkreter Ort (workshop yard, Berlin underpass,
  industrial dumpster lot, kitchen, foggy tarmac).
  Wetter / Tageszeit (golden hour, deep blue-hour, overcast, rain).
  Sekundär-Elemente die die Story tragen (Passant unscharf im Hintergrund,
  überfließender Mülleimer, leeres Schwarz-Plakat).

AKT 3 — DAS FUNNY / WOW-ELEMENT (Pflicht — 20-40 Worte)
  EIN witziges, unerwartetes oder absurdes Detail das das Auge fängt:
  - Lustige Juxtaposition (Wurst neben Anwalts-Akten)
  - Personalisiertes Mini-Objekt (handgeschriebenes Post-it mit Smiley auf
    einem brennenden 50€-Schein)
  - Tier in unerwartetem Kontext (eine Taube sitzt auf der zerrissenen
    Bitly-Visitenkarte)
  - Übertriebener Kontrast (winziger QR neben riesiger Bratwurst-Plakat-
    Werbung)
  - Mini-Story-Detail (eine angebissene Brezel halb in dem Aktenstapel)

AKT 4 — TEXT-OVERLAY (YouTube-Thumbnail-Headline)
  GENAU EIN kurzer, deutscher Text-Overlay mit 1-3 Worten in BOLD CAPS
  (DALL-E 3 / gpt-image-1 / Midjourney v6 können kurze Texte zuverlässig
  rendern).

  Format im Prompt:
  "with bold yellow sans-serif text reading exactly 'VERPUFFT.' overlaid
   in the upper-left corner, slight rough handprinted texture, slight
   shadow behind the letters"

  Text-Auswahl-Regeln:
  - 1-3 Worte MAX (länger = AI rendert falsch)
  - DEUTSCH, in CAPS
  - Triggert sofort einen emotionalen Stop: "VERPUFFT.", "WEG.",
    "AUTSCH.", "BLIND.", "PEINLICH.", "47 BILLBOARDS.", "300€/MONAT.",
    "0 SCANS.", "NIE WIEDER.", "OPS!", "OHA."
  - MUSS zum Blog-Titel passen (extrahiere die punchigste Essenz)
  - Style: Bold sans-serif (Impact / Helvetica Bold / Inter Black),
    bevorzugt Gelb / Weiss / Hazard-Orange
  - Position: Upper-Left ODER Upper-Right ODER Bottom-Center

AKT 5 — DIE TECHNIK + ABSCHLUSS (40-60 Worte)
  Camera + Brennweite + Blende ("shot on Canon EOS R5 24mm f/2.8").
  Lichtquelle benannt + Richtung ("harsh diagonal late-afternoon sun").
  Farbpalette mit 2-3 Kontrast-Farben.
  Style-Referenz benennen (VICE magazine reportage / NatGeo / noir editorial).
  Ende mit: "no other text or logos visible besides the headline overlay".

WICHTIG: Frueher stand "no text visible". JETZT ist EIN gezielter Text-Overlay
(Akt 4) PFLICHT, um YouTube-Thumbnail-Feel zu erzeugen. Trotzdem KEINE anderen
Texte / Logos / Wasserzeichen.

═══════════════════════════════════════════
SHOCK-DETAIL-BANK (mind. 1 davon im Output)
═══════════════════════════════════════════
Eines dieser Wow-Details MUSS im Image-Prompt vorkommen — sie machen den
Unterschied zwischen "ganz nett" und "scroll-stop":

  Physisch:
  - "a single [object] mid-action / mid-flight / mid-fall / mid-burn"
  - "scattered debris suspended in dust beams"
  - "one melting / dripping / cracking [object]"
  - "raindrops beading on [surface]"
  - "broken glass / torn fabric / spilled liquid creating organic chaos"

  Human-Element ohne Gesicht:
  - "a single hand visible from edge of frame holding [object]"
  - "blurred pedestrian silhouette in background"
  - "shadow of a person on the wall but person out of frame"
  - "footprints leading away into the distance"

  Story-Anchor:
  - "scattered receipts with the date 2026 visible on one"
  - "a single stamped passport corner peeking from envelope"
  - "an old printed Bitly logo faintly visible on a torn sticker"

  Unexpected-Juxtaposition:
  - "expensive object in cheap setting (Rolex on muddy concrete)"
  - "fragile object in rough setting (vintage photo album in dumpster)"
  - "delicate light in industrial setting"

═══════════════════════════════════════════
VISUAL-DNA-PFLICHT
═══════════════════════════════════════════
Pro Output mind. 1 Element aus jeder dieser DNA-Säulen:

  PALETTE: ein Kontrast-Farbpaar benannt + Sättigung
    z.B. "saturated burnt orange against deep charcoal, single cyan accent"

  KAMERA: Marke + Brennweite + Blende + Distanz
    z.B. "shot on Canon EOS R5 24mm f/2.8 from 30cm distance"

  LICHT: Quelle + Richtung + Qualität
    z.B. "harsh single overhead workshop pendant casting hard diagonal shadow"

  WINKEL: kein eye-level, etwas dynamisches
    z.B. "low-angle 15cm above the muddy ground", "extreme top-down 90 degrees"

  TEXTUR: physische Materialqualitäten benennen
    z.B. "fine paper fibers visible, slight ink bleed on weathered surface"

  STYLE-REFERENZ: zum Schluss EIN Genre benennen
    z.B. "photorealistic gritty documentary style" / "VICE magazine reportage"
    / "National Geographic photojournalism" / "noir editorial photography"

═══════════════════════════════════════════
NIE-ZWEIMAL-GLEICH-Regel
═══════════════════════════════════════════
Wenn der Blog-Title viele "QR-Code" / "Plakat" / "Bitly" enthält, variiere die
visuelle Umsetzung trotzdem:
  - Plakat → Mal Plakatwand frontal, Mal U-Bahn-Station, Mal Bushaltestelle,
            Mal Fußgängerzone in der Pampa, Mal Tankstelle bei Nacht
  - QR-Code → Mal Speisekarte, Mal Visitenkarte, Mal Tankstelle, Mal Friedhof,
              Mal Industrie-Schild, Mal Veterinäramt
  - Bitly → Mal Server-Raum, Mal Reisepass, Mal Flughafen, Mal AVV-Vertrag-
            Detail, Mal physischer Brief

Verwende Blog-spezifische CONTEXT-Hooks: wenn der Blog "Speisekarte" nennt
→ Speisekarte zentral. Wenn "Plakatwand" → Plakatwand zentral. Niemals
generische "Marketing-Materialien".

----------------------------------------
LÄNGE
----------------------------------------
**150-220 Worte.** Dieser Prompt geht direkt in ChatGPT/DALL-E/Midjourney.
Je präziser, desto besser das resultierende Bild.

Konkrete Details > vage Adjektive. Lieber 220 Worte mit echten Specs als 80
Worte mit "beautiful / cinematic / professional".

Output-Format — KRITISCH WICHTIG (Parser hängt sonst):

---META---
slug: kurz-knackig-url-friendly
description: 1-2 Sätze SEO max 155 Zeichen, mit Wow-Hook
tags: Tag1, Tag2, Tag3
image_prompt: [START MUST BEGIN with a concrete PHYSICAL OBJECT like "A stack of", "A burnt", "A single torn", "An open vintage", "Hundreds of scattered", NEVER with "A cluttered scene", "A split-screen", "A minimalist", "A modern". The first 6 words determine the image. 150-220 Wörter, 3-Akt-Struktur (Object → Setting → Camera/Light/Detail), mind. 1 Shock-Detail aus der Bank, alle Visual-DNA-Säulen abgedeckt. ABSOLUT VERBOTEN: "split-screen", "overlay", "comparison side by side", "infographic", "minimalist", "chart", "before-after", "data visualization". KEINE Quotes drum, ein einziger zusammenhängender Text-Block.]
image_alt: [deutscher Alt-Text für Accessibility, max 120 Zeichen]
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
 * Parser für ---META---...---BODY---...-Format.
 * Tolerant gegenüber leichten Format-Abweichungen.
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
  // Clickbait-Thumbnail-Style Fallback. Hash auf Titel wählt Konzept-Familie
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
