import type { TaskListRow } from "@/components/timeline/task-list";
import { TimelineFeedRow } from "@/components/timeline/timeline-feed-row";
import type { AppSearch } from "@/lib/timeline/app-search";
import { useToggleTaskDone } from "@/lib/timeline/use-toggle-task-done";

export function UpcomingTaskLines({
  tasks,
  search,
}: {
  readonly tasks: TaskListRow[];
  readonly search: AppSearch;
}) {
  const toggle = useToggleTaskDone();

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
        className="pointer-events-none absolute top-0 bottom-0 left-5 z-0 w-px bg-border/70 max-sm:hidden"
        aria-hidden
      />
      <ul className="relative z-[1] divide-y divide-border/50">
        {tasks.map((row) => (
          <li key={row.id} className="py-4 first:pt-0 last:pb-0 sm:py-5">
            <TimelineFeedRow
              row={row}
              search={search}
              onToggleDone={(id) => toggle.mutate(id)}
              togglePending={toggle.isPendingFor(row.id)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
