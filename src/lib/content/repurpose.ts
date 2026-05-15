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
import { addUtmToAllLinks } from '@/lib/attribution/utm';

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
  let text = data.content?.find((c) => c.type === 'text')?.text?.trim();

  // UTM-Anreicherung: jeder spurig.com-Link im Draft bekommt utm_source = channel etc.
  // -> bei Signup wird attribution_source = 'linkedin' / 'twitter' / 'reddit'.
  if (text) {
    text = addUtmToAllLinks(text, {
      source: channel,
      medium: 'social',
      campaign: blog.slug,
    });
  }
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

Generiere einen LinkedIn-Post (deutsch, du-Form, 900-1400 Zeichen) der LinkedIn-Algorithmus liebt — Stop-Scroll-Hook, persoenliche Lern-Story, MASSIVE Diskussions-Provokation.

LINKEDIN-ALGORITHMUS-REGELN (Pflicht, vor 2026 getestet):
1) **Zeile 1 = STOP-SCROLL-HOOK (max 100 Zeichen)** — eines davon:
   - Konkrete Zahl die schockt ("40% deines Werbebudgets sind unsichtbar tot.")
   - Anti-Mainstream-Statement ("Bitly ist eine DSGVO-Falle. Niemand sagt's.")
   - Persoenliche Fail-Story ("6 Wochen, 450 € — und ich habe NICHTS gelernt.")
   - Provokante Frage ("Warum messt ihr eure Posts, aber nicht eure Plakate?")
2) **Zeile 2 = LEER** (LinkedIn-Cut-Off-Trick — der erste Satz haengt allein da)
3) **2-4 Absatz-Blocks** (je 1-3 Saetze, Leerzeile dazwischen):
   - Block 1: Konkrete Story-Situation (Wer, Wann, Was)
   - Block 2: Konkrete Zahl + persoenlicher Lern-Moment
   - Block 3: Kontroverser Take ODER Selbstkritik ("Was ich falsch dachte:")
   - Block 4: Praktischer Insight oder Anti-Pattern
4) **Schluss-Block**: ECHTE Diskussions-Frage die Antworten provoziert. KEINE rhetorische Frage. KEINE "Was ist deine Meinung?". Beispiele:
   - "Wer hat das letzte Mal pro Plakat-Standort gemessen statt pro Kampagne?"
   - "Habt ihr Bitly noch in DACH-Kunden-Reports? Wie verteidigt ihr das?"
   - "Was war dein groesster Werbe-Reinfall? Ich teile meinen."
5) **Eine Leerzeile, dann nur** "https://spurig.com/blog/${blog.slug}"
6) **0-2 Hashtags** ganz am Ende (nur wenn wirklich passend, lieber 0)

LINKEDIN-VIBE (sehr wichtig):
- KURZE Saetze. Subjekt-Verb-Objekt. Manchmal 2-3 Worte ("Klingt absurd. Ist Realitaet.")
- Erste Person, du-Form an Leser direkt
- Konkret + ehrlich, lieber unbequem als nett
- Klingt wie Founder beim Bier, NICHT wie Corporate-Marketing-Mail

VERBOTEN (instant fail):
- "Spannend", "Take", "Pro-Tipp", "Spoiler:", "Hier sind 5 Tipps"
- Generische Hooks ("Lass uns ueber X reden", "Kennen wir alle?")
- "Was meint ihr?" als rhetorische Schluss-Floskel ohne Substanz
- Emoji-Spam (max 0-1 wenn wirklich passend)
- Hashtag-Salat
- Lange Werbe-Sehnsuchts-Texte

Antworte NUR mit dem Post-Text. Keine Erklaerung, keine Quotes, keine Code-Fences.`;
  }

  if (channel === 'twitter') {
    const blogUrl = `https://spurig.com/blog/${blog.slug}`;
    // URL ist exakt ~30 Zeichen; max Tweet = 280 → fuer Text bleiben ~245 Zeichen
    return `${base}

Generiere EINEN einzelnen Twitter/X-Tweet (deutsch, du-Form). HARTE GRENZE: **max 270 Zeichen TOTAL inklusive dem Blog-Link am Ende**.

Format:
1) Wow-Hook in Zeile 1: konkrete Zahl, Pattern-Break, oder kontroverser Take
2) (Optional) 1-2 weitere Saetze als Punchline / Mini-Story
3) Letzte Zeile: ${blogUrl}

Beispiel-Tweets die funktionieren:
- "23 € pro Scan. Pro Plakat. Echt gemessen. Spoiler: 80% der Standorte rechnen sich nie. Welche Plakatwand hat dir letztes Mal wirklich Kunden gebracht? ${blogUrl}"
- "Bitly speichert deine Kurzlink-Daten in den USA. Schrems II sagt: ist DSGVO-problematisch. 2026 fragt die Aufsicht nach. ${blogUrl}"

VERBOTEN:
- "Thread:", "1/", "Spoiler:" als Marker
- Emojis (default 0, MAX 1 wenn wirklich passend)
- Hashtags (max 0-2 wenn relevant, default 0)
- "Pro-Tipp", "Game Changer", "krass"

WICHTIG: ZAEHLE die Zeichen. Wenn Tweet ueber 270 Zeichen → kuerzer machen.

Antworte NUR mit dem Tweet-Text (Text + Link am Ende). Keine Erklaerung, keine Quotes.`;
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
- Subreddits-Empfehlung am Ende: waehle 2-3 passende DACH/internationale Subs aus dieser Liste:
  · DACH-B2B: r/de_EDV, r/de_marketing, r/Selbststaendig, r/Unternehmer, r/Finanzen (wenn ROI-Topic)
  · DACH-DSGVO: r/de_IT, r/datenschutz_de, r/recht
  · International (englisch-Posts erlaubt): r/SaaS, r/Entrepreneur, r/marketing, r/smallbusiness, r/GDPR
  · Praezise empfehlen: gleich angeben WARUM dieser Sub passt (1 Zeile)
- VERBOTEN: CTAs, Werbe-Phrasen, "Spoiler:", emotionale Manipulation

Antworte mit:
Titel: [Reddit-Post-Titel]

Body:
[Reddit-Post-Body in Markdown]`;
}
