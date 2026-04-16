export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-shimmer">
      <div>
        <div className="h-5 w-32 rounded bg-muted" />
        <div className="mt-1.5 h-4 w-56 rounded bg-muted/60" />
      </div>
      {/* Profile card skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-4 w-16 rounded bg-muted" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="h-3 w-12 rounded bg-muted/60" />
            <div className="h-9 w-full rounded-md bg-muted/40" />
          </div>
          <div className="space-y-1.5">
            <div className="h-3 w-20 rounded bg-muted/60" />
            <div className="h-9 w-full rounded-md bg-muted/40" />
          </div>
        </div>
        <div className="h-8 w-24 rounded-md bg-muted" />
      </div>
      {/* Tracking script card skeleton */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="h-4 w-4 rounded bg-muted" />
          <div className="h-4 w-28 rounded bg-muted" />
        </div>
        <div className="h-20 w-full rounded-md bg-muted/30" />
      </div>
    </div>
  );
}
