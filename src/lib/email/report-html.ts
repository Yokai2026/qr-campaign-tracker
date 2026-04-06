type ReportData = {
  dateFrom: string;
  dateTo: string;
  campaignName: string | null;
  totalScans: number;
  uniqueVisitors: number;
  ctaClicks: number;
  formSubmits: number;
  topPlacements: { name: string; scans: number }[];
  topCountries: { name: string; scans: number }[];
};

const COUNTRY_NAMES: Record<string, string> = {
  DE: 'Deutschland', AT: 'Oesterreich', CH: 'Schweiz', NL: 'Niederlande',
  BE: 'Belgien', FR: 'Frankreich', GB: 'Grossbritannien', US: 'USA',
  PL: 'Polen', CZ: 'Tschechien', IT: 'Italien', ES: 'Spanien',
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code] || code;
}

export function buildReportHtml(data: ReportData): string {
  const conversionRate = data.totalScans > 0
    ? ((data.ctaClicks / data.totalScans) * 100).toFixed(1)
    : '0';

  const placementRows = data.topPlacements
    .slice(0, 5)
    .map((p) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${p.name}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-variant-numeric:tabular-nums">${p.scans}</td></tr>`)
    .join('');

  const countryRows = data.topCountries
    .slice(0, 5)
    .map((c) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee">${countryName(c.name)}</td><td style="padding:6px 12px;border-bottom:1px solid #eee;text-align:right;font-variant-numeric:tabular-nums">${c.scans}</td></tr>`)
    .join('');

  const scope = data.campaignName || 'Alle Kampagnen';

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:system-ui,-apple-system,sans-serif;color:#111">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;border:1px solid #e5e5e5;overflow:hidden">

  <div style="padding:24px 24px 16px;border-bottom:1px solid #eee">
    <h1 style="margin:0;font-size:18px;font-weight:600">Spurig Report</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#666">${scope} &middot; ${data.dateFrom} bis ${data.dateTo}</p>
  </div>

  <div style="padding:20px 24px">
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr>
        <td style="padding:8px 0;color:#666">Scans gesamt</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${data.totalScans}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666">Einzelne Besucher</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${data.uniqueVisitors}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666">Klicks auf Zielseite</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${data.ctaClicks}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666">Formulare</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${data.formSubmits}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666">Klickrate</td>
        <td style="padding:8px 0;text-align:right;font-weight:600">${conversionRate}%</td>
      </tr>
    </table>
  </div>

  ${placementRows ? `
  <div style="padding:0 24px 20px">
    <h2 style="margin:0 0 8px;font-size:14px;font-weight:600">Top-Platzierungen</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      ${placementRows}
    </table>
  </div>` : ''}

  ${countryRows ? `
  <div style="padding:0 24px 20px">
    <h2 style="margin:0 0 8px;font-size:14px;font-weight:600">Top-Laender</h2>
    <table style="width:100%;border-collapse:collapse;font-size:13px">
      ${countryRows}
    </table>
  </div>` : ''}

  <div style="padding:16px 24px;background:#f8f8f8;font-size:11px;color:#999;text-align:center">
    Automatisch generiert von Spurig
  </div>
</div>
</body></html>`;
}
