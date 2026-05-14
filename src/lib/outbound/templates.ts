/**
 * Cold-Mail-Templates pro ICP-Segment.
 *
 * V2 Design-Prinzipien:
 * - Visuell: Hero-Image + Comparison-Box + CTA-Button (kein Text-Wall)
 * - Kurz: max 80 Wörter im Body-Text
 * - Catchy Subjects: Pain-First, max 50 Zeichen
 * - 1 klares CTA mit Button + Link
 * - LinkedIn-Profile in Signatur (Trust-Signal)
 * - DSGVO-konform: List-Unsubscribe + Reply-mit-stop
 */

import type { OutboundSegment, OutboundLead } from './types';

export type TemplateKey =
  | 'marketing_agency_dsgvo_v2'
  | 'gastronomy_qr_v2'
  | 'crafts_sme_print_v2'
  | 'events_tourism_print_v2';

export type RenderedMail = {
  templateKey: TemplateKey;
  subject: string;
  bodyText: string;
  bodyHtml: string;
  personalizationHook: string;
};

type TemplateInput = {
  firstName: string | null;
  greetingTarget: string;
  companyName: string;
  city: string | null;
  industry: string | null;
  unsubscribeUrl: string;
};

type TemplateContent = {
  hook: string;            // 1-line opener nach Greeting
  painLine: string;        // Bold pain statement
  bullets: string[];       // 3 short bullet points
  comparison: { bitlyOrAlt: string; spurig: string }[];  // 3-4 Vergleichszeilen
  ctaText: string;         // Button-Text
  ctaUrl: string;          // CTA-URL
  closer: string;          // letzter Satz vor Signatur
};

type Template = {
  key: TemplateKey;
  segments: OutboundSegment[];
  subjects: string[];
  build: (input: TemplateInput) => TemplateContent;
};

// Spurig Brand-Colors (von spurig.com OG-Image + Brand-System)
const BRAND = {
  primary: '#7C3AED',         // Brand-Lila (Logo-Dot)
  secondary: '#22D3EE',       // Brand-Cyan (Logo-Dot)
  text: '#111113',            // Near-Black
  textMuted: '#525252',
  textSubtle: '#737373',
  bg: '#FFFFFF',
  bgSoft: '#F5F5F5',
  bgDark: '#0a0a0a',
  border: '#E5E5E5',
  borderSoft: '#F0F0F0',
  success: '#10B981',
  warn: '#F59E0B',
  danger: '#EF4444',
};

const LINKEDIN_URL = 'https://www.linkedin.com/in/david-da-silva-gornik-59262b367/';
const WEBSITE_URL = 'https://spurig.com';
const LOGO_URL = 'https://spurig.com/spurig-icon.png';

const HERO_IMAGES: Record<TemplateKey, string> = {
  marketing_agency_dsgvo_v2: 'https://spurig.com/email-assets/hero-dashboard.jpg',
  gastronomy_qr_v2: 'https://spurig.com/email-assets/hero-gastro.jpg',
  crafts_sme_print_v2: 'https://spurig.com/email-assets/hero-dashboard.jpg',
  events_tourism_print_v2: 'https://spurig.com/email-assets/hero-dashboard.jpg',
};

