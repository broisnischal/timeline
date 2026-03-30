import type { QueryClient } from "@tanstack/react-query";

import type { TaskListRow } from "@/components/timeline/task-list";
import { $createTask } from "@/lib/timeline/functions";
import { spacesQueryOptions } from "@/lib/timeline/queries";

type CreatedTask = Awaited<ReturnType<typeof $createTask>>;

type TaskFilters = { from?: string; to?: string; spaceId?: string };

function taskMatchesFilters(row: TaskListRow, filters: TaskFilters) {
  if (filters.spaceId && filters.spaceId !== row.spaceId) return false;
  const anchor = row.startsAt ?? row.dueAt ?? row.createdAt;
  if (!anchor) return true;
  const t = new Date(anchor).getTime();
  if (filters.from && t < new Date(filters.from).getTime()) return false;
  if (filters.to && t > new Date(filters.to).getTime()) return false;
  return true;
}

/** First matching task row from any cached `["tasks", …]` list (for instant task detail shell). */
export function findTaskInCachedLists(qc: QueryClient, taskId: string): TaskListRow | undefined {
  const entries = qc.getQueriesData<TaskListRow[]>({ queryKey: ["tasks"] });
  for (const [, data] of entries) {
    if (!Array.isArray(data)) continue;
    const found = data.find((t) => t.id === taskId);
    if (found) return found;
  }
  return undefined;
}

/** Optimistically insert a newly created task into matching `["tasks", …]` caches. */
export function mergeCreatedTaskIntoCaches(qc: QueryClient, created: CreatedTask) {
  const spaces = qc.getQueryData(spacesQueryOptions().queryKey);
  const sp = spaces?.find((s) => s.id === created.spaceId);
  const synthetic: TaskListRow = {
    ...created,
    spaceName: sp?.name ?? "",
    spaceColor: sp?.color ?? null,
  };
  const entries = qc.getQueriesData<TaskListRow[]>({ queryKey: ["tasks"] });
  for (const [key, old] of entries) {
    if (!old) continue;
    if (old.some((t) => t.id === synthetic.id)) continue;
    const filters =
      Array.isArray(key) && key[1] && typeof key[1] === "object" ? (key[1] as TaskFilters) : {};
    if (!taskMatchesFilters(synthetic, filters)) continue;
    qc.setQueryData(key, [...old, synthetic]);
  }
}
