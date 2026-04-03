'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  Megaphone,
  MapPin,
  ClipboardList,
  QrCode,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const mainNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kampagnen', href: '/campaigns', icon: Megaphone },
  { name: 'Standorte', href: '/locations', icon: MapPin },
  { name: 'Platzierungen', href: '/placements', icon: ClipboardList },
  { name: 'QR-Codes', href: '/qr-codes', icon: QrCode },
  { name: 'Analytik', href: '/analytics', icon: BarChart3 },
];

const bottomNav = [
  { name: 'Einstellungen', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  function NavItem({ item }: { item: typeof mainNav[number] }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium transition-all duration-150',
          isActive
            ? 'bg-sidebar-primary/15 text-white font-semibold'
            : 'text-sidebar-foreground/55 hover:bg-sidebar-accent hover:text-sidebar-foreground/90'
        )}
      >
        {isActive && (
          <span className="absolute -left-[3px] top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-sidebar-primary" />
        )}
        <item.icon className={cn(
          'h-[17px] w-[17px] shrink-0 transition-colors',
          isActive ? 'text-sidebar-primary' : 'text-sidebar-foreground/35 group-hover:text-sidebar-foreground/60'
        )} />
        {item.name}
      </Link>
    );
  }

  const navContent = (
    <>
      {/* Brand */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary shadow-glow">
          <QrCode className="h-4 w-4 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">QR Tracker</span>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-0.5 px-2 pt-2">
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/25">
          Navigation
        </p>
        {mainNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-0.5 border-t border-sidebar-border/50 px-2 py-2">
        {bottomNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-medium text-sidebar-foreground/40 transition-all duration-150 hover:bg-red-500/8 hover:text-red-400"
        >
          <LogOut className="h-[17px] w-[17px]" />
          Abmelden
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="fixed left-0 top-0 z-40 flex h-13 w-full items-center border-b border-border/50 bg-background/80 glass px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="ml-2 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg gradient-primary">
            <QrCode className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">QR Tracker</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar transition-transform duration-300 ease-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col lg:bg-sidebar">
        {navContent}
      </aside>
    </>
  );
}
