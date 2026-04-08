import { Sidebar } from '@/components/layout/sidebar';
import { CommandPalette } from '@/components/layout/command-palette';
import { Toaster } from '@/components/ui/sonner';
import { Providers } from '@/components/providers';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Providers>
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="pt-12 lg:pl-[220px] lg:pt-0">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 sm:py-6 lg:px-10">
            {children}
          </div>
        </main>
        <CommandPalette />
        <Toaster />
      </div>
    </Providers>
  );
}
