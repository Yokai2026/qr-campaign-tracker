import { unstable_noStore as noStore } from 'next/cache';
import { Suspense } from 'react';
import Link from 'next/link';
import { Plus, Upload } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { getQrCodes } from './actions';
import { QrCodeList } from './qr-code-list';

export default function QrCodesPage() {
  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="QR-Codes"
        description="Verwalte deine QR-Codes und deren Weiterleitungen"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" render={<Link href="/qr-codes/bulk" />}>
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Bulk-Import</span>
              <span className="sm:hidden">Bulk</span>
            </Button>
            <Button size="sm" render={<Link href="/qr-codes/new" />}>
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">Neuer QR-Code</span>
              <span className="sm:hidden">Neu</span>
            </Button>
          </div>
        }
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
