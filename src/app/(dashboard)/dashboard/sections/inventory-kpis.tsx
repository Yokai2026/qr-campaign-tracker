import { unstable_noStore as noStore } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { KPIStatCard } from '@/components/shared/kpi-stat-card';
import Link from 'next/link';
import { Megaphone, MapPin, ClipboardList, QrCode } from 'lucide-react';

export async function InventoryKPIs() {
  noStore();
  const supabase = await createClient();

  const [
    { count: campaignCount },
    { count: locationCount },
    { count: placementCount },
    { count: qrCodeCount },
  ] = await Promise.all([
    supabase.from('campaigns').select('*', { count: 'exact', head: true }),
    supabase.from('locations').select('*', { count: 'exact', head: true }),
    supabase.from('placements').select('*', { count: 'exact', head: true }),
    supabase.from('qr_codes').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[13px] font-semibold tracking-tight">Bestand</h2>
        <p className="text-[12px] text-muted-foreground">Was du bereits angelegt hast</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
        <Link href="/campaigns" className="group">
          <KPIStatCard
            label="Kampagnen"
            value={campaignCount || 0}
            icon={Megaphone}
            hint="Eine Kampagne bündelt alle Platzierungen und QR-Codes für ein Marketing-Ziel."
            className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
          />
        </Link>
        <Link href="/locations" className="group">
          <KPIStatCard
            label="Standorte"
            value={locationCount || 0}
            icon={MapPin}
            hint="Orte an denen deine QR-Codes aushängen (z. B. Bibliothek, Café, Jugendzentrum)."
            className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
          />
        </Link>
        <Link href="/placements" className="group">
          <KPIStatCard
            label="Platzierungen"
            value={placementCount || 0}
            icon={ClipboardList}
            hint="Einzelne Anbringungen pro Standort (z. B. Poster am Eingang, Flyer am Tresen)."
            className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
          />
        </Link>
        <Link href="/qr-codes" className="group">
          <KPIStatCard
            label="QR-Codes"
            value={qrCodeCount || 0}
            icon={QrCode}
            hint="Jede Platzierung hat einen eigenen QR-Code mit individueller Tracking-URL."
            className="transition-colors group-hover:border-border/80 group-hover:bg-muted/30"
          />
        </Link>
      </div>
    </section>
  );
}
