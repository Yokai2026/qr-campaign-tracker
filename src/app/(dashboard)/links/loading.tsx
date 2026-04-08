export default function LinksLoading() {
  return (
    <div className="space-y-6 animate-shimmer">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-5 w-28 rounded bg-muted" />
          <div className="mt-1.5 h-4 w-72 rounded bg-muted/60" />
        </div>
        <div className="h-8 w-32 rounded-md bg-muted" />
      </div>
      {/* Tabs skeleton */}
      <div className="flex gap-1 rounded-xl bg-muted p-1 w-fit">
        <div className="h-7 w-28 rounded-lg bg-background" />
        <div className="h-7 w-36 rounded-lg bg-muted/60" />
      </div>
      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex gap-6 border-b border-border bg-muted/40 px-4 py-3">
          {[24, 16, 40, 20, 16, 12, 14, 16].map((w, i) => (
            <div key={i} className="h-3 rounded bg-muted" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-border/60 px-4 py-3">
            <div className="h-3 w-24 rounded bg-muted/60" />
            <div className="h-3 w-16 rounded bg-muted/40" />
            <div className="h-3 w-40 rounded bg-muted/40" />
            <div className="h-3 w-20 rounded bg-muted/40" />
            <div className="h-3 w-16 rounded bg-muted/40" />
            <div className="h-3 w-12 rounded bg-muted/40" />
            <div className="h-3 w-14 rounded bg-muted/40" />
            <div className="ml-auto h-3 w-16 rounded bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
