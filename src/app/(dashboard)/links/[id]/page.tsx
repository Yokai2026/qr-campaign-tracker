import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getShortLink } from '../actions';
import dynamic from 'next/dynamic';
import { PageSkeleton } from '@/components/shared/loading-skeleton';

const LinkDetail = dynamic(() => import('./link-detail').then((m) => m.LinkDetail), {
  loading: () => <PageSkeleton />,
});

type Props = {
  params: Promise<{ id: string }>;
};

export default async function LinkDetailPage({ params }: Props) {
  noStore();
  const { id } = await params;
  const link = await getShortLink(id);

  if (!link) notFound();

  return <LinkDetail link={link} />;
}
