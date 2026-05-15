import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { SEGMENT_CONFIGS } from '@/lib/outbound/segments';
import type { LeadStatus, OutboundSegment } from '@/lib/outbound/types';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requireAdmin() {
  const sb = await createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return null;
  const { data: profile } = await sb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  return profile?.role === 'admin' ? user : null;
}

/**
 * GET /api/admin/outbound/leads?segment=&status=&hasEmail=&hasWebsite=&limit=&offset=
 */
export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const params = request.nextUrl.searchParams;
  const segment = params.get('segment') as OutboundSegment | null;
  // Multi-Status: kommagetrennte Liste ("new,contacted,replied"). Einzelner Wert
  // weiter unterstuetzt (legacy + Backwards-compat).
  const statusParam = params.get('status');
  const statuses: LeadStatus[] | null = statusParam
    ? (statusParam.split(',').map((s) => s.trim()).filter(Boolean) as LeadStatus[])
    : null;
  const hasEmail = params.get('hasEmail');
  const hasWebsite = params.get('hasWebsite');
  // Suche: ILIKE auf name, email, city — case-insensitive. Wird serverseitig
  // ausgewertet, damit auch Leads ausserhalb der ersten Seite gefunden werden.
  const q = params.get('q')?.trim() ?? '';
  const limit = Math.min(parseInt(params.get('limit') ?? '50', 10), 200);
  const offset = parseInt(params.get('offset') ?? '0', 10);

  if (segment && !SEGMENT_CONFIGS[segment]) {
    return NextResponse.json({ error: `Unknown segment: ${segment}` }, { status: 400 });
  }

  const sb = await createServiceClient();
  // Sort: zuerst angeschriebene/replied (juengstes contacted_at oben),
  // dann neu gescrapte. So sieht der Admin Engagement-Leads sofort.
  let query = sb
    .from('outbound_leads')
    .select('*', { count: 'exact' })
    .order('contacted_at', { ascending: false, nullsFirst: false })
    .order('scraped_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (segment) query = query.eq('segment', segment);
  if (statuses && statuses.length > 0) {
    if (statuses.length === 1) query = query.eq('status', statuses[0]);
    else query = query.in('status', statuses);
  }
  if (hasEmail === 'true') query = query.not('email', 'is', null);
  if (hasEmail === 'false') query = query.is('email', null);
  if (hasWebsite === 'true') query = query.not('website', 'is', null);
  if (hasWebsite === 'false') query = query.is('website', null);
  if (q) {
    // PostgREST ".or" mit ILIKE — Suche in name/email/city
    const escaped = q.replace(/[%,]/g, ' ');
    query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,city.ilike.%${escaped}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Stats parallel
  const { data: statsRaw } = await sb
    .from('outbound_leads')
    .select('segment, status, email_status');

  const stats = aggregateStats(statsRaw ?? []);

  return NextResponse.json({
    leads: data ?? [],
    total: count ?? 0,
    limit,
    offset,
    stats,
  });
}

function aggregateStats(
  rows: Array<{ segment: string; status: string; email_status: string }>,
) {
  const bySegment: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  const byEmailStatus: Record<string, number> = {};
  for (const r of rows) {
    bySegment[r.segment] = (bySegment[r.segment] ?? 0) + 1;
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    byEmailStatus[r.email_status] = (byEmailStatus[r.email_status] ?? 0) + 1;
  }
  return { total: rows.length, bySegment, byStatus, byEmailStatus };
}
