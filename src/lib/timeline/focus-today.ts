import type { TaskListRow } from "@/components/timeline/task-list";

function utcDayBounds() {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999),
  );
  return { start, end };
}

function parseTime(x: string | Date | null | undefined): number | null {
  if (x == null) return null;
  const d = typeof x === "string" ? new Date(x) : x;
  return Number.isNaN(d.getTime()) ? null : d.getTime();
}

/** Whether the task is completed today, or an open todo whose window overlaps today (UTC). */
export function isTaskTouchingToday(row: TaskListRow): boolean {
  const { start, end } = utcDayBounds();
  const lo = start.getTime();
  const hi = end.getTime();

  if (row.status === "cancelled") return false;

  if (row.status === "done" && row.completedAt) {
    const c = parseTime(row.completedAt);
    return c != null && c >= lo && c <= hi;
  }
  if (row.status === "done") return false;

  const startAnchor = parseTime(row.startsAt) ?? parseTime(row.createdAt) ?? 0;
  const endAnchor = parseTime(row.dueAt) ?? Number.POSITIVE_INFINITY;
  return startAnchor <= hi && endAnchor >= lo;
}

function anchor(row: TaskListRow): Date {
  const s = row.startsAt ? new Date(row.startsAt) : null;
  const du = row.dueAt ? new Date(row.dueAt) : null;
  const c = row.createdAt ? new Date(row.createdAt) : new Date();
  return s ?? du ?? c;
}

export function sortTodayTasks(rows: TaskListRow[]): TaskListRow[] {
  return [...rows].sort((a, b) => {
    const aDone = a.status === "done";
    const bDone = b.status === "done";
    if (aDone && !bDone) return 1;
    if (!aDone && bDone) return -1;
    if (aDone && bDone) {
      const ac = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const bc = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return bc - ac;
    }
    return anchor(a).getTime() - anchor(b).getTime();
  });
}
