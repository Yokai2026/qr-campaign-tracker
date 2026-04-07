'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PageHeader } from '@/components/shared/page-header';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DataTableShell } from '@/components/shared/data-table-shell';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Shield } from 'lucide-react';
import { format, subDays } from 'date-fns';

const ACTION_LABELS: Record<string, string> = {
  'account.deleted': 'Account gel��scht',
  'account.password_reset': 'Passwort zurückgesetzt',
  'campaign.created': 'Kampagne erstellt',
  'campaign.updated': 'Kampagne aktualisiert',
  'campaign.deleted': 'Kampagne gelöscht',
  'qr_code.created': 'QR-Code erstellt',
  'qr_code.deleted': 'QR-Code gelöscht',
  'qr_code.deactivated': 'QR-Code deaktiviert',
  'short_link.created': 'Kurzlink erstellt',
  'short_link.deleted': 'Kurzlink gelöscht',
  'placement.created': 'Platzierung erstellt',
  'placement.deleted': 'Platzierung gelöscht',
  'data_export.requested': 'Daten-Export angefordert',
  'role.changed': 'Rolle geändert',
};

export default function AuditLogPage() {
  const supabase = createClient();
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [actionFilter, setActionFilter] = useState<string>('all');

  const { data: entries, isLoading } = useQuery({
    queryKey: ['audit-log', dateFrom, dateTo, actionFilter],
    queryFn: async () => {
      let query = supabase
        .from('audit_log')
        .select('id, user_id, action, entity_type, entity_id, details, created_at, profile:profiles!user_id(email, display_name)')
        .gte('created_at', `${dateFrom}T00:00:00`)
        .lte('created_at', `${dateTo}T23:59:59`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const actions = Object.keys(ACTION_LABELS);

  return (
    <div className="space-y-6 animate-in-card">
      <PageHeader
        title="Audit-Log"
        description="Sicherheitsrelevante Aktionen im System"
        breadcrumbs={[
          { label: 'Einstellungen', href: '/settings' },
          { label: 'Audit-Log' },
        ]}
      />

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Von</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Bis</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 text-[13px]" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-muted-foreground">Aktion</Label>
            <Select value={actionFilter} onValueChange={(v) => setActionFilter(v ?? 'all')}>
              <SelectTrigger className="h-8 text-[13px]">
                <SelectValue>{actionFilter === 'all' ? 'Alle Aktionen' : ACTION_LABELS[actionFilter] || actionFilter}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Aktionen</SelectItem>
                {actions.map((a) => (
                  <SelectItem key={a} value={a}>{ACTION_LABELS[a]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : entries && entries.length > 0 ? (
        <DataTableShell>
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border bg-muted/40 hover:bg-muted/40">
                <TableHead className="text-[12px] font-medium text-muted-foreground">Zeitpunkt</TableHead>
                <TableHead className="text-[12px] font-medium text-muted-foreground">Benutzer</TableHead>
                <TableHead className="text-[12px] font-medium text-muted-foreground">Aktion</TableHead>
                <TableHead className="text-[12px] font-medium text-muted-foreground">Objekt</TableHead>
                <TableHead className="text-[12px] font-medium text-muted-foreground">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry: Record<string, unknown>) => {
                const profile = entry.profile as { email: string; display_name: string | null } | null;
                const details = entry.details as Record<string, unknown> | null;
                return (
                  <TableRow key={entry.id as string} className="border-b border-border/60">
                    <TableCell className="text-[12px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {(entry.created_at as string).slice(0, 19).replace('T', ' ')}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      {profile?.display_name || profile?.email || (entry.user_id as string)?.slice(0, 8) || '—'}
                    </TableCell>
                    <TableCell className="text-[13px]">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium">
                        <Shield className="h-3 w-3" />
                        {ACTION_LABELS[entry.action as string] || String(entry.action)}
                      </span>
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground">
                      {entry.entity_type ? `${entry.entity_type}` : '—'}
                      {entry.entity_id ? <code className="ml-1 text-[11px]">{(entry.entity_id as string).slice(0, 8)}…</code> : ''}
                    </TableCell>
                    <TableCell className="text-[12px] text-muted-foreground max-w-[200px] truncate">
                      {details ? Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(', ') : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </DataTableShell>
      ) : (
        <div className="rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center">
          <Shield className="mx-auto h-6 w-6 text-muted-foreground/60" />
          <p className="mt-2 text-[13px] font-medium">Keine Einträge</p>
          <p className="mt-1 text-[12px] text-muted-foreground">Im gewählten Zeitraum wurden keine sicherheitsrelevanten Aktionen protokolliert.</p>
        </div>
      )}
    </div>
  );
}
