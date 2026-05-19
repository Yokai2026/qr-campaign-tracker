/**
 * Shared Mail-Shell für ALLE transaktionalen Mails (Welcome, Activation,
 * Trial-Upsell, Admin-Notify, Alerts).
 *
 * Designprinzipien:
 *  - Light-Background by default. Dark-Mail-Versuche scheitern in Outlook,
 *    Gmail-Web und vielen Mobile-Clients (Card wird zwangsweise weiss
 *    gerendert → unleserliches dark-on-dark Layout). Light ist sicher.
 *  - Optional dark-mode via `@media (prefers-color-scheme: dark)` für Clients
 *    die es respektieren (Apple Mail, iOS Mail).
 *  - Brand-Header: dünner Akzent-Streifen + Wordmark "Spurig" in Brand-Farbe.
 *  - Generous spacing, lesbarer Body, klare Hierarchie.
 *  - 600px Container — Standard für transaktionale Mail.
 *
 * Verwendung:
 *   renderShell({ preheader, headerAccent, body: '<p>...</p>', footer: '...' })
 */

const SPURIG_TEAL = '#0e7c7b';
const SPURIG_TEAL_DARK = '#0a5e5d';
const SUPPORT_EMAIL = 'support@spurig.com';

export type ShellOptions = {
  /** Wird im Preview-Pane gezeigt (50-120 Zeichen). Wenn weggelassen: keiner. */
  preheader?: string;
  /** HTML-Body zwischen Header und Footer. Schon getrimmt + escaped. */
  body: string;
  /** Footer-Hinweis (z.B. "Activation-Mail #2 – einmalig am Trial-Tag 2."). */
  footer?: string;
  /** Akzentfarbe für den Header-Streifen. Default Spurig-Teal. */
  headerAccent?: string;
  /** Wenn true: Footer zeigt "Du bekommst diese Mail weil…" + Unsubscribe-Hinweis. */
  showUnsubscribeNote?: boolean;
};

