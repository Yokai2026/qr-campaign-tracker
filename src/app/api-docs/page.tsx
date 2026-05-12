import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'API-Dokumentation · Spurig',
  description: 'Public REST API für QR-Codes, Kurzlinks, Kampagnen und Analytics. Authentifizierung über Bearer-Tokens.',
  robots: { index: true, follow: true },
};

type Endpoint = {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  summary: string;
  body?: string;
  example?: string;
  query?: { name: string; desc: string }[];
};

const ENDPOINTS: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/v1/me',
    summary: 'Aktuelle User-Info zurückgeben.',
    example: `curl https://spurig.com/api/v1/me \\
  -H "Authorization: Bearer spr_live_..."`,
  },
  {
    method: 'GET',
    path: '/api/v1/campaigns',
    summary: 'Liste aller Kampagnen des Owners. Paginiert.',
    query: [
      { name: 'page', desc: 'Seitennummer, Default 1' },
      { name: 'per_page', desc: 'Einträge pro Seite, 1-100, Default 25' },
    ],
    example: `curl https://spurig.com/api/v1/campaigns?page=1 \\
  -H "Authorization: Bearer spr_live_..."`,
  },
  {
    method: 'POST',
    path: '/api/v1/campaigns',
    summary: 'Neue Kampagne anlegen.',
    body: `{
  "name": "Sommer 2026",
  "description": "Strand-Promo",
  "status": "active",
  "start_date": "2026-06-01",
  "end_date": "2026-08-31"
}`,
    example: `curl -X POST https://spurig.com/api/v1/campaigns \\
  -H "Authorization: Bearer spr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Sommer 2026"}'`,
  },
  {
    method: 'GET',
    path: '/api/v1/campaigns/{id}',
    summary: 'Eine Kampagne lesen.',
  },
  {
    method: 'PATCH',
    path: '/api/v1/campaigns/{id}',
    summary: 'Kampagne aktualisieren. Felder: name, slug, description, status, start_date, end_date.',
    body: `{ "name": "Neuer Name", "status": "archived" }`,
  },
  {
    method: 'DELETE',
    path: '/api/v1/campaigns/{id}',
    summary: 'Kampagne löschen.',
  },
  {
    method: 'GET',
    path: '/api/v1/qr-codes',
    summary: 'Liste aller QR-Codes des Owners.',
    query: [
      { name: 'page', desc: 'Seitennummer' },
      { name: 'per_page', desc: 'Einträge pro Seite (1-100)' },
      { name: 'placement_id', desc: 'Optionaler Placement-Filter' },
    ],
  },
  {
    method: 'POST',
    path: '/api/v1/qr-codes',
    summary: 'Neuen QR-Code anlegen. short_code wird auto-generiert wenn nicht angegeben.',
    body: `{
  "target_url": "https://spurig.com/landing",
  "title": "Sommer-Plakat",
  "utm_source": "print",
  "utm_medium": "qr",
  "utm_campaign": "sommer2026",
  "qr_fg_color": "#000000",
  "qr_bg_color": "#FFFFFF"
}`,
    example: `curl -X POST https://spurig.com/api/v1/qr-codes \\
  -H "Authorization: Bearer spr_live_..." \\
  -H "Content-Type: application/json" \\
  -d '{"target_url":"https://example.com","title":"Test"}'`,
  },
  {
    method: 'GET',
    path: '/api/v1/qr-codes/{id}',
    summary: 'Einen QR-Code lesen.',
  },
  {
    method: 'PATCH',
    path: '/api/v1/qr-codes/{id}',
    summary: 'QR-Code aktualisieren. Felder: target_url, active, valid_from, valid_until, note, title, utm_*, qr_fg_color, qr_bg_color, max_scans, short_host, placement_id.',
  },
  {
    method: 'DELETE',
    path: '/api/v1/qr-codes/{id}',
    summary: 'QR-Code löschen.',
  },
  {
    method: 'GET',
    path: '/api/v1/qr-codes/{id}/png',
    summary: 'Live-PNG des QR-Codes. Query "size" (64-2048, Default 512).',
    query: [
      { name: 'size', desc: 'Pixel-Größe, 64-2048, Default 512' },
    ],
    example: `curl https://spurig.com/api/v1/qr-codes/{id}/png?size=1024 \\
  -H "Authorization: Bearer spr_live_..." \\
  -o qr.png`,
  },
  {
    method: 'GET',
    path: '/api/v1/links',
    summary: 'Liste aller Kurzlinks.',
    query: [
      { name: 'campaign_id', desc: 'Optionaler Kampagnen-Filter' },
      { name: 'archived', desc: 'true|false zum Filtern' },
      { name: 'page / per_page', desc: 'Pagination' },
    ],
  },
  {
    method: 'POST',
    path: '/api/v1/links',
    summary: 'Neuen Kurzlink anlegen.',
    body: `{
  "target_url": "https://example.com/long/path",
  "title": "Newsletter Mai",
  "utm_source": "email",
  "campaign_id": "<optional>"
}`,
  },
  {
    method: 'PATCH',
    path: '/api/v1/links/{id}',
    summary: 'Kurzlink aktualisieren.',
  },
  {
    method: 'DELETE',
    path: '/api/v1/links/{id}',
    summary: 'Kurzlink löschen.',
  },
  {
    method: 'GET',
    path: '/api/v1/analytics',
    summary: 'Aggregierte Analytics. Liefert KPIs, Zeitreihe, Top-Länder, Top-Geräte.',
    query: [
      { name: 'from', desc: 'ISO-Date (YYYY-MM-DD), Default = heute - 30 Tage' },
      { name: 'to', desc: 'ISO-Date, Default = heute' },
      { name: 'campaign_id', desc: 'Optionaler Kampagnen-Filter' },
      { name: 'source', desc: '"qr" | "link" | "all" (Default all)' },
    ],
    example: `curl "https://spurig.com/api/v1/analytics?from=2026-04-01&to=2026-04-30" \\
  -H "Authorization: Bearer spr_live_..."`,
  },
];

