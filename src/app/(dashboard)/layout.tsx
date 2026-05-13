import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';
import { TrialEndedModal } from '@/components/billing/trial-ended-modal';
import { getSessionTier } from '@/lib/billing/gates';

// Eigene async-Komponente: Tier-Lookup blockiert das Shell-Streaming nicht mehr.
// Ohne aktiven Trial-Modal liefert sie null und kostet im Render nichts.
async function TrialGate() {
  const session = await getSessionTier();
  if (session?.tier !== 'expired') return null;
  return <TrialEndedModal />;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main id="main-content" className="pb-16 pt-12 lg:pb-0 lg:pl-[220px] lg:pt-0">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
            {children}
          </div>
        </main>
        <MobileBottomNav />
        <Toaster />
        <Suspense fallback={null}>
          <TrialGate />
        </Suspense>
      </div>
    </Providers>
  );
}
