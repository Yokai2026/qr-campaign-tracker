/**
 * Content-Repurposing: Blog-Post -> LinkedIn-Post + Twitter-Thread + Reddit-Post.
 *
 * Claude Haiku 4.5 generiert pro Channel ein Draft im richtigen Format
 * (LinkedIn: Hook + Value + CTA, Twitter: 5-7 Tweets, Reddit: Story-Format).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ARTICLES } from '@/app/blog/articles';

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

export type ContentChannel = 'linkedin' | 'twitter' | 'reddit';

export type BlogContent = {
  slug: string;
  title: string;
  description: string;
  body: string;
  tags: string[];
};

export type GeneratedDraft = {
  channel: ContentChannel;
  text: string;
};

// ---------------------------------------------------------------------------
// Blog extraction
// ---------------------------------------------------------------------------

export async function readBlogPost(slug: string): Promise<BlogContent | null> {
  const meta = ARTICLES.find((a) => a.slug === slug);
  if (!meta) return null;

  const filePath = path.join(process.cwd(), 'src', 'app', 'blog', slug, 'page.tsx');
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    return null;
  }

  const body = extractBodyText(raw);
  return {
    slug: meta.slug,
    title: meta.title,
    description: meta.description,
    body,
    tags: meta.tags ?? [],
  };
}

/**
 * Extrahiert lesbaren Text aus dem JSX-Body einer Blog-Page.
 * Strippt JSX-Tags, Imports, Metadata, behaelt nur Paragraph-Content.
 */
