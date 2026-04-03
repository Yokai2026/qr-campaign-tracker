export default function LocationsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-5 w-28 rounded bg-muted" />
          <div className="mt-1.5 h-4 w-52 rounded bg-muted/60" />
        </div>
        <div className="h-8 w-36 rounded-md bg-muted" />
      </div>
      <div className="flex gap-3">
        <div className="h-8 w-36 rounded-md bg-muted/60" />
        <div className="h-8 w-36 rounded-md bg-muted/60" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex gap-6 border-b border-border bg-muted/40 px-4 py-3">
          {[20, 16, 12, 12, 20].map((w, i) => (
            <div key={i} className="h-3 rounded bg-muted" style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-border/60 px-4 py-3">
            <div>
              <div className="h-3 w-28 rounded bg-muted/60" />
              <div className="mt-1.5 h-2.5 w-40 rounded bg-muted/30" />
            </div>
            <div className="h-3 w-16 rounded bg-muted/40" />
            <div className="h-3 w-16 rounded bg-muted/40" />
            <div className="h-3 w-12 rounded bg-muted/40" />
            <div className="h-3 w-8 rounded bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
