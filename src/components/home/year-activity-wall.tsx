import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { yearActivityQueryOptions } from "@/lib/timeline/queries";
import type { YearActivityCell } from "@/lib/timeline/year-activity.types";
import { cn } from "@/lib/utils";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** GitHub-style square size + gap (px). Fixed columns avoid squashed month labels. */
const CELL_PX = 11;
const GAP_PX = 3;

function buildDemoCells(year: number): YearActivityCell[] {
  const cells: YearActivityCell[] = [];
  let seed = year * 1103515245 + 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let m = 0; m < 12; m++) {
    const dim = new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
    for (let d = 1; d <= dim; d++) {
      const day = new Date(Date.UTC(year, m, d));
      const key = day.toISOString().slice(0, 10);
      const r = rand();
      const completed = r < 0.62 ? 0 : r < 0.78 ? 1 : r < 0.88 ? 2 : r < 0.94 ? 3 : 4;
      const due = rand() < 0.028 ? 1 : 0;
      const ongoing = rand() < 0.035 ? 1 : 0;
      cells.push({ day: key, completed, due, ongoing });
    }
  }
  return cells;
}

function utcDayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function completionLevel(n: number, max: number): 0 | 1 | 2 | 3 | 4 {
  if (n <= 0 || max <= 0) return 0;
  const t = n / max;
  if (t <= 0.25) return 1;
  if (t <= 0.5) return 2;
  if (t <= 0.75) return 3;
  return 4;
}

type GridDay = {
  key: string;
  cell: YearActivityCell | null;
  inYear: boolean;
};

function buildGridDays(
  year: number,
  cellMap: Map<string, YearActivityCell>,
): { days: GridDay[]; gridStart: Date; nWeeks: number } {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dow = jan1.getUTCDay();
  const gridStart = new Date(jan1);
  gridStart.setUTCDate(jan1.getUTCDate() - dow);

  const dec31 = new Date(Date.UTC(year, 11, 31));
  const dowEnd = dec31.getUTCDay();
  const gridEnd = new Date(dec31);
  gridEnd.setUTCDate(dec31.getUTCDate() + (6 - dowEnd));

  const days: GridDay[] = [];
  const cur = new Date(gridStart);
  while (cur.getTime() <= gridEnd.getTime()) {
    const key = utcDayKey(cur);
    const inYear = key >= `${year}-01-01` && key <= `${year}-12-31`;
    const cell = inYear
      ? (cellMap.get(key) ?? { day: key, completed: 0, due: 0, ongoing: 0 })
      : null;
    days.push({ key, cell, inYear });
    cur.setUTCDate(cur.getUTCDate() + 1);
  }

  const nWeeks = Math.ceil(days.length / 7);
  return { days, gridStart, nWeeks };
}

function monthStartColumns(year: number, gridStart: Date, nWeeks: number) {
  const startMs = gridStart.getTime();
  const msDay = 86_400_000;
  const labels: { col: number; label: string }[] = [];
  for (let m = 0; m < 12; m++) {
    const first = new Date(Date.UTC(year, m, 1));
    const dayIndex = Math.floor((first.getTime() - startMs) / msDay);
    if (dayIndex < 0) continue;
    const col = Math.floor(dayIndex / 7);
    if (col < nWeeks) labels.push({ col, label: MONTHS[m]! });
  }
  return labels;
}

