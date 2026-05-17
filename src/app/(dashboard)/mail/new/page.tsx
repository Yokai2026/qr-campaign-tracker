'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Send, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function NewMailPage() {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [fromName, setFromName] = useState('David');
  const [fromEmail, setFromEmail] = useState('david@spurig.com');
  const [replyTo, setReplyTo] = useState('');
  const [recipientsText, setRecipientsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);

  function parseRecipients(): Array<{ email: string; name?: string }> {
    return recipientsText
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((line) => {
        // Format: "Name <email@x.de>" oder "email@x.de"
        const match = line.match(/^(.+?)\s*<(.+?)>$/);
        if (match) return { name: match[1].trim(), email: match[2].trim().toLowerCase() };
        return { email: line.toLowerCase() };
      })
      .filter((r) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
  }

  async function saveDraft(): Promise<string | null> {
    if (!subject.trim() || !bodyHtml.trim()) {
      toast.error('Betreff und Inhalt müssen ausgefüllt sein');
      return null;
    }
    setSaving(true);
    try {
      const r = await fetch('/api/mail/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body_html: bodyHtml,
          from_email: fromEmail,
          from_name: fromName,
          reply_to: replyTo || undefined,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Fehler beim Speichern');
      toast.success('Entwurf gespeichert');
      return j.campaign.id;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Fehler');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function sendNow(testOnly: boolean) {
    const recipients = parseRecipients();
    if (recipients.length === 0) {
      toast.error('Mindestens eine gültige Email-Adresse eingeben');
      return;
    }
    if (recipients.length > 100) {
      toast.error('Max 100 Empfänger pro Sendung (MVP-Limit)');
      return;
    }

    const id = await saveDraft();
    if (!id) return;

    setSending(true);
    const loadingId = toast.loading(`Sende ${testOnly ? '1 Test-Mail' : `${recipients.length} Mails`}...`);
    try {
      const r = await fetch(`/api/mail/campaigns/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, testOnly }),
      });
      const j = await r.json();
      toast.dismiss(loadingId);
      if (!r.ok) throw new Error(j.error ?? 'Send fehlgeschlagen');
      toast.success(`${j.sent} von ${j.total} versandt${j.failed ? `, ${j.failed} fehlgeschlagen` : ''}`);
      router.push(`/mail/${id}`);
    } catch (e) {
      toast.dismiss(loadingId);
      toast.error(e instanceof Error ? e.message : 'Send-Fehler');
    } finally {
      setSending(false);
    }
  }

  const recipientCount = parseRecipients().length;
  const busy = saving || sending;

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-8 lg:py-8">
      <Link
        href="/mail"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Zurück zur Liste
      </Link>

      <div className="mb-6 flex items-center gap-2">
        <Mail className="h-5 w-5 text-brand" />
        <h1 className="text-2xl font-semibold tracking-tight">Neue Mail-Kampagne</h1>
      </div>

      <div className="space-y-5">
        {/* Absender */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Absender</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-[12px]">Name</Label>
              <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="David" />
            </div>
            <div>
              <Label className="text-[12px]">Email</Label>
              <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} placeholder="david@spurig.com" />
            </div>
            <div className="sm:col-span-2">
              <Label className="text-[12px]">Reply-To (optional)</Label>
              <Input value={replyTo} onChange={(e) => setReplyTo(e.target.value)} placeholder="optional, leer = wie Absender" />
            </div>
          </div>
        </div>

        {/* Betreff + Body */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">Inhalt</h2>
          <div className="space-y-3">
            <div>
              <Label className="text-[12px]">Betreff</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="z.B. Update zu deiner Anfrage" />
            </div>
            <div>
              <Label className="text-[12px]">HTML-Body</Label>
              <textarea
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={14}
                placeholder={`<p>Hi {{name}},</p>\n<p>kurze Frage...</p>\n<p><a href="https://spurig.com/demo">Demo buchen</a></p>\n<p>Gruß<br>David</p>`}
                className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-[12.5px] leading-relaxed"
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                Platzhalter: <code className="rounded bg-muted px-1">{'{{name}}'}</code> wird pro Empfänger ersetzt.
                Alle <code className="rounded bg-muted px-1">&lt;a href&gt;</code>-Links werden automatisch mit Click-Tracking versehen.
              </p>
            </div>
          </div>
        </div>

        {/* Empfänger */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-3 text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            Empfänger {recipientCount > 0 && <span className="ml-2 text-brand">({recipientCount} gültige)</span>}
          </h2>
          <textarea
            value={recipientsText}
            onChange={(e) => setRecipientsText(e.target.value)}
            rows={8}
            placeholder={`max@beispiel.de\nLisa Schmidt <lisa@kunde.de>\ndevrim@startup.de`}
            className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 font-mono text-[12.5px] leading-relaxed"
          />
          <p className="mt-1.5 text-[11px] text-muted-foreground">
            Eine Email pro Zeile. Optional mit Name: <code className="rounded bg-muted px-1">Name &lt;email@x.de&gt;</code>.
            Max 100 pro Sendung.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => sendNow(true)} disabled={busy || recipientCount === 0}>
            {busy ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
            Test an mich (1 Mail)
          </Button>
          <Button variant="brand" size="lg" onClick={() => sendNow(false)} disabled={busy || recipientCount === 0}>
            {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
            An {recipientCount} Empfänger senden
          </Button>
          <Button variant="ghost" onClick={saveDraft} disabled={busy}>
            <Save className="mr-1.5 h-3.5 w-3.5" />
            Als Entwurf speichern
          </Button>
        </div>
      </div>
    </div>
  );
}