const TEMPLATES: Record<TemplateKey, Template> = {
  marketing_agency_dsgvo_v2: {
    key: 'marketing_agency_dsgvo_v2',
    segments: ['marketing_agency'],
    subjects: [
      'Bitly = 4% Bußgeld-Risiko für eure Kunden',
      'Eure Bitly-Links sind nicht DSGVO-konform',
      'Schrems-II-Falle bei Kunden-Kampagnen?',
      'Bitly-Alternative aus Berlin — kurze Frage',
    ],
    build: ({ greetingTarget, city }) => ({
      hook: city
        ? `als Agentur in ${city} arbeitet ihr sicher mit QR-Codes und Kurzlinks in Kunden-Kampagnen.`
        : `als Agentur arbeitet ihr sicher mit QR-Codes und Kurzlinks in Kunden-Kampagnen.`,
      painLine: 'Wenn ihr Bitly nutzt: das ist nach Schrems-II rechtlich angreifbar.',
      bullets: [
        'Bitly = US-Hosting → CLOUD Act → Kunden-Daten in den USA',
        'Bußgeld-Risiko: bis 4% vom Jahresumsatz eures Kunden',
        '2024 erste DSGVO-Entscheidung gegen US-Kurzlink-Dienst',
      ],
      comparison: [
        { bitlyOrAlt: 'US-Server', spurig: 'EU-Server (Frankfurt)' },
        { bitlyOrAlt: '199 $ / Monat', spurig: '8,99 € / Monat' },
        { bitlyOrAlt: 'Cookie-Banner Pflicht', spurig: 'Kein Banner nötig' },
        { bitlyOrAlt: 'Eigene Domain ab 499$', spurig: 'Eigene Domain inklusive' },
      ],
      ctaText: 'Spurig 14 Tage gratis testen',
      ctaUrl: 'https://spurig.com/bitly-alternative',
      closer: `Hat das für eure Kampagnen-Strategie Relevanz, ${greetingTarget.split('-')[0]}?`,
    }),
  },

  gastronomy_qr_v2: {
    key: 'gastronomy_qr_v2',
    segments: ['gastronomy'],
    subjects: [
      'Welcher Tisch scannt euren QR-Code?',
      'QR-Code für Speisekarte — DSGVO-Update',
      '247 Scans Tisch 5 · 14 Scans Tisch 11',
      'Bewertungs-QR auf der Rechnung tracken',
    ],
    build: ({ greetingTarget, companyName, city }) => ({
      hook: city
        ? `falls ihr im ${companyName} in ${city} QR-Codes für Speisekarte oder Google-Bewertungen nutzt — kurze Frage.`
        : `falls ihr im ${companyName} QR-Codes für Speisekarte oder Google-Bewertungen nutzt — kurze Frage.`,
      painLine: 'Wisst ihr, welcher Tisch wie oft scannt? Welche Aktion Gäste bringt?',
      bullets: [
        'Echte Daten statt Bauchgefühl: Scans pro Tisch, pro Flyer, pro Aktion',
        'Live-Dashboard — Top-Tische und tote Werbe-Aktionen sofort sichtbar',
        'DSGVO-konform: Server in Frankfurt, kein Cookie-Banner',
      ],
      comparison: [
        { bitlyOrAlt: 'Bitly: US-Daten', spurig: 'EU-Hosting, AVV inkl.' },
        { bitlyOrAlt: 'Standard-Tools: nur Total-Klicks', spurig: 'Scans pro Tisch / pro Plakat' },
        { bitlyOrAlt: 'Versteckte Kosten', spurig: 'Ab 8,99 € / Monat, alles drin' },
      ],
      ctaText: '14 Tage gratis testen',
      ctaUrl: 'https://spurig.com/qr-code-fuer-gastronomie',
      closer: `Wäre der 5-Min-Blick wert, ${greetingTarget.split('-')[0]}?`,
    }),
  },

  crafts_sme_print_v2: {
    key: 'crafts_sme_print_v2',
    segments: ['crafts_sme'],
    subjects: [
      'Welcher Flyer bringt eure Kunden?',
      'QR-Tracking für Visitenkarten & Flyer',
      '450 € Flyer-Budget verbrannt? (möglich)',
    ],
    build: ({ greetingTarget, companyName, city }) => ({
      hook: `${companyName}${city ? ' in ' + city : ''} hat sicher Visitenkarten, Flyer oder Plakate in der Region.`,
      painLine: 'Aber: wisst ihr welche Aktion am meisten Anfragen bringt?',
      bullets: [
        'QR-Code auf Visitenkarte / Flyer / Plakat — pro Aktion eigene Stats',
        'Nach 7 Tagen seht ihr objektiv was funktioniert',
        'Beim nächsten Druck: nur noch Top-Aktionen, kein Geld mehr verbrennen',
      ],
      comparison: [
        { bitlyOrAlt: 'Ohne Tracking: Bauchgefühl', spurig: 'Mit Spurig: echte Daten' },
        { bitlyOrAlt: 'Bitly: DSGVO-Risiko', spurig: 'EU-Hosting, DSGVO-konform' },
        { bitlyOrAlt: 'Stundenlanges Setup', spurig: 'In 5 Min einsatzbereit' },
      ],
      ctaText: 'Jetzt 14 Tage gratis testen',
      ctaUrl: 'https://spurig.com/qr-code-print-tracking',
      closer: `Wäre das relevant für euch, ${greetingTarget.split('-')[0]}?`,
    }),
  },

  events_tourism_print_v2: {
    key: 'events_tourism_print_v2',
    segments: ['events_tourism'],
    subjects: [
      '3.000 € pro Plakat-Kampagne verbrennen?',
      'Welcher Plakat-Standort wirklich performt',
      'Datenidee für eure Event-Werbung',
    ],
    build: ({ greetingTarget, companyName, city }) => ({
      hook: `Plakat-Kampagnen für Events / Tourismus${city ? ' in ' + city : ''} — typisches Problem: man weiß nicht welche Standorte tatsächlich Aufmerksamkeit bringen.`,
      painLine: 'Studien: 30-40 % der Standorte bringen < 5 % der Wahrnehmung.',
      bullets: [
        'Bei 7.500 €-Kampagnen sind das 2.000-3.000 € verbranntes Budget',
        'Mit QR-pro-Standort seht ihr nach 7 Tagen objektiv welcher Standort scannt',
        'Bei nächster Kampagne: Top-3 verdoppeln, Bottom-3 streichen',
      ],
      comparison: [
        { bitlyOrAlt: 'Plakatkampagne ohne Tracking', spurig: 'Spurig pro Standort' },
        { bitlyOrAlt: '30-40% Budget-Verlust', spurig: 'Daten nach 7 Tagen' },
        { bitlyOrAlt: 'Bitly: US-Hosting', spurig: 'EU-Hosting, DSGVO ok' },
      ],
      ctaText: 'Beispiel-Analyse anschauen',
      ctaUrl: 'https://spurig.com/qr-code-print-tracking',
      closer: `Wäre das für ${companyName} relevant, ${greetingTarget.split('-')[0]}?`,
    }),
  },
};

