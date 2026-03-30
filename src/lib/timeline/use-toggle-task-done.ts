import { useMutation, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";

import type { TaskListRow } from "@/components/timeline/task-list";
import { celebrateTaskDone } from "@/lib/confetti/celebrate-task-done";
import { $toggleTaskDone } from "@/lib/timeline/functions";
import { taskQueryOptions } from "@/lib/timeline/queries";

type ToggleServerRow = Awaited<ReturnType<typeof $toggleTaskDone>>;

function applyToggleOptimistic(row: TaskListRow): TaskListRow {
  const nextStatus = row.status === "done" ? "todo" : "done";
  const now = new Date().toISOString();
  return {
    ...row,
    status: nextStatus,
    completedAt: nextStatus === "done" ? now : null,
    updatedAt: now,
  } as unknown as TaskListRow;
}

function mergeTaskWithToggleServer(row: TaskListRow, server: ToggleServerRow): TaskListRow {
  return {
    ...row,
    ...server,
    spaceName: row.spaceName,
    spaceColor: row.spaceColor,
  };
}

type ToggleContext = {
  readonly previousTasks: [QueryKey, unknown][];
  readonly previousTask: TaskListRow | undefined;
};

export function useToggleTaskDone() {
  const qc = useQueryClient();
  const mutation = useMutation<ToggleServerRow, Error, string, ToggleContext>({
    mutationFn: (id: string) => $toggleTaskDone({ data: { id } }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });
      await qc.cancelQueries({ queryKey: ["task", id] });
      const previousTasks = qc.getQueriesData({ queryKey: ["tasks"] });
      const previousTask = qc.getQueryData<TaskListRow | undefined>(taskQueryOptions(id).queryKey);
      qc.setQueriesData<TaskListRow[]>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return old;
        return old.map((t) => (t.id === id ? applyToggleOptimistic(t) : t));
      });
      qc.setQueryData<TaskListRow>(taskQueryOptions(id).queryKey, (old) =>
        old ? applyToggleOptimistic(old) : old,
      );
      return { previousTasks, previousTask };
    },
    onError: (err, id, ctx) => {
      if (ctx) {
        for (const [key, data] of ctx.previousTasks) {
          qc.setQueryData(key, data);
        }
        qc.setQueryData(taskQueryOptions(id).queryKey, ctx.previousTask);
      }
      toast.error(err instanceof Error ? err.message : "Could not update task");
    },
    onSuccess: (server, id) => {
      qc.setQueriesData<TaskListRow[]>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return old;
        return old.map((t) => (t.id === id ? mergeTaskWithToggleServer(t, server) : t));
      });
      qc.setQueryData<TaskListRow>(taskQueryOptions(id).queryKey, (old) =>
        old ? mergeTaskWithToggleServer(old, server) : old,
      );
      void qc.invalidateQueries({ queryKey: ["streak"] });
      if (server.status === "done") {
        celebrateTaskDone();
        toast.success("Task completed");
      } else {
        toast.message("Marked as to-do");
      }
    },
  });

  const isPendingFor = (taskId: string) => mutation.isPending && mutation.variables === taskId;

  return { ...mutation, isPendingFor };
}
