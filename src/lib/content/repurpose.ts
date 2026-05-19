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
  const text = await callClaudeWithRetry(apiKey, prompt, channel);

  // UTM-Anreicherung: jeder spurig.com-Link im Draft bekommt utm_source = channel etc.
  // -> bei Signup wird attribution_source = 'linkedin' / 'twitter' / 'reddit'.
  return addUtmToAllLinks(text, {
    source: channel,
    medium: 'social',
    campaign: blog.slug,
  });
}

/**
 * Claude-Call mit Exponential-Backoff fuer transient Errors.
 *
 * Retry-Auslöser:
 *   - 529 overloaded_error   → Anthropic-API ueberlastet (haeufig in Lastspitzen)
 *   - 429 rate_limit         → wir feuern zu schnell
 *   - 500 / 502 / 503 / 504  → transient Server-Fehler
 *
 * Backoff: 2s → 5s → 10s mit Jitter. Bei 429 mit retry-after-Header: dessen Wert.
 * Nach 3 Versuchen friendly Error-Message fuer die UI (auf 529 spezifisch).
 */
async function callClaudeWithRetry(
  apiKey: string,
  prompt: string,
  channel: ContentChannel,
  maxAttempts = 3,
): Promise<string> {
  let lastStatus = 0;
  let lastBody = '';

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
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

    if (res.ok) {
      const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
      const text = data.content?.find((c) => c.type === 'text')?.text?.trim();
      if (!text) throw new Error(`Claude lieferte leere Antwort (${channel})`);
      return text;
    }

    lastStatus = res.status;
    lastBody = await res.text();

    const isTransient = res.status === 529 || res.status === 429
      || res.status === 500 || res.status === 502 || res.status === 503 || res.status === 504;

    if (!isTransient || attempt === maxAttempts) break;

    // Anthropic kann retry-after sekunden-genau zurueckgeben (besonders bei 429).
    const retryAfter = Number(res.headers.get('retry-after'));
    const backoffMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? Math.min(retryAfter * 1000, 30_000)
      : [2_000, 5_000, 10_000][attempt - 1] ?? 10_000;
    const jitter = Math.floor(Math.random() * 750);

    console.warn(
      `[generateDraft:${channel}] Claude ${res.status} (attempt ${attempt}/${maxAttempts}) — `
      + `retry in ${(backoffMs + jitter) / 1000}s`,
    );
    await new Promise((r) => setTimeout(r, backoffMs + jitter));
  }

  if (lastStatus === 529) {
    throw new Error(
      `Claude API ueberlastet (529 overloaded). Anthropic-Server haben kurzfristig keine Kapazitaet. `
      + `In 1-2 Minuten nochmal versuchen — dann meist ok.`,
    );
  }
  if (lastStatus === 429) {
    throw new Error(
      `Claude API Rate-Limit (429). Zu viele Drafts in kurzer Zeit. `
      + `5-10 Minuten warten ODER $40 Credits aufladen fuer Tier-2.`,
    );
  }
  throw new Error(`Claude API ${lastStatus}: ${lastBody.slice(0, 200)}`);
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

========================================
DEINE AUFGABE — LINKEDIN-POST AUS DEM BLOG
========================================

Generiere EINEN LinkedIn-Post (deutsch, du-Form, 900-1500 Zeichen total) der nach
dem 8-Punkt-Storytelling-Arc (PART 6 oben) gebaut ist und alle Pattern-Checks
aus PART 7 + 8 besteht.

----------------------------------------
PRE-WRITING-PRUEFUNG (mental durchspielen)
----------------------------------------
1. Welche EINE Story im Blog ist die staerkste? (eine konkrete Person, ein
   konkreter Moment)
2. Was ist die punchige Schluss-Zeile?
3. Welche Diskussions-Frage provoziert echte DACH-Marketer-Antworten?

Den Blog NICHT zusammenfassen. Den Blog als Material nutzen, daraus EINE Story
extrahieren und dramatisch verdichten.

----------------------------------------
LINKEDIN-FORMAT (strikt)
----------------------------------------

ZEILE 1 (STOP-SCROLL-HOOK, max 100 Zeichen):
Nutze einen der Hook-Patterns aus PART 7 — ABER siehe SPURIG_VOICE PART 0
(Anti-Monotonie): keine wiederholten Signature-Phrasen, keine Klischee-Timestamps.
  A. Echter Dialog: "Eine Marketing-Chefin gestern: 'Wir nutzen das seit 6 Jahren…'"
  B. Persoenlicher Fail: "Ich hab 8 Wochen das falsche Feature gebaut."
  C. Konkrete Zahl + Pattern-Break: "47 Marketing-Mitarbeiter. Keiner stellte die Frage."
  D. Verlustangst + Specificity: "Sechs Jahre Daten. Server in Ashburn, Virginia. Kein AV-Vertrag."
  E. Provokante Behauptung: "Cookie-Banner sind nicht das DSGVO-Problem."
  F. Hyper-spezifische Mini-Story: variiere Setting + Geräusch + Person.
     NIEMALS "Donnerstag 14:30. Drei Minuten Stille." — das ist Davids Signature
     und längst totgeritten. Stattdessen: andere Mikro-Szenen, andere Sinnesebene,
     andere Tageszeit. Variety-Bank A nutzen.

ZEILE 2: LEER (LinkedIn-Cut-Off-Trick — der Hook hängt allein, der "weiter lesen"-Klick faellt)

