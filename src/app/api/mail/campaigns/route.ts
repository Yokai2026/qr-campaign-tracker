/**
 * Mail-Campaigns API.
 *
 * GET  /api/mail/campaigns       — Liste eigener Campaigns
 * POST /api/mail/campaigns       — Neue Campaign anlegen (status=draft)
 *
 * MVP: User muss authentifiziert sein. Spaeter: Multi-Tenant ueber user_id.
 * Initialer Roll-out nur fuer admin-User (Feature-Flag via UI-Sidebar).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_BODY_SIZE = 200_000; // 200KB HTML max

export async function GET() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const service = await createServiceClient();
  const { data, error } = await service
    .from('mail_campaigns')
    .select('id, subject, status, sent_at, recipient_count, open_count, human_open_count, click_count, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaigns: data ?? [] });
}

export async function POST(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: {
    subject?: string;
    body_html?: string;
    body_text?: string;
    from_email?: string;
    from_name?: string;
    reply_to?: string;
  };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid-json' }, { status: 400 }); }

  const subject = (body.subject ?? '').trim();
  const bodyHtml = (body.body_html ?? '').trim();
  if (!subject || subject.length > 200) {
    return NextResponse.json({ error: 'subject required (max 200 chars)' }, { status: 400 });
  }
  if (!bodyHtml || bodyHtml.length > MAX_BODY_SIZE) {
    return NextResponse.json({ error: `body_html required (max ${MAX_BODY_SIZE} chars)` }, { status: 400 });
  }

  const service = await createServiceClient();
  const { data, error } = await service
    .from('mail_campaigns')
    .insert({
      user_id: user.id,
      subject,
      body_html: bodyHtml,
      body_text: body.body_text ?? null,
      from_email: body.from_email ?? 'david@spurig.com',
      from_name: body.from_name ?? 'David',
      reply_to: body.reply_to ?? null,
      status: 'draft',
    })
    .select('id, subject, status, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ campaign: data });
}
