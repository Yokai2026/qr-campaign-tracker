'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import Link from 'next/link';
import { toast } from 'sonner';
import { MapPin, Trash2 } from 'lucide-react';
import { locationSchema } from '@/lib/validations';
import { LOCATION_TYPE_LABELS, PLACEMENT_STATUS_LABELS } from '@/lib/constants';
import type { Location, LocationInput, LocationType } from '@/types';
import { PageHeader } from '@/components/shared/page-header';
import { DetailMetaStrip } from '@/components/shared/detail-meta-strip';
import { StatusBadge } from '@/components/shared/status-badge';
import { EmptyState } from '@/components/shared/empty-state';
import { DataTableShell } from '@/components/shared/data-table-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { updateLocation, deleteLocation } from '../actions';
import { formatDate } from '@/lib/format';

const LOCATION_TYPES = Object.keys(LOCATION_TYPE_LABELS) as LocationType[];

type LocationDetailTabsProps = {
  location: Location;
  placements: Array<{
    id: string;
    name: string;
    placement_code: string;
    status: string;
    campaign: { id: string; name: string } | null;
  }>;
  placementCount: number;
};

type FormValues = {
  venue_name: string;
  district: string;
  address: string;
  location_type: LocationType;
  notes: string;
  active: boolean;
};

export function LocationDetailTabs({
  location,
  placements,
  placementCount,
}: LocationDetailTabsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      venue_name: location.venue_name,
      district: location.district ?? '',
      address: location.address ?? '',
      location_type: location.location_type,
      notes: location.notes ?? '',
      active: location.active,
    },
  });

  function onSubmit(data: FormValues) {
    const input: LocationInput = {
      venue_name: data.venue_name,
      district: data.district || undefined,
      address: data.address || undefined,
      location_type: data.location_type,
      notes: data.notes || undefined,
      active: data.active,
    };

    const parsed = locationSchema.safeParse(input);
    if (!parsed.success) return;

    startTransition(async () => {
      try {
        const result = await updateLocation(location.id, input);
        if (result.success) {
          toast.success('Standort aktualisiert');
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } catch {
        toast.error('Unerwarteter Fehler');
      }
    });
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      'Diesen Standort wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.',
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const result = await deleteLocation(location.id);
      if (result.success) {
        toast.success('Standort gelöscht');
        router.push('/locations');
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error('Unerwarteter Fehler');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <div className="space-y-6 animate-in-card">
      {/* Header */}
      <PageHeader
        title={location.venue_name}
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Standorte', href: '/locations' },
          { label: location.venue_name },
        ]}
        badge={
          <StatusBadge
            status={location.active ? 'active' : 'archived'}
            label={location.active ? 'Aktiv' : 'Inaktiv'}
          />
        }
        action={
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {isDeleting ? 'Wird gelöscht...' : 'Löschen'}
          </Button>
        }
      />

      {/* Meta strip */}
      <DetailMetaStrip
        items={[
          ...(location.district ? [{ label: 'Bezirk', value: location.district }] : []),
          ...(location.address ? [{ label: 'Adresse', value: location.address }] : []),
          { label: 'Typ', value: LOCATION_TYPE_LABELS[location.location_type] ?? location.location_type },
          { label: 'Erstellt', value: formatDate(location.created_at) },
        ]}
      />

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="placements">
            Platzierungen ({placementCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="border border-border">
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="venue_name">Ortsname *</Label>
                  <Input
                    id="venue_name"
                    {...register('venue_name')}
                    aria-invalid={!!errors.venue_name}
                  />
                  {errors.venue_name && (
                    <p className="text-xs text-destructive">{errors.venue_name.message}</p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="district">Bezirk</Label>
                    <Input id="district" {...register('district')} />
                    {errors.district && (
                      <p className="text-xs text-destructive">{errors.district.message}</p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="address">Adresse</Label>
                    <Input id="address" {...register('address')} />
                    {errors.address && (
                      <p className="text-xs text-destructive">{errors.address.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="location_type">Typ *</Label>
                  <Controller
                    name="location_type"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={(val) => { if (val) field.onChange(val); }}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Typ auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {LOCATION_TYPES.map((t) => (
                            <SelectItem key={t} value={t}>
                              {LOCATION_TYPE_LABELS[t]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.location_type && (
                    <p className="text-xs text-destructive">{errors.location_type.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes">Notizen</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    rows={3}
                  />
                </div>

                <Controller
                  name="active"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="active"
                        checked={field.value}
                        onCheckedChange={(checked) => field.onChange(!!checked)}
                      />
                      <Label htmlFor="active" className="cursor-pointer">Aktiv</Label>
                    </div>
                  )}
                />

                <div className="flex items-center gap-3 border-t pt-4">
                  <Button type="submit" disabled={isPending}>
                    {isPending ? 'Wird gespeichert...' : 'Änderungen speichern'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/locations')}
                    disabled={isPending}
                  >
                    Abbrechen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="placements">
          {placements.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Keine Platzierungen"
              description="Diesem Standort sind noch keine Platzierungen zugeordnet."
            />
          ) : (
            <DataTableShell>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableHead className="font-semibold">Name</TableHead>
                    <TableHead className="font-semibold">Code</TableHead>
                    <TableHead className="font-semibold">Kampagne</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {placements.map((p) => (
                    <TableRow key={p.id} className="group transition-colors hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/placements/${p.id}`}
                          className="font-medium hover:text-primary transition-colors"
                        >
                          {p.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <code className="rounded-md bg-muted/60 px-1.5 py-0.5 text-xs font-mono">
                          {p.placement_code}
                        </code>
                      </TableCell>
                      <TableCell>
                        {p.campaign ? (
                          <Link href={`/campaigns/${p.campaign.id}`} className="hover:underline">
                            {p.campaign.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{'\u2014'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge
                          status={p.status}
                          label={PLACEMENT_STATUS_LABELS[p.status] ?? p.status}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </DataTableShell>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
