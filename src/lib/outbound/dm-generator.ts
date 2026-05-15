/**
 * LinkedIn-DM-Opener-Generator.
 *
 * Strategie:
 *  1. Claude Haiku 4.5 wenn ANTHROPIC_API_KEY gesetzt (beste Personalisierung, ~$0.0015/Opener)
 *  2. Segment-Template-Fallback ohne API-Call (deterministisch, gratis)
 *
 * Output: 2-3 Saetze, deutsche du-Form, max 280 Zeichen (LinkedIn Connection-Request-Limit).
 * Kein Auto-DM — die UI macht Copy-Paste. LinkedIn-ToS-konform.
 */

import type { OutboundLead, OutboundSegment } from './types';

const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';
const MAX_OPENER_CHARS = 280;

export type DmOpener = {
  text: string;
  model: 'claude-haiku-4-5' | 'template';
};

export async function generateDmOpener(lead: OutboundLead, firstName: string | null): Promise<DmOpener> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const text = await callClaude(apiKey, lead, firstName);
      if (text) return { text: trim280(text), model: 'claude-haiku-4-5' };
    } catch {
      // Fall through to template
    }
  }
  return { text: buildTemplateOpener(lead, firstName), model: 'template' };
}

// ---------------------------------------------------------------------------
// Claude Haiku integration
// ---------------------------------------------------------------------------

async function callClaude(apiKey: string, lead: OutboundLead, firstName: string | null): Promise<string | null> {
  const segmentLabel = SEGMENT_LABELS[lead.segment as OutboundSegment] ?? lead.segment;
  const ratingInfo = lead.rating && lead.rating_count
    ? `Google-Rating ${lead.rating}/5 aus ${lead.rating_count} Bewertungen`
    : 'keine Google-Reviews-Daten';

  const prompt = `Du schreibst LinkedIn-Connection-Opener fuer einen Cold-Outreach von Spurig (DSGVO-konformes QR-Code-Tracking-Tool fuer Offline-Marketing).

Generiere EINEN deutschen Opener (du-Form, max 280 Zeichen, 2-3 Saetze) fuer:
- Empfaenger: ${firstName ?? 'Unbekannter Vorname'}
- Unternehmen: ${lead.name}
- Branche: ${segmentLabel}
- Stadt: ${lead.city ?? 'unbekannt'}
- Kontext: ${ratingInfo}

Style:
- Locker, persoenlich, kein Sales-Speech
- Konkrete Beobachtung zum Unternehmen (Branche/Stadt) als Aufhaenger
- Endet mit weicher Frage (kein harter CTA)
- Niemals: "Vielleicht interessant", "ich hoffe", Smileys, Emojis, "kurz" als Filler

Antworte NUR mit dem Opener-Text. Keine Quotes, keine Erklaerung.`;

  const res = await fetch(ANTHROPIC_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return null;
  const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
  const text = data.content?.find((c) => c.type === 'text')?.text?.trim();
  return text ?? null;
}

function trim280(s: string): string {
  if (s.length <= MAX_OPENER_CHARS) return s;
  return s.slice(0, MAX_OPENER_CHARS - 1).replace(/\s+\S*$/, '') + '…';
}

// ---------------------------------------------------------------------------
// Template-Fallback (gratis, deterministisch)
// ---------------------------------------------------------------------------

const SEGMENT_LABELS: Record<OutboundSegment, string> = {
  marketing_agency: 'Marketing-Agentur',
  gastronomy: 'Gastronomie',
  crafts_sme: 'Handwerk/Dienstleister',
  events_tourism: 'Events/Tourismus',
};

function buildTemplateOpener(lead: OutboundLead, firstName: string | null): string {
  const hi = firstName ? `Hi ${firstName}` : 'Hi';
  const city = lead.city ? ` in ${lead.city}` : '';
  const reviews = lead.rating_count && lead.rating_count > 20
    ? ` (${lead.rating_count} Reviews — solide Sichtbarkeit)`
    : '';

  switch (lead.segment as OutboundSegment) {
    case 'marketing_agency':
      return trim280(
        `${hi}, bin auf ${lead.name}${city} gestossen${reviews}. Frage: wie messt ihr aktuell Print-/OOH-Performance fuer eure Kunden? Hab ein DSGVO-konformes Tracking-Tool gebaut, kurzer Austausch?`,
      );
    case 'gastronomy':
      return trim280(
        `${hi}, ${lead.name}${city} sieht stark aus${reviews}. Tracked ihr eigentlich welcher Werbe-Touchpoint (Speisekarte/Aufsteller/Schaufenster) tatsaechlich Gaeste zieht? Wuerde 5 Min dazu mit dir sparren.`,
      );
    case 'crafts_sme':
      return trim280(
        `${hi}, ${lead.name}${city} ist mir aufgefallen${reviews}. Frage: wisst ihr welcher Flyer-Stadtteil oder welche Plakatwand tatsaechlich Auftraege bringt? Hab fuer Handwerk ein einfaches Tracking gebaut — Interesse?`,
      );
    case 'events_tourism':
      return trim280(
        `${hi}, ${lead.name}${city}${reviews}. Bei Events/Tourismus seid ihr ja oft auf Plakaten/Flyern unterwegs — habt ihr aktuell harte Zahlen welche Platzierung wirklich Besucher zieht? Wuerde dazu kurz sparren.`,
      );
    default:
      return trim280(
        `${hi}, ${lead.name}${city} ist mir aufgefallen${reviews}. Wie tracked ihr eure Offline-Werbung aktuell? Hab dazu ein DSGVO-konformes Tool gebaut — kurzer Austausch?`,
      );
  }
}
