import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getCampaign } from '../actions';
import { CampaignDetailClient } from './campaign-detail-client';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { EntityStatsHeader } from '@/components/shared/entity-stats-header';

interface CampaignStats {
  placementCount: number;
  qrCodeCount: number;
  totalScans: number;
}

/** Fetch aggregated stats for a campaign. */
async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
  const supabase = await createClient();

  // Placement count
  const { count: placementCount } = await supabase
    .from('placements')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId);

  // QR code count via placements
  const { data: placements } = await supabase
    .from('placements')
    .select('id')
    .eq('campaign_id', campaignId);

  const placementIds = (placements ?? []).map((p: { id: string }) => p.id);

  let qrCodeCount = 0;
  let totalScans = 0;

  if (placementIds.length > 0) {
    const { count: qrCount } = await supabase
      .from('qr_codes')
      .select('*', { count: 'exact', head: true })
      .in('placement_id', placementIds);

    qrCodeCount = qrCount ?? 0;

    // Total redirect events (scans) for this campaign
    const { count: scanCount } = await supabase
      .from('redirect_events')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId);

    totalScans = scanCount ?? 0;
  }

  return {
    placementCount: placementCount ?? 0,
    qrCodeCount,
    totalScans,
  };
}

/** Fetch placements linked to a campaign. */
async function getCampaignPlacements(campaignId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('placements')
    .select('*, location:locations(*)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Platzierungen konnten nicht geladen werden: ${error.message}`);
  }

  return data ?? [];
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  noStore();
  await requireAuth();
  const { id } = await params;

  const campaign = await getCampaign(id);

  if (!campaign) {
    notFound();
  }

  const [stats, placements] = await Promise.all([
    getCampaignStats(id),
    getCampaignPlacements(id),
  ]);

  return (
    <>
      <Suspense fallback={null}>
        <EntityStatsHeader scope={{ kind: 'campaign', id }} label="Kampagne" />
      </Suspense>
      <CampaignDetailClient
        campaign={campaign}
        stats={stats}
        placements={placements}
      />
    </>
  );
}
