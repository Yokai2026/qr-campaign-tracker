import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/admin/outbound/backfill
 *
 * Backfilled outbound_messages aus Resend-API. Holt fuer jede Message mit
 * sent_at IS NOT NULL aber delivered_at IS NULL den aktuellen Status von
 * Resend und setzt delivered_at / opened_at / bounced_at / etc nach.
 *
 * Nuetzlich nach Webhook-Setup-Luecken oder Webhook-Outages.
 */
export async function POST() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'RESEND_API_KEY not set' }, { status: 500 });

  const service = await createServiceClient();
  const { data: msgs, error } = await service
    .from('outbound_messages')
    .select('id, resend_message_id, sent_at')
    .not('resend_message_id', 'is', null)
    .not('sent_at', 'is', null)
    .is('delivered_at', null)
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!msgs?.length) return NextResponse.json({ checked: 0, updated: 0 });

  let updated = 0;
  const errors: string[] = [];

  for (const m of msgs) {
    try {
      const res = await fetch(`https://api.resend.com/emails/${m.resend_message_id}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!res.ok) {
        errors.push(`${m.resend_message_id?.slice(0, 8)}: ${res.status}`);
        continue;
      }
      const data = (await res.json()) as { last_event?: string; created_at?: string };
      const last = data.last_event;
      const createdAt = data.created_at ?? new Date().toISOString();

      const patch: Record<string, unknown> = {};
      if (last === 'delivered' || last === 'opened' || last === 'clicked') {
        patch.delivered_at = createdAt;
        patch.status = last;
      } else if (last === 'bounced' || last === 'complained') {
        patch.status = last;
        patch[`${last}_at`] = createdAt;
      } else {
        continue;
      }

      const { error: upErr } = await service.from('outbound_messages').update(patch).eq('id', m.id);
      if (upErr) errors.push(`${m.id}: ${upErr.message}`);
      else updated++;
    } catch (e) {
      errors.push(`${m.id}: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }

  return NextResponse.json({ checked: msgs.length, updated, errors: errors.slice(0, 5) });
}
