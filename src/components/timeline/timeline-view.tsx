import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { TaskListRow } from "@/components/timeline/task-list";
import { TimelineFeedRow } from "@/components/timeline/timeline-feed-row";
import { $toggleTaskDone } from "@/lib/timeline/functions";
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

function startOfTodayLocal() {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return n;
}

function sortKey(row: TaskListRow) {
  const du = row.dueAt ? new Date(row.dueAt).getTime() : Number.POSITIVE_INFINITY;
  const st = row.startsAt ? new Date(row.startsAt).getTime() : Number.POSITIVE_INFINITY;
  const cr = row.createdAt ? new Date(row.createdAt).getTime() : 0;
  return Math.min(du, st, cr);
}

function isOverdue(row: TaskListRow) {
  if (row.status !== "todo") return false;
  if (!row.dueAt) return false;
  return new Date(row.dueAt) < startOfTodayLocal();
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

const dateHeadingFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
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

export function TimelineView({
  tasks,
  search,
}: {
  readonly tasks: TaskListRow[];
  readonly search: Record<string, unknown>;
}) {
  const qc = useQueryClient();
  const toggle = useMutation({
    mutationFn: (id: string) => $toggleTaskDone({ data: { id } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["streak"] });
    },
  });

  const overdue = tasks.filter(isOverdue).sort((a, b) => sortKey(a) - sortKey(b));
  const overdueIds = new Set(overdue.map((r) => r.id));
  const calendarTasks = tasks.filter((r) => !overdueIds.has(r.id));
  const grouped = groupTasksByDay(calendarTasks);

  if (grouped.length === 0 && overdue.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-muted-foreground">
        Nothing in this range yet. Add a task above or load samples.
      </p>
    );
  }

  return (
    <div className="space-y-14">
      {overdue.length > 0 ? (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between gap-3 border-b border-border/60 pb-3">
            <h2 className="text-base font-semibold tracking-tight text-destructive">Overdue</h2>
            <span className="text-xs text-muted-foreground tabular-nums">{overdue.length}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Due before today — open a task to reschedule or finish.
          </p>
          <div className="relative">
            <div
              className="absolute top-8 bottom-4 left-[19px] w-px bg-border/80 max-sm:hidden"
              aria-hidden
            />
            <ul className="divide-y divide-border/50">
              {overdue.map((row) => (
                <li key={row.id} className="py-5 first:pt-0 last:pb-0">
                  <TimelineFeedRow
                    row={row}
                    search={search}
                    onToggleDone={(id) => toggle.mutate(id)}
                    togglePending={toggle.isPending}
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {grouped.length > 0 ? (
        <div className="space-y-12">
          {grouped.map(([day, dayTasks]) => {
            const today = isTodayDay(day);
            const sorted = [...dayTasks].sort((a, b) => anchor(a).getTime() - anchor(b).getTime());
            return (
              <section key={day} className="space-y-4">
                <div className="border-b border-border/60 pb-3">
                  <h2
                    className={cn(
                      "text-base font-semibold tracking-tight",
                      today ? "text-primary" : "text-foreground",
                    )}
                  >
                    {dateHeadingFmt.format(parseLocalDay(day))}
                  </h2>
                  {today ? (
                    <p className="mt-0.5 text-xs font-medium text-muted-foreground">Today</p>
                  ) : null}
                </div>
                <div className="relative">
                  <div
                    className="absolute top-8 bottom-4 left-[19px] w-px bg-border/80 max-sm:hidden"
                    aria-hidden
                  />
                  <ul className="divide-y divide-border/50">
                    {sorted.map((row) => (
                      <li key={row.id} className="py-5 first:pt-0 last:pb-0">
                        <TimelineFeedRow
                          row={row}
                          search={search}
                          onToggleDone={(id) => toggle.mutate(id)}
                          togglePending={toggle.isPending}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border/60 bg-muted/15 px-4 py-8 text-center text-sm text-muted-foreground">
          Everything else is caught up — only overdue items need attention right now.
        </p>
      )}
    </div>
  );
}
