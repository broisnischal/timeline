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

function monthLabelColumns(year: number, gridStart: Date, nWeeks: number) {
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

export function YearActivityWall({ hasUser }: { readonly hasUser: boolean }) {
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
    () => monthLabelColumns(year, gridStart, nWeeks),
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

  return (
    <section
      className={cn("border-t border-border/60 pt-8", hasUser && isPending && "opacity-60")}
      aria-label={`Activity in ${year}`}
    >
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-dashed pb-2 text-left text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
        <span>Year · {year}</span>
        <span className="font-normal tracking-normal normal-case">
          {hasUser && isPending ? "…" : meta}
        </span>
      </div>

      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="max-w-full min-w-[720px]">
          <div
            className="mb-1.5 grid gap-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase"
            style={{ gridTemplateColumns: `repeat(${nWeeks}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: nWeeks }, (_, col) => {
              const label = monthLabels.find((l) => l.col === col)?.label ?? "";
              return (
                <div key={col} className="truncate text-center">
                  {label}
                </div>
              );
            })}
          </div>
          <div
            className="grid gap-px bg-border/50 p-px"
            style={{
              gridTemplateColumns: `repeat(${nWeeks}, minmax(0, 1fr))`,
              gridTemplateRows: "repeat(7, minmax(0, 1fr))",
              gridAutoFlow: "column",
            }}
          >
            {days.map((d) => {
              if (!d.cell || !d.inYear) {
                return (
                  <div
                    key={d.key}
                    className="aspect-square min-h-[8px] bg-background opacity-0"
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
                  className={cn(
                    "relative aspect-square min-h-[8px] bg-background",
                    future && "bg-muted/30",
                    !future && lv === 0 && "bg-muted/40",
                    !future && lv === 1 && "bg-primary/20",
                    !future && lv === 2 && "bg-primary/35",
                    !future && lv === 3 && "bg-primary/55",
                    !future && lv === 4 && "bg-primary/75",
                    due && "outline outline-1 -outline-offset-1 outline-amber-500/70",
                    ongoing &&
                      !due &&
                      "outline outline-1 -outline-offset-1 outline-emerald-600/60 dark:outline-emerald-400/55",
                  )}
                >
                  {ongoing && due && !future ? (
                    <span
                      className="absolute right-px bottom-px size-1 bg-emerald-500 dark:bg-emerald-400"
                      aria-hidden
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-border/40 pt-4 text-xs text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-px bg-border/50 p-px">
          {[0, 1, 2, 3, 4].map((lv) => (
            <div
              key={lv}
              className={cn(
                "size-3 bg-background",
                lv === 0 && "bg-muted/40",
                lv === 1 && "bg-primary/20",
                lv === 2 && "bg-primary/35",
                lv === 3 && "bg-primary/55",
                lv === 4 && "bg-primary/75",
              )}
            />
          ))}
        </div>
        <span>More</span>
        <span className="text-foreground/25" aria-hidden>
          |
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 bg-primary/40 outline outline-1 -outline-offset-1 outline-amber-500/70" />
          Due
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block size-3 bg-primary/40 outline outline-1 -outline-offset-1 outline-emerald-600/60 dark:outline-emerald-400/55" />
          In progress
        </span>
      </div>
    </section>
  );
}
