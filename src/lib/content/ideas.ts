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

Schreibe einen 900-1300 Worte deutschen Markdown-Blog-Post mit Social-Media-Vibe (Schlagzeile-Feel, Wow-Hook, lehrreich + unterhaltsam).

Struktur:
1. **Hook-Absatz** (3-5 Saetze): direkter Story-Einstieg aus dem angle. KEIN "In diesem Artikel...", keine Begruessung.
2. **4-5 H2-Unterabschnitte** mit ## Headlines (max 50 Zeichen, knackig, "klick-mich"-Feel)
3. **Jeder Abschnitt**: 2-4 Absaetze mit konkreten Zahlen, Anekdoten, eigenen Beobachtungen
4. **Mindestens 1 kontroverser Take** ("Das wird dir niemand sagen, aber...", "Mainstream-Meinung ist X. Ich glaube...")
5. **Mindestens 1 Selbstkritik** ("Ich dachte 6 Monate dass...", "Was ich erst nach 50 Kunden verstanden habe...")
6. **Mindestens 2 konkrete Zahlen/Stats** (aus Spurig-Daten, plausibel)
7. **Schluss-H2 "Fazit"** oder aehnlich: 2-3 Saetze + 1 Diskussions-Frage

ZUSAETZLICH generiere einen DALL-E/Midjourney-tauglichen ENGLISCHEN Image-Prompt fuer ein Hero-Bild:
- Photorealistic, 16:9 aspect ratio
- Spurig-Brand: dark background (#0a0a0a or near-black), subtle purple (#7C3AED) + cyan (#22d3ee) accent lighting
- Scene: konkret abgeleitet aus dem Blog-Thema (z.B. "marketing analyst at desk reviewing QR-code scan data on minimalist dark dashboard, German poster wall visible through window")
- Editorial premium-SaaS landing-page feel
- NO TEXT visible in image (kritisch — KI macht oft hässliche Letters)
- Style: cinematic, minimalist, professional
- Auf englisch fuer beste Image-AI-Ergebnisse

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
  return `Photorealistic 16:9 hero image, dark background (#0a0a0a) with subtle purple (#7C3AED) and cyan (#22d3ee) accent lighting, minimalist editorial scene related to "${title.slice(0, 80)}", no text visible, premium SaaS landing-page aesthetic, cinematic depth of field.`;
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
