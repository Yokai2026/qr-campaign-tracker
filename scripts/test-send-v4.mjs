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
  primary: '#7C3AED',
  text: '#111113',
  textMuted: '#525252',
  textSubtle: '#737373',
  bgSoft: '#F5F5F5',
  bgDark: '#0a0a0a',
  border: '#E5E5E5',
};
const LINKEDIN = 'https://www.linkedin.com/in/david-da-silva-gornik-59262b367/';
const WEB = 'https://spurig.com';
const LOGO = 'https://spurig.com/spurig-icon.png';
const HERO = 'https://spurig.com/email-assets/hero-dashboard.jpg';

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
function shortCompany(n) {
  return n.replace(/\b(GmbH|UG|AG|GbR|KG|& Co\.?|Co\.|e\.K\.|mbH|Inc\.?|Ltd\.?)\b/gi, '')
    .replace(/[|·•–—].*$/, '')
    .replace(/\s*-\s*.*$/, '')
    .trim()
    .slice(0, 40);
}

const fn = firstName(lead.email);
const greeting = fn || 'zusammen';
const openingHtml = greeting === 'zusammen' ? 'Hallo zusammen' : `Hi <strong>${greeting}</strong>`;

const hook = `kurze Frage als Agentur in ${lead.city}: wie messt ihr aktuell die Performance von Print- oder QR-Kampagnen für eure Kunden?`;
const painLine = 'Die meisten Tools zeigen Gesamt-Klicks — aber nicht welcher Standort, welche Auflage oder welche Aktion wirklich performt.';
const bullets = [
  'QR-Code- & Kurzlink-Tracking pro Standort, Auflage, Variante',
  'Live-Dashboard für Kunden-Reports — keine Excel-Exporte mehr',
  'Eigene Domain (z.B. go.kundenname.de) + API + n8n-Integration',
];
const ctaText = 'Spurig in 5 Min anschauen';
const ctaUrl = 'https://spurig.com';
const closer = `Würde das eure Kampagnen-Berichte für Kunden konkreter machen${greeting !== 'zusammen' ? ', ' + greeting : ''}?`;

const bulletRows = bullets.map(b => `<tr>
  <td style="vertical-align:top;padding:6px 10px 6px 0;width:24px">
    <div style="width:18px;height:18px;background:${BRAND.primary};border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:18px">✓</div>
  </td>
  <td style="vertical-align:top;padding:6px 0;font-size:14px;line-height:1.55;color:${BRAND.text}">${b}</td>
</tr>`).join('');

const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:${BRAND.text};font-size:15px;line-height:1.55">

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f4f6;padding:24px 16px">
<tr><td align="center">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06)">

<!-- White Brand Header -->
<tr><td style="padding:22px 32px;background:#ffffff;border-bottom:1px solid ${BRAND.border}">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
<td style="vertical-align:middle;width:1%;white-space:nowrap">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
    <td style="padding-right:14px;vertical-align:middle">
      <div style="width:40px;height:40px;border-radius:11px;background:${BRAND.bgDark};display:inline-block;text-align:center;line-height:40px;vertical-align:middle">
        <img src="${LOGO}" alt="" width="26" height="26" style="display:inline-block;vertical-align:middle;border:0;outline:none;margin-top:7px">
      </div>
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
</tr></table>
</td></tr>

<!-- Hero -->
<tr><td style="padding:0;font-size:0;line-height:0">
<img src="${HERO}" alt="Spurig Dashboard" width="600" style="display:block;width:100%;height:auto;max-width:600px;border:0;outline:none">
</td></tr>

<!-- Greeting -->
<tr><td style="padding:28px 32px 8px">
<p style="margin:0 0 12px;font-size:16px;line-height:1.5;color:${BRAND.text}">${openingHtml},</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:${BRAND.text}">${hook}</p>
</td></tr>

<!-- Insight Banner -->
<tr><td style="padding:0 32px">
<div style="padding:16px 20px;background:${BRAND.bgSoft};border-left:3px solid ${BRAND.primary};border-radius:8px;font-size:15px;color:${BRAND.text};line-height:1.5">
${painLine}
</div>
</td></tr>

<!-- Bullets -->
<tr><td style="padding:22px 32px 4px">
<table role="presentation" cellspacing="0" cellpadding="0" border="0">${bulletRows}</table>
</td></tr>

<!-- CTA -->
<tr><td style="padding:24px 32px;text-align:center">
<a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:${BRAND.primary};color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;letter-spacing:-0.01em;box-shadow:0 2px 8px rgba(124,58,237,0.35)">
${ctaText} →
</a>
<div style="margin-top:10px;font-size:12px;color:${BRAND.textMuted}">14 Tage gratis · keine Kreditkarte · jederzeit kündbar</div>
</td></tr>

<!-- Closer -->
<tr><td style="padding:8px 32px 24px">
<p style="margin:0;font-size:15px;line-height:1.6;color:${BRAND.text}">${closer}</p>
</td></tr>

<!-- Signature -->
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

<!-- Footer -->
<tr><td style="padding:14px 32px 24px;text-align:center;font-size:11px;color:${BRAND.textMuted};line-height:1.5">
Nicht relevant? Antworte mit „stop" oder
<a href="https://spurig.com/unsubscribe?l=test" style="color:${BRAND.textMuted};text-decoration:underline">hier abbestellen</a>.<br>
Spurig · Berlin · <a href="https://spurig.com/impressum" style="color:${BRAND.textMuted};text-decoration:underline">Impressum</a>
</td></tr>

</table>
</td></tr></table>
</body></html>`;

const subject = `[TEST V4] Idee für ${shortCompany(lead.name)}`;

const send = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'David da Silva Gornik <david@hello.spurig.com>',
    to: ['tomatenkopf36@gmail.com'],
    reply_to: 'david@spurig.com',
    subject,
    html,
    text: 'Bitte HTML-Version anzeigen — V4 mit weissem Header und neuem Value-First-Copy.',
  }),
});
const data = await send.json();
console.log('Status:', send.status, 'ID:', data.id);
