import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ContentStatsClient } from './content-stats-client';

export const dynamic = 'force-dynamic';

export default async function AdminContentStatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/dashboard');

  return <ContentStatsClient />;
}
