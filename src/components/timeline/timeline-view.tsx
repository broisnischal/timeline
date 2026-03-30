import type { TaskListRow } from "@/components/timeline/task-list";
import { TaskList } from "@/components/timeline/task-list";
import { cn } from "@/lib/utils";

/** Local calendar day (YYYY-MM-DD) for grouping and labels. */
function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function anchor(row: TaskListRow): Date {
  const s = row.startsAt ? new Date(row.startsAt) : null;
  const du = row.dueAt ? new Date(row.dueAt) : null;
  const c = row.createdAt ? new Date(row.createdAt) : new Date();
  return s ?? du ?? c;
}

function groupTasksByDay(rows: TaskListRow[]) {
  const map = new Map<string, TaskListRow[]>();
  for (const r of rows) {
    const k = dayKey(anchor(r));
    const list = map.get(k) ?? [];
    list.push(r);
    map.set(k, list);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function groupBySpace(rows: TaskListRow[]) {
  const map = new Map<string, TaskListRow[]>();
  for (const r of rows) {
    const name = r.spaceName ?? "Uncategorized";
    const list = map.get(name) ?? [];
    list.push(r);
    map.set(name, list);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

const headingFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

function parseLocalDay(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function isTodayDay(day: string) {
  const now = new Date();
  const k = dayKey(now);
  return day === k;
}

export function TimelineView({ tasks }: { readonly tasks: TaskListRow[] }) {
  const grouped = groupTasksByDay(tasks);
  if (grouped.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Nothing in this window. Widen the range above or add tasks from Home.
      </p>
    );
  }

  return (
    <div className="space-y-14">
      {grouped.map(([day, dayTasks]) => {
        const today = isTodayDay(day);
        return (
          <section key={day} className="relative">
            <div
              className="absolute top-9 bottom-0 left-[7px] w-px bg-gradient-to-b from-border/80 via-border/40 to-transparent max-sm:hidden"
              aria-hidden
            />
            <div className="mb-6 flex flex-wrap items-center gap-2.5">
              <span
                className={cn(
                  "relative z-10 size-2.5 shrink-0 rounded-full bg-background ring-1 ring-border/60 transition-[box-shadow,background-color] duration-300 ease-out",
                  today && "bg-primary ring-2 ring-primary/45",
                )}
              />
              <h3 className="text-base font-semibold tracking-tight text-foreground">
                {headingFmt.format(parseLocalDay(day))}
              </h3>
              {today ? (
                <span className="rounded-full bg-foreground/8 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Today
                </span>
              ) : null}
            </div>
            <div className="space-y-8 sm:pl-6">
              {groupBySpace(dayTasks).map(([spaceName, list]) => (
                <div key={spaceName}>
                  <p className="mb-2 text-[11px] font-medium tracking-wide text-muted-foreground/90 uppercase">
                    {spaceName}
                  </p>
                  <TaskList compact tasks={list} />
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
