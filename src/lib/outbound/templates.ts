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
const LOGO_URL = 'https://spurig.com/email-assets/spurig-logo-glow.png';

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
      'So verlierst du gerade Premium-Kunden',
      'Deine Kunden-Reports lügen dich an',
      'Was deine Konkurrenz über Print weiß — du nicht',
      'Stop. Bevor du die nächste Kampagne pitchst.',
    ],
    build: ({ greetingTarget, companyName, city }) => ({
      hook: city
        ? `ehrliche Frage: kannst du deinen Kunden in ${city} nach jeder Kampagne sagen, welcher Standort wirklich Anfragen gebracht hat — oder gibst du ihnen Gesamt-Klicks und hoffst dass keiner nachhakt?`
        : `ehrliche Frage: kannst du deinen Kunden nach jeder Kampagne sagen, welcher Standort wirklich Anfragen gebracht hat — oder gibst du ihnen Gesamt-Klicks und hoffst dass keiner nachhakt?`,
      painLine: '2026 ist Gesamt-Klicks-Reporting der schnellste Weg, Premium-Kunden zu verlieren. Wer Standort-für-Standort messen kann, kassiert die größeren Budgets.',
      bullets: [
        'Scans pro Standort, pro Auflage, pro Variante — Drill-down in Live-Dashboard',
        'Branded Kurz-Domain (z.B. go.kundenname.de) statt bit.ly — kostenlos inklusive',
        'Daten bleiben in Frankfurt — kein Schrems-II, kein Bußgeld-Risiko für eure Kunden',
        'Stripe-Rechnung über euch, white-labeled Reports für eure Kunden',
      ],
      comparison: [],
      ctaText: 'Spurig in 5 Min anschauen',
      ctaUrl: 'https://spurig.com',
      closer: `Wenn ich euch das in 10 Min zeige${greetingTarget !== 'zusammen' ? `, ${greetingTarget}` : ''} — wäre das interessant?`,
    }),
  },

  gastronomy_qr_v2: {
    key: 'gastronomy_qr_v2',
    segments: ['gastronomy'],
    subjects: [
      'So verlierst du Gäste an die Konkurrenz',
      'Tisch 5: 247 Scans. Tisch 11: 14. Warum?',
      'Deine Speisekarte verschweigt dir etwas',
      'Stop. Bevor du wieder QR-Codes druckst.',
    ],
    build: ({ greetingTarget, companyName, city }) => ({
      hook: city
        ? `wenn dein Gast den QR-Code für die Speisekarte im ${companyName} (${city}) scannt — weißt du an welchem Tisch er sitzt, wie lange er bleibt, ob er die Bewertungs-Aktion gesehen hat?`
        : `wenn dein Gast den QR-Code für die Speisekarte im ${companyName} scannt — weißt du an welchem Tisch er sitzt, wie lange er bleibt, ob er die Bewertungs-Aktion gesehen hat?`,
      painLine: 'Generische QR-Generatoren zeigen Total-Klicks. Die Restaurants die wirklich wachsen, wissen genau welcher Tisch zur Premium-Zeit scannt — und welcher Aushang Google-Bewertungen bringt.',
      bullets: [
        'Scans pro Tisch, pro Aktion, pro Tageszeit — live im Dashboard',
        'Bewertungs-Booster: misst welcher Aushang Google-Reviews generiert',
        'Wiederkehrer erkennen: gleicher Tisch, anderer Tag — anonymisiert',
        'Server in Frankfurt — kein Cookie-Banner, kein DSGVO-Stress',
      ],
      comparison: [],
      ctaText: '14 Tage gratis testen',
      ctaUrl: 'https://spurig.com',
      closer: `Wenn das deine Speisekarte-Daten live zeigt${greetingTarget !== 'zusammen' ? `, ${greetingTarget}` : ''} — wert für 5 Min?`,
    }),
  },

  crafts_sme_print_v2: {
    key: 'crafts_sme_print_v2',
    segments: ['crafts_sme'],
    subjects: [
      'So verbrennst du gerade 450 € pro Flyer-Druck',
      'Welcher Flyer dir wirklich Kunden bringt — keiner weiß es',
      'Deine Visitenkarten kosten dich Aufträge',
      'Stop. Bevor du wieder Flyer bestellst.',
    ],
    build: ({ greetingTarget, companyName, city }) => ({
      hook: city
        ? `wenn du diese Woche Flyer oder Visitenkarten in ${city} verteilst — weißt du nach 7 Tagen objektiv welche der Aktionen Anfragen bringt? Oder ratest du beim nächsten Druck wieder?`
        : `wenn du diese Woche Flyer oder Visitenkarten verteilst — weißt du nach 7 Tagen objektiv welche der Aktionen Anfragen bringt? Oder ratest du beim nächsten Druck wieder?`,
      painLine: 'Ohne Tracking ist Print-Werbung Roulette. Die Konkurrenz die misst, druckt nur noch was funktioniert — und verdoppelt damit ihre Anfragen ohne mehr Budget.',
      bullets: [
        'Ein QR-Code pro Aktion — separate Stats für jeden Flyer / jede Visitenkarte',
        'Setup in 5 Min, ohne Tech-Wissen — du druckst einfach den QR auf den Print',
        'Live-Daten nach 1-3 Tagen — beim nächsten Druck nur noch Top-Aktionen',
        'EU-Hosting, kein Cookie-Banner, keine Datenschutz-Sorgen',
      ],
      comparison: [],
      ctaText: '14 Tage gratis testen',
      ctaUrl: 'https://spurig.com',
      closer: `Falls du nächste Woche eh wieder druckst${greetingTarget !== 'zusammen' ? `, ${greetingTarget}` : ''} — lohnt sich der 5-Min-Test vorher?`,
    }),
  },

  events_tourism_print_v2: {
    key: 'events_tourism_print_v2',
    segments: ['events_tourism'],
    subjects: [
      'So verlierst du 3.000 € pro Plakatkampagne',
      'Deine Plakate hängen — aber wer sieht sie?',
      '30-40 % deines Budgets sind Müll. Hier ist der Beweis.',
      'Stop. Bevor du die nächste Kampagne buchst.',
    ],
    build: ({ greetingTarget, companyName, city }) => ({
      hook: city
        ? `bei eurer letzten Plakatkampagne in ${city} — kannst du objektiv sagen, welche 3 Standorte 80 % der Aufmerksamkeit gebracht haben? Oder hast du am Ende der Laufzeit nur ein Bauchgefühl?`
        : `bei eurer letzten Plakatkampagne — kannst du objektiv sagen, welche 3 Standorte 80 % der Aufmerksamkeit gebracht haben? Oder hast du am Ende der Laufzeit nur ein Bauchgefühl?`,
      painLine: 'ZAW-Studie 2024: 30-40 % der Plakat-Standorte bringen weniger als 5 % der Wahrnehmung. Bei einer 7.500 € Kampagne sind das bis zu 3.000 € pro Quartal in tote Standorte. Jedes Jahr neu.',
      bullets: [
        'QR-Code pro Standort — nach 7 Tagen seht ihr objektiv welche performen',
        'Beim nächsten Buchen: Top-3 Standorte verdoppeln, Bottom-3 streichen',
        'Kunden-Reports automatisch generiert — keine Excel-Abende mehr',
        'EU-Hosting, DSGVO-konform, ab 8,99 €/Monat',
      ],
      comparison: [],
      ctaText: 'Spurig anschauen',
      ctaUrl: 'https://spurig.com',
      closer: `Wenn ich dir das mal an einer eurer Kampagnen durchrechne${greetingTarget !== 'zusammen' ? `, ${greetingTarget}` : ''} — wert?`,
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
            <td style="padding:22px 32px;background:#ffffff;border-bottom:1px solid ${BRAND.border}">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align:middle;width:1%;white-space:nowrap">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
                      <td style="padding-right:14px;vertical-align:middle">
                        <!-- Logo has dark rounded BG baked in for visibility on white header -->
                        <img src="${LOGO_URL}" alt="Spurig" width="48" height="48" style="display:block;border:0;outline:none;border-radius:12px">
                      </td>
                      <td style="vertical-align:middle">
                        <div style="font-size:22px;font-weight:800;letter-spacing:-0.025em;color:${BRAND.text};line-height:1.1">Spurig</div>
                        <div style="font-size:11px;color:${BRAND.textSubtle};letter-spacing:0.02em;margin-top:2px">Made in Berlin</div>
                      </td>
                    </tr></table>
                  </td>
                  <td style="text-align:right;vertical-align:middle">
                    <span style="display:inline-block;padding:7px 14px;border:1px solid ${BRAND.border};border-radius:999px;font-size:10.5px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.textMuted};background:#ffffff">DSGVO · EU-Hosting</span>
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

          <!-- Insight Banner — neutral, value-focused -->
          <tr>
            <td style="padding:0 32px">
              <div style="padding:16px 20px;background:${BRAND.bgSoft};border-left:3px solid ${BRAND.primary};border-radius:8px;font-size:15px;color:${BRAND.text};line-height:1.5">
                ${escapeHtml(c.painLine)}
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

          <!-- Comparison Table (nur wenn Vergleichszeilen definiert) -->
          ${c.comparison.length > 0 ? `<tr>
            <td style="padding:16px 32px">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.textMuted};margin-bottom:8px;font-weight:600">Vergleich</div>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden">
                ${comparisonRows}
              </table>
            </td>
          </tr>` : ''}

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
