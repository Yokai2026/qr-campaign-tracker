'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { deletePlacement } from './actions';

interface DeletePlacementButtonProps {
  id: string;
  name: string;
}

export function DeletePlacementButton({ id, name }: DeletePlacementButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Platzierung "${name}" wirklich löschen?`)) return;

    startTransition(async () => {
      try {
        await deletePlacement(id);
        toast.success('Platzierung gelöscht');
        router.refresh();
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Fehler beim Löschen'
        );
      }
    });
  }

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={isPending}
      onClick={handleDelete}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {isPending ? 'Wird gelöscht...' : 'Löschen'}
    </DropdownMenuItem>
  );
}
