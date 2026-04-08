import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export function PrivacyBadge() {
  return (
    <Link
      href="/datenschutz"
      className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-950/60"
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      DSGVO-konform — kein Cookie-Consent nötig
    </Link>
  );
}