export function renderShell(opts: ShellOptions): string {
  const accent = opts.headerAccent ?? SPURIG_TEAL;
  const preheaderHtml = opts.preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;color:transparent">${escapeHtml(opts.preheader)}</div>`
    : '';

  const unsubNote = opts.showUnsubscribeNote
    ? `<div style="margin-top:8px;font-size:11px;line-height:1.55;color:#9ca3af">
         Du bekommst diese Mail, weil du dich bei Spurig registriert hast.
         Wenn du keine erhalten möchtest, antworte einfach mit "Stopp".
       </div>`
    : '';

  const footerNote = opts.footer
    ? `<div style="font-size:11px;color:#9ca3af;line-height:1.55">${opts.footer}</div>`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>Spurig</title>
<style>
  @media (max-width: 600px) {
    .sp-card { border-radius: 0 !important; }
    .sp-content { padding: 24px 20px !important; }
    .sp-cta { display: block !important; width: 100% !important; box-sizing: border-box; text-align: center; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#18181b;-webkit-font-smoothing:antialiased">
${preheaderHtml}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f4f5">
  <tr>
    <td align="center" style="padding:32px 16px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%">

        <!-- Brand-Header über der Card (außerhalb, wie ein Watermark) -->
        <tr>
          <td style="padding:0 4px 18px">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td style="font-size:16px;font-weight:700;letter-spacing:-0.01em;color:#0e7c7b">
                  <span style="display:inline-block;vertical-align:middle;width:8px;height:8px;border-radius:50%;background:${accent};margin-right:8px"></span>Spurig
                </td>
                <td align="right" style="font-size:11px;color:#9ca3af;letter-spacing:0.04em;text-transform:uppercase">
                  Tracking Intelligence
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td class="sp-card" style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;box-shadow:0 1px 2px rgba(0,0,0,0.04);overflow:hidden">

            <!-- Akzent-Streifen oben -->
            <div style="height:4px;background:linear-gradient(90deg,${accent} 0%,${SPURIG_TEAL_DARK} 100%)"></div>

            <!-- Content -->
            <div class="sp-content" style="padding:36px 36px 28px;font-size:15px;line-height:1.65;color:#27272a">
              ${opts.body}
            </div>

            <!-- Card-Footer -->
            <div style="padding:18px 36px 24px;border-top:1px solid #f4f4f5;background:#fafafa;font-size:12px;line-height:1.6;color:#71717a">
              Fragen? Antworte einfach auf diese Mail oder schreib an
              <a href="mailto:${SUPPORT_EMAIL}" style="color:${accent};text-decoration:none;font-weight:500">${SUPPORT_EMAIL}</a>.
            </div>
          </td>
        </tr>

        <!-- Außen-Footer -->
        <tr>
          <td style="padding:22px 8px 0">
            ${footerNote}
            ${unsubNote}
            <div style="margin-top:10px;font-size:11px;color:#a1a1aa;line-height:1.55">
              DSG Studio · Rahel-Varnhagen-Promenade 2 · 10969 Berlin
            </div>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Shared UI-Bausteine (in body-Strings benutzbar)
// ---------------------------------------------------------------------------

/** Große Headline am Anfang eines Mail-Body. */
export function heading(title: string): string {
  return `<h1 style="margin:0 0 12px;font-size:24px;font-weight:600;letter-spacing:-0.015em;color:#18181b;line-height:1.25">${escapeHtml(title)}</h1>`;
}

/** Sub-Headline / Lead-Paragraph direkt unter dem Heading. */
export function lead(text: string): string {
  return `<p style="margin:0 0 24px;font-size:15px;line-height:1.65;color:#52525b">${escapeHtml(text)}</p>`;
}

/** Body-Paragraph mit Standard-Stil. */
export function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#27272a">${text}</p>`;
}

/** Hervorgehobener Info-Block (z.B. "14 Tage kostenlos"). */
export function callout(opts: {
  kicker?: string;
  title?: string;
  body: string;
  accent?: string;
}): string {
  const accent = opts.accent ?? SPURIG_TEAL;
  return `
<div style="margin:0 0 24px;padding:18px 20px;border-radius:12px;background:#f0fdfa;border:1px solid #ccfbf1">
  ${opts.kicker ? `<div style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:${accent};margin-bottom:6px">${escapeHtml(opts.kicker)}</div>` : ''}
  ${opts.title ? `<div style="font-size:15px;font-weight:600;color:#18181b;margin-bottom:6px">${escapeHtml(opts.title)}</div>` : ''}
  <div style="font-size:14px;line-height:1.6;color:#3f3f46">${opts.body}</div>
</div>`;
}

/** Numbered-Step-Block (1, 2, 3). */
export function steps(items: Array<{ title: string; body?: string }>): string {
  const rows = items.map((item, i) => `
  <tr>
    <td style="width:32px;padding:8px 0;vertical-align:top">
      <div style="width:26px;height:26px;border-radius:50%;background:#0e7c7b;color:#ffffff;font-size:12px;font-weight:600;text-align:center;line-height:26px">${i + 1}</div>
    </td>
    <td style="padding:8px 0 8px 14px;vertical-align:top">
      <div style="font-size:15px;font-weight:600;color:#18181b;line-height:1.4">${escapeHtml(item.title)}</div>
      ${item.body ? `<div style="font-size:14px;color:#52525b;line-height:1.6;margin-top:3px">${escapeHtml(item.body)}</div>` : ''}
    </td>
  </tr>`).join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;margin:0 0 24px">${rows}</table>`;
}

/** Primary-CTA-Button. Mobile-friendly via .sp-cta. */
export function button(label: string, href: string, accent?: string): string {
  const bg = accent ?? SPURIG_TEAL;
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px"><tr><td style="border-radius:10px;background:${bg}">
<a class="sp-cta" href="${href}" style="display:inline-block;padding:13px 26px;background:${bg};color:#ffffff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:-0.01em;line-height:1">${escapeHtml(label)} →</a>
</td></tr></table>`;
}

/** Secondary-Link unter dem Primary-CTA. */
export function secondaryLink(label: string, href: string, accent?: string): string {
  const color = accent ?? SPURIG_TEAL;
  return `<div style="margin:6px 0 24px;font-size:13px"><a href="${href}" style="color:${color};text-decoration:none">${escapeHtml(label)} →</a></div>`;
}

/** Definition-List Row (Label links, Value rechts) — für Admin-Notifications. */
export function row(label: string, value: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
<tr>
  <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:13px;color:#71717a;width:40%">${escapeHtml(label)}</td>
  <td style="padding:8px 0;border-bottom:1px solid #f4f4f5;font-size:14px;color:#18181b;font-weight:500;text-align:right">${escapeHtml(value)}</td>
</tr>
</table>`;
}

/** Small-Text-Note unter dem CTA (z.B. "PS: …"). */
export function note(text: string): string {
  return `<p style="margin:20px 0 0;font-size:13px;line-height:1.65;color:#71717a">${text}</p>`;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!),
  );
}

/**
 * Smart-Greeting: vermeidet "Hi yjd" bei kryptischen Usernamen.
 *
 * Regeln:
 *   - null oder leerer Username → "Hi"
 *   - Username sieht wie generierte ID aus (z.B. "u5188930189", "yjd",
 *     <4 Zeichen, viele Ziffern) → nur "Hi"
 *   - Sonst: "Hi {Username mit grossem Anfangsbuchstaben}"
 *
 * So bekommt der User entweder einen sympathischen "Hi" Gruß oder seinen
 * echten Namen — aber NIEMALS "Hi yjd" oder "Hi u5188930189".
 */
export function smartGreeting(username: string | null | undefined): string {
  if (!username) return 'Hi';
  const u = username.trim();
  if (u.length < 4) return 'Hi';
  if (/^u\d{6,}$/i.test(u)) return 'Hi'; // generated like "u5188930189"
  if (/\d{4,}/.test(u)) return 'Hi'; // 4+ digits in a row = probably ID
  if (/^[a-z]{1,3}$/i.test(u)) return 'Hi'; // 1-3 letters = probably initials/placeholder
  // Capitalize nur das erste Zeichen, Rest bleibt (case-preserving für leviett222 → Leviett222)
  return `Hi ${u.charAt(0).toUpperCase()}${u.slice(1)}`;
}