function MethodBadge({ method }: { method: Endpoint['method'] }) {
  const colors: Record<Endpoint['method'], string> = {
    GET: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    POST: 'bg-brand/15 text-brand border-brand/30',
    PATCH: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    DELETE: 'bg-red-500/15 text-red-300 border-red-500/30',
  };
  return (
    <span className={`inline-block rounded-md border px-2 py-0.5 text-[11px] font-mono font-semibold tracking-wider ${colors[method]}`}>
      {method}
    </span>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">

        <header className="mb-10 border-b border-border pb-8">
          <p className="text-[12px] uppercase tracking-[0.12em] text-muted-foreground">Public API</p>
          <h1 className="mt-2 text-[28px] font-semibold tracking-tight">Spurig REST API</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Steuere QR-Codes, Kurzlinks, Kampagnen und Analytics programmatisch — z.B. aus einem KI-Agenten,
            einer n8n-Pipeline oder einem eigenen Backend. Authentifizierung über Bearer-Tokens, die du in den{' '}
            <a className="text-brand hover:underline" href="/settings?tab=integrations">Einstellungen unter Entwickler</a> erstellst.
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-[18px] font-semibold tracking-tight">Authentifizierung</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Alle Endpoints erwarten einen <code className="rounded bg-muted px-1.5 py-0.5 text-[12.5px]">Authorization: Bearer spr_live_…</code> Header.
            Token-Format: <code className="text-[12.5px]">spr_live_</code> + 32 zufällige Zeichen. Ein Token wird genau einmal beim Erstellen angezeigt — danach nur noch der Prefix.
          </p>
          <pre className="mt-3 overflow-x-auto rounded-xl border border-border bg-muted/30 p-4 text-[12.5px] font-mono leading-relaxed">
            <code>{`curl https://spurig.com/api/v1/me \\
  -H "Authorization: Bearer spr_live_yourTokenHere"`}</code>
          </pre>
        </section>

        <section className="mb-10">
          <h2 className="text-[18px] font-semibold tracking-tight">Rate-Limit</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            100 Requests pro Minute pro Token. Bei Überschreitung kommt <code className="text-[12.5px]">429</code> mit{' '}
            <code className="text-[12.5px]">Retry-After</code> Header in Sekunden.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-[18px] font-semibold tracking-tight">Response-Format</h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Erfolg: <code className="text-[12.5px]">{`{ "data": ... }`}</code>, Listen zusätzlich mit{' '}
            <code className="text-[12.5px]">{`{ "data": [...], "pagination": { "page", "per_page", "total" } }`}</code>.
            Fehler: <code className="text-[12.5px]">{`{ "error": { "message": "...", "code": "..." } }`}</code> mit passendem HTTP-Status (400, 401, 404, 429, 500).
          </p>
        </section>

        <section>
          <h2 className="text-[18px] font-semibold tracking-tight">Endpoints</h2>
          <div className="mt-5 space-y-6">
            {ENDPOINTS.map((ep, i) => (
              <article key={i} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-center gap-3">
                  <MethodBadge method={ep.method} />
                  <code className="text-[13px] font-mono">{ep.path}</code>
                </div>
                <p className="mt-2 text-[14px] leading-relaxed">{ep.summary}</p>

                {ep.query && (
                  <div className="mt-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Query-Parameter</p>
                    <ul className="mt-1 space-y-0.5">
                      {ep.query.map((q, j) => (
                        <li key={j} className="text-[13px] text-muted-foreground">
                          <code className="text-foreground">{q.name}</code> — {q.desc}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {ep.body && (
                  <div className="mt-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Request-Body</p>
                    <pre className="mt-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-[12px] font-mono">
                      <code>{ep.body}</code>
                    </pre>
                  </div>
                )}

                {ep.example && (
                  <div className="mt-3">
                    <p className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">Beispiel</p>
                    <pre className="mt-1 overflow-x-auto rounded-lg border border-border bg-muted/30 p-3 text-[12px] font-mono">
                      <code>{ep.example}</code>
                    </pre>
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-border pt-6 text-[12px] text-muted-foreground">
          Fragen? Schreib uns an <a className="text-brand hover:underline" href="mailto:support@spurig.com">support@spurig.com</a>.
        </footer>
      </div>
    </div>
  );
}
