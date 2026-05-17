/**
 * GET    /api/mail/campaigns/[id] — Detail mit aggregierten Stats + Recipients-Liste
 * PATCH  /api/mail/campaigns/[id] — Draft editieren (subject, body)
 * DELETE /api/mail/campaigns/[id] — Soft-Delete (nur drafts)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const service = await createServiceClient();
  const { data: campaign, error } = await service
    .from('mail_campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!campaign) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const [{ data: recipients }, { data: links }] = await Promise.all([
    service
      .from('mail_recipients')
      .select('id, email, name, status, sent_at, first_open_at, last_open_at, open_count, human_open_count, click_count, first_click_at')
      .eq('campaign_id', id)
      .order('email', { ascending: true }),
    service
      .from('mail_links')
      .select('id, original_url, click_count, unique_click_count')
      .eq('campaign_id', id)
      .order('click_count', { ascending: false }),
  ]);

  return NextResponse.json({
    campaign,
    recipients: recipients ?? [],
    links: links ?? [],
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let body: { subject?: string; body_html?: string; from_email?: string; from_name?: string; reply_to?: string };
  try { body = await request.json(); } catch { return NextResponse.json({ error: 'invalid-json' }, { status: 400 }); }

  const service = await createServiceClient();
  // Nur drafts editierbar
  const { data: existing } = await service
    .from('mail_campaigns')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.status !== 'draft') {
    return NextResponse.json({ error: 'only drafts editable' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (typeof body.subject === 'string' && body.subject.trim()) updates.subject = body.subject.trim();
  if (typeof body.body_html === 'string' && body.body_html.trim()) updates.body_html = body.body_html.trim();
  if (typeof body.from_email === 'string') updates.from_email = body.from_email;
  if (typeof body.from_name === 'string') updates.from_name = body.from_name;
  if (typeof body.reply_to === 'string') updates.reply_to = body.reply_to;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const { error } = await service.from('mail_campaigns').update(updates).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const service = await createServiceClient();
  // Nur drafts loeschbar (sent-Mails behalten als History)
  const { data: existing } = await service
    .from('mail_campaigns')
    .select('id, status')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (!existing) return NextResponse.json({ error: 'not found' }, { status: 404 });
  if (existing.status !== 'draft') {
    return NextResponse.json({ error: 'cannot delete sent campaigns' }, { status: 400 });
  }
  const { error } = await service.from('mail_campaigns').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
