'use client';

import { useState, useTransition } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { deleteCampaign } from './actions';

interface DeleteCampaignButtonProps {
  campaignId: string;
  campaignName: string;
}

export function DeleteCampaignButton({
  campaignId,
  campaignName,
}: DeleteCampaignButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      try {
        await deleteCampaign(campaignId);
        toast.success('Kampagne gelöscht');
        setOpen(false);
      } catch (err) {
        toast.error(
          err instanceof Error
            ? err.message
            : 'Kampagne konnte nicht gelöscht werden',
        );
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="ghost" size="icon" />}>
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Löschen</span>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Kampagne löschen</DialogTitle>
          <DialogDescription>
            Möchtest du die Kampagne &ldquo;{campaignName}&rdquo;
            wirklich löschen? Diese Aktion kann nicht rückgängig gemacht
            werden.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
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
  );
}
