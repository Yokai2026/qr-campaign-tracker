import { Sidebar } from '@/components/layout/sidebar';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-[linear-gradient(135deg,oklch(0.975_0.003_265),oklch(0.965_0.008_240))]">
        <Sidebar />
        <main className="pt-13 lg:pl-60 lg:pt-0">
          <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8 lg:px-10">
            {children}
          </div>
        </main>
        <Toaster />
      </div>
    </Providers>
  );
}
