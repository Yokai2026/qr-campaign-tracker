import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { DmStatus } from '@/lib/outbound/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALLOWED_STATUS: DmStatus[] = ['pending', 'ready', 'sent', 'replied', 'skipped'];

/**
 * PATCH /api/admin/linkedin-dms/update
 * Body: { leadId, dm_status?, linkedin_url?, linkedin_first_name?, dm_opener? }
 *
 * Editiert DM-State eines einzelnen Leads. Setzt dm_sent_at/dm_replied_at automatisch
 * wenn dm_status auf 'sent'/'replied' wechselt.
 */
export async function PATCH(request: NextRequest) {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const leadId = typeof body.leadId === 'string' ? body.leadId : null;
  if (!leadId) return NextResponse.json({ error: 'leadId required' }, { status: 400 });

  const updates: Record<string, unknown> = {};
  if (typeof body.dm_status === 'string' && ALLOWED_STATUS.includes(body.dm_status as DmStatus)) {
    updates.dm_status = body.dm_status;
    if (body.dm_status === 'sent') updates.dm_sent_at = new Date().toISOString();
    if (body.dm_status === 'replied') {
      updates.dm_replied_at = new Date().toISOString();
      // bei replied auch das lead-status auf replied setzen
      updates.status = 'replied';
      updates.replied_at = new Date().toISOString();
    }
  }
  if (typeof body.linkedin_url === 'string') updates.linkedin_url = body.linkedin_url || null;
  if (typeof body.linkedin_first_name === 'string') updates.linkedin_first_name = body.linkedin_first_name || null;
  if (typeof body.dm_opener === 'string') {
    updates.dm_opener = body.dm_opener;
    updates.dm_opener_model = 'manual';
    updates.dm_opener_generated_at = new Date().toISOString();
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'nothing to update' }, { status: 400 });
  }

  const service = await createServiceClient();
  const { error } = await service.from('outbound_leads').update(updates).eq('id', leadId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, updated: updates });
}
