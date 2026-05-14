/**
 * Cold-Mail-Templates pro ICP-Segment.
 *
 * Design-Prinzipien:
 * - Kurz: <120 Wörter
 * - Konkret: Branche im ersten Satz nennen
 * - Soft Pitch: keine Hard-Sell, Frage am Ende
 * - DSGVO-konform: klarer Absender, Opt-Out-Link am Ende
 * - Personalisiert wo möglich (firstName aus E-Mail extrahierbar)
 */

import type { OutboundSegment, OutboundLead } from './types';

export type TemplateKey =
  | 'marketing_agency_dsgvo_v1'
  | 'gastronomy_qr_v1'
  | 'crafts_sme_print_v1'
  | 'events_tourism_print_v1';

export type RenderedMail = {
  templateKey: TemplateKey;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  personalizationHook: string;
};

type TemplateInput = {
  firstName: string | null;       // aus Email extrahiert wenn personal
  greetingTarget: string;          // "Jasper" oder "Team"
  companyName: string;
  city: string | null;
  industry: string | null;
  unsubscribeUrl: string;
};

type Template = {
  key: TemplateKey;
  segments: OutboundSegment[];
  subjects: string[];                                  // wird pseudo-random rotiert
  build: (input: TemplateInput) => { text: string; hook: string };
};

const SIGNATURE = `David da Silva Gornik
Spurig — DSGVO QR-Codes & Kurzlinks
https://spurig.com · Made in Berlin`;

const TEMPLATES: Record<TemplateKey, Template> = {
  marketing_agency_dsgvo_v1: {
    key: 'marketing_agency_dsgvo_v1',
    segments: ['marketing_agency'],
    subjects: [
      'Bitly bei Kunden-Kampagnen — DSGVO-Risiko',
      'Kurze Frage zur QR-Code-Strategie eurer Kunden',
      'Schrems-II + Kurzlink-Tracking',
    ],
    build: ({ greetingTarget, companyName, city }) => {
      const hook = city
        ? `als Agentur in ${city} arbeitet ihr sicher mit Print- oder QR-Code-Kampagnen für Kunden.`
        : `als Agentur arbeitet ihr sicher mit Print- oder QR-Code-Kampagnen für Kunden.`;
      const text = `Hi ${greetingTarget},

${hook}

Kurze Frage: wie löst ihr aktuell Tracking dafür? Bitly ist verbreitet, aber nach Schrems-II rechtlich heikel — US-Hosting, kein vollständiger AVV, Kunden-Daten fließen in die USA.

Wir haben Spurig gebaut: DSGVO-konformes QR-Code- und Kurzlink-Tracking aus Frankfurt. Funktioniert wie Bitly, nur ohne das Risiko für eure Kunden. Eigene Domain inklusive (z.B. go.${companyName.toLowerCase().replace(/[^a-z]/g, '').slice(0, 20) || 'agentur'}.de), Live-Analytics, ab 8,99€/Monat.

Hat das für eure Kampagnen-Strategie Relevanz, oder seid ihr da schon anderweitig unterwegs?

Mehr Details: https://spurig.com/bitly-alternative

Beste Grüße
${SIGNATURE}`;
      return { text, hook };
    },
  },

  gastronomy_qr_v1: {
    key: 'gastronomy_qr_v1',
    segments: ['gastronomy'],
    subjects: [
      'QR-Codes für eure Speisekarte — Frage',
      'Idee: Tisch-Tracking für {companyName}',
      'Welche Tische scannen euren QR-Code?',
    ],
    build: ({ greetingTarget, companyName, city }) => {
      const cityPart = city ? `in ${city}` : '';
      const hook = `falls ihr im ${companyName} ${cityPart} QR-Codes für Speisekarte, Bewertungslinks oder Reservierung nutzt`;
      const text = `Hi ${greetingTarget},

${hook} — kurze Frage: könnt ihr aktuell sehen, welcher Tisch wie oft scannt? Oder welcher Flyer/Plakat Gäste bringt?

Die meisten Tools (Bitly, etc) zeigen das nicht — und sind aus DSGVO-Sicht angreifbar, weil US-Hosting.

Spurig zeigt euch in Echtzeit: Scans pro Tisch, pro Flyer, pro Kampagne. Server in Frankfurt, kein Cookie-Banner, kein Datenschutz-Stress. Ab 8,99€/Monat, 14 Tage gratis.

Lohnt sich der 5-Min-Blick?

https://spurig.com/qr-code-fuer-gastronomie

Beste Grüße
${SIGNATURE}`;
      return { text, hook };
    },
  },

  crafts_sme_print_v1: {
    key: 'crafts_sme_print_v1',
    segments: ['crafts_sme'],
    subjects: [
      'Frage zu euren Visitenkarten und Flyern',
      'QR-Tracking für {companyName} — kurze Idee',
    ],
    build: ({ greetingTarget, companyName, city }) => {
      const cityPart = city ? `in ${city}` : '';
      const hook = `${companyName} ${cityPart} hat sicher Visitenkarten, Flyer oder Werbung in der Region`;
      const text = `Hi ${greetingTarget},

${hook}. Wisst ihr eigentlich, wie viele Anfragen daraus tatsächlich kommen — und welcher Flyer/welche Aktion am meisten bringt?

Wir haben Spurig gebaut: kleine QR-Codes für Print, die in Echtzeit zeigen wer scannt, wann, von wo. DSGVO-konform aus Frankfurt, kein Cookie-Banner. 8,99€/Monat, 14 Tage gratis.

Für lokale Betriebe oft ein Game-Changer beim nächsten Flyer-Druck — man weiß plötzlich was funktioniert.

Wäre das relevant für euch?

https://spurig.com/qr-code-print-tracking

Beste Grüße
${SIGNATURE}`;
      return { text, hook };
    },
  },

  events_tourism_print_v1: {
    key: 'events_tourism_print_v1',
    segments: ['events_tourism'],
    subjects: [
      'Plakat-Tracking für eure Events',
      'Welcher Plakat-Standort performt? — Datenidee',
    ],
    build: ({ greetingTarget, companyName, city }) => {
      const cityPart = city ? `in ${city}` : '';
      const hook = `Eventagentur/Tourismus ${cityPart} mit Plakat-Kampagnen — typisches Problem: man weiß nicht welche Standorte wirklich Aufmerksamkeit bringen`;
      const text = `Hi ${greetingTarget},

${hook}.

Studien zeigen: 30-40% der Plakat-Standorte einer Kampagne bringen <5% der Wahrnehmung. Bei 7.500€-Kampagnen verbrennt man da schnell 2-3k €.

Spurig löst das per QR-Code-pro-Standort: nach 7 Tagen seht ihr objektiv welcher Standort scannt und welcher nicht. DSGVO-konform aus Frankfurt, 8,99€/Monat, 14 Tage gratis. Bei der nächsten Kampagne könnt ihr Top-3-Standorte verdoppeln und Bottom-3 streichen.

Wäre das für ${companyName} relevant?

https://spurig.com/qr-code-print-tracking

Beste Grüße
${SIGNATURE}`;
      return { text, hook };
    },
  },
};

