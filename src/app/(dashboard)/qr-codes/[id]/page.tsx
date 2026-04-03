import { unstable_noStore as noStore } from 'next/cache';
import { notFound } from 'next/navigation';
import { getQrCode } from '../actions';
import { QrCodeDetail } from './qr-code-detail';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function QrCodeDetailPage({ params }: Props) {
  noStore();
  const { id } = await params;

  let data;
  try {
    data = await getQrCode(id);
  } catch {
    notFound();
  }

  if (!data?.qrCode) {
    notFound();
  }

  return (
    <QrCodeDetail
      qrCode={data.qrCode}
      history={data.history}
      redirectCount={data.redirectCount}
    />
  );
}