function extractBodyText(src: string): string {
  // Alles vor `<ArticleLayout` entfernen
  const startMatch = src.match(/<ArticleLayout[^>]*>/);
  const tail = startMatch ? src.slice(startMatch.index! + startMatch[0].length) : src;
  // Alles nach `</ArticleLayout>` entfernen
  const endIdx = tail.lastIndexOf('</ArticleLayout>');
  const body = endIdx > 0 ? tail.slice(0, endIdx) : tail;

  // JSX-Expressions {...} und Komponenten <Link> entfernen, Text-Inhalt behalten
  return body
    .replace(/<Link[^>]*>([\s\S]*?)<\/Link>/g, '$1')
    .replace(/<a[^>]*>([\s\S]*?)<\/a>/g, '$1')
    .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')
    .replace(/<em>([\s\S]*?)<\/em>/g, '*$1*')
    .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, '\n## $1\n')
    .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '\n### $1\n')
    .replace(/<p[^>]*>([\s\S]*?)<\/p>/g, '$1\n\n')
    .replace(/<ul[^>]*>([\s\S]*?)<\/ul>/g, '$1\n')
    .replace(/<li[^>]*>([\s\S]*?)<\/li>/g, '- $1\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\{[^}]*\}/g, '')
    .replace(/&auml;/g, 'ä').replace(/&ouml;/g, 'ö').replace(/&uuml;/g, 'ü')
    .replace(/&Auml;/g, 'Ä').replace(/&Ouml;/g, 'Ö').replace(/&Uuml;/g, 'Ü')
    .replace(/&szlig;/g, 'ß').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ---------------------------------------------------------------------------
// Claude generation
// ---------------------------------------------------------------------------

export async function generateDraft(
  channel: ContentChannel,
  blog: BlogContent,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');

  const prompt = buildPrompt(channel, blog);

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim();
  if (!text) throw new Error('Empty response from Claude');
  return text;
}

function buildPrompt(channel: ContentChannel, blog: BlogContent): string {
  const base = `Blog-Post:
Titel: ${blog.title}
Beschreibung: ${blog.description}
Tags: ${blog.tags.join(', ')}
URL: https://spurig.com/blog/${blog.slug}

Body:
${blog.body.slice(0, 6000)}

---`;

  if (channel === 'linkedin') {
    return `${base}

Generiere einen LinkedIn-Post (deutsch, du-Form, 700-1200 Zeichen) der den Blog-Inhalt als persoenliche Lern-Geschichte rueberbringt — NICHT als Experten-Vortrag.

Struktur — Story-Format (kritisch!):
- Zeile 1: persoenlicher Aufhaenger ("Letzte Woche...", "Vor 2 Jahren dachte ich noch...", "Ein Kunde fragte mich gestern...", "Ich hab das selbst lang falsch gemacht...")
- Mittel-Teil: Was du gelernt hast, in 3-5 kurzen Absaetzen (je 1-2 Saetze). Inkl. EINE konkrete Zahl/Beispiel aus dem Blog
- Selbstkritik-Moment: zeig dass du selbst mal anders gedacht hast ("Ich war ueberzeugt dass ... bis ich gemerkt habe ...")
- Letzter Absatz: kurze Frage an den Leser (zur Diskussion, nicht zur Conversion)
- "Voller Artikel mit Quellen: https://spurig.com/blog/${blog.slug}"
- MAX 2 Hashtags am Ende — nur wirklich relevante (#DSGVO #Marketing). Wenn keine passen: keine.

Style — wichtig:
- Erste Person ("Ich", "wir"), du-Form zum Leser
- Klingt wie wenn du einem Kollegen beim Bier erzaehlst — nicht wie Marketing-Email
- KURZE Saetze. Subjekt-Verb-Objekt. Keine verschachtelten Konstruktionen
- Konkret: Namen, Zahlen, echte Situationen statt abstrakter Phrasen
- Selbstkritik > Expertenstolz
- VERBOTEN: "spannend", "ich freue mich", "Take", "Pro-Tipp", "Spoiler:", Marketing-Lehren-Floskeln
- VERBOTEN: lange Absaetze, Aufzaehlungen, Bullet-Points
- VERBOTEN: emotionaler Manipulationsstil ("Verlieren Sie nicht...")

Antworte NUR mit dem Post-Text. Keine Erklaerung, keine Quotes.`;
  }

  if (channel === 'twitter') {
    return `${base}

Generiere einen Twitter/X-Thread (deutsch, du-Form, 6-8 Tweets) der diesen Blog-Post repurposed.

Format:
- Tweet 1: Hook (max 270 Zeichen) mit konkreter Zahl oder Pattern-Break
- Tweet 2-6: Je 1 Insight, je max 270 Zeichen
- Letzter Tweet: Link zum Blog: "Voller Artikel: https://spurig.com/blog/${blog.slug}"

Separator zwischen Tweets: "---"

Style:
- Erster Tweet: persoenliche Beobachtung oder Frage, KEINE Statistik-Bombe
- Schreibe als jemand der gerade was lernt — nicht als Lehrer
- Kurze Saetze. Subjekt-Verb-Objekt.
- Konkrete Zahlen + EINE eigene Anekdote
- VERBOTEN: "Thread:", "1/", "Spoiler:", Hashtag-Spam, Emoji-Spam (0 Emojis bevorzugt, max 1 wenn wirklich passend)
- VERBOTEN: "Pro-Tip", "Game Changer", "krass", marketing-floskeln
- Klingt wie Bier-Gespraech, nicht wie Whitepaper

Antworte NUR mit dem Thread-Text (Tweets durch "---" getrennt).`;
  }

  // reddit
  return `${base}

Generiere einen Reddit-Post (deutsch, du-Form, 600-1200 Woerter) der diesen Blog-Post repurposed.

Format:
- Titel: Frage-Form oder konkrete Behauptung (max 100 Zeichen)
- Body: Story/Erfahrungs-Format ("Ich hatte das Problem... habe diese 3 Sachen probiert...")
- Endet mit Link zum Blog: "Voller Artikel mit Quellen + Tabellen: https://spurig.com/blog/${blog.slug}"

Style:
- Reddit-Tone: ehrlich, leicht selbstironisch, KEINE Werbung — du bist hier ein User, kein Marketer
- Erste Person, vergangenheits-Form ("Ich hatte das Problem...", "Ich hab probiert...")
- Markdown (## Sub-Headers, **bold** sparsam, - Listen wo's passt)
- Mind. EINE Stelle wo du eigene Fehleinschaetzung zugibst ("Ich dachte erst...")
- Subreddits-Empfehlung am Ende: "Passt zu r/de_EDV, r/Marketing, r/dsgvo"
- VERBOTEN: CTAs, Werbe-Phrasen, "Spoiler:", emotionale Manipulation

Antworte mit:
Titel: [Reddit-Post-Titel]

Body:
[Reddit-Post-Body in Markdown]`;
}