export function buildMailForLead(lead: OutboundLead, unsubscribeUrl: string): RenderedMail | null {
  if (!lead.email) return null;
  const template = pickTemplateForSegment(lead.segment);
  if (!template) return null;

  const greetingTarget = extractGreetingTarget(lead.email, lead.name);
  const firstName = extractFirstName(lead.email);

  const input: TemplateInput = {
    firstName,
    greetingTarget,
    companyName: lead.name,
    city: lead.city,
    industry: lead.industry,
    unsubscribeUrl,
  };

  // Subject mit Token-Replacement
  const subjectRaw = pickSubject(template, lead.id);
  const subject = subjectRaw
    .replace('{companyName}', lead.name)
    .replace('{firstName}', firstName ?? 'Team');

  const { text, hook } = template.build(input);
  const fullText = text + `\n\n---\n\nNicht relevant? Antworte mit "stop" — ich nehm dich raus.\nImpressum: https://spurig.com/impressum`;

  return {
    templateKey: template.key,
    subject,
    bodyText: fullText,
    bodyHtml: textToHtml(fullText, unsubscribeUrl),
    personalizationHook: hook,
  };
}

function pickTemplateForSegment(segment: OutboundSegment): Template | null {
  for (const t of Object.values(TEMPLATES)) {
    if (t.segments.includes(segment)) return t;
  }
  return null;
}

function pickSubject(template: Template, leadId: string): string {
  // Stabile Auswahl per Lead-ID-Hash → A/B-Verteilung gleichmäßig
  let hash = 0;
  for (let i = 0; i < leadId.length; i++) hash = (hash * 31 + leadId.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % template.subjects.length;
  return template.subjects[idx];
}

function extractFirstName(email: string): string | null {
  const local = email.split('@')[0]?.toLowerCase();
  if (!local) return null;

  // firstname.lastname → Firstname
  if (/^[a-z]+\.[a-z]+$/.test(local)) {
    return capitalize(local.split('.')[0]);
  }
  // einzelner Name (keine Role-Words) → Firstname
  const ROLE_WORDS = new Set(['info', 'kontakt', 'contact', 'hello', 'hallo', 'mail', 'team', 'office', 'service', 'support', 'sales', 'vertrieb', 'studio', 'press', 'presse']);
  if (/^[a-z]+$/.test(local) && local.length >= 3 && !ROLE_WORDS.has(local)) {
    return capitalize(local);
  }
  return null;
}

function extractGreetingTarget(email: string, companyName: string): string {
  const firstName = extractFirstName(email);
  if (firstName) return firstName;
  // Fallback: kürze Company-Name
  const shortCompany = companyName
    .replace(/\b(GmbH|UG|AG|GbR|KG|& Co\.?|Co\.|e\.K\.|mbH)\b/gi, '')
    .replace(/[|·•–—-].*$/, '')
    .trim()
    .slice(0, 40);
  return shortCompany + '-Team';
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function textToHtml(text: string, unsubscribeUrl: string): string {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // URLs zu Links
  const linked = escaped.replace(
    /(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color:#2563eb;text-decoration:underline">$1</a>',
  );

  // Paragraphs
  const paragraphs = linked
    .split('\n\n')
    .map((p) => '<p style="margin:0 0 14px;line-height:1.55">' + p.replace(/\n/g, '<br>') + '</p>')
    .join('');

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;font-size:15px">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    ${paragraphs}
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#6b7280;line-height:1.5">
      Falls die Mail nicht relevant ist, einfach mit "stop" antworten oder
      <a href="${unsubscribeUrl}" style="color:#6b7280;text-decoration:underline">hier abbestellen</a>.
    </div>
  </div>
</body></html>`;
}
