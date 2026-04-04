import { NextRequest, NextResponse } from 'next/server';
import { generateQrCode } from '@/lib/qr/generate';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');
  const format = request.nextUrl.searchParams.get('format') || 'png';

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  const fg = request.nextUrl.searchParams.get('fg') || undefined;
  const bg = request.nextUrl.searchParams.get('bg') || undefined;
  const { pngDataUrl, svgString } = await generateQrCode(url, { fgColor: fg, bgColor: bg });

  if (format === 'svg') {
    return new NextResponse(svgString, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  }

  // Convert data URL to buffer for PNG
  const base64 = pngDataUrl.split(',')[1];
  const buffer = Buffer.from(base64, 'base64');

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
