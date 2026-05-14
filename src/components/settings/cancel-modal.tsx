'use client';

import { useState, useTransition } from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { cancelSubscription, type CancellationReason } from '@/app/(dashboard)/settings/billing-actions';

const REASONS: Array<{ key: CancellationReason; label: string; hint: string }> = [
  { key: 'too_expensive', label: 'Zu teuer', hint: 'Preis passt nicht zu meinem Budget' },
  { key: 'missing_features', label: 'Fehlende Features', hint: 'Funktion XY fehlt mir' },
  { key: 'not_using_enough', label: 'Nutze es kaum', hint: 'Brauche es aktuell nicht' },
  { key: 'switched_competitor', label: 'Wechsel zu anderem Tool', hint: 'Habe etwas anderes gefunden' },
  { key: 'project_finished', label: 'Projekt ist fertig', hint: 'Kampagne abgeschlossen' },
  { key: 'technical_issues', label: 'Technische Probleme', hint: 'Bugs oder Performance' },
  { key: 'other', label: 'Anderer Grund', hint: 'Bitte kurz beschreiben' },
];

type Props = {
  trigger: React.ReactNode;
};

export function CancelModal({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<CancellationReason | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!reason) {
      toast.error('Bitte wähle einen Grund aus');
      return;
    }
    startTransition(async () => {
      const result = await cancelSubscription({ reason, feedback: feedback.trim() || undefined });
      if (result.success) {
        toast.success('Abo wurde zum Periodenende gekündigt. Du hast bis dahin vollen Zugriff.');
        setOpen(false);
        setTimeout(() => window.location.reload(), 800);
      } else {
        toast.error(result.error || 'Kündigung fehlgeschlagen');
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <DialogTitle>Abo kündigen</DialogTitle>
          </div>
          <DialogDescription className="mt-2">
            Dein Abo läuft bis zum Periodenende — du behältst bis dahin vollen Zugriff.
            Hilf uns Spurig besser zu machen: warum kündigst du?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div role="radiogroup" aria-label="Kündigungsgrund" className="space-y-1.5">
            {REASONS.map((r) => (
              <button
                key={r.key}
                type="button"
                role="radio"
                aria-checked={reason === r.key}
                onClick={() => setReason(r.key)}
                className={`flex w-full items-start gap-3 rounded-lg border p-2.5 text-left transition-colors ${
                  reason === r.key
                    ? 'border-brand bg-brand/[0.05]'
                    : 'border-border bg-card hover:border-foreground/20 hover:bg-muted/40'
                }`}
              >
                <span
                  className={`mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${
                    reason === r.key ? 'border-brand' : 'border-muted-foreground/40'
                  }`}
                >
                  {reason === r.key && <span className="h-1.5 w-1.5 rounded-full bg-brand" />}
                </span>
                <div className="min-w-0">
                  <div className="text-[13px] font-medium">{r.label}</div>
                  <div className="text-[11.5px] text-muted-foreground">{r.hint}</div>
                </div>
              </button>
            ))}
          </div>

          {reason && (
            <div>
              <Label htmlFor="feedback" className="text-[12px]">
                {reason === 'other' ? 'Beschreibung (Pflicht)' : 'Mehr Details (optional)'}
              </Label>
              <Textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder={
                  reason === 'too_expensive'
                    ? 'Was wäre für dich ein fairer Preis?'
                    : reason === 'missing_features'
                    ? 'Welche Funktion fehlt dir?'
                    : reason === 'switched_competitor'
                    ? 'Zu welchem Tool wechselst du?'
                    : 'Optional: kurze Erklärung'
                }
                rows={3}
                className="mt-1"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Abbrechen
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleConfirm}
            disabled={isPending || !reason || (reason === 'other' && feedback.trim().length < 3)}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Kündigung wird verarbeitet…
              </>
            ) : (
              'Abo zum Periodenende kündigen'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
