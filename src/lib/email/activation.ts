/**
 * Activation-Mail-Sequenz: Day 1 / Day 2 / Day 3 nach Signup.
 *
 * Ziel: User vom Signup zum Aha-Moment (erster getrackter Scan) bringen.
 * Laeuft PARALLEL zur Trial-Upsell-Sequenz (033) — Upsell ueberzeugt zur Zahlung,
 * Activation ueberzeugt vom Produkt.
 *
 * Resend mit Tracking, idempotent via profiles.activation_dN_sent_at.
 */

const RESEND_API = 'https://api.resend.com/emails';
const FROM =
  process.env.TRIAL_UPSELL_FROM_EMAIL ||
  process.env.OUTBOUND_FROM_EMAIL ||
  'David da Silva Gornik <david@hello.spurig.com>';
const REPLY_TO = process.env.OUTBOUND_REPLY_TO || 'david@spurig.com';
const BCC_TO = process.env.OUTBOUND_BCC_EMAIL || null;

export type ActivationStage = 'd1' | 'd2' | 'd3';

export type SendActivationInput = {
  to: string;
  username: string | null;
  stage: ActivationStage;
  /** Hat der User schon eine Kampagne? Steuert Day-2 / Day-3 Variation. */
  hasCampaign: boolean;
  /** Hat der User schon einen QR-Code? */
  hasQrCode: boolean;
  /** Hat der User schon einen ersten Scan? */
  hasScan: boolean;
};

export type SendActivationResult = {
  messageId: string;
  subject: string;
};

const DASHBOARD_URL = 'https://spurig.com/dashboard';
const CAMPAIGNS_NEW_URL = 'https://spurig.com/campaigns/new';
const QR_CODES_URL = 'https://spurig.com/qr-codes';
const GUIDE_URL = 'https://spurig.com/guide';

export async function sendActivation(
  input: SendActivationInput,
): Promise<SendActivationResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const tpl = buildTemplate(input);

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: [input.to],
      ...(BCC_TO ? { bcc: [BCC_TO] } : {}),
      reply_to: REPLY_TO,
      subject: tpl.subject,
      html: tpl.html,
      tags: [
        { name: 'type', value: 'activation' },
        { name: 'stage', value: input.stage },
      ],
      tracking: { opens: true, clicks: true },
    }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`Resend ${res.status}: ${errBody.slice(0, 200)}`);
  }

  const data = (await res.json()) as { id: string };
  return { messageId: data.id, subject: tpl.subject };
}

// ---------------------------------------------------------------------------

type Template = { subject: string; html: string };

function greeting(username: string | null): string {
  return username ? `Hi ${username}` : 'Hi';
}

const SHELL_OPEN = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e5e5">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">
    <div style="text-align:left;padding:0 8px 24px">
      <span style="display:inline-block;font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#fafafa">Spurig</span>
    </div>
    <div style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;overflow:hidden">
      <div style="padding:28px 28px 24px">`;

const SHELL_CLOSE = (footer: string) => `
      </div>
    </div>
    <p style="margin:24px 8px 0;font-size:11px;line-height:1.6;color:#525252">
      ${footer}<br />
      Fragen? Antworte einfach auf diese Mail oder schreib an
      <a href="mailto:support@spurig.com" style="color:#22d3ee;text-decoration:none">support@spurig.com</a>.
    </p>
  </div>
</body>
</html>`;

function buildTemplate(input: SendActivationInput): Template {
  switch (input.stage) {
    case 'd1':
      return buildDay1(input);
    case 'd2':
      return buildDay2(input);
    case 'd3':
      return buildDay3(input);
  }
}

function buildDay1(input: SendActivationInput): Template {
  const subject = 'Dein erster QR-Code in 60 Sekunden';
  const html = `${SHELL_OPEN}
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#fafafa">
          ${greeting(input.username)}, willkommen bei Spurig.
        </h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          Schoen dass du da bist. Damit du den Wert von Spurig sofort siehst, lass uns deinen ersten QR-Code anlegen — dauert keine Minute.
        </p>

        <div style="margin:0 0 20px;padding:16px;border-radius:10px;background:#0f1f22;border:1px solid #1f3f44">
          <div style="font-size:11px;color:#22d3ee;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">3 Schritte</div>
          <ol style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:#e5e5e5">
            <li><strong style="color:#fafafa">Kampagne anlegen</strong> &mdash; zum Beispiel "Plakate Berlin".</li>
            <li><strong style="color:#fafafa">QR-Code generieren</strong> &mdash; verlinkt auf eine beliebige URL.</li>
            <li><strong style="color:#fafafa">Mit Handy testen</strong> &mdash; und du siehst den Scan live im Dashboard.</li>
          </ol>
        </div>

        <a href="${CAMPAIGNS_NEW_URL}" style="display:inline-block;padding:11px 20px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
          Jetzt erste Kampagne anlegen &rarr;
        </a>

        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#737373">
          Stecken geblieben? Antworte auf diese Mail — ich richte dir die ersten Codes persoenlich ein. Kein Bot, kein Support-Ticket.
        </p>
