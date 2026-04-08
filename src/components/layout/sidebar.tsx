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
  Scale,
  Search,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';
import { checkFeatureAccess } from '@/lib/billing/check-access';
import type { EffectiveTier } from '@/lib/billing/gates';

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
  const [tier, setTier] = useState<EffectiveTier | null>(null);

  useEffect(() => {
    checkFeatureAccess('analytics').then(({ tier: t }) => setTier(t as EffectiveTier));
  }, []);

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
            ? 'bg-white/[0.08] text-white font-medium border-l-2 border-white/60 pl-[6px]'
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

  const tierLabel: Record<string, string> = {
    free: 'Free',
    trial: 'Trial',
    expired: 'Trial abgelaufen',
    standard: 'Standard',
    pro: 'Pro',
  };

  const brandBlock = (
    <div className="flex h-12 items-center gap-2 px-3">
      <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-white/10">
        <QrCode className="h-3 w-3 text-white/70" />
      </div>
      <span className="text-[13px] font-semibold tracking-tight text-white/90">
        Spurig
      </span>
      {tier && (
        <span className={cn(
          'ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium',
          tier === 'pro' ? 'bg-violet-500/20 text-violet-300' :
          tier === 'standard' ? 'bg-blue-500/20 text-blue-300' :
          tier === 'trial' ? 'bg-amber-500/20 text-amber-300' :
          'bg-white/10 text-white/40'
        )}>
          {tierLabel[tier] ?? tier}
        </span>
      )}
    </div>
  );

  const navBody = (
    <>
      {/* Search trigger */}
      <div className="px-2 pt-2 pb-1">
        <button
          onClick={() => {
            setMobileOpen(false);
            window.dispatchEvent(new Event('open-command-palette'));
          }}
          className="flex w-full items-center gap-2 rounded-[5px] bg-white/[0.04] px-2 py-[6px] text-[12px] text-white/40 transition-colors hover:bg-white/[0.06] hover:text-white/60"
        >
          <Search className="h-[13px] w-[13px]" />
          <span>Suchen…</span>
          <kbd className="ml-auto font-mono text-[10px] text-white/30">⌘K</kbd>
        </button>
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
          <ExternalLink className="ml-auto h-3 w-3 opacity-40" />
        </Link>
        <Link
          href="/impressum"
          target="_blank"
          className="flex items-center gap-2.5 rounded-[5px] px-2 py-[6px] text-[13px] text-white/30 transition-colors duration-75 hover:bg-white/[0.04] hover:text-white/50"
        >
          <Scale className="h-[15px] w-[15px]" />
          Impressum
          <ExternalLink className="ml-auto h-3 w-3 opacity-40" />
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
      <div className="fixed left-0 top-0 z-40 flex h-12 w-full items-center border-b border-border bg-background px-3 lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Menü schließen' : 'Menü öffnen'}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <div className="ml-2 flex items-center gap-2">
          <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] bg-neutral-900">
            <QrCode className="h-3 w-3 text-white/70" />
          </div>
          <span className="text-[13px] font-semibold">Spurig</span>
        </div>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 top-12 z-30 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar — below header, no duplicate brand */}
      <aside
        className={cn(
          'fixed top-12 bottom-0 left-0 z-30 flex w-[220px] flex-col bg-[#111] transition-transform duration-200 ease-out lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {navBody}
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-[220px] lg:flex-col lg:bg-[#111] lg:border-r lg:border-white/[0.06]">
        {brandBlock}
        {navBody}
      </aside>
    </>
  );
}
