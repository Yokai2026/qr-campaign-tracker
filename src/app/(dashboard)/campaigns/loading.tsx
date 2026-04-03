export default function CampaignsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div>
          <div className="h-5 w-32 rounded bg-muted" />
          <div className="mt-1.5 h-4 w-64 rounded bg-muted/60" />
        </div>
        <div className="h-8 w-36 rounded-md bg-muted" />
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex gap-6 border-b border-border bg-muted/40 px-4 py-3">
          {[28, 20, 16, 16, 16, 12, 20].map((w, i) => (
            <div key={i} className={`h-3 rounded bg-muted`} style={{ width: `${w * 4}px` }} />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-6 border-b border-border/60 px-4 py-3">
            <div className="h-3 w-32 rounded bg-muted/60" />
            <div className="h-3 w-20 rounded bg-muted/40" />
            <div className="h-3 w-14 rounded bg-muted/40" />
            <div className="h-3 w-16 rounded bg-muted/40" />
            <div className="h-3 w-16 rounded bg-muted/40" />
            <div className="h-3 w-8 rounded bg-muted/40" />
            <div className="ml-auto h-3 w-16 rounded bg-muted/40" />
          </div>
        ))}
      </div>
    </div>
  );
}
