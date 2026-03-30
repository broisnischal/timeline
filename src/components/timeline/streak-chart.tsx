type SeriesPoint = { day: string; count: number };

export function StreakChart({
  series,
  streak,
}: {
  readonly series: SeriesPoint[];
  readonly streak: number;
}) {
  const max = Math.max(1, ...series.map((s) => s.count));
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Activity
          </p>
          <p className="text-2xl font-semibold tabular-nums">
            {streak} day{streak === 1 ? "" : "s"}
          </p>
          <p className="text-xs text-muted-foreground">Consecutive days with a completed task</p>
        </div>
      </div>
      <div className="flex h-14 items-end gap-0.5">
        {series.map((s) => {
          const h = s.count === 0 ? 6 : Math.max(10, (s.count / max) * 100);
          return (
            <div
              key={s.day}
              className="min-w-[6px] flex-1 rounded-sm bg-primary/25 transition-colors hover:bg-primary/40"
              style={{ height: `${h}%` }}
              title={`${s.day}: ${s.count} completed`}
            />
          );
        })}
      </div>
    </div>
  );
}
