'use client';

import { useCallback, useRef, useState } from 'react';
import { Paperclip, X, FileText, Image as ImageIcon, FileSpreadsheet, Presentation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export type MailAttachment = {
  path: string;
  filename: string;
  size: number;
  content_type: string;
};

type Props = {
  value: MailAttachment[];
  onChange: (next: MailAttachment[]) => void;
  /** Resend-Total-Cap = 25MB. Wir warnen ab 20MB. */
  maxTotalBytes?: number;
};

const DEFAULT_MAX_TOTAL = 25 * 1024 * 1024;
const MAX_FILES = 10;

function fileIconFor(mime: string) {
  if (mime.startsWith('image/')) return <ImageIcon size={14} className="text-brand" />;
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) return <FileSpreadsheet size={14} className="text-emerald-500" />;
  if (mime.includes('presentation') || mime.includes('powerpoint')) return <Presentation size={14} className="text-amber-500" />;
  return <FileText size={14} className="text-muted-foreground" />;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function AttachmentsUploader({ value, onChange, maxTotalBytes = DEFAULT_MAX_TOTAL }: Props) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalBytes = value.reduce((s, a) => s + a.size, 0);
  const remainingBytes = Math.max(0, maxTotalBytes - totalBytes);
  const percentUsed = Math.min(100, Math.round((totalBytes / maxTotalBytes) * 100));

  const uploadFile = useCallback(
    async (file: File) => {
      if (value.length >= MAX_FILES) {
        toast.error(`Maximal ${MAX_FILES} Anhänge pro Mail`);
        return;
      }
      if (file.size > remainingBytes) {
        toast.error(`Datei zu groß. Übrig: ${formatBytes(remainingBytes)}, Datei: ${formatBytes(file.size)}`);
        return;
      }

      setUploading(true);
      try {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/mail/upload-attachment', { method: 'POST', body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'upload_failed' }));
          toast.error(`Upload fehlgeschlagen: ${err.error ?? 'unbekannt'}`);
          return;
        }
        const att = (await res.json()) as MailAttachment;
        onChange([...value, att]);
        toast.success(`${att.filename} hochgeladen`);
      } catch (e) {
        toast.error(`Upload-Fehler: ${e instanceof Error ? e.message : 'unbekannt'}`);
      } finally {
        setUploading(false);
      }
    },
    [value, onChange, remainingBytes],
  );

  const onPickFiles = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const onFiles = useCallback(
    async (files: FileList | File[]) => {
      const arr = Array.from(files);
      for (const f of arr) {
        // Sequenziell, nicht parallel — sonst race on remainingBytes
        await uploadFile(f);
      }
    },
    [uploadFile],
  );

  const remove = useCallback(
    (idx: number) => {
      const next = value.filter((_, i) => i !== idx);
      onChange(next);
    },
    [value, onChange],
  );

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) {
            void onFiles(e.dataTransfer.files);
          }
        }}
        className={`flex items-center justify-between gap-3 rounded-md border-2 border-dashed px-4 py-3 transition-colors ${
          dragOver ? 'border-brand bg-brand/5' : 'border-border bg-background'
        }`}
      >
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <Paperclip size={15} />
          <span>
            Dateien hier ablegen oder Button klicken — PDF / Word / Excel / Bilder, max 15 MB pro Datei,
            10 Anhänge / 25 MB total.
          </span>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onPickFiles} disabled={uploading}>
          {uploading ? <Loader2 size={14} className="mr-1.5 animate-spin" /> : <Paperclip size={14} className="mr-1.5" />}
          {uploading ? 'Lade hoch...' : 'Datei wählen'}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp,.svg,.txt,.csv"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              void onFiles(e.target.files);
            }
            e.target.value = '';
          }}
        />
      </div>

      {value.length > 0 && (
        <>
          <ul className="mt-3 space-y-1.5">
            {value.map((att, idx) => (
              <li
                key={att.path}
                className="flex items-center gap-3 rounded-md border border-border bg-background px-3 py-2"
              >
                {fileIconFor(att.content_type)}
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-medium">{att.filename}</div>
                  <div className="text-[11px] text-muted-foreground">{formatBytes(att.size)}</div>
                </div>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  title="Entfernen"
                  className="text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <X size={15} />
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {value.length} Anhang{value.length === 1 ? '' : 'e'} · {formatBytes(totalBytes)} / {formatBytes(maxTotalBytes)}
            </span>
            <div className="h-1 w-32 overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full ${percentUsed > 80 ? 'bg-amber-500' : 'bg-brand'}`}
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
