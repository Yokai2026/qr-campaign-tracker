'use server';

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import { campaignSchema } from '@/lib/validations';
import { revalidatePath } from 'next/cache';
import { logAudit } from '@/lib/audit';
import type { Campaign, CampaignInput, CampaignTag } from '@/types';

// ---------------------------------------------------------------------------
// Types for query results
// ---------------------------------------------------------------------------

export interface CampaignWithTagCount extends Campaign {
  tag_count: number;
}

export interface CampaignWithTags extends Campaign {
  campaign_tags: CampaignTag[];
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch all campaigns with their tag counts, ordered by updated_at desc. */
export async function getCampaigns(): Promise<CampaignWithTagCount[]> {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('campaigns')
    .select('*, campaign_tags(count)')
    .order('updated_at', { ascending: false });

  if (error) {
    throw new Error(`Kampagnen konnten nicht geladen werden: ${error.message}`);
  }

  // Supabase returns `campaign_tags: [{ count: n }]` when using select count
  return (data ?? []).map((row: Record<string, unknown>) => {
    const tags = row.campaign_tags as { count: number }[] | undefined;
    const { campaign_tags: _tags, ...campaign } = row;
    return {
      ...campaign,
      tag_count: tags?.[0]?.count ?? 0,
    } as CampaignWithTagCount;
  });
}

/** Fetch a single campaign by id including its tags. */
export async function getCampaign(id: string): Promise<CampaignWithTags | null> {
  await requireAuth();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('campaigns')
    .select('*, campaign_tags(*)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found
    throw new Error(`Kampagne konnte nicht geladen werden: ${error.message}`);
  }

  return data as CampaignWithTags;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** Create a new campaign with optional tags. Returns the created campaign id. */
export async function createCampaign(
  input: CampaignInput,
): Promise<{ id: string }> {
  const profile = await requireAuth();
  const parsed = campaignSchema.parse(input);
  const supabase = await createClient();

  const { tags, ...campaignData } = parsed;

  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      ...campaignData,
      description: campaignData.description || null,
      start_date: campaignData.start_date || null,
      end_date: campaignData.end_date || null,
      owner_id: profile.id,
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Kampagne konnte nicht erstellt werden: ${error.message}`);
  }

  // Insert tags if provided
  if (tags && tags.length > 0) {
    const tagRows = tags.map((tag) => ({
      campaign_id: data.id,
      tag: tag.trim(),
    }));

    const { error: tagError } = await supabase
      .from('campaign_tags')
      .insert(tagRows);

    if (tagError) {
      throw new Error(`Tags konnten nicht gespeichert werden: ${tagError.message}`);
    }
  }

  revalidatePath('/campaigns');
  return { id: data.id };
}

/** Update an existing campaign and replace its tags. */
export async function updateCampaign(
  id: string,
  input: CampaignInput,
): Promise<void> {
  await requireAuth();
  const parsed = campaignSchema.parse(input);
  const supabase = await createClient();

  const { tags, ...campaignData } = parsed;

  const { error } = await supabase
    .from('campaigns')
    .update({
      ...campaignData,
      description: campaignData.description || null,
      start_date: campaignData.start_date || null,
      end_date: campaignData.end_date || null,
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Kampagne konnte nicht aktualisiert werden: ${error.message}`);
  }

  // Replace tags: delete existing (service client to bypass admin-only DELETE policy), then insert new ones
  const serviceClient = await createServiceClient();

  const { error: deleteError } = await serviceClient
    .from('campaign_tags')
    .delete()
    .eq('campaign_id', id);

  if (deleteError) {
    throw new Error(`Tags konnten nicht aktualisiert werden: ${deleteError.message}`);
  }

  if (tags && tags.length > 0) {
    const tagRows = tags.map((tag) => ({
      campaign_id: id,
      tag: tag.trim(),
    }));

    const { error: tagError } = await serviceClient
      .from('campaign_tags')
      .insert(tagRows);

    if (tagError) {
      throw new Error(`Tags konnten nicht gespeichert werden: ${tagError.message}`);
    }
  }

  revalidatePath('/campaigns');
  revalidatePath(`/campaigns/${id}`);
}

/** Delete a campaign by id. */
export async function deleteCampaign(id: string): Promise<void> {
  const profile = await requireAuth();
  const supabase = await createServiceClient();

  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Kampagne konnte nicht gelöscht werden: ${error.message}`);
  }

  await logAudit({
    userId: profile.id,
    action: 'campaign.deleted',
    entityType: 'campaign',
    entityId: id,
  });

  revalidatePath('/campaigns');
}
