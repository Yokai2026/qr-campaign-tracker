'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Megaphone,
  QrCode,
  BarChart3,
  Settings,
} from 'lucide-react';

const TABS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kampagnen', href: '/campaigns', icon: Megaphone },
  { name: 'QR-Codes', href: '/qr-codes', icon: QrCode },
  { name: 'Analytik', href: '/analytics', icon: BarChart3 },
  { name: 'Mehr', href: '/settings', icon: Settings },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm lg:hidden"
    >
      <ul className="flex items-stretch justify-around">
        {TABS.map((tab) => {
          const isActive =
            pathname === tab.href || pathname.startsWith(tab.href + '/');
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] transition-colors',
                  isActive
                    ? 'text-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <tab.icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-accent-warm' : 'text-muted-foreground'
                  )}
                />
                <span className="font-medium">{tab.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
