import Link from 'next/link';
import { FileQuestion, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-6 w-6 text-muted-foreground" />
        </div>
        <h1 className="mt-4 text-lg font-semibold tracking-tight">
          Seite nicht gefunden
        </h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Die angeforderte Seite existiert nicht oder wurde verschoben
        </p>
        <Button render={<Link href="/dashboard" />} size="sm" className="mt-5">
          <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
          Zurück zum Dashboard
        </Button>
      </div>
    </div>
  );
}
