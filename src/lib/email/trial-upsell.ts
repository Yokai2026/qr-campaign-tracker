/**
 * Trial-Upsell Sequenz: Day 3 / Day 7 / Day 12.
 *
 * Direkter Resend-Versand mit Open/Click-Tracking. Domain hello.spurig.com.
 * Aufruf aus /api/cron/trial-reminders, idempotent via profiles.trial_upsell_dN_sent_at.
 */

const RESEND_API = 'https://api.resend.com/emails';
const FROM =
  process.env.TRIAL_UPSELL_FROM_EMAIL ||
  process.env.OUTBOUND_FROM_EMAIL ||
  'David da Silva Gornik <david@hello.spurig.com>';
const REPLY_TO = process.env.OUTBOUND_REPLY_TO || 'david@spurig.com';
const BCC_TO = process.env.OUTBOUND_BCC_EMAIL || null;

export type TrialUpsellStage = 'd3' | 'd7' | 'd12';

export type SendTrialUpsellInput = {
  to: string;
  username: string | null;
  stage: TrialUpsellStage;
  trialEndsAt: string | null;
};

export type SendTrialUpsellResult = {
  messageId: string;
  subject: string;
};

const PRICING_URL = 'https://spurig.com/settings';
const DASHBOARD_URL = 'https://spurig.com/campaigns';
const BLOG_URL = 'https://spurig.com/blog';

