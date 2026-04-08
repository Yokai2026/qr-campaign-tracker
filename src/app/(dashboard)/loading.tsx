export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-shimmer">
      <div>
        <div className="h-6 w-52 rounded bg-muted" />
        <div className="mt-2 h-4 w-72 rounded bg-muted/60" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 rounded bg-muted" />
              <div className="h-4 w-4 rounded bg-muted/60" />
            </div>
            <div className="mt-3 h-6 w-14 rounded bg-muted" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <div className="h-4 w-32 rounded bg-muted" />
            </div>
            <div className="space-y-0 divide-y divide-border/60">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="px-4 py-3">
                  <div className="h-4 w-40 rounded bg-muted/60" />
                  <div className="mt-1.5 h-3 w-24 rounded bg-muted/30" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