export function buildMailForLead(
  lead: OutboundLead,
  unsubscribeUrl: string,
): RenderedMail | null {
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

  const subjectRaw = pickSubject(template, lead.id);
  const subject = subjectRaw
    .replace('{companyName}', shortCompanyName(lead.name))
    .replace('{firstName}', firstName ?? 'Team')
    .replace('{city}', lead.city ?? 'eurer Region');

  const content = template.build(input);

  return {
    templateKey: template.key,
    subject,
    bodyText: buildTextVersion(greetingTarget, content),
    bodyHtml: buildHtmlVersion(template.key, greetingTarget, content, unsubscribeUrl),
    personalizationHook: content.hook,
  };
}

function pickTemplateForSegment(segment: OutboundSegment): Template | null {
  for (const t of Object.values(TEMPLATES)) {
    if (t.segments.includes(segment)) return t;
  }
  return null;
}

function pickSubject(template: Template, leadId: string): string {
  let hash = 0;
  for (let i = 0; i < leadId.length; i++) hash = (hash * 31 + leadId.charCodeAt(i)) | 0;
  const idx = Math.abs(hash) % template.subjects.length;
  return template.subjects[idx];
}

function extractFirstName(email: string): string | null {
  const local = email.split('@')[0]?.toLowerCase();
  if (!local) return null;
  if (/^[a-z]+\.[a-z]+$/.test(local)) {
    return capitalize(local.split('.')[0]);
  }
  const ROLE_WORDS = new Set([
    'info', 'kontakt', 'contact', 'hello', 'hallo', 'mail', 'team', 'office',
    'service', 'support', 'sales', 'vertrieb', 'studio', 'press', 'presse',
    'anfrage', 'reservierung', 'reservation', 'booking',
  ]);
  if (/^[a-z]+$/.test(local) && local.length >= 3 && !ROLE_WORDS.has(local)) {
    return capitalize(local);
  }
  return null;
}

