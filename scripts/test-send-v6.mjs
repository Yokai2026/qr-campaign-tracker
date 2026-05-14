import { readFileSync } from 'fs';

const env = readFileSync('.env.local', 'utf-8');
const get = (k) => {
  const line = env.split('\n').find((l) => l.startsWith(k + '='));
  return line ? line.split('=').slice(1).join('=').trim() : null;
};

const RESEND_KEY = get('RESEND_API_KEY');
const LOGO = 'https://spurig.com/email-assets/spurig-logo-glow.png';
const HERO = 'https://spurig.com/email-assets/hero-dashboard.jpg';

const subject = 'So verlierst du gerade Premium-Kunden';

const hook = 'ehrliche Frage: kannst du deinen Kunden in Berlin nach jeder Kampagne sagen, welcher Standort wirklich Anfragen gebracht hat — oder gibst du ihnen Gesamt-Klicks und hoffst dass keiner nachhakt?';
const painLine = '2026 ist Gesamt-Klicks-Reporting der schnellste Weg, Premium-Kunden zu verlieren. Wer Standort-für-Standort messen kann, kassiert die größeren Budgets.';
const bullets = [
  'Scans pro Standort, pro Auflage, pro Variante — Drill-down in Live-Dashboard',
  'Branded Kurz-Domain (z.B. go.kundenname.de) statt bit.ly — kostenlos inklusive',
  'Daten bleiben in Frankfurt — kein Schrems-II, kein Bußgeld-Risiko für eure Kunden',
  'Stripe-Rechnung über euch, white-labeled Reports für eure Kunden',
];
const ctaText = 'Spurig in 5 Min anschauen';
const ctaUrl = 'https://spurig.com';
const closer = 'Wenn ich euch das in 10 Min zeige — wäre das interessant?';

const bulletRows = bullets.map(b => `<tr>
  <td style="vertical-align:top;padding:6px 10px 6px 0;width:24px">
    <div style="width:18px;height:18px;background:#7C3AED;border-radius:50%;color:#fff;font-size:11px;font-weight:700;text-align:center;line-height:18px">✓</div>
  </td>
  <td style="vertical-align:top;padding:6px 0;font-size:14px;line-height:1.55;color:#111113">${b}</td>
</tr>`).join('');

const html = `<!DOCTYPE html><html lang="de"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111113;font-size:15px;line-height:1.55">
<table width="100%" cellspacing="0" cellpadding="0" style="background:#f3f4f6;padding:24px 16px"><tr><td align="center">
<table width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,0.06)">
<tr><td style="padding:22px 32px;background:#fff;border-bottom:1px solid #E5E5E5">
<table width="100%" cellspacing="0" cellpadding="0"><tr>
<td style="vertical-align:middle;width:1%;white-space:nowrap">
<table cellspacing="0" cellpadding="0"><tr>
<td style="padding-right:14px;vertical-align:middle"><img src="${LOGO}" alt="Spurig" width="48" height="48" style="display:block;border:0;border-radius:12px"></td>
<td style="vertical-align:middle"><div style="font-size:22px;font-weight:800;letter-spacing:-0.025em;color:#111113;line-height:1.1">Spurig</div><div style="font-size:11px;color:#737373;margin-top:2px">Made in Berlin</div></td>
</tr></table>
</td>
<td style="text-align:right;vertical-align:middle"><span style="display:inline-block;padding:7px 14px;border:1px solid #E5E5E5;border-radius:999px;font-size:10.5px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#525252">DSGVO · EU-Hosting</span></td>
</tr></table>
</td></tr>

<tr><td style="padding:0;font-size:0;line-height:0">
<img src="${HERO}" alt="" width="600" style="display:block;width:100%;height:auto;max-width:600px;border:0">
</td></tr>

<tr><td style="padding:28px 32px 8px">
<p style="margin:0 0 12px;font-size:16px">Hallo zusammen,</p>
<p style="margin:0 0 18px;font-size:15px;line-height:1.6">${hook}</p>
</td></tr>

<tr><td style="padding:0 32px">
<div style="padding:16px 20px;background:#F5F5F5;border-left:3px solid #7C3AED;border-radius:8px;font-size:15px;line-height:1.5">${painLine}</div>
</td></tr>

<tr><td style="padding:22px 32px 4px">
<table cellspacing="0" cellpadding="0">${bulletRows}</table>
</td></tr>

<tr><td style="padding:24px 32px;text-align:center">
<a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:#7C3AED;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;font-size:15px;box-shadow:0 2px 8px rgba(124,58,237,0.35)">${ctaText} →</a>
<div style="margin-top:10px;font-size:12px;color:#525252">14 Tage gratis · keine Kreditkarte · jederzeit kündbar</div>
</td></tr>

<tr><td style="padding:8px 32px 24px">
<p style="margin:0;font-size:15px;line-height:1.6">${closer}</p>
</td></tr>

<tr><td style="padding:20px 32px 24px;border-top:1px solid #E5E5E5;background:#F5F5F5">
<div style="font-size:14px;font-weight:600">David da Silva Gornik</div>
<div style="font-size:13px;color:#525252;margin-top:2px">Founder · Spurig</div>
<div style="margin-top:10px;font-size:13px">
<a href="https://spurig.com" style="color:#7C3AED;text-decoration:none;font-weight:600">spurig.com</a> · <a href="https://www.linkedin.com/in/david-da-silva-gornik-59262b367/" style="color:#7C3AED;text-decoration:none;font-weight:600">LinkedIn</a> · Berlin 🇩🇪
</div>
</td></tr>

</table></td></tr></table></body></html>`;

const send = await fetch('https://api.resend.com/emails', {
  method: 'POST',
  headers: { Authorization: 'Bearer ' + RESEND_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    from: 'David da Silva Gornik <david@hello.spurig.com>',
    to: ['tomatenkopf36@gmail.com'],
    reply_to: 'david@spurig.com',
    subject: '[V6] ' + subject,
    html,
    text: 'V6 test - überzeugende Schlagzeile + überarbeiteter Body',
  }),
});
console.log('Status:', send.status, JSON.stringify(await send.json()).slice(0, 150));
