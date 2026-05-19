import {
  renderShell,
  heading,
  paragraph,
  callout,
  steps,
  button,
  secondaryLink,
  smartGreeting,
  escapeHtml,
} from './shell';

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
  const greet = smartGreeting(data.username);
  const trialDate = formatDateDE(data.trialEndsAt);

  const trialCallout = trialDate
    ? callout({
        kicker: '14 Tage kostenlos',
        body: `Dein Testzeitraum endet am <strong style="color:#18181b">${escapeHtml(trialDate)}</strong>. Bis dahin nutzt du alle Funktionen ohne Limit — keine Kreditkarte hinterlegt.`,
      })
    : '';

  const body = [
    heading('Willkommen bei Spurig.'),
    paragraph(
      `${greet}, schön dass du da bist. Dein Konto ist bestätigt und startklar — `
      + `lass uns deinen ersten Tracking-Link in 60 Sekunden anlegen.`,
    ),
    trialCallout,
    `<h2 style="margin:24px 0 12px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#71717a">So legst du los</h2>`,
    steps([
      {
        title: 'Kampagne anlegen',
        body: 'Gib deiner ersten Kampagne einen Namen — etwa „Sommer-Aktion 2026".',
      },
      {
        title: 'QR-Code oder Tracking-Link erstellen',
        body: 'Zielseite eintragen — du bekommst einen kurzen Tracking-Link und einen QR-Code (PNG + SVG). Bereit für Print, Web und Mailings.',
      },
      {
        title: 'Scans und Klicks live verfolgen',
        body: 'Jeder QR-Scan und jeder Klick landet sofort im Dashboard — inklusive Gerät, Land und Zeitverlauf.',
      },
    ]),
    button('Zum Dashboard', data.dashboardUrl),
    secondaryLink('Oder direkt eine Kampagne anlegen', data.newCampaignUrl),
    paragraph(
      `<strong style="color:#18181b">Brauchst du eine Anleitung?</strong> Der `
      + `<a href="${data.dashboardUrl.replace('/dashboard', '/guide')}" style="color:#0e7c7b;text-decoration:none;font-weight:500">komplette Leitfaden</a> `
      + `zeigt dir alles in 30 Min — inklusive KI-Steuerung via API.`,
    ),
  ].join('\n');

  return renderShell({
    preheader: 'Willkommen bei Spurig — dein Konto ist startklar.',
    body,
    showUnsubscribeNote: false,
  });
}
