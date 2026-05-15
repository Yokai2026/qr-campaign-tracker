/**
 * Content-Ideas-Generator + Blog-Expander via Claude.
 *
 * Pipeline:
 *  1. generateIdeasForCluster(cluster) -> 15 {title, outline, angle} Ideen
 *  2. expandIdeaToBlog(ideaId)          -> full Markdown-Blog (~1500-2000 Woerter)
 *                                          + Auto-Insert in content_blogs (DB)
 */

import { CLUSTER_DESCRIPTION, type ContentCluster } from './pillars';

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

  const prompt = `Du bist Content-Strategist fuer Spurig (DSGVO-konformes QR-Code & Kurzlink-Tracking-Tool fuer DACH-Marketing-Teams).

Generiere ${count} Content-Ideen fuer den Pillar "${cluster}":
${CLUSTER_DESCRIPTION[cluster]}

Jede Idee soll:
- Einen konkreten, klickbaren Blog-Titel haben (deutsch, max 80 Zeichen)
- Einen persoenlichen Story-Aufhaenger ("Was ich gelernt habe...", "Vor 6 Monaten dachte ich...", "Ein Kunde fragte mich...")
- Ein klares Audience-Problem loesen — keine generischen Themen wie "Was ist DSGVO"
- Konkret + spezifisch sein — Zahlen, Beispiele, Anti-Patterns

Vermeide:
- Generische "5 Tipps fuer..." Titel
- Buzzwords ohne Substanz ("synergy", "leverage")
- Themen die schon erschoepft sind ("Was ist QR-Code")

Format: JSON-Array, ${count} Eintraege:
[
  {
    "title": "...",
    "outline": "1-2 Saetze Stichpunkt-Liste was im Post drinsteht",
    "angle": "Der konkrete Story-Aufhaenger fuer den Intro",
    "target_keywords": "2-4 SEO-Keywords kommagetrennt"
  }
]

Antworte NUR mit dem JSON. Kein Markdown-Code-Block, kein Vorwort.`;

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

  // Robust-Parse: strip optional markdown-fences
  const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
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
// Blog-Expander (Story-Mode)
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

  const prompt = `Du schreibst einen Spurig-Blog-Post als Founder/Indie-Hacker im Story-Mode (persoenlich, mit Selbstkritik, lehrreich aber unaufdringlich).

INPUT:
- Titel: ${idea.title}
- Story-Aufhaenger: ${idea.angle}
- Outline: ${idea.outline}
- SEO-Keywords: ${idea.target_keywords ?? 'keine vorgegeben'}
- Pillar: ${idea.cluster}

Schreibe einen 1500-2000 Worte Blog-Post in DEUTSCHEM Markdown.

Struktur:
1. Hook-Absatz (3-5 Saetze): persoenliche Geschichte aus dem Story-Aufhaenger. Keine Begruessung, kein Inhaltsverzeichnis.
2. 4-6 Unterabschnitte mit ## H2-Headlines
3. Jeder Abschnitt: 2-4 Absaetze, je 2-4 Saetze
4. Konkrete Zahlen, Beispiele, eigene Beobachtungen (auch wenn fiktiv plausibel)
5. Mindestens 1 Selbstkritik-Moment ("Ich dachte erst...", "Was ich erst spaet verstanden habe...")
6. Letzter Abschnitt ## Fazit: 3-4 Saetze + 1 Frage an den Leser
7. KEIN Aufrufung "Probier Spurig kostenlos!" — sei zurueckhaltend mit Eigenwerbung

Style:
- Erste Person ("ich", "wir bei Spurig"), du-Form an Leser
- KURZE Saetze, Subjekt-Verb-Objekt
- Klingt wie Founder der ehrlich reflektiert, nicht wie Marketing
- VERBOTEN: "spannend", "Take", "Pro-Tipp", "leverage", "synergetisch", "Game Changer"
- Verwende **bold** sparsam (max 5x), *italic* fuer Betonung
- Code-Bloecke nur wenn wirklich relevant

Output-Format (JSON):
{
  "slug": "url-friendly-slug-aus-titel",
  "description": "1-2 Saetze SEO-Description max 160 Zeichen",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "body_md": "FULL MARKDOWN BODY hier rein, ohne ## Titel-Headline am Anfang (der kommt extern)"
}

Antworte NUR mit dem JSON. Kein Markdown-Code-Block.`;

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim() ?? '';
  const jsonText = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();

  let parsed: {
    slug?: string;
    description?: string;
    tags?: string[];
    body_md?: string;
  };
  try {
    parsed = JSON.parse(jsonText);
  } catch (e) {
    throw new Error(`Blog JSON parse failed: ${(e as Error).message}. First 300 chars: ${jsonText.slice(0, 300)}`);
  }

  if (!parsed.slug || !parsed.body_md || !parsed.description) {
    throw new Error('Blog JSON missing required fields (slug/description/body_md)');
  }

  return {
    slug: slugify(parsed.slug),
    title: idea.title,
    description: parsed.description.slice(0, 200),
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
    body_md: parsed.body_md,
  };
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
