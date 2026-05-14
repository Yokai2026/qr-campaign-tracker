/**
 * Batch-Email-Discovery: nimmt unbearbeitete Leads aus Supabase, crawlt deren Websites,
 * speichert die beste gefundene Email zurück.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { discoverEmailsForWebsite } from './email-discovery';

export type DiscoveryBatchResult = {
  processed: number;
  withEmail: number;
  withoutEmail: number;
  errors: number;
  durationMs: number;
};

export async function discoverEmailsForLeadBatch(
  options: { limit?: number; segment?: string } = {},
): Promise<DiscoveryBatchResult> {
  const startedAt = Date.now();
  const sb = await createServiceClient();
  const limit = options.limit ?? 25;

  let query = sb
    .from('outbound_leads')
    .select('id, website, name')
    .eq('email_status', 'unknown')
    .not('website', 'is', null)
    .order('scraped_at', { ascending: false })
    .limit(limit);

  if (options.segment) query = query.eq('segment', options.segment);

  const { data: leads, error } = await query;
  if (error) {
    throw new Error('Failed to fetch leads: ' + error.message);
  }

  let processed = 0;
  let withEmail = 0;
  let withoutEmail = 0;
  let errors = 0;

  // Sequential crawling — kein Burst, keine Rate-Limit-Issues bei den gecrawlten Sites
  for (const lead of leads ?? []) {
    if (!lead.website) continue;
    processed++;

    try {
      const result = await discoverEmailsForWebsite(lead.website);
      const best = result.emails[0]; // Höchste Priorität (sortiert)

      if (best) {
        withEmail++;
        await sb
          .from('outbound_leads')
          .update({
            email: best.email,
            email_status: 'discovered',
            email_source:
              best.priority === 'personal'
                ? 'website_personal'
                : best.priority === 'role'
                  ? 'website_role'
                  : 'website_generic',
          })
          .eq('id', lead.id);
      } else {
        withoutEmail++;
        await sb
          .from('outbound_leads')
          .update({
            email_status: result.error ? 'invalid' : 'unknown',
            email_source: result.error ? null : 'website_no_match',
          })
          .eq('id', lead.id);
      }
    } catch {
      errors++;
    }
  }

  return {
    processed,
    withEmail,
    withoutEmail,
    errors,
    durationMs: Date.now() - startedAt,
  };
}
