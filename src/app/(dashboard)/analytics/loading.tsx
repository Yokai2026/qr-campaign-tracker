export default function AnalyticsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-5 w-24 rounded bg-muted" />
          <div className="mt-1.5 h-4 w-52 rounded bg-muted/60" />
        </div>
        <div className="h-8 w-28 rounded-md bg-muted" />
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-3 w-12 rounded bg-muted" />
              <div className="h-8 w-full rounded-md bg-muted/60" />
            </div>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-4 w-4 rounded bg-muted/60" />
            </div>
            <div className="mt-3 h-6 w-14 rounded bg-muted" />
            <div className="mt-1.5 h-2.5 w-28 rounded bg-muted/40" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card lg:col-span-2">
          <div className="border-b border-border px-4 py-3">
            <div className="h-4 w-40 rounded bg-muted" />
          </div>
          <div className="p-4">
            <div className="h-[280px] rounded bg-muted/30" />
          </div>
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
            <div className="p-4">
              <div className="h-[280px] rounded bg-muted/30" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