export async function sendTrialUpsell(
  input: SendTrialUpsellInput,
): Promise<SendTrialUpsellResult> {
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
        { name: 'type', value: 'trial_upsell' },
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
// Templates
// ---------------------------------------------------------------------------

type Template = { subject: string; html: string };

function buildTemplate(input: SendTrialUpsellInput): Template {
  switch (input.stage) {
    case 'd3':
      return buildDay3(input);
    case 'd7':
      return buildDay7(input);
    case 'd12':
      return buildDay12(input);
  }
}

function greeting(username: string | null): string {
  return username ? `Hi ${username}` : 'Hi';
}

function formatDateDe(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long' });
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

function buildDay3(input: SendTrialUpsellInput): Template {
  const subject = '3 Tage Spurig — die eine Funktion die fast keiner kennt';
  const html = `${SHELL_OPEN}
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#fafafa">
          ${greeting(input.username)}, du bist jetzt drei Tage dabei.
        </h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          Schoen dass du Spurig ausprobierst. Damit du den vollen Wert siehst, hier ein Profi-Tipp den die meisten am Anfang uebersehen.
        </p>

        <div style="margin:0 0 20px;padding:16px;border-radius:10px;background:#0f1f22;border:1px solid #1f3f44">
          <div style="font-size:11px;color:#22d3ee;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">Tipp #1 — Platzierungs-IDs</div>
          <div style="font-size:14px;line-height:1.6;color:#e5e5e5">
            Erstelle <strong style="color:#fafafa">pro Plakatwand einen eigenen QR-Code</strong> &mdash; nicht einen pro Kampagne.
            So siehst du am Ende der Woche welcher Standort wirklich performt und welcher Werbeplatz Geld verbrennt.
          </div>
        </div>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          User die Codes pro Platzierung anlegen, identifizieren im Schnitt
          <strong style="color:#fafafa">3-5 schwache Standorte pro Kampagne</strong>.
          Das spart bei der naechsten Buchung mehr als ein Jahres-Abo Spurig.
        </p>

        <a href="${DASHBOARD_URL}" style="display:inline-block;padding:11px 20px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
          Neue Platzierung anlegen &rarr;
        </a>

        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#737373">
          PS: Wenn du Hilfe beim Setup willst, antworte einfach auf diese Mail. Ich richte dir die ersten Codes selbst ein.
        </p>
${SHELL_CLOSE('Du bekommst diese Mail einmalig waehrend deines Spurig-Trials.')}`;
  return { subject, html };
}

function buildDay7(input: SendTrialUpsellInput): Template {
  const subject = 'Halbzeit deines Trials — so nutzen andere Spurig';
  const html = `${SHELL_OPEN}
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#fafafa">
          ${greeting(input.username)}, Halbzeit.
        </h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          Eine Woche dein Spurig-Trial laeuft. Damit du den Rest besser nutzt, hier wie andere Spurig wirklich einsetzen.
        </p>

        <div style="margin:0 0 16px;padding:16px;border-radius:10px;background:#171717;border:1px solid #262626">
          <div style="font-size:11px;color:#a3a3a3;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">Restaurant in Muenchen</div>
          <div style="font-size:14px;line-height:1.6;color:#e5e5e5;margin-bottom:8px">
            QR auf Tischaufstellern, Speisekarte, Eingangstuer. Nach 30 Tagen: <strong style="color:#22d3ee">247 Scans</strong> nur ueber Tisch 5.
            Eingangstuer-Code: 11 Scans. Speisekarte abgeschafft, Aufsteller verdoppelt.
          </div>
        </div>

        <div style="margin:0 0 16px;padding:16px;border-radius:10px;background:#171717;border:1px solid #262626">
          <div style="font-size:11px;color:#a3a3a3;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">Friseur-Salon, Berlin</div>
          <div style="font-size:14px;line-height:1.6;color:#e5e5e5">
            Flyer-Aktion mit 3 Stadtteilen, je eigener QR. Stadtteil A: <strong style="color:#22d3ee">38 Scans</strong>. B: 4. C: 1.
            Nachste Flyer-Bestellung: 100% Stadtteil A. Streuverlust eliminiert.
          </div>
        </div>

        <div style="margin:0 0 20px;padding:16px;border-radius:10px;background:#171717;border:1px solid #262626">
          <div style="font-size:11px;color:#a3a3a3;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">Marketing-Agentur Hamburg</div>
          <div style="font-size:14px;line-height:1.6;color:#e5e5e5">
            Kunden-Reporting per CSV-Export aus Spurig. Klare ROI-Zahl statt "wir haben Reichweite generiert".
            Drei Kunden-Pitches gewonnen mit Spurig-Daten als Beweis-Material.
          </div>
        </div>

        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          Was haben sie gemeinsam? <strong style="color:#fafafa">Mehrere Codes statt einer.</strong>
          Genau das schaltest du in deinem Account in 2 Minuten frei.
        </p>

        <a href="${DASHBOARD_URL}" style="display:inline-block;padding:11px 20px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
          Codes & Platzierungen ansehen &rarr;
        </a>

        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#737373">
          Mehr Use-Cases im <a href="${BLOG_URL}" style="color:#22d3ee;text-decoration:none">Spurig-Blog</a>.
        </p>
${SHELL_CLOSE('Halbzeit-Mail deines Spurig-Trials.')}`;
  return { subject, html };
}

function buildDay12(input: SendTrialUpsellInput): Template {
  const trialDate = formatDateDe(input.trialEndsAt);
  const subject = trialDate
    ? `Noch 2 Tage Trial — sicher dir 5,99 € statt 12,99 € (gilt nur bis ${trialDate})`
    : 'Noch 2 Tage Trial — sicher dir 5,99 € statt 12,99 €';
  const html = `${SHELL_OPEN}
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#fafafa">
          ${greeting(input.username)}, noch 2 Tage.
        </h1>
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#a3a3a3">
          ${trialDate ? `Dein Trial endet am <strong style="color:#fafafa">${trialDate}</strong>. ` : ''}Damit du den Sprung nicht teurer machst als noetig: bis Trial-Ende kriegst du das Neukunden-Angebot.
        </p>

        <div style="margin:0 0 20px;padding:18px;border-radius:12px;background:linear-gradient(135deg,#0f1f22,#1a1029);border:1px solid #2a3a40">
          <div style="font-size:11px;color:#22d3ee;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:6px">Neukunden-Angebot</div>
          <div style="font-size:26px;font-weight:700;color:#fff;line-height:1.2;margin-bottom:4px">
            5,99 € / Monat
            <span style="font-size:14px;color:#737373;font-weight:400;text-decoration:line-through;margin-left:6px">12,99 €</span>
          </div>
          <div style="font-size:12px;color:#a3a3a3">Erste 3 Monate &middot; automatischer Coupon &middot; jederzeit kuendbar</div>
        </div>

        <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:#a3a3a3">Was du behaeltst:</p>
        <ul style="margin:0 0 20px;padding-left:18px;font-size:14px;line-height:1.8;color:#e5e5e5">
          <li>Alle bestehenden QR-Codes & Kurzlinks bleiben aktiv</li>
          <li>Komplettes Tracking ohne Limit</li>
          <li>CSV-Export, API-Zugang, Custom-Domain</li>
        </ul>

        <a href="${PRICING_URL}" style="display:inline-block;padding:12px 22px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px">
          Jetzt 5,99 € sichern &rarr;
        </a>

        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#737373">
          Nach Trial-Ende: 12,99 €/Monat regulaer. Wer jetzt locked, spart 84 € im Jahr.
        </p>
${SHELL_CLOSE('Last-Call-Mail deines Spurig-Trials.')}`;
  return { subject, html };
}
