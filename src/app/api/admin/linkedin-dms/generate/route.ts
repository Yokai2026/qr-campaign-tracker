import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { generateDmOpener } from '@/lib/outbound/dm-generator';
import type { OutboundLead } from '@/lib/outbound/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Bulk-Generate DM-Opener fuer Leads.
 * Zielgruppe: status='new' oder 'contacted' (Replies/Bounces ausgeschlossen),
 * dm_opener IS NULL. Limit pro Aufruf via body.batchSize (default 10).
 *
 * Auth: nur Admin.
 */
export async function POST(request: NextRequest) {
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

  let batchSize = 10;
  let leadIds: string[] | null = null;
  try {
    const body = await request.json();
    if (typeof body?.batchSize === 'number') batchSize = Math.min(50, Math.max(1, body.batchSize));
    if (Array.isArray(body?.leadIds)) leadIds = body.leadIds.filter((x: unknown) => typeof x === 'string');
  } catch {
    // body optional
  }

  const service = await createServiceClient();
  let query = service
    .from('outbound_leads')
    .select('*')
    .in('status', ['new', 'contacted'])
    .is('dm_opener', null);

  if (leadIds && leadIds.length > 0) {
    query = service.from('outbound_leads').select('*').in('id', leadIds);
  } else {
    query = query.limit(batchSize);
  }

  const { data: leads, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!leads || leads.length === 0) return NextResponse.json({ generated: 0 });

  let generated = 0;
  const errors: string[] = [];

  for (const lead of leads as OutboundLead[]) {
    const firstName = lead.linkedin_first_name ?? null;
    try {
      const opener = await generateDmOpener(lead, firstName);
      await service
        .from('outbound_leads')
        .update({
          dm_opener: opener.text,
          dm_opener_model: opener.model,
          dm_opener_generated_at: new Date().toISOString(),
          dm_status: 'ready',
        })
        .eq('id', lead.id);
      generated++;
    } catch (e) {
      errors.push(`${lead.id}: ${e instanceof Error ? e.message : 'unknown'}`);
    }
  }

  return NextResponse.json({ generated, total: leads.length, errors });
}
