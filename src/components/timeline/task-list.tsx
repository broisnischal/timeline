import { TaskDoneCheckbox } from "@/components/timeline/task-done-checkbox";
import { $listTasks } from "@/lib/timeline/functions";
import { useToggleTaskDone } from "@/lib/timeline/use-toggle-task-done";

export type TaskListRow = Awaited<ReturnType<typeof $listTasks>>[number];

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function formatDay(d: Date | string | null | undefined) {
  if (d == null) return null;
  const dt = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(dt.getTime())) return null;
  return dateFmt.format(dt);
}

export function TaskList({
  tasks,
  compact,
}: {
  readonly tasks: TaskListRow[];
  readonly compact?: boolean;
}) {
  const toggle = useToggleTaskDone();

  if (tasks.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        Nothing here yet. Add a task above.
      </p>
    );
  }

  const shell = compact ? "divide-border/60 divide-y" : "divide-border divide-y rounded-2xl border";

  return (
    <ul className={shell}>
      {tasks.map((row) => {
        const start = row.startsAt ? new Date(row.startsAt) : null;
        const due = row.dueAt ? new Date(row.dueAt) : null;
        const done = row.status === "done";
        return (
          <li
            key={row.id}
            className="flex flex-wrap items-start gap-3 rounded-xl px-1 py-2.5 transition-colors duration-200 ease-out hover:bg-muted/35 sm:px-3 sm:py-3"
          >
            <div className="pt-0.5">
              <TaskDoneCheckbox
                checked={done}
                disabled={toggle.isPendingFor(row.id)}
                onCheckedChange={() => toggle.mutate(row.id)}
                className="size-5"
                aria-label={done ? "Mark as todo" : "Mark done"}
              />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {row.icon ? (
                  <span className="text-base leading-none" aria-hidden>
                    {row.icon}
                  </span>
                ) : null}
                <span className={done ? "text-muted-foreground line-through" : "font-medium"}>
                  {row.title}
                </span>
                {!compact ? (
                  <span className="rounded-md bg-muted/60 px-2 py-0.5 text-xs text-muted-foreground">
                    {row.spaceName}
                  </span>
                ) : null}
                {row.isPublic ? (
                  <span className="text-[10px] text-muted-foreground uppercase">Public</span>
                ) : null}
              </div>
              {row.notes ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">{row.notes}</p>
              ) : null}
              {done && row.outcome ? (
                <p className="border-l-2 border-foreground/15 pl-3 text-sm">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase">
                    Done
                  </span>
                  <span className="mt-0.5 block">{row.outcome}</span>
                </p>
              ) : null}
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                {formatDay(start) ? <span>Start {formatDay(start)}</span> : null}
                {formatDay(due) ? <span>Due {formatDay(due)}</span> : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
