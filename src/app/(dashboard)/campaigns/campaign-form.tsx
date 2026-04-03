'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { campaignSchema } from '@/lib/validations';
import { CAMPAIGN_STATUS_LABELS } from '@/lib/constants';
import type { CampaignStatus, CampaignInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createCampaign, updateCampaign } from './actions';

// ---------------------------------------------------------------------------
// Slug helper
// ---------------------------------------------------------------------------

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface CampaignFormProps {
  /** If provided the form operates in edit mode. */
  campaignId?: string;
  defaultValues?: {
    name: string;
    slug: string;
    description: string;
    status: CampaignStatus;
    start_date: string;
    end_date: string;
    tags: string[];
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CampaignForm({ campaignId, defaultValues }: CampaignFormProps) {
  const router = useRouter();
  const isEditing = Boolean(campaignId);

  // Form state
  const [name, setName] = useState(defaultValues?.name ?? '');
  const [slug, setSlug] = useState(defaultValues?.slug ?? '');
  const [description, setDescription] = useState(
    defaultValues?.description ?? '',
  );
  const [status, setStatus] = useState<CampaignStatus>(
    defaultValues?.status ?? 'draft',
  );
  const [startDate, setStartDate] = useState(
    defaultValues?.start_date ?? '',
  );
  const [endDate, setEndDate] = useState(defaultValues?.end_date ?? '');
  const [tagsInput, setTagsInput] = useState(
    defaultValues?.tags?.join(', ') ?? '',
  );

  // Whether the slug has been manually edited
  const [slugTouched, setSlugTouched] = useState(isEditing);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // Derive tags array from comma-separated input
  function parseTags(raw: string): string[] {
    return raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(generateSlug(value));
    }
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const data: CampaignInput = {
      name,
      slug,
      description: description || undefined,
      status,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      tags: parseTags(tagsInput),
    };

    // Client-side validation
    const result = campaignSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (key && !fieldErrors[String(key)]) {
          fieldErrors[String(key)] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      try {
        if (isEditing && campaignId) {
          await updateCampaign(campaignId, data);
          toast.success('Kampagne wurde aktualisiert.');
        } else {
          await createCampaign(data);
          toast.success('Kampagne wurde erstellt.');
        }
        router.push('/campaigns');
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Ein Fehler ist aufgetreten.',
        );
      }
    });
  }

  const statusEntries = Object.entries(CAMPAIGN_STATUS_LABELS) as [
    CampaignStatus,
    string,
  ][];

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {isEditing ? 'Kampagne bearbeiten' : 'Neue Kampagne'}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="z.B. Sommer-Leseaktion 2026"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="sommer-leseaktion-2026"
              className="font-mono"
            />
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Wird automatisch aus dem Namen generiert. Nur Kleinbuchstaben,
              Zahlen und Bindestriche.
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optionale Beschreibung der Kampagne..."
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={status}
              onValueChange={(value) => {
                if (value) setStatus(value as CampaignStatus);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status waehlen" />
              </SelectTrigger>
              <SelectContent>
                {statusEntries.map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status}</p>
            )}
          </div>

          {/* Dates */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="start_date">Startdatum</Label>
              <Input
                id="start_date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              {errors.start_date && (
                <p className="text-sm text-destructive">{errors.start_date}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Enddatum</Label>
              <Input
                id="end_date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
              {errors.end_date && (
                <p className="text-sm text-destructive">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="z.B. sommer, lesen, kinder"
            />
            <p className="text-xs text-muted-foreground">
              Kommagetrennte Liste von Tags.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/campaigns')}
          >
            Abbrechen
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending
              ? 'Wird gespeichert...'
              : isEditing
                ? 'Speichern'
                : 'Erstellen'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
