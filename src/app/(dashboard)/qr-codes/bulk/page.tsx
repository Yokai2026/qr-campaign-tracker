'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import Papa from 'papaparse';
import {
  Upload,
  FileSpreadsheet,
  ChevronDown,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
} from 'lucide-react';

import { getPlacements, bulkCreateQrCodes } from '../actions';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type PlacementOption = {
  id: string;
  name: string;
  placement_code: string;
  campaign: { id: string; name: string; slug: string } | null;
};

type CsvRow = {
  target_url: string;
  note?: string;
};

export default function BulkQrCodePage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [placements, setPlacements] = useState<PlacementOption[]>([]);
  const [loadingPlacements, setLoadingPlacements] = useState(true);
  const [comboOpen, setComboOpen] = useState(false);
  const [placementId, setPlacementId] = useState('');

  const [rows, setRows] = useState<CsvRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [result, setResult] = useState<{ created: number; errors: string[] } | null>(null);

  const selectedPlacement = placements.find((p) => p.id === placementId);

  useEffect(() => {
    getPlacements()
      .then(setPlacements)
      .catch(() => toast.error('Platzierungen konnten nicht geladen werden.'))
      .finally(() => setLoadingPlacements(false));
  }, []);

  function handleFileUpload(file: File) {
    setParseErrors([]);
    setResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const errors: string[] = [];
        const parsed: CsvRow[] = [];

        results.data.forEach((row, i) => {
          const url = row.target_url?.trim() || row.url?.trim() || row.URL?.trim();
          if (!url) {
            errors.push(`Zeile ${i + 2}: Keine URL gefunden`);
            return;
          }
          try {
            new URL(url);
          } catch {
            errors.push(`Zeile ${i + 2}: Ungültige URL "${url}"`);
            return;
          }
          parsed.push({
            target_url: url,
            note: row.note?.trim() || row.Notiz?.trim() || undefined,
          });
        });

        if (parsed.length > 100) {
          errors.push('Maximal 100 Eintraege pro Import. Bitte aufteilen.');
          setParseErrors(errors);
          return;
        }

        setRows(parsed);
        setParseErrors(errors);

        if (parsed.length > 0) {
          toast.success(`${parsed.length} Eintraege erkannt`);
        }
      },
      error(err) {
        setParseErrors([`CSV-Fehler: ${err.message}`]);
      },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv')) {
      handleFileUpload(file);
    } else {
      toast.error('Bitte eine CSV-Datei hochladen.');
    }
  }

  function downloadExample() {
    const csv = 'target_url,note\nhttps://beispiel.de/seite-1,Erstes Ziel\nhttps://beispiel.de/seite-2,Zweites Ziel\nhttps://beispiel.de/seite-3,';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'qr-bulk-vorlage.csv';
    link.click();
  }

  function handleSubmit() {
    if (!placementId) {
      toast.error('Bitte zuerst eine Platzierung wählen.');
      return;
    }
    if (rows.length === 0) {
      toast.error('Keine Eintraege zum Erstellen.');
      return;
    }

    startTransition(async () => {
      try {
        const res = await bulkCreateQrCodes(placementId, rows);
        setResult(res);
        if (res.created > 0) {
          toast.success(`${res.created} QR-Codes erfolgreich erstellt!`);
        }
        if (res.errors.length > 0) {
          toast.error(`${res.errors.length} Fehler aufgetreten.`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Fehler beim Erstellen.');
      }
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk-Import"
        description="Erstelle viele QR-Codes auf einmal per CSV-Upload."
        breadcrumbs={[
          { label: 'QR-Codes', href: '/qr-codes' },
          { label: 'Bulk-Import' },
        ]}
      />

      <div className="max-w-2xl space-y-6">
        {/* Step 1: Placement */}
        <Card>
          <CardHeader>
            <CardTitle>1. Platzierung wählen</CardTitle>
            <CardDescription>
              Alle importierten QR-Codes werden dieser Platzierung zugeordnet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger
                render={
                  <Button
                    variant="outline"
                    className="w-full justify-between font-normal"
                    disabled={loadingPlacements}
                    aria-label="Platzierung auswählen"
                  />
                }
              >
                {loadingPlacements
                  ? 'Laden...'
                  : selectedPlacement
                    ? `${selectedPlacement.name} (${selectedPlacement.campaign?.name ?? '-'})`
                    : 'Platzierung wählen...'}
                <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput placeholder="Platzierung suchen..." />
                  <CommandList>
                    <CommandEmpty>Keine Platzierung gefunden.</CommandEmpty>
                    <CommandGroup>
                      {placements.map((p) => (
                        <CommandItem
                          key={p.id}
                          value={`${p.name} ${p.campaign?.name ?? ''}`}
                          onSelect={() => {
                            setPlacementId(p.id);
                            setComboOpen(false);
                          }}
                          data-checked={placementId === p.id}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.campaign?.name ?? 'Keine Kampagne'} &middot; {p.placement_code}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Step 2: CSV Upload */}
        <Card>
          <CardHeader>
            <CardTitle>2. CSV-Datei hochladen</CardTitle>
            <CardDescription>
              Die CSV braucht eine Spalte <code className="text-xs bg-muted px-1 py-0.5 rounded">target_url</code>.
              Optional: <code className="text-xs bg-muted px-1 py-0.5 rounded">note</code> für interne Notizen.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20 p-8 transition-colors hover:border-muted-foreground/40 cursor-pointer"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-medium">CSV hierher ziehen oder klicken</p>
                <p className="text-xs text-muted-foreground mt-1">Maximal 100 Eintraege</p>
              </div>
              <input
                id="csv-input"
                type="file"
                accept=".csv"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>

            <Button type="button" variant="ghost" size="sm" onClick={downloadExample}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Beispiel-CSV herunterladen
            </Button>

            {parseErrors.length > 0 && (
              <div className="rounded-lg bg-destructive/10 p-3 space-y-1">
                {parseErrors.map((err, i) => (
                  <p key={i} className="text-sm text-destructive flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    {err}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Step 3: Preview */}
        {rows.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>3. Vorschau ({rows.length} Eintraege)</CardTitle>
                  <CardDescription>Prüfen Sie die Daten vor dem Import.</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => { setRows([]); setResult(null); }}
                >
                  <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                  Verwerfen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border max-h-64 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Ziel-URL</TableHead>
                      <TableHead>Notiz</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-mono text-xs max-w-xs truncate">
                          {row.target_url}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {row.note || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium">
                    {result.created} von {rows.length} QR-Codes erstellt
                  </p>
                  {result.errors.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {result.errors.map((err, i) => (
                        <p key={i} className="text-sm text-destructive">{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3">
          {!result ? (
            <Button
              onClick={handleSubmit}
              disabled={isPending || rows.length === 0 || !placementId}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {rows.length} QR-Codes erstellen
            </Button>
          ) : (
            <Button onClick={() => router.push('/qr-codes')}>
              Zur Übersicht
            </Button>
          )}
          <Button variant="outline" onClick={() => router.push('/qr-codes')}>
            Abbrechen
          </Button>
        </div>
      </div>
    </div>
  );
}
