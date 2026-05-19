/**
 * Activation-Mail-Sequenz: Day 1 / Day 2 / Day 3 nach Signup.
 *
 * Ziel: User vom Signup zum Aha-Moment (erster getrackter Scan) bringen.
 * Laeuft PARALLEL zur Trial-Upsell-Sequenz (033) — Upsell ueberzeugt zur Zahlung,
 * Activation ueberzeugt vom Produkt.
 *
 * Resend mit Tracking, idempotent via profiles.activation_dN_sent_at.
 */

import {
  renderShell,
  heading,
  paragraph,
  callout,
  button,
  note,
  smartGreeting,
} from './shell';

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
  const greet = smartGreeting(input.username);
  const body = [
    heading(`${greet}, willkommen bei Spurig.`),
    paragraph(
      'Schön, dass du da bist. Damit du den Wert von Spurig sofort siehst, lass uns deinen ersten QR-Code anlegen — dauert keine Minute.',
    ),
    callout({
      kicker: '3 Schritte',
      body: `
<ol style="margin:0;padding-left:18px;font-size:14px;line-height:1.75;color:#27272a">
  <li><strong style="color:#18181b">Kampagne anlegen</strong> — zum Beispiel „Plakate Berlin".</li>
  <li><strong style="color:#18181b">QR-Code generieren</strong> — verlinkt auf eine beliebige URL.</li>
  <li><strong style="color:#18181b">Mit Handy testen</strong> — und du siehst den Scan live im Dashboard.</li>
</ol>`,
    }),
    button('Jetzt erste Kampagne anlegen', CAMPAIGNS_NEW_URL),
    note(
      'Stecken geblieben? Antworte einfach auf diese Mail — ich richte dir die ersten Codes persönlich ein. Kein Bot, kein Support-Ticket.',
    ),
  ].join('\n');

  const html = renderShell({
    preheader: 'Lass uns deinen ersten Tracking-QR-Code anlegen — dauert keine Minute.',
    body,
    footer: 'Activation-Mail #1 — einmalig am Anfang deines Spurig-Trials.',
    showUnsubscribeNote: true,
  });
  return { subject, html };
}

function buildDay2(input: SendActivationInput): Template {
  const noQr = !input.hasQrCode;
  const subject = noQr
    ? 'Dein Spurig-Account wartet auf den ersten QR-Code'
    : 'Hier sind deine ersten Scans — wenn du dich selbst scannst';
  const greet = smartGreeting(input.username);

  if (noQr) {
    const body = [
      heading(`${greet}, einfacher als gedacht.`),
      paragraph(
        'Du hast Spurig gestern angelegt, aber noch keinen QR-Code generiert. Falls du dir unsicher bist wo anfangen — hier der schnellste Weg:',
      ),
      callout({
        title: 'Tipp',
        body:
          'Du brauchst noch keine fertige Kampagne. Leg einen Code an, der auf deine '
          + 'Webseite oder Instagram-Profil zeigt — du kannst das Ziel jederzeit '
          + 'ändern, ohne den QR neu drucken zu müssen.',
      }),
      button('Ersten QR-Code anlegen', CAMPAIGNS_NEW_URL),
      note(
        'Wenn du lieber anders Hilfe willst — antworte einfach auf diese Mail. Ich richte dir das Setup live ein.',
      ),
    ].join('\n');

    const html = renderShell({
      preheader: 'Einen QR-Code anlegen geht schneller als gedacht.',
      body,
      footer: 'Activation-Mail #2 — einmalig am Trial-Tag 2.',
      showUnsubscribeNote: true,
    });
    return { subject, html };
  }

  const body = [
    heading(`${greet}, Spurig wartet auf deinen ersten Scan.`),
    paragraph(
      'QR-Code ist generiert — perfekt. Jetzt der wichtige Schritt: einmal selbst scannen. Du siehst dann in Echtzeit:',
    ),
    `<ul style="margin:0 0 24px;padding-left:18px;font-size:15px;line-height:1.75;color:#27272a">
  <li><strong style="color:#18181b">Gerät</strong> (iOS / Android), <strong style="color:#18181b">Browser</strong>, ungefährer <strong style="color:#18181b">Standort</strong></li>
  <li><strong style="color:#18181b">Zeitstempel</strong> auf die Sekunde genau</li>
  <li><strong style="color:#18181b">Klick</strong> auf das Ziel inkl. UTM-Attribution</li>
</ul>`,
    button('Zu meinen QR-Codes', QR_CODES_URL),
    note(
      'PS: Test-Scans kannst du im Dashboard als „Test" markieren oder später ignorieren — die zählen nicht zur echten Reichweite.',
    ),
  ].join('\n');

  const html = renderShell({
    preheader: 'Ein Scan, und du siehst was Spurig wirklich kann.',
    body,
    footer: 'Activation-Mail #2 — einmalig am Trial-Tag 2.',
    showUnsubscribeNote: true,
  });
  return { subject, html };
}

function buildDay3(input: SendActivationInput): Template {
  const noScan = !input.hasScan;
  const subject = noScan
    ? 'Brauchst du Hilfe mit deinem Spurig-Setup?'
    : 'Jetzt richtig setzen: ein Code pro Platzierung';
  const greet = smartGreeting(input.username);

  if (noScan) {
    const body = [
      heading(`${greet}, woran liegt's?`),
      paragraph(
        'Drei Tage Trial — aber noch kein Scan im Account. Das ist meistens einer von zwei Gründen, und beides ist in 5 Minuten gelöst:',
      ),
      callout({
        kicker: '1. Unklar wo anfangen',
        body: 'Schau dir den Setup-Guide an — 4 Minuten Lesezeit, danach hast du das Grundgerüst.',
      }),
      callout({
        kicker: '2. Use-Case unklar',
        body:
          'Antworte auf diese Mail mit „was machst du?" — ich sag dir wo Spurig für '
          + 'deinen Fall den größten Hebel hat.',
      }),
      button('Setup-Guide öffnen', GUIDE_URL),
    ].join('\n');

    const html = renderShell({
      preheader: 'Hängst du beim Setup? Hier sind die zwei häufigsten Gründe.',
      body,
      footer: 'Activation-Mail #3 — einmalig am Trial-Tag 3.',
      showUnsubscribeNote: true,
    });
    return { subject, html };
  }

  const body = [
    heading(`${greet}, du hast den ersten Scan!`),
    paragraph(
      'Top — das ist der Moment, in dem Spurig für dich anfängt zu arbeiten. Jetzt der Move, der echte Insights bringt:',
    ),
    callout({
      kicker: 'Profi-Setup',
      body:
        '<strong style="color:#18181b">Ein QR-Code pro Platzierung</strong> — nicht einer pro Kampagne. '
        + 'Bei 10 Plakaten = 10 Codes. So siehst du am Ende der Woche, welcher Standort wirklich '
        + 'liefert und welcher Werbeplatz Geld verbrennt.',
    }),
    paragraph(
      'Bulk-Import via CSV hilft — 100 Codes in einer Minute. Im Dashboard unter „Platzierungen" → „CSV importieren".',
    ),
    button('Zum Dashboard', DASHBOARD_URL),
  ].join('\n');

  const html = renderShell({
    preheader: 'Ein Code pro Platzierung — so kommen die echten Insights.',
    body,
    footer: 'Activation-Mail #3 — einmalig am Trial-Tag 3.',
    showUnsubscribeNote: true,
  });
  return { subject, html };
}
