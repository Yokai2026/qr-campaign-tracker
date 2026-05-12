import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { apiError, serviceRoleClient } from '@/lib/api/auth';
import { authAndRateLimit } from '@/lib/api/rate-limit';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

// Liefert das PNG live generiert. Code wird aus DB geladen, wir bauen
// die /r/{short_code}-URL als Inhalt und encoden sie mit den
// User-spezifischen Farben/Sizes.
export async function GET(req: NextRequest, { params }: Ctx) {
  const auth = await authAndRateLimit(req);
  if (auth instanceof Response) return auth;
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const size = Math.min(2048, Math.max(64, parseInt(searchParams.get('size') || '512', 10)));

  const sb = serviceRoleClient();
  const { data: qr } = await sb
    .from('qr_codes')
    .select('short_code, qr_fg_color, qr_bg_color, short_host')
    .eq('id', id)
    .eq('created_by', auth.userId)
    .maybeSingle();
  if (!qr) return apiError(404, 'QR-Code not found');

  const host = qr.short_host || process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || 'spurig.com';
  const url = `https://${host}/r/${qr.short_code}`;

  const png = await QRCode.toBuffer(url, {
    type: 'png',
    width: size,
    errorCorrectionLevel: 'M',
    color: {
      dark: qr.qr_fg_color || '#000000',
      light: qr.qr_bg_color || '#FFFFFF',
    },
  });

  return new NextResponse(new Uint8Array(png), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'private, no-store',
      'Content-Disposition': `inline; filename="${qr.short_code}.png"`,
    },
  });
}
