type WelcomeData = {
  username: string | null;
  trialEndsAt: string | null;
  dashboardUrl: string;
  newCampaignUrl: string;
  pricingUrl: string;
  supportEmail: string;
};

function formatDateDE(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

export function buildWelcomeHtml(data: WelcomeData): string {
  const greetingName = data.username ? `Hi ${data.username},` : 'Hi,';
  const trialDate = formatDateDE(data.trialEndsAt);

  const trialBlock = trialDate
    ? `
      <div style="margin:0 0 24px;padding:14px 16px;border-radius:10px;background:#0f1f22;border:1px solid #1f3f44">
        <div style="font-size:12px;color:#22d3ee;font-weight:600;letter-spacing:0.02em;text-transform:uppercase">14 Tage kostenlos</div>
        <div style="margin-top:4px;font-size:14px;color:#e5e5e5;line-height:1.5">
          Dein Testzeitraum endet am <strong style="color:#fafafa">${trialDate}</strong>. Bis dahin nutzt du alle Funktionen ohne Limit.
        </div>
      </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Willkommen bei Spurig</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#e5e5e5">
  <div style="max-width:560px;margin:0 auto;padding:32px 16px">

    <div style="text-align:left;padding:0 8px 24px">
      <span style="display:inline-block;font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#fafafa">Spurig</span>
    </div>

    <div style="background:#111111;border:1px solid #1f1f1f;border-radius:14px;overflow:hidden">

      <div style="padding:28px 28px 8px">
        <h1 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.01em;color:#fafafa">Willkommen bei Spurig.</h1>
        <p style="margin:8px 0 0;font-size:14px;line-height:1.6;color:#a3a3a3">
          ${greetingName} sch&ouml;n dass du da bist. Dein Konto ist best&auml;tigt und startklar.
        </p>
      </div>

      <div style="padding:24px 28px 8px">
        ${trialBlock}

        <h2 style="margin:0 0 12px;font-size:13px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#a3a3a3">So legst du los</h2>

        <table style="width:100%;border-collapse:collapse;margin-bottom:8px" cellpadding="0" cellspacing="0">
          <tr>
            <td style="width:32px;padding:10px 0;vertical-align:top">
              <div style="width:24px;height:24px;border-radius:50%;background:#0f1f22;border:1px solid #1f3f44;color:#22d3ee;font-size:12px;font-weight:600;text-align:center;line-height:23px">1</div>
            </td>
            <td style="padding:10px 0 10px 12px;vertical-align:top">
              <div style="font-size:14px;font-weight:600;color:#fafafa;line-height:1.4">Kampagne anlegen</div>
              <div style="font-size:13px;color:#a3a3a3;line-height:1.55;margin-top:2px">Gib deiner ersten Kampagne einen Namen &mdash; etwa &bdquo;Sommer-Aktion 2026&ldquo;.</div>
            </td>
          </tr>
          <tr>
            <td style="width:32px;padding:10px 0;vertical-align:top">
              <div style="width:24px;height:24px;border-radius:50%;background:#0f1f22;border:1px solid #1f3f44;color:#22d3ee;font-size:12px;font-weight:600;text-align:center;line-height:23px">2</div>
            </td>
            <td style="padding:10px 0 10px 12px;vertical-align:top">
              <div style="font-size:14px;font-weight:600;color:#fafafa;line-height:1.4">QR-Code generieren</div>
              <div style="font-size:13px;color:#a3a3a3;line-height:1.55;margin-top:2px">Zielseite eintragen, PNG oder SVG runterladen &mdash; bereit f&uuml;r Print oder Web.</div>
            </td>
          </tr>
          <tr>
            <td style="width:32px;padding:10px 0;vertical-align:top">
              <div style="width:24px;height:24px;border-radius:50%;background:#0f1f22;border:1px solid #1f3f44;color:#22d3ee;font-size:12px;font-weight:600;text-align:center;line-height:23px">3</div>
            </td>
            <td style="padding:10px 0 10px 12px;vertical-align:top">
              <div style="font-size:14px;font-weight:600;color:#fafafa;line-height:1.4">Scans live verfolgen</div>
              <div style="font-size:13px;color:#a3a3a3;line-height:1.55;margin-top:2px">Jeder Scan landet sofort im Dashboard. Inklusive Ger&auml;t, Land und Zeitverlauf.</div>
            </td>
          </tr>
        </table>
      </div>

      <div style="padding:8px 28px 28px;text-align:center">
        <a href="${data.dashboardUrl}" style="display:inline-block;padding:12px 28px;background:#22d3ee;color:#0a0a0a;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:-0.01em">Zum Dashboard</a>
        <div style="margin-top:10px">
          <a href="${data.newCampaignUrl}" style="font-size:12px;color:#a3a3a3;text-decoration:none">Oder direkt eine Kampagne anlegen &rarr;</a>
        </div>
      </div>

      <div style="padding:20px 28px;border-top:1px solid #1f1f1f;background:#0d0d0d">
        <div style="font-size:13px;color:#a3a3a3;line-height:1.6">
          <strong style="color:#e5e5e5">Fragen?</strong> Schreib uns einfach an
          <a href="mailto:${data.supportEmail}" style="color:#22d3ee;text-decoration:none">${data.supportEmail}</a>
          &mdash; wir antworten meist innerhalb eines Werktages.
        </div>
      </div>

    </div>

    <div style="padding:20px 8px;text-align:center;font-size:11px;color:#525252;line-height:1.6">
      Du erh&auml;ltst diese Mail, weil du dich bei Spurig registriert hast.<br>
      <a href="${data.pricingUrl}" style="color:#737373;text-decoration:none">Tarife ansehen</a>
      &middot;
      DSG Studio &middot; Rahel-Varnhagen-Promenade 2 &middot; 10969 Berlin
    </div>

  </div>
</body>
</html>`;
}
