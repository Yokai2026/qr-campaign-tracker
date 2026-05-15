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

---

Du bist Content-Strategist fuer Spurig. Generiere ${count} VIRALE Content-Ideen fuer den Pillar "${CLUSTER_LABEL[cluster]}":
${CLUSTER_DESCRIPTION[cluster]}

Jede Idee muss SOCIAL-MEDIA-tauglich sein:
- **Titel** (max 70 Zeichen): Schlagzeile mit Wow-Effekt / Pattern-Break / Kontroverse / konkreter Zahl.
  Beispiele guter Titel:
  · "Was 90% der Marketing-Agenturen ueber DSGVO falsch verstehen"
  · "Ich habe 6 Wochen mit Bitly gearbeitet. Hier was passierte."
  · "27 Euro pro Plakat-Standort. So habe ich das gemessen."
  · "Warum dein QR-Code mit Logo 30% weniger Scans bekommt"
  Schlechte Titel (NICHT generieren):
  · "5 Tipps fuer besseres DSGVO" (Listicle, generisch)
  · "Was ist QR-Code-Tracking?" (zu basic)
  · "Datensparsamkeit im Tracking" (klingt nach Whitepaper)

- **angle** (Story-Hook fuer Intro, 1 Satz): persoenliche Beobachtung, eigene Fehleinschaetzung, oder echter Kunden-Moment.
  Format: "Letzte Woche...", "Ein Kunde fragte mich...", "Bis vor 3 Monaten dachte ich..."

- **outline** (2-3 Saetze): WAS im Post drin steht — konkrete Punkte, Zahlen, Beispiele.
  Mindestens 1 kontroverser Take oder Insight gegen Mainstream.

- **target_keywords** (2-4 SEO-Keywords kommagetrennt): natuerlich, nicht stuffed.

Tonalitaet: jede Idee muss Spurig's "anti-Bitly + indie + ehrlich + lehrreich"-DNA tragen.

Format: NUR JSON-Array, keine Markdown-Fences, kein Vorwort:
[
  {"title": "...", "angle": "...", "outline": "...", "target_keywords": "..."},
  ...
]`;

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';

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

---

Du schreibst einen Spurig-Blog-Post zum Thema "${idea.title}".

INPUT:
- Story-Hook: ${idea.angle}
- Outline: ${idea.outline}
- SEO-Keywords: ${idea.target_keywords ?? 'keine vorgegeben'}
- Pillar: ${CLUSTER_LABEL[idea.cluster]}

Schreibe einen 900-1300 Worte deutschen Markdown-Blog-Post — Stil = "Founder beim Bier mit Kollegen", maximales Engagement, persoenlich, diskussions-anregend.

ENGAGEMENT-REGELN (Pflicht):
- **Du-Form direkt** an Leser ("Kennst du das?", "Mach das nicht so wie ich", "Du wirst denken...")
- **Mindestens 3 direkte Leser-Fragen** verteilt ueber den Text (nicht alle am Ende)
- **Mindestens 1 kontroverse These** in ersten 2 Absaetzen ("Die meisten machen X. Das ist Bullshit. Hier warum:")
- **Mindestens 1 Selbstkritik** ("Ich war ueberzeugt dass... bis...")
- **Mindestens 1 "Aha"-Moment** ("Was ich nie verstand: ...")
- **Sehr kurze Saetze**. 3-8 Worte. Manche 1 Wort. ("Klar. Logisch. Trotzdem falsch.")
- **Konkrete Namen, Zahlen, Beispiele** statt abstrakter Phrasen
- **Mind. 2 plausible Stats** ("Bei den 50 Marketing-Teams die ich gesprochen habe...")

Struktur:
1. **Hook-Absatz** (2-4 Saetze): konkrete Situation aus dem angle. Kein "In diesem Artikel". Pattern-Break in Zeile 1.
2. **4-5 H2-Unterabschnitte** mit ## Headlines (max 45 Zeichen, klick-mich-Feel — am besten Fragen oder kontroverse Behauptungen)
3. **Pro Abschnitt 2-4 Absaetze**, mit eingebauten Leser-Fragen + konkreten Beispielen
4. **Schluss-Abschnitt** ## Was meinst du? oder ## Hab ich da was uebersehen? — endet mit ECHTER Diskussions-Frage die Antworten provoziert

VERBOTEN (instant fail):
- "In diesem Artikel", "Hier sind 5 Tipps", "Lass uns einen Blick werfen"
- Generische Hooks ("Hast du dir je gefragt...")
- "Take", "Pro-Tipp", "Spoiler:", "innovativ", "revolutionaer"
- Lange verschachtelte Saetze
- Keine echte Frage am Ende (sonst keine Diskussion)

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

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 5000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';

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
