import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

type PdfReportData = {
  dateFrom: string;
  dateTo: string;
  kpis: {
    totalOpens: number;
    qrScans: number;
    linkClicks: number;
    uniqueScans: number;
    uniqueQrCodes: number;
    ctaClicks: number;
    formSubmits: number;
  };
  campaignData: { name: string; opens: number }[];
  placementData: { name: string; location: string; opens: number }[];
  deviceData: { name: string; value: number }[];
  countryData: { name: string; value: number }[];
};

export function generateAnalyticsPdf(data: PdfReportData) {
  const doc = new jsPDF();
  const conversionRate = data.kpis.totalOpens > 0
    ? ((data.kpis.ctaClicks / data.kpis.totalOpens) * 100).toFixed(1)
    : '0';

  // Title
  doc.setFontSize(18);
  doc.text('Spurig — Bericht', 14, 20);
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Zeitraum: ${data.dateFrom} bis ${data.dateTo}`, 14, 28);
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 14, 34);

  // KPIs
  doc.setFontSize(13);
  doc.setTextColor(0);
  doc.text('Kennzahlen', 14, 46);

  autoTable(doc, {
    startY: 50,
    head: [['Metrik', 'Wert']],
    body: [
      ['Aufrufe gesamt', String(data.kpis.totalOpens)],
      ['  davon QR-Scans', String(data.kpis.qrScans)],
      ['  davon Link-Klicks', String(data.kpis.linkClicks)],
      ['Einzelne Besucher', String(data.kpis.uniqueScans)],
      ['Verwendete QR-Codes', String(data.kpis.uniqueQrCodes)],
      ['Zielseite erreicht', String(data.kpis.ctaClicks)],
      ['Formulare abgeschickt', String(data.kpis.formSubmits)],
      ['Abschlussrate', `${conversionRate}%`],
    ],
    theme: 'striped',
    headStyles: { fillColor: [30, 30, 30] },
    styles: { fontSize: 9 },
  });

  // Campaigns
  if (data.campaignData.length > 0) {
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.text('Scans pro Kampagne', 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [['Kampagne', 'Scans']],
      body: data.campaignData.map((c) => [c.name, String(c.opens)]),
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 30] },
      styles: { fontSize: 9 },
    });
  }

  // Top Placements
  if (data.placementData.length > 0) {
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    doc.setFontSize(13);
    doc.text('Top-Platzierungen', 14, y);

    autoTable(doc, {
      startY: y + 4,
      head: [['#', 'Platzierung', 'Standort', 'Scans']],
      body: data.placementData.map((p, i) => [String(i + 1), p.name, p.location, String(p.opens)]),
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 30] },
      styles: { fontSize: 9 },
    });
  }

  // Devices
  if (data.deviceData.length > 0) {
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

    if (y > 250) doc.addPage();
    const startY = y > 250 ? 20 : y;

    doc.setFontSize(13);
    doc.text('Geraetetypen', 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Geraet', 'Scans', 'Anteil']],
      body: data.deviceData.map((d) => {
        const total = data.deviceData.reduce((s, x) => s + x.value, 0);
        return [d.name, String(d.value), `${((d.value / total) * 100).toFixed(1)}%`];
      }),
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 30] },
      styles: { fontSize: 9 },
    });
  }

  // Countries
  if (data.countryData.length > 0) {
    const y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

    if (y > 250) doc.addPage();
    const startY = y > 250 ? 20 : y;

    doc.setFontSize(13);
    doc.text('Scans nach Land', 14, startY);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Land', 'Scans', 'Anteil']],
      body: data.countryData.map((c) => {
        const total = data.countryData.reduce((s, x) => s + x.value, 0);
        return [c.name, String(c.value), `${((c.value / total) * 100).toFixed(1)}%`];
      }),
      theme: 'striped',
      headStyles: { fillColor: [30, 30, 30] },
      styles: { fontSize: 9 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Seite ${i} von ${pageCount} — Spurig`, 14, 290);
  }

  doc.save(`qr-bericht-${data.dateFrom}-${data.dateTo}.pdf`);
}
