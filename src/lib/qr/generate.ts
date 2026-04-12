import QRCode from 'qrcode';

export interface QrGenerateOptions {
  fgColor?: string;
  bgColor?: string;
}

export interface QrGenerateResult {
  pngDataUrl: string;
  svgString: string;
}

export async function generateQrCode(
  url: string,
  opts?: QrGenerateOptions,
): Promise<QrGenerateResult> {
  const fgColor = opts?.fgColor || '#000000';
  const bgColor = opts?.bgColor || '#FFFFFF';

  // Detect transparent background (8-char hex ending in 00 alpha)
  const isTransparent = /^#[0-9A-Fa-f]{6}00$/.test(bgColor);

  const options = {
    errorCorrectionLevel: 'M' as const,
    margin: 2,
    width: 400,
    color: {
      dark: fgColor,
      light: isTransparent ? '#00000000' : bgColor,
    },
  };

  const [pngDataUrl, svgStringRaw] = await Promise.all([
    QRCode.toDataURL(url, { ...options, type: 'image/png' }),
    QRCode.toString(url, { ...options, type: 'svg' }),
  ]);

  // For SVG: remove the background <path> when transparent so the QR sits on
  // any surface without a filled rectangle underneath.
  const svgString = isTransparent
    ? svgStringRaw.replace(/<path[^>]*fill="#00000000"[^/]*\/>/g, '')
    : svgStringRaw;

  return { pngDataUrl, svgString };
}

export function buildRedirectUrl(baseUrl: string, shortCode: string): string {
  return `${baseUrl}/r/${shortCode}`;
}

export function buildTargetUrlWithUtm(
  targetUrl: string,
  params: {
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
    utm_content?: string;
    utm_id?: string;
  }
): string {
  const url = new URL(targetUrl);
  if (params.utm_source) url.searchParams.set('utm_source', params.utm_source);
  if (params.utm_medium) url.searchParams.set('utm_medium', params.utm_medium);
  if (params.utm_campaign) url.searchParams.set('utm_campaign', params.utm_campaign);
  if (params.utm_content) url.searchParams.set('utm_content', params.utm_content);
  if (params.utm_id) url.searchParams.set('utm_id', params.utm_id);
  return url.toString();
}
