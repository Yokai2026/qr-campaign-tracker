import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SalesAgentClient } from './sales-agent-client';

export const dynamic = 'force-dynamic';

export default async function AdminSalesAgentPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (profile?.role !== 'admin') redirect('/dashboard');

  return <SalesAgentClient />;
}
