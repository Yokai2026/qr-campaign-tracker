import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/auth';
import dynamic from 'next/dynamic';
import { PageSkeleton } from '@/components/shared/loading-skeleton';

const AnalyticsClient = dynamic(() => import('./analytics-client').then((m) => m.AnalyticsClient), {
  loading: () => <PageSkeleton />,
});

export default async function AnalyticsPage() {
  noStore();
  await requireAuth();
  const supabase = await createClient();

  // Fetch filter options
  const [
    { data: campaigns },
    { data: districts },
  ] = await Promise.all([
    supabase.from('campaigns').select('id, name').order('name'),
    supabase.from('locations').select('district').not('district', 'is', null).order('district'),
  ]);

  const uniqueDistricts = [...new Set((districts || []).map((d: { district: string }) => d.district).filter(Boolean))];

  return (
    <AnalyticsClient
      campaigns={campaigns || []}
      districts={uniqueDistricts as string[]}
    />
  );
}
