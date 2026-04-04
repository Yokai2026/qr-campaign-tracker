'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  FolderOpen,
  Loader2,
} from 'lucide-react';

import type { LinkGroup } from '@/types';
import {
  createLinkGroup,
  updateLinkGroup,
  deleteLinkGroup,
} from './actions';

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent } from '@/components/ui/card';

type Campaign = { id: string; name: string };

type LinkGroupManagementProps = {
  groups: LinkGroup[];
  campaigns: Campaign[];
  linkCountMap: Record<string, number>;
};

type FormData = {
  name: string;
  slug: string;
  description: string;
  color: string;
  campaign_id: string;
};

const DEFAULT_COLORS = [
  '#6d28d9', '#2563eb', '#0891b2', '#059669',
  '#ca8a04', '#ea580c', '#dc2626', '#db2777',
];

const emptyForm: FormData = {
  name: '',
  slug: '',
  description: '',
  color: '#6d28d9',
  campaign_id: '',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae')
    .replace(/[öÖ]/g, 'oe')
    .replace(/[üÜ]/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function LinkGroupManagement({
  groups,
  campaigns,
  linkCountMap,
}: LinkGroupManagementProps) {
  const [isPending, startTransition] = useTransition();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LinkGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<LinkGroup | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [autoSlug, setAutoSlug] = useState(true);

  function openCreate() {
    setEditingGroup(null);
    setForm(emptyForm);
    setAutoSlug(true);
    setDialogOpen(true);
  }

  function openEdit(group: LinkGroup) {
    setEditingGroup(group);
    setForm({
      name: group.name,
      slug: group.slug,
      description: group.description ?? '',
      color: group.color,
      campaign_id: group.campaign_id ?? '',
    });
    setAutoSlug(false);
    setDialogOpen(true);
  }

  function openDelete(group: LinkGroup) {
    setDeletingGroup(group);
    setDeleteDialogOpen(true);
  }

  function handleNameChange(name: string) {
    setForm((prev) => ({
      ...prev,
      name,
      slug: autoSlug ? slugify(name) : prev.slug,
    }));
  }

  function handleSubmit() {
    const input = {
      name: form.name,
      slug: form.slug,
      description: form.description,
      color: form.color,
      campaign_id: form.campaign_id || undefined,
    };

    startTransition(async () => {
      if (editingGroup) {
        const result = await updateLinkGroup(editingGroup.id, input);
        if (result.success) {
          toast.success('Sammlung aktualisiert');
          setDialogOpen(false);
        } else {
          toast.error(result.error || 'Fehler beim Aktualisieren');
        }
      } else {
        const result = await createLinkGroup(input);
        if (result.success) {
          toast.success('Sammlung erstellt');
          setDialogOpen(false);
        } else {
          toast.error(result.error || 'Fehler beim Erstellen');
        }
      }
    });
  }

  function handleDelete() {
    if (!deletingGroup) return;
    startTransition(async () => {
      const result = await deleteLinkGroup(deletingGroup.id);
      if (result.success) {
        toast.success('Sammlung gelöscht');
        setDeleteDialogOpen(false);
        setDeletingGroup(null);
      } else {
        toast.error(result.error || 'Fehler beim Löschen');
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-muted-foreground">
          Gruppiere Links nach Thema, Kanal oder Kampagne
        </p>
        <Button size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Neue Sammlung
        </Button>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <FolderOpen className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium">Keine Sammlungen vorhanden</p>
            <p className="text-[13px] text-muted-foreground mt-1">
              Erstelle eine Sammlung, um deine Links zu organisieren
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => {
            const count = linkCountMap[group.id] ?? 0;
            return (
              <Card key={group.id} className="group relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ background: group.color }}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{group.name}</p>
                        <p className="text-[12px] text-muted-foreground">/{group.slug}</p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        }
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(group)}>
                          <Pencil className="mr-2 h-3.5 w-3.5" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => openDelete(group)}
                        >
                          <Trash2 className="mr-2 h-3.5 w-3.5" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {group.description && (
                    <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2">
                      {group.description}
                    </p>
                  )}

                  <div className="flex items-center gap-3 mt-3 text-[12px] text-muted-foreground">
                    <span>{count} {count === 1 ? 'Link' : 'Links'}</span>
                    {group.campaign && (
                      <span className="truncate">
                        Kampagne: {group.campaign.name}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Sammlung bearbeiten' : 'Neue Sammlung'}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? 'Passe die Eigenschaften der Sammlung an'
                : 'Erstelle eine neue Sammlung für deine Links'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="group-name">Name</Label>
              <Input
                id="group-name"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="z.B. Social Media"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group-slug">Slug</Label>
              <Input
                id="group-slug"
                value={form.slug}
                onChange={(e) => {
                  setAutoSlug(false);
                  setForm((prev) => ({ ...prev, slug: e.target.value }));
                }}
                placeholder="z.B. social-media"
              />
              <p className="text-[11px] text-muted-foreground">
                Nur Kleinbuchstaben, Zahlen und Bindestriche
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="group-description">Beschreibung</Label>
              <Textarea
                id="group-description"
                value={form.description}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optionale Beschreibung..."
                rows={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Farbe</Label>
              <div className="flex items-center gap-2">
                {DEFAULT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, color: c }))}
                    className="h-6 w-6 rounded-full transition-transform hover:scale-110 ring-offset-background"
                    style={{
                      background: c,
                      outline: form.color === c ? '2px solid currentColor' : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="h-6 w-8 p-0 border-0 cursor-pointer"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Kampagne (optional)</Label>
              <Select
                value={form.campaign_id || 'none'}
                onValueChange={(val) =>
                  setForm((prev) => ({
                    ...prev,
                    campaign_id: !val || val === 'none' ? '' : val,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Keine Kampagne" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Keine Kampagne</SelectItem>
                  {campaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !form.name || !form.slug}>
              {isPending ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Speichern...
                </>
              ) : editingGroup ? (
                'Speichern'
              ) : (
                'Erstellen'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sammlung löschen</DialogTitle>
            <DialogDescription>
              Möchtest du die Sammlung &ldquo;{deletingGroup?.name}&rdquo; wirklich
              löschen? Die zugehörigen Links bleiben erhalten, verlieren aber ihre
              Gruppenzuordnung.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
            >
              {isPending ? 'Wird gelöscht...' : 'Löschen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
