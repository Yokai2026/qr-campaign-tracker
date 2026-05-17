import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { nanoid } from 'nanoid';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB pro Datei
const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'text/plain',
  'text/csv',
]);

const EXT_FROM_MIME: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'text/plain': 'txt',
  'text/csv': 'csv',
};

/**
 * POST /api/mail/upload-attachment
 * multipart/form-data: file
 *
 * Lädt eine Datei in den privaten 'mail-attachments' Storage-Bucket.
 * Gibt Path zurück — der Inhalt wird beim Send-Request via Service-Role aus
 * dem Bucket geladen und an Resend übergeben.
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
    return NextResponse.json({
      error: 'unsupported_type',
      detected: file.type,
      allowed: 'PDF, Word, Excel, PowerPoint, Bilder (PNG/JPG/GIF/WebP/SVG), TXT, CSV',
    }, { status: 400 });
  }

  // Sanitisierte Dateiname für Display (nicht für Path — der bleibt mit nanoid)
  const safeFilename = file.name
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 100);

  const ext = EXT_FROM_MIME[file.type];
  const path = `${user.id}/${Date.now()}-${nanoid(10)}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const service = await createServiceClient();
  const { error: upErr } = await service.storage
    .from('mail-attachments')
    .upload(path, buf, {
      contentType: file.type,
      cacheControl: '31536000',
      upsert: false,
    });
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    path,
    filename: safeFilename || `datei.${ext}`,
    size: file.size,
    content_type: file.type,
  });
}
