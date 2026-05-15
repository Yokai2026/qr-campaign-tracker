/**
 * Content-Repurposing: Blog-Post -> LinkedIn-Post + Twitter-Thread + Reddit-Post.
 *
 * Claude Haiku 4.5 generiert pro Channel ein Draft im richtigen Format
 * (LinkedIn: Hook + Value + CTA, Twitter: 5-7 Tweets, Reddit: Story-Format).
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ARTICLES } from '@/app/blog/articles';
import { SPURIG_VOICE } from './spurig-voice';

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

/**
 * Liest Blog-Post-Content. Erst DB (content_blogs), dann File-System (legacy).
 * Importer nimmt service-Client via Lazy-Import um Circular-Deps zu vermeiden.
 */
export async function readBlogPost(slug: string): Promise<BlogContent | null> {
  // 1) DB-Lookup (neue Ideen-basierte Posts)
  try {
    const { createServiceClient } = await import('@/lib/supabase/server');
    const sb = await createServiceClient();
    const { data: dbPost } = await sb
      .from('content_blogs')
      .select('slug, title, description, tags, body_md')
      .eq('slug', slug)
      .maybeSingle();
    if (dbPost) {
      return {
        slug: dbPost.slug,
        title: dbPost.title,
        description: dbPost.description,
        body: dbPost.body_md,
        tags: dbPost.tags ?? [],
      };
    }
  } catch {
    // ignore, fall back to file
  }

  // 2) File-based (existing legacy blog posts in src/app/blog/<slug>/page.tsx)
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
  const base = `${SPURIG_VOICE}

---

QUELL-BLOG:
Titel: ${blog.title}
Beschreibung: ${blog.description}
Tags: ${blog.tags.join(', ')}
URL: https://spurig.com/blog/${blog.slug}

Body:
${blog.body.slice(0, 6000)}

---`;

  if (channel === 'linkedin') {
    return `${base}

Generiere einen LinkedIn-Post (deutsch, du-Form, 800-1300 Zeichen) der den Blog-Inhalt SOCIAL-MEDIA-tauglich rueberbringt — Schlagzeile-Hook, Lehr-Story, Diskussion-Ende.

Format-Anforderungen:
1) **Zeile 1 = Wow-Hook (max 100 Zeichen)** — eines davon:
   - Konkrete Zahl die schockt ("40% der Werbebudgets verbrennen unsichtbar")
   - Pattern-Break ("Bitly ist 2026 ein DSGVO-Problem. Hier was passierte als wir wechselten:")
   - Konkrete persoenliche Behauptung ("Ich habe 6 Wochen ein Plakat getrackt. Das Ergebnis hat mich umgehauen.")
   - Frage die der Leser sich nie gestellt hat ("Wie viel kostet dich Tracking, das du nicht hast?")
2) **Leerzeile**, dann **2-4 kurze Absaetze** (je 1-3 Saetze) mit Story + Mini-Lernen
3) **Mindestens 1 konkrete Zahl/Stat aus dem Blog**
4) **Mindestens 1 kontroverser Take** ("Das wird kaum jemand sagen, aber...") ODER **Selbstkritik** ("Ich war 6 Monate ueberzeugt dass...")
5) **Schluss: Diskussions-Frage** ("Wie machst du das?") + "Mehr im Blog: https://spurig.com/blog/${blog.slug}"
6) **Max 2 Hashtags** — nur wirklich relevant (#DSGVO #Marketing). Lieber gar keine.

Lehrreich + Unterhaltsam + Authentisch — Spurig-DNA. KEIN Marketing-Speak.

Antworte NUR mit dem Post-Text. Keine Erklaerung, keine Quotes, keine Code-Fences.`;
  }

  if (channel === 'twitter') {
    return `${base}

Generiere einen Twitter/X-Thread (deutsch, du-Form, 5-7 Tweets) im Social-Media-Vibe.

Format:
- **Tweet 1 = Wow-Hook** (max 270 Zeichen). Pattern-Break oder konkrete Zahl. NICHT "Thread:", NICHT "1/".
  Beispiel: "Bitly nutzt fast jede DACH-Marketing-Abteilung. Fast keine weiss dass das 2026 ein DSGVO-Bussgeld-Risiko ist."
- **Tweet 2-5 = Mini-Insights** (je max 270 Zeichen). Eine Idee pro Tweet, mit konkreter Zahl oder Beispiel.
- **Tweet 6/7 = Pointe + Link**: persoenlicher Take + "Voller Artikel: https://spurig.com/blog/${blog.slug}"

Separator zwischen Tweets: EINZIGE Zeile mit nur "---"

Style:
- Jeder Tweet muss alleine klick-wuerdig sein (Twitter-User scrollt schnell)
- Konkrete Zahlen, kontroverse Takes, eigene Erfahrung
- KURZE Saetze. Subjekt-Verb-Objekt.
- 0-1 Emoji im gesamten Thread. Default 0.
- 0-3 Hashtags im LETZTEN Tweet, nur wenn wirklich relevant

Antworte NUR mit dem Thread-Text (Tweets durch "---"-Zeile getrennt). Keine Erklaerung.`;
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
