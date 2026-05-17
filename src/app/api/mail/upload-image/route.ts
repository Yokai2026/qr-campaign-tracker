import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const EXT_FROM_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

/**
 * POST /api/mail/upload-image
 * multipart/form-data: file
 *
 * Lädt ein Bild in den 'mail-images' Storage-Bucket und gibt Public-URL zurück.
 * Admin-only (Mail-Tracking ist admin-only Beta).
 */
export async function POST(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase());
  const isAdmin = adminEmails.includes(user.email?.toLowerCase() ?? '');
  if (!isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'no_file' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'file_too_large', max_bytes: MAX_BYTES }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'unsupported_mime', allowed: Array.from(ALLOWED_MIME) }, { status: 400 });
  }

  const ext = EXT_FROM_MIME[file.type];
  const path = `${user.id}/${Date.now()}-${nanoid(10)}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const service = await createServiceClient();
  const { error: upErr } = await service.storage
    .from('mail-images')
    .upload(path, buf, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  const { data: publicUrl } = service.storage.from('mail-images').getPublicUrl(path);

  return NextResponse.json({
    ok: true,
    url: publicUrl.publicUrl,
    path,
    size: file.size,
  });
}
