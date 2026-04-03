/**
 * Client-side helpers for downloading QR code images from data URLs.
 */

/**
 * Trigger a browser download from a data URL string.
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download a QR code PNG image.
 */
export function downloadQrPng(pngDataUrl: string, shortCode: string): void {
  downloadDataUrl(pngDataUrl, `qr-${shortCode}.png`);
}

/**
 * Download a QR code SVG image.
 * Handles both raw SVG data URLs (base64-encoded) and plain SVG strings.
 */
export function downloadQrSvg(svgDataUrl: string, shortCode: string): void {
  downloadDataUrl(svgDataUrl, `qr-${shortCode}.svg`);
}