BLOCK 2-4 (Story-Aufbau, je 2-4 Zeilen, mit Leerzeile dazwischen):

  Block A — Relatable Moment: konkrete Situation, Wer/Wann/Wo, mit Specificity.
    (z.B. "Wir sassen in ihrem Büro. Sie zeigte mir ihre Funnel — sauber gebaut,
    jeder Touchpoint vermessen.")

  Block B — Konflikt: die Wendung, die Überraschung, mit Mini-Cliffhanger.
    Variiere den Cliffhanger-Stil (Variety-Bank A — Geräusch, Geste, Blick,
    direktes Eingestaendnis). NIEMALS "Drei Minuten Stille" — schon erschöpft.
    Beispiel: "Ich hab eine einzige Frage gestellt. Sie tippte. Loeschte.
    Tippte wieder. Dann: 'Ashburn, Virginia.'"

  Block C — Insight + Selbstkritik / Kontroverse: was die Geschichte für ALLE
    bedeutet. Eine starke These oder Selbst-Eingestaendnis.
    (z.B. "Das eigentliche Problem ist nicht Bitly. Es ist, dass niemand fragt.")

  Block D (optional) — Praktischer Mehrwert: was der Leser KONKRET tun kann,
    in 1-2 Sätzen, NICHT als Liste. Nahtlos im Lesefluss.

SCHLUSS-BLOCK (separater Absatz, kurz):
  - Punchige Schluss-Zeile, memorable
  - DANN ECHTE Diskussions-Frage:
    * "Wer hat in den letzten 6 Monaten den AV-Vertrag mit seinem Link-Tool geprüft?"
    * "Welches Tracking-Tool nutzt ihr aktuell — und würdet ihr's einem
       Datenschutzbeauftragten erklären können?"
    * "Was war dein größter Marketing-Reinfall? Ich teil meinen."
  - KEINE rhetorische Frage ("Was meint ihr?")
  - KEINE Werbe-CTA

NACH LEERZEILE: Der Link zum vollen Blog:
"https://spurig.com/blog/${blog.slug}"

Optional 0-2 Hashtags am Ende (wenn wirklich passend, default 0).

----------------------------------------
RETENTION-CHECKS (PART 8)
----------------------------------------
- Mind. 1 Cliffhanger (variiere Stil — sensorisch, Geste, Wort — siehe Variety-Bank A;
  NICHT "Drei Minuten Stille" / NICHT "Stille." als 1-Wort-Satz)
- Mind. 1 direkter Satz in Anführungszeichen
- Mind. 2 sehr kurze Sätze (3-6 Worte) als Pattern-Interrupt
- Mind. 1 konkrete Zahl/Ort/Person/Marke

----------------------------------------
LINKEDIN-VIBE (Bier-mit-Founder, nicht Corporate)
----------------------------------------
- Kurze Sätze. Subjekt-Verb-Objekt. Keine Verschachtelung.
- Erste Person, direkte Du-Adresse an Leser
- Konkret + ehrlich + manchmal unbequem
- Wechsel zwischen Beobachtung und Konfrontation
- KEINE Marketing-Brand-Voice

----------------------------------------
SPEZIFITAETS-CHECKLISTE (vor Output)
----------------------------------------
[ ] Mind. 1 konkrete Zahl
[ ] Mind. 1 konkreter Ort ODER Rolle ODER Zeitpunkt
[ ] Mind. 1 direkter Satz in Anführungszeichen
[ ] Mind. 1 Marke / Tool konkret genannt
[ ] Schluss-Frage ist KEINE rhetorische Floskel

Wenn irgendwas fehlt: ueberarbeiten.

----------------------------------------
VERBOTEN (Instant-Fail)
----------------------------------------
- "Spannend", "innovativ", "revolutionaer", "Game Changer"
- "Take:", "Pro-Tipp:", "Spoiler:", "TL;DR:"
- "In der heutigen Zeit", "Heutzutage", "In einer Welt in der..."
- "Hast du dich schon mal gefragt..."
- "Hier sind 5 Tipps..."
- "Was meint ihr?" als Schluss-Floskel
- Emoji-Spam, Hashtag-Salat
- Lange Werbe-Sehnsuchts-Texte

Antworte NUR mit dem Post-Text. Keine Erklärung, keine Quotes, keine Code-Fences.`;
  }

  if (channel === 'twitter') {
    const blogUrl = `https://spurig.com/blog/${blog.slug}`;
    // URL ist exakt ~30 Zeichen; max Tweet = 280 → für Text bleiben ~245 Zeichen
    return `${base}

Generiere EINEN einzelnen Twitter/X-Tweet (deutsch, du-Form). HARTE GRENZE: **max 270 Zeichen TOTAL inklusive dem Blog-Link am Ende**.

Format:
1) Wow-Hook in Zeile 1: konkrete Zahl, Pattern-Break, oder kontroverser Take
2) (Optional) 1-2 weitere Sätze als Punchline / Mini-Story
3) Letzte Zeile: ${blogUrl}

Beispiel-Tweets die funktionieren:
- "23 € pro Scan. Pro Plakat. Echt gemessen. Spoiler: 80% der Standorte rechnen sich nie. Welche Plakatwand hat dir letztes Mal wirklich Kunden gebracht? ${blogUrl}"
- "Bitly speichert deine Kurzlink-Daten in den USA. Schrems II sagt: ist DSGVO-problematisch. 2026 fragt die Aufsicht nach. ${blogUrl}"

VERBOTEN:
- "Thread:", "1/", "Spoiler:" als Marker
- Emojis (default 0, MAX 1 wenn wirklich passend)
- Hashtags (max 0-2 wenn relevant, default 0)
- "Pro-Tipp", "Game Changer", "krass"

WICHTIG: ZAEHLE die Zeichen. Wenn Tweet über 270 Zeichen → kürzer machen.

Antworte NUR mit dem Tweet-Text (Text + Link am Ende). Keine Erklärung, keine Quotes.`;
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
- Subreddits-Empfehlung am Ende: wähle 2-3 passende DACH/internationale Subs aus dieser Liste:
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
