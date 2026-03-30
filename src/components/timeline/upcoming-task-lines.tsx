import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { TaskListRow } from "@/components/timeline/task-list";
import { TimelineFeedRow } from "@/components/timeline/timeline-feed-row";
import { $toggleTaskDone } from "@/lib/timeline/functions";

export function UpcomingTaskLines({
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

  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nothing here yet. Add a task above.
      </p>
    );
  }

  return (
    <div className="relative">
      <div
        className="absolute top-6 bottom-6 left-[19px] w-px bg-border/70 max-sm:hidden"
        aria-hidden
      />
      <ul className="divide-y divide-border/50">
        {tasks.map((row) => (
          <li key={row.id} className="py-4 first:pt-0 last:pb-0 sm:py-5">
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
  );
}