export function YearActivityWall({
  hasUser,
  variant = "default",
}: {
  readonly hasUser: boolean;
  readonly variant?: "default" | "minimal" | "focus";
}) {
  const compact = variant === "minimal" || variant === "focus";
  const year = new Date().getUTCFullYear();
  const { data, isPending } = useQuery({
    ...yearActivityQueryOptions(year),
    enabled: hasUser,
  });

  const cellMap = useMemo(() => {
    const m = new Map<string, YearActivityCell>();
    if (!hasUser) {
      for (const c of buildDemoCells(year)) {
        m.set(c.day, c);
      }
      return m;
    }
    for (const c of data?.cells ?? []) {
      m.set(c.day, c);
    }
    return m;
  }, [hasUser, data?.cells, year]);

  const todayKey = hasUser
    ? (data?.todayKey ?? new Date().toISOString().slice(0, 10))
    : new Date().toISOString().slice(0, 10);

  const { days, gridStart, nWeeks } = useMemo(() => buildGridDays(year, cellMap), [year, cellMap]);

  const maxCompleted = useMemo(() => {
    let max = 0;
    for (const d of days) {
      if (d.cell && d.inYear) max = Math.max(max, d.cell.completed);
    }
    return max;
  }, [days]);

  const monthLabels = useMemo(
    () => monthStartColumns(year, gridStart, nWeeks),
    [year, gridStart, nWeeks],
  );

  const totalDone = useMemo(() => {
    let n = 0;
    for (const d of days) {
      if (d.cell && d.inYear) n += d.cell.completed;
    }
    return n;
  }, [days]);

  const meta = hasUser
    ? `${totalDone} completed · due and in-progress days marked`
    : "Sample data · sign in for yours";

  const showDueOngoingChrome = variant === "default";
  const gridWidthPx = nWeeks * CELL_PX + Math.max(0, nWeeks - 1) * GAP_PX;

  return (
    <section
      className={cn(
        compact ? "pt-2" : "border-t border-border/60 pt-8",
        hasUser && isPending && "opacity-60",
      )}
      aria-label={`Activity in ${year}`}
    >
      <div
        className={cn(
          "mb-5 flex flex-wrap items-end justify-between gap-3 text-left",
          compact
            ? "border-b border-border/25 pb-3"
            : "border-b border-dashed border-border/60 pb-2",
        )}
      >
        <span
          className={cn(
            "text-[11px] font-medium text-muted-foreground",
            compact
              ? "tracking-[0.12em] uppercase"
              : "tracking-wide text-muted-foreground/80 uppercase",
          )}
        >
          {compact ? "Completions" : `Year · ${year}`}
        </span>
        <span
          className={cn(
            "text-muted-foreground",
            compact
              ? "text-[12px] tracking-tight tabular-nums"
              : "text-[11px] font-normal normal-case",
          )}
        >
          {hasUser && isPending ? "…" : compact ? `${totalDone} done` : meta}
        </span>
      </div>

      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div style={{ width: gridWidthPx, minWidth: gridWidthPx }}>
          <div
            className="flex"
            style={{ gap: GAP_PX, width: gridWidthPx, marginBottom: GAP_PX + 1 }}
          >
            {Array.from({ length: nWeeks }, (_, col) => {
              const label = monthLabels.find((l) => l.col === col)?.label;
              return (
                <div
                  key={col}
                  className="relative shrink-0 overflow-visible"
                  style={{ width: CELL_PX }}
                >
                  {label ? (
                    <span
                      className={cn(
                        "pointer-events-none absolute top-0 left-0 z-10 text-[10px] leading-none whitespace-nowrap text-muted-foreground select-none",
                        variant === "default" && "font-medium tracking-wide uppercase",
                        (variant === "minimal" || variant === "focus") &&
                          "font-medium tracking-tight",
                      )}
                    >
                      {label}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div
            className="grid rounded-sm bg-border/40 p-px"
            style={{
              width: gridWidthPx,
              gridTemplateColumns: `repeat(${nWeeks}, ${CELL_PX}px)`,
              gridTemplateRows: `repeat(7, ${CELL_PX}px)`,
              gap: GAP_PX,
              gridAutoFlow: "column",
            }}
          >
            {days.map((d) => {
              if (!d.cell || !d.inYear) {
                return (
                  <div
                    key={d.key}
                    className="rounded-[2px] bg-transparent opacity-0"
                    style={{ width: CELL_PX, height: CELL_PX }}
                    aria-hidden
                  />
                );
              }
              const future = d.key > todayKey;
              const lv = future ? 0 : completionLevel(d.cell.completed, maxCompleted);
              const due = d.cell.due > 0;
              const ongoing = d.cell.ongoing > 0;
              const title = `${d.key}${future ? " (upcoming)" : ""}\n${d.cell.completed} completed${due ? ` · ${d.cell.due} due` : ""}${ongoing ? ` · ${d.cell.ongoing} in progress` : ""}`;

              return (
                <div
                  key={d.key}
                  title={title}
                  style={{ width: CELL_PX, height: CELL_PX }}
                  className={cn(
                    "rounded-[2px]",
                    future && "bg-muted/35",
                    !future && lv === 0 && "bg-muted/50",
                    !future && lv === 1 && "bg-primary/25",
                    !future && lv === 2 && "bg-primary/40",
                    !future && lv === 3 && "bg-primary/58",
                    !future && lv === 4 && "bg-primary/78",
                    showDueOngoingChrome &&
                      due &&
                      "ring-1 ring-amber-500/55 ring-inset dark:ring-amber-400/45",
                    showDueOngoingChrome &&
                      ongoing &&
                      !due &&
                      "ring-1 ring-emerald-600/45 ring-inset dark:ring-emerald-400/40",
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div
        className={cn(
          "mt-5 flex flex-wrap items-center gap-y-1 text-[11px] text-muted-foreground",
          compact
            ? "gap-x-3 border-t border-border/20 pt-3"
            : "gap-x-5 border-t border-border/40 pt-4 text-xs",
        )}
      >
        <span>Less</span>
        <div className="flex gap-px rounded-sm bg-border/45 p-px">
          {[0, 1, 2, 3, 4].map((lv) => (
            <div
              key={lv}
              className={cn(
                compact ? "size-2.5" : "size-3",
                "rounded-[2px] bg-background",
                lv === 0 && "bg-muted/50",
                lv === 1 && "bg-primary/25",
                lv === 2 && "bg-primary/40",
                lv === 3 && "bg-primary/58",
                lv === 4 && "bg-primary/78",
              )}
            />
          ))}
        </div>
        <span>More</span>
        {showDueOngoingChrome ? (
          <>
            <span className="text-foreground/20" aria-hidden>
              |
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-[2px] bg-primary/35 ring-1 ring-amber-500/55 ring-inset" />
              Due
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block size-3 rounded-[2px] bg-primary/35 ring-1 ring-emerald-600/45 ring-inset dark:ring-emerald-400/40" />
              In progress
            </span>
          </>
        ) : null}
      </div>
    </section>
  );
}
