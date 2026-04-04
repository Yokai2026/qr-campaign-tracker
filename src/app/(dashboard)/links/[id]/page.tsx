import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getShortLink } from '../actions';
import { LinkDetail } from './link-detail';

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