${SHELL_CLOSE('Du bekommst diese Mail einmalig am Anfang deines Spurig-Trials.')}`;
  return { subject, html };
}

function buildDay2(input: SendActivationInput): Template {
  const noQr = !input.hasQrCode;
  const subject = noQr
    ? 'Dein Spurig-Account wartet auf den ersten QR-Code'
    : 'Hier sind deine ersten Scans — wenn du dich selbst scannst';

  if (noQr) {
    const html = `${SHELL_OPEN}
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#fafafa">
          ${greeting(input.username)}, einfacher als gedacht.
        </h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          Du hast Spurig gestern angelegt, aber noch keinen QR-Code generiert. Falls du dir unsicher bist wo anfangen — hier der schnellste Weg:
        </p>

        <div style="margin:0 0 20px;padding:16px;border-radius:10px;background:#171717;border:1px solid #262626">
          <div style="font-size:14px;line-height:1.7;color:#e5e5e5">
            <strong style="color:#fafafa">Tipp:</strong> Du brauchst noch keine fertige Kampagne. Leg einen Code an der auf deine
            Webseite oder Instagram-Profil zeigt &mdash; du kannst das Ziel jederzeit aendern, ohne den QR neu drucken zu muessen.
          </div>
        </div>

        <a href="${CAMPAIGNS_NEW_URL}" style="display:inline-block;padding:11px 20px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
          Ersten QR-Code anlegen &rarr;
        </a>

        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#737373">
          Wenn du anders helfen willst &mdash; antworte einfach auf diese Mail. Ich richte dir das Setup live ein.
        </p>
${SHELL_CLOSE('Activation-Mail #2 &mdash; einmalig am Trial-Tag 2.')}`;
    return { subject, html };
  }

  const html = `${SHELL_OPEN}
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#fafafa">
          ${greeting(input.username)}, Spurig wartet auf deinen ersten Scan.
        </h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          QR-Code ist generiert &mdash; perfekt. Jetzt der wichtige Schritt: einmal selbst scannen. Du siehst dann in Echtzeit:
        </p>

        <ul style="margin:0 0 20px;padding-left:18px;font-size:14px;line-height:1.7;color:#e5e5e5">
          <li><strong style="color:#fafafa">Geraet</strong> (iOS/Android), <strong style="color:#fafafa">Browser</strong>, ungefaehrer <strong style="color:#fafafa">Standort</strong></li>
          <li><strong style="color:#fafafa">Zeitstempel</strong> auf die Sekunde genau</li>
          <li><strong style="color:#fafafa">Klick</strong> auf das Ziel inkl. UTM-Attribution</li>
        </ul>

        <a href="${QR_CODES_URL}" style="display:inline-block;padding:11px 20px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
          Zu meinen QR-Codes &rarr;
        </a>

        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#737373">
          PS: Test-Scans kannst du im Dashboard als "Test" markieren oder spaeter ignorieren &mdash; die zaehlen nicht zur echten Reichweite.
        </p>
${SHELL_CLOSE('Activation-Mail #2 &mdash; einmalig am Trial-Tag 2.')}`;
  return { subject, html };
}

function buildDay3(input: SendActivationInput): Template {
  const noScan = !input.hasScan;
  const subject = noScan
    ? 'Brauchst du Hilfe mit deinem Spurig-Setup?'
    : 'Jetzt richtig setzen: ein Code pro Platzierung';

  if (noScan) {
    const html = `${SHELL_OPEN}
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#fafafa">
          ${greeting(input.username)}, woran liegt's?
        </h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          Drei Tage Trial &mdash; aber noch kein Scan im Account. Das ist meistens einer von zwei Gruenden, und beides ist in 5 Minuten geloest:
        </p>

        <div style="margin:0 0 12px;padding:16px;border-radius:10px;background:#171717;border:1px solid #262626">
          <div style="font-size:13px;color:#22d3ee;font-weight:600;margin-bottom:4px">1. Unklar wo anfangen</div>
          <div style="font-size:13.5px;line-height:1.6;color:#e5e5e5">
            Schau dir den Setup-Guide an &mdash; 4 Minuten Lesezeit, danach hast du das Grundgeruest.
          </div>
        </div>

        <div style="margin:0 0 20px;padding:16px;border-radius:10px;background:#171717;border:1px solid #262626">
          <div style="font-size:13px;color:#22d3ee;font-weight:600;margin-bottom:4px">2. Use-Case unklar</div>
          <div style="font-size:13.5px;line-height:1.6;color:#e5e5e5">
            Antworte auf diese Mail mit "was machst du?" &mdash; ich sag dir wo Spurig fuer deinen Fall den groessten Hebel hat.
          </div>
        </div>

        <a href="${GUIDE_URL}" style="display:inline-block;padding:11px 20px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
          Setup-Guide oeffnen &rarr;
        </a>
${SHELL_CLOSE('Activation-Mail #3 &mdash; einmalig am Trial-Tag 3.')}`;
    return { subject, html };
  }

  const html = `${SHELL_OPEN}
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#fafafa">
          ${greeting(input.username)}, du hast den ersten Scan!
        </h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          Top &mdash; das ist der Moment in dem Spurig fuer dich anfaengt zu arbeiten. Jetzt der Move der echte Insights bringt:
        </p>

        <div style="margin:0 0 20px;padding:16px;border-radius:10px;background:#0f1f22;border:1px solid #1f3f44">
          <div style="font-size:11px;color:#22d3ee;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">Profi-Setup</div>
          <div style="font-size:14px;line-height:1.6;color:#e5e5e5">
            <strong style="color:#fafafa">Ein QR-Code pro Platzierung</strong> &mdash; nicht einer pro Kampagne.
            Bei 10 Plakaten = 10 Codes. So siehst du am Ende der Woche welcher Standort wirklich liefert und welcher Werbeplatz Geld verbrennt.
          </div>
        </div>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          Bulk-Import via CSV hilft &mdash; 100 Codes in einer Minute. Im Dashboard unter "Platzierungen" &rarr; "CSV importieren".
        </p>

        <a href="${DASHBOARD_URL}" style="display:inline-block;padding:11px 20px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
          Zum Dashboard &rarr;
        </a>
${SHELL_CLOSE('Activation-Mail #3 &mdash; einmalig am Trial-Tag 3.')}`;
  return { subject, html };
}
