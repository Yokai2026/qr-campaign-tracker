import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf-8');
const get = (k) => {
  const line = env.split('\n').find((l) => l.startsWith(k + '='));
  return line ? line.split('=').slice(1).join('=').trim() : null;
};

const SB_URL = get('NEXT_PUBLIC_SUPABASE_URL');
const SB_KEY = get('SUPABASE_SERVICE_ROLE_KEY');
const RESEND_KEY = get('RESEND_API_KEY');

const r = await fetch(
  SB_URL + '/rest/v1/outbound_leads?segment=eq.marketing_agency&email_status=eq.discovered&select=*&limit=1',
  { headers: { apikey: SB_KEY, Authorization: 'Bearer ' + SB_KEY } },
);
const leads = await r.json();
const lead = leads[0];
console.log('Lead:', lead.name, '|', lead.email, '|', lead.city);

const BRAND = {
  primary: '#6366f1',
  text: '#111827',
  textMuted: '#6b7280',
  bgSoft: '#f9fafb',
  border: '#e5e7eb',
  success: '#10b981',
  warn: '#f59e0b',
  danger: '#ef4444',
};
const LINKEDIN = 'https://www.linkedin.com/in/david-da-silva-gornik-59262b367/';
const WEB = 'https://spurig.com';

function shortCompany(n) {
  return n
    .replace(/\b(GmbH|UG|AG|GbR|KG|& Co\.?|Co\.|e\.K\.|mbH|Inc\.?|Ltd\.?)\b/gi, '')
    .replace(/[|·•–—].*$/, '')
    .replace(/\s*-\s*.*$/, '')
    .trim()
    .slice(0, 40);
}
function firstName(email) {
  const local = email.split('@')[0].toLowerCase();
  if (/^[a-z]+\.[a-z]+$/.test(local))
    return local.split('.')[0][0].toUpperCase() + local.split('.')[0].slice(1);
  const ROLE = new Set([
    'info', 'kontakt', 'contact', 'hello', 'hallo', 'mail', 'team',
    'office', 'service', 'support', 'sales', 'vertrieb', 'studio',
    'press', 'presse', 'anfrage', 'reservierung',
  ]);
  if (/^[a-z]+$/.test(local) && local.length >= 3 && !ROLE.has(local))
    return local[0].toUpperCase() + local.slice(1);
  return null;
}
function greeting(email, name) {
  return firstName(email) || shortCompany(name) + '-Team';
}

const g = greeting(lead.email, lead.name);
const hook = `als Agentur in ${lead.city} arbeitet ihr sicher mit QR-Codes und Kurzlinks in Kunden-Kampagnen.`;
const painLine = 'Wenn ihr Bitly nutzt: das ist nach Schrems-II rechtlich angreifbar.';
const bullets = [
  'Bitly = US-Hosting → CLOUD Act → Kunden-Daten in den USA',
  'Bußgeld-Risiko: bis 4% vom Jahresumsatz eures Kunden',
  '2024 erste DSGVO-Entscheidung gegen US-Kurzlink-Dienst',
];
const comparison = [
  { l: 'US-Server', r: 'EU-Server (Frankfurt)' },
  { l: '199 $ / Monat', r: '8,99 € / Monat' },
  { l: 'Cookie-Banner Pflicht', r: 'Kein Banner nötig' },
  { l: 'Eigene Domain ab 499$', r: 'Eigene Domain inklusive' },
];
const ctaText = 'Spurig 14 Tage gratis testen';
const ctaUrl = 'https://spurig.com/bitly-alternative';
const closer = `Hat das für eure Kampagnen-Strategie Relevanz, ${g.split('-')[0]}?`;

const bulletRows = bullets
  .map(
    (b) => `<tr>
  <td style="vertical-align:top;padding:4px 8px 4px 0;width:24px">
    <div style="width:18px;height:18px;background:${BRAND.primary};border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:18px">✓</div>
  </td>
  <td style="vertical-align:top;padding:4px 0;font-size:14px;line-height:1.5;color:${BRAND.text}">${b}</td>
</tr>`,
  )
  .join('');

