import { Suspense } from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getQrCode } from '../actions';
import { QrCodeDetail } from './qr-code-detail';
import { getSessionTier } from '@/lib/billing/gates';
import { EntityStatsHeader } from '@/components/shared/entity-stats-header';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QrCodeDetailPage({ params }: Props) {
  noStore();
  const { id } = await params;

  const [data, session] = await Promise.all([
    getQrCode(id).catch(() => null),
    getSessionTier(),
  ]);

  if (!data?.qrCode) {
    notFound();
  }

  return (
    <>
      <Suspense fallback={null}>
        <EntityStatsHeader scope={{ kind: 'qr_code', id }} label="QR-Code" />
      </Suspense>
      <QrCodeDetail
        qrCode={data.qrCode}
        history={data.history}
        redirectCount={data.redirectCount}
        redirectRules={data.redirectRules}
        abVariants={data.abVariants}
        userTier={session?.tier ?? 'expired'}
      />
    </>
  );
}
