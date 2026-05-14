import { createServiceClient } from '@/lib/supabase/server';
import { searchPlaces } from './places';
import { rotateSearchQueries, SEGMENT_CONFIGS } from './segments';
import type { OutboundSegment } from './types';

export type ScrapeRunResult = {
  segment: OutboundSegment;
  queries: string[];
  found: number;
  inserted: number;
  duplicates: number;
  errors: Array<{ query: string; message: string }>;
};

export async function scrapeSegment(
  segment: OutboundSegment,
  options: { queriesPerRun?: number; maxPerQuery?: number; date?: Date } = {},
): Promise<ScrapeRunResult> {
  const queries = rotateSearchQueries(segment, options.date, options.queriesPerRun ?? 3);
  const sb = await createServiceClient();

  let found = 0;
  let inserted = 0;
  let duplicates = 0;
  const errors: Array<{ query: string; message: string }> = [];

  for (const query of queries) {
    try {
      const results = await searchPlaces(query, { maxResults: options.maxPerQuery ?? 20 });
      found += results.length;

      if (results.length === 0) continue;

      const rows = results.map((r) => ({
        source: 'google_places' as const,
        source_id: r.place_id,
        segment,
        query,
        name: r.name,
        industry: r.industry,
        address: r.address,
        city: r.city,
        region: r.region,
        country: r.country,
        phone: r.phone,
        website: r.website,
        rating: r.rating,
        rating_count: r.rating_count,
        status: 'new' as const,
        email_status: 'unknown' as const,
      }));

      const { data, error } = await sb
        .from('outbound_leads')
        .upsert(rows, {
          onConflict: 'source,source_id',
          ignoreDuplicates: true,
        })
        .select('id');

      if (error) {
        errors.push({ query, message: error.message });
        continue;
      }

      const insertedThisQuery = data?.length ?? 0;
      inserted += insertedThisQuery;
      duplicates += rows.length - insertedThisQuery;
    } catch (e) {
      errors.push({ query, message: e instanceof Error ? e.message : 'unknown' });
    }
  }

  return { segment, queries, found, inserted, duplicates, errors };
}

export async function scrapeAllSegments(
  options: { queriesPerRun?: number; maxPerQuery?: number; date?: Date } = {},
): Promise<ScrapeRunResult[]> {
  const segments = Object.keys(SEGMENT_CONFIGS) as OutboundSegment[];
  const results: ScrapeRunResult[] = [];

  for (const seg of segments) {
    const r = await scrapeSegment(seg, options);
    results.push(r);
  }

  return results;
}