function extractGreetingTarget(email: string, _companyName: string): string {
  const firstName = extractFirstName(email);
  if (firstName) return firstName;
  // Fallback: neutrales Standard-B2B-Greeting auf Deutsch
  return 'zusammen';
}

function shortCompanyName(companyName: string): string {
  return companyName
    .replace(/\b(GmbH|UG|AG|GbR|KG|& Co\.?|Co\.|e\.K\.|mbH|Inc\.?|Ltd\.?)\b/gi, '')
    .replace(/[|·•–—].*$/, '')
    .replace(/\s*-\s*.*$/, '') // alles nach " - "
    .trim()
    .slice(0, 40);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function openingFor(greeting: string): string {
  return greeting === 'zusammen' ? `Hallo ${greeting}` : `Hi ${greeting}`;
}

function openingHtmlFor(greeting: string): string {
  return greeting === 'zusammen'
    ? `Hallo zusammen`
    : `Hi <strong>${escapeHtml(greeting)}</strong>`;
}

function buildTextVersion(greeting: string, c: TemplateContent): string {
  return `${openingFor(greeting)},

${c.hook}

${c.painLine}

${c.bullets.map((b) => '• ' + b).join('\n')}

Vergleich:
${c.comparison.map((row) => `  Bitly/Standard: ${row.bitlyOrAlt}\n  Spurig: ${row.spurig}\n`).join('\n')}

${c.closer}

→ ${c.ctaText}: ${c.ctaUrl}

Beste Grüße
David da Silva Gornik
Spurig — DSGVO-konformes QR & Kurzlink-Tracking
${WEBSITE_URL} · Made in Berlin
LinkedIn: ${LINKEDIN_URL}

---
Nicht relevant? Antworte mit "stop" — ich nehm dich raus.
Impressum: https://spurig.com/impressum`;
}

function buildHtmlVersion(
  templateKey: TemplateKey,
  greeting: string,
  c: TemplateContent,
  unsubscribeUrl: string,
): string {
  const heroUrl = HERO_IMAGES[templateKey];
  void greeting; // greeting wird via openingHtmlFor inline genutzt
  const bulletItems = c.bullets
    .map(
      (b) => `
      <tr>
        <td style="vertical-align:top;padding:4px 8px 4px 0;width:24px">
          <div style="width:18px;height:18px;background:${BRAND.primary};border-radius:50%;color:white;font-size:11px;font-weight:700;text-align:center;line-height:18px">✓</div>
        </td>
        <td style="vertical-align:top;padding:4px 0;font-size:14px;line-height:1.5;color:${BRAND.text}">${escapeHtml(b)}</td>
      </tr>`,
    )
    .join('');

  const comparisonRows = c.comparison
    .map(
      (row) => `
      <tr>
        <td style="padding:10px 14px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.danger};background:#fef2f2">
          <span style="display:inline-block;width:14px;color:${BRAND.danger};font-weight:700">✗</span>
          ${escapeHtml(row.bitlyOrAlt)}
        </td>
        <td style="padding:10px 14px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.success};background:#f0fdf4;font-weight:600">
          <span style="display:inline-block;width:14px;color:${BRAND.success};font-weight:700">✓</span>
          ${escapeHtml(row.spurig)}
        </td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Spurig</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.text};font-size:15px;line-height:1.55">

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 16px">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04)">

          <!-- Dark Brand Header -->
          <tr>
            <td style="padding:18px 24px;background:${BRAND.bgDark};text-align:left">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
                      <td style="padding-right:8px;vertical-align:middle">
                        <img src="${LOGO_URL}" alt="" width="28" height="28" style="display:block;border:0;outline:none">
                      </td>
                      <td style="vertical-align:middle">
                        <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#ffffff;line-height:1">Spurig</div>
                      </td>
                    </tr></table>
                  </td>
                  <td style="text-align:right;vertical-align:middle">
                    <span style="display:inline-block;padding:4px 10px;border:1px solid rgba(255,255,255,0.18);border-radius:999px;font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:rgba(255,255,255,0.85)">DSGVO · EU-Hosting</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Hero Image -->
          <tr>
            <td style="padding:0;font-size:0;line-height:0">
              <img src="${heroUrl}" alt="Spurig Dashboard" width="600" style="display:block;width:100%;height:auto;max-width:600px;border:0;outline:none">
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding:28px 32px 8px">
              <p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:${BRAND.text}">${openingHtmlFor(greeting)},</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${BRAND.text}">${escapeHtml(c.hook)}</p>
            </td>
          </tr>

          <!-- Pain Banner -->
          <tr>
            <td style="padding:0 32px">
              <div style="padding:14px 18px;background:#fef3c7;border-left:4px solid ${BRAND.warn};border-radius:8px;font-size:15px;font-weight:600;color:#78350f;line-height:1.4">
                ⚠ ${escapeHtml(c.painLine)}
              </div>
            </td>
          </tr>

          <!-- Bullets -->
          <tr>
            <td style="padding:20px 32px 8px">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                ${bulletItems}
              </table>
            </td>
          </tr>

          <!-- Comparison Table -->
          <tr>
            <td style="padding:16px 32px">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.textMuted};margin-bottom:8px;font-weight:600">Bitly/Standard vs Spurig</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden">
                ${comparisonRows}
              </table>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td style="padding:24px 32px;text-align:center">
              <a href="${escapeAttr(c.ctaUrl)}" style="display:inline-block;padding:14px 28px;background:${BRAND.primary};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:-0.01em;box-shadow:0 2px 8px rgba(124,58,237,0.35)">
                ${escapeHtml(c.ctaText)} →
              </a>
              <div style="margin-top:10px;font-size:12px;color:${BRAND.textMuted}">14 Tage gratis · keine Kreditkarte · jederzeit kündbar</div>
            </td>
          </tr>

          <!-- Closer -->
          <tr>
            <td style="padding:8px 32px 24px">
              <p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.text}">${escapeHtml(c.closer)}</p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td style="padding:20px 32px 24px;border-top:1px solid ${BRAND.border};background:${BRAND.bgSoft}">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:top">
                    <div style="font-size:14px;font-weight:600;color:${BRAND.text}">David da Silva Gornik</div>
                    <div style="font-size:13px;color:${BRAND.textMuted};margin-top:2px">Founder · Spurig</div>
                    <div style="margin-top:10px;font-size:13px">
                      <a href="${WEBSITE_URL}" style="color:${BRAND.primary};text-decoration:none;font-weight:600">spurig.com</a>
                      <span style="color:${BRAND.border};margin:0 8px">·</span>
                      <a href="${LINKEDIN_URL}" style="color:${BRAND.primary};text-decoration:none;font-weight:600">LinkedIn</a>
                      <span style="color:${BRAND.border};margin:0 8px">·</span>
                      <span style="color:${BRAND.textMuted}">Berlin 🇩🇪</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:14px 32px 24px;text-align:center;font-size:11px;color:${BRAND.textMuted};line-height:1.5">
              Nicht relevant? Antworte mit „stop" oder
              <a href="${escapeAttr(unsubscribeUrl)}" style="color:${BRAND.textMuted};text-decoration:underline">hier abbestellen</a>.<br>
              Spurig · Berlin · <a href="https://spurig.com/impressum" style="color:${BRAND.textMuted};text-decoration:underline">Impressum</a>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, '%22');
}
