import { cn } from "@/lib/utils";

/** Skeleton rows for upcoming / timeline lists — matches line layout height to avoid CLS. */
export function UpcomingTasksShimmer({
  rows = 6,
  className,
}: {
  readonly rows?: number;
  readonly className?: string;
}) {
  return (
    <div className={cn("divide-y divide-border/40", className)} aria-hidden>
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="grid grid-cols-[2.5rem_3px_minmax(0,1fr)] gap-x-3 py-3.5 first:pt-0 last:pb-0 sm:gap-x-4 sm:py-4"
        >
          <div className="flex justify-center pt-0.5">
            <div className="timeline-shimmer-bg size-2 rounded-full bg-muted" />
          </div>
          <div className="timeline-shimmer-bg w-[3px] self-stretch rounded-full bg-muted/80" />
          <div className="min-w-0 space-y-2 pt-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <div className="timeline-shimmer-bg h-4 max-w-[60%] flex-1 rounded-sm bg-muted" />
              <div className="timeline-shimmer-bg size-4 shrink-0 rounded-sm bg-muted/80" />
            </div>
            <div className="timeline-shimmer-bg h-3 max-w-[85%] rounded-sm bg-muted/70" />
            <div className="timeline-shimmer-bg h-3 max-w-[40%] rounded-sm bg-muted/60" />
          </div>
        </div>
      ))}
    </div>
  );
}
