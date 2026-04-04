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
  Link2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const mainNav = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kampagnen', href: '/campaigns', icon: Megaphone },
  { name: 'Standorte', href: '/locations', icon: MapPin },
  { name: 'Platzierungen', href: '/placements', icon: ClipboardList },
  { name: 'QR-Codes', href: '/qr-codes', icon: QrCode },
  { name: 'Kurzlinks', href: '/links', icon: Link2 },
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
          'group flex items-center gap-2.5 rounded-[5px] px-2 py-[6px] text-[13px] transition-colors duration-75',
          isActive
            ? 'bg-white/[0.08] text-white font-medium'
            : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
        )}
      >
        <item.icon className={cn(
          'h-[15px] w-[15px] shrink-0',
          isActive ? 'text-white/90' : 'text-white/25'
        )} />
        <span>{item.name}</span>
      </Link>
    );
  }

  function BottomNavItem({ item }: { item: typeof bottomNav[number] }) {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={cn(
          'group flex items-center gap-2.5 rounded-[5px] px-2 py-[6px] text-[13px] transition-colors duration-75',
          isActive
            ? 'bg-white/[0.08] text-white font-medium'
            : 'text-white/40 hover:bg-white/[0.04] hover:text-white/70'
        )}
      >
        <item.icon className="h-[15px] w-[15px] shrink-0 text-white/25" />
        {item.name}
      </Link>
    );
  }

  const navContent = (
    <>
      {/* Brand */}
      <div className="flex h-12 items-center gap-2 px-3">
        <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-white/10">
          <QrCode className="h-3 w-3 text-white/70" />
        </div>
        <span className="text-[13px] font-semibold tracking-tight text-white/90">
          QR Tracker
        </span>
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-[2px] px-2 pt-1">
        {mainNav.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom */}
      <div className="space-y-[2px] border-t border-white/[0.06] px-2 py-2">
        {bottomNav.map((item) => (
          <BottomNavItem key={item.href} item={item} />
        ))}
        <Link
          href="/datenschutz"
          target="_blank"
          className="flex items-center gap-2.5 rounded-[5px] px-2 py-[6px] text-[13px] text-white/30 transition-colors duration-75 hover:bg-white/[0.04] hover:text-white/50"
        >
          <Shield className="h-[15px] w-[15px]" />
          Datenschutz
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-[6px] text-[13px] text-white/30 transition-colors duration-75 hover:bg-white/[0.04] hover:text-red-400"
        >
          <LogOut className="h-[15px] w-[15px]" />
          Abmelden
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile toggle */}
      <div className="fixed left-0 top-0 z-40 flex h-12 w-full items-center border-b border-border bg-background px-4 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <div className="ml-2 flex items-center gap-2">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-neutral-900">
            <QrCode className="h-3 w-3 text-white/70" />
          </div>
          <span className="text-[13px] font-semibold">QR Tracker</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-[220px] flex-col bg-[#111] transition-transform duration-200 ease-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navContent}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[220px] lg:flex-col lg:bg-[#111] lg:border-r lg:border-white/[0.06]">
        {navContent}
      </aside>
    </>
  );
}
