import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { getQrCodes } from './actions';
import { QrCodeList } from './qr-code-list';

export default function QrCodesPage() {
  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="QR-Codes"
        description="Verwalten Sie Ihre QR-Codes und deren Weiterleitungen."
        actionLabel="Neuer QR-Code"
        actionHref="/qr-codes/new"
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            QR-Codes werden geladen...
          </div>
        }
      >
        <QrCodeListLoader />
      </Suspense>
    </div>
  );
}

async function QrCodeListLoader() {
  noStore();
  const qrCodes = await getQrCodes();
  return <QrCodeList qrCodes={qrCodes} />;
}
