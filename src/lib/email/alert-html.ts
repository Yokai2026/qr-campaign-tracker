type AlertData = {
  metricLabel: string;
  currentValue: number;
  threshold: number;
  campaignName: string | null;
  dashboardUrl: string;
};

export function buildAlertHtml(data: AlertData): string {
  const scope = data.campaignName || 'Alle Kampagnen';

  return `<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:system-ui,-apple-system,sans-serif;color:#111">
<div style="max-width:560px;margin:24px auto;background:#fff;border-radius:8px;border:1px solid #e5e5e5;overflow:hidden">

  <div style="padding:24px 24px 16px;border-bottom:1px solid #eee">
    <h1 style="margin:0;font-size:18px;font-weight:600">Scan-Alert ausgeloest</h1>
    <p style="margin:4px 0 0;font-size:13px;color:#666">${scope}</p>
  </div>

  <div style="padding:20px 24px">
    <p style="margin:0 0 16px;font-size:14px;line-height:1.5">
      Dein Schwellwert fuer <strong>${data.metricLabel}</strong> wurde erreicht.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px">
      <tr>
        <td style="padding:8px 0;color:#666">Schwellwert</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${data.threshold.toLocaleString('de-DE')}</td>
      </tr>
      <tr>
        <td style="padding:8px 0;color:#666">Aktueller Wert</td>
        <td style="padding:8px 0;text-align:right;font-weight:600;font-variant-numeric:tabular-nums">${data.currentValue.toLocaleString('de-DE')}</td>
      </tr>
    </table>
    <div style="margin-top:20px;text-align:center">
      <a href="${data.dashboardUrl}" style="display:inline-block;padding:10px 24px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500">Zum Dashboard</a>
    </div>
  </div>

  <div style="padding:16px 24px;background:#f8f8f8;font-size:11px;color:#999;text-align:center">
    Automatisch generiert von Spurig &middot; Du kannst diesen Alert in den Einstellungen deaktivieren.
  </div>
</div>
</body></html>`;
}