const cmpRows = comparison
  .map(
    (row) => `<tr>
  <td style="padding:10px 14px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.danger};background:#fef2f2">
    <span style="display:inline-block;width:14px;font-weight:700">✗</span> ${row.l}
  </td>
  <td style="padding:10px 14px;border-bottom:1px solid ${BRAND.border};font-size:13px;color:${BRAND.success};background:#f0fdf4;font-weight:600">
    <span style="display:inline-block;width:14px;font-weight:700">✓</span> ${row.r}
  </td>
</tr>`,
  )
  .join('');

const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.text};font-size:15px;line-height:1.55">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 16px">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04)">

<tr><td style="padding:24px 32px 0">
<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
<td style="padding-right:10px">
  <div style="width:38px;height:38px;border-radius:10px;background:linear-gradient(135deg,${BRAND.primary} 0%,#a855f7 100%);color:white;font-size:22px;font-weight:800;text-align:center;line-height:38px">S</div>
</td>
<td>
  <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;color:${BRAND.text}">Spurig</div>
  <div style="font-size:11px;color:${BRAND.textMuted};letter-spacing:0.04em;text-transform:uppercase">Made in Berlin · DSGVO-konform</div>
</td>
</tr></table>
</td></tr>

<tr><td style="padding:24px 32px 8px">
<p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:${BRAND.text}">Hi <strong>${g}</strong>,</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${BRAND.text}">${hook}</p>
</td></tr>

<tr><td style="padding:0 32px">
<div style="padding:14px 18px;background:#fef3c7;border-left:4px solid ${BRAND.warn};border-radius:8px;font-size:15px;font-weight:600;color:#78350f;line-height:1.4">
⚠ ${painLine}
</div>
</td></tr>

<tr><td style="padding:20px 32px 8px">
<table role="presentation" cellspacing="0" cellpadding="0" border="0">${bulletRows}</table>
</td></tr>

<tr><td style="padding:16px 32px">
<div style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:${BRAND.textMuted};margin-bottom:8px;font-weight:600">Bitly/Standard vs Spurig</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid ${BRAND.border};border-radius:10px;overflow:hidden">${cmpRows}</table>
</td></tr>

<tr><td style="padding:24px 32px;text-align:center">
<a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:${BRAND.primary};color:#ffffff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:-0.01em;box-shadow:0 2px 6px rgba(99,102,241,0.3)">
${ctaText} →
</a>
<div style="margin-top:10px;font-size:12px;color:${BRAND.textMuted}">14 Tage gratis · keine Kreditkarte · jederzeit kündbar</div>
</td></tr>

<tr><td style="padding:8px 32px 24px">
<p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.text}">${closer}</p>
</td></tr>

<tr><td style="padding:20px 32px 24px;border-top:1px solid ${BRAND.border};background:${BRAND.bgSoft}">
<div style="font-size:14px;font-weight:600;color:${BRAND.text}">David da Silva Gornik</div>
<div style="font-size:13px;color:${BRAND.textMuted};margin-top:2px">Founder · Spurig</div>
<div style="margin-top:10px;font-size:13px">
<a href="${WEB}" style="color:${BRAND.primary};text-decoration:none;font-weight:600">spurig.com</a>
<span style="color:${BRAND.border};margin:0 8px">·</span>
<a href="${LINKEDIN}" style="color:${BRAND.primary};text-decoration:none;font-weight:600">LinkedIn</a>
<span style="color:${BRAND.border};margin:0 8px">·</span>
<span style="color:${BRAND.textMuted}">Berlin 🇩🇪</span>
</div>
</td></tr>

<tr><td style="padding:14px 32px 24px;text-align:center;font-size:11px;color:${BRAND.textMuted};line-height:1.5">
Nicht relevant? Antworte mit „stop" oder
<a href="https://spurig.com/unsubscribe?l=test" style="color:${BRAND.textMuted};text-decoration:underline">hier abbestellen</a>.<br>
Spurig · Berlin · <a href="https://spurig.com/impressum" style="color:${BRAND.textMuted};text-decoration:underline">Impressum</a>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

const subject = '[TEST V2] Bitly = 4% Bußgeld-Risiko für eure Kunden';

const send = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer ' + RESEND_KEY,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    from: 'David da Silva Gornik <david@hello.spurig.com>',
    to: ['tomatenkopf36@gmail.com'],
    reply_to: 'david@spurig.com',
    subject,
    html,
    text: 'Bitte HTML-Version ansehen für visuelles Design.',
  }),
});
const data = await send.json();
console.log('Status:', send.status, 'ID:', data.id);
