import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getShortLink } from '../actions';
import { getLinkRedirectRules } from '@/app/(dashboard)/qr-codes/redirect-rules-actions';
import { getSessionTier } from '@/lib/billing/gates';
import dynamic from 'next/dynamic';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { createClient } from '@/lib/supabase/server';
import type { AbVariant } from '@/types';

const LinkDetail = dynamic(() => import('./link-detail').then((m) => m.LinkDetail), {
  loading: () => <PageSkeleton />,
});

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LinkDetailPage({ params }: Props) {
  noStore();
  const { id } = await params;

  const [link, session] = await Promise.all([
    getShortLink(id),
    getSessionTier(),
  ]);

  if (!link) notFound();

  // Fetch redirect rules and AB variants for this link
  const supabase = await createClient();
  const [rulesResult, variantsResult] = await Promise.all([
    getLinkRedirectRules(id).catch(() => []),
    supabase
      .from('ab_variants')
      .select('*')
      .eq('short_link_id', id)
      .order('created_at', { ascending: true })
      .then(({ data }) => (data ?? []) as AbVariant[]),
  ]);

  return (
    <LinkDetail
      link={link}
      redirectRules={rulesResult}
      abVariants={variantsResult}
      userTier={session?.tier ?? 'expired'}
    />
  );
}
