import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logAudit } from '@/lib/audit';

export const dynamic = 'force-dynamic';

/**
 * DSGVO Art. 20 — Datenportabilität
 * Exportiert alle personenbezogenen Daten des eingeloggten Users als JSON.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Collect all user-associated data in parallel
  const [
    profileRes,
    campaignsRes,
    qrCodesRes,
    shortLinksRes,
    linkGroupsRes,
    reportSchedulesRes,
    customDomainsRes,
  ] = await Promise.all([
    supabase.from('profiles').select('id, email, username, display_name, role, created_at, updated_at').eq('id', user.id).single(),
    supabase.from('campaigns').select('id, name, slug, description, status, start_date, end_date, created_at').eq('owner_id', user.id).order('created_at', { ascending: false }),
    supabase.from('qr_codes').select('id, short_code, target_url, active, valid_from, valid_until, note, utm_source, utm_medium, utm_campaign, utm_content, created_at').eq('created_by', user.id).order('created_at', { ascending: false }),
    supabase.from('short_links').select('id, short_code, target_url, title, description, active, archived, expires_at, utm_source, utm_medium, utm_campaign, utm_content, click_count, created_at').eq('created_by', user.id).order('created_at', { ascending: false }),
    supabase.from('link_groups').select('id, name, slug, description, color, created_at').eq('created_by', user.id).order('created_at', { ascending: false }),
    supabase.from('report_schedules').select('id, email, frequency, active, last_sent_at, next_run_at, created_at, campaign:campaigns(name)').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('custom_domains').select('id, host, verified, verified_at, is_primary, created_at').eq('created_by', user.id).order('created_at', { ascending: false }),
  ]);

  // Placements have no created_by — fetch via user's campaign IDs
  const campaignIds = (campaignsRes.data || []).map((c: { id: string }) => c.id);
  const placementsRes = campaignIds.length > 0
    ? await supabase.from('placements').select('id, name, placement_code, placement_type, status, notes, installed_at, removed_at, created_at, campaign:campaigns(name), location:locations(venue_name, district)').in('campaign_id', campaignIds).order('created_at', { ascending: false })
    : { data: [] };

  const exportData = {
    export_info: {
      exported_at: new Date().toISOString(),
      format: 'JSON (DSGVO Art. 20 — Datenportabilität)',
      user_id: user.id,
    },
    profile: profileRes.data,
    campaigns: campaignsRes.data || [],
    placements: placementsRes.data || [],
    qr_codes: qrCodesRes.data || [],
    short_links: shortLinksRes.data || [],
    link_groups: linkGroupsRes.data || [],
    report_schedules: reportSchedulesRes.data || [],
    custom_domains: customDomainsRes.data || [],
  };

  // Audit log: track data export requests (DSGVO Art. 20)
  await logAudit({
    userId: user.id,
    action: 'data_export.requested',
  });

  const json = JSON.stringify(exportData, null, 2);
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(json, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': `attachment; filename="meine-daten-${date}.json"`,
    },
  });
}
