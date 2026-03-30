import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";

import { TaskDoneCheckbox } from "@/components/timeline/task-done-checkbox";
import type { TaskListRow } from "@/components/timeline/task-list";
import type { AppSearch } from "@/lib/timeline/app-search";
import { priorityBadge, resolveAccent } from "@/lib/timeline/task-appearance";
import { cn } from "@/lib/utils";

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function anchor(row: TaskListRow): Date {
  const s = row.startsAt ? new Date(row.startsAt) : null;
  const du = row.dueAt ? new Date(row.dueAt) : null;
  const c = row.createdAt ? new Date(row.createdAt) : new Date();
  return s ?? du ?? c;
}

type Props = {
  readonly row: TaskListRow;
  readonly search: AppSearch;
  readonly onToggleDone?: (id: string) => void;
  readonly togglePending?: boolean;
};

export function TimelineFeedRow({ row, search, onToggleDone, togglePending }: Props) {
  const accent = resolveAccent(row);
  const badge = priorityBadge(row);
  const done = row.status === "done";
  const when = anchor(row);
  const spaceInline = row.spaceName?.trim();

  const metaLine = [
    spaceInline ? null : row.spaceName,
    row.dueAt
      ? `Due ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(row.dueAt))}`
      : null,
    row.startsAt && !row.dueAt
      ? `Starts ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(row.startsAt))}`
      : null,
    done ? "Completed" : row.status === "cancelled" ? "Cancelled" : "Open",
  ]
    .filter(Boolean)
    .join(" · ");

  const dotColor = done ? "hsl(var(--muted-foreground) / 0.4)" : (accent ?? "hsl(var(--primary))");

  const stripColor = done
    ? "hsl(var(--border) / 0.5)"
    : accent
      ? accent
      : "hsl(var(--border) / 0.72)";

  return (
    <div
      className={cn(
        "group/row grid grid-cols-[var(--rail)_3px_minmax(0,1fr)] gap-x-3 sm:gap-x-4",
        "[--rail:2.5rem]",
      )}
    >
      <div className="relative flex justify-center pt-0.5">
        <div
          className={cn(
            "relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border border-background text-[13px] leading-none shadow-sm ring-1 ring-border/40",
            done ? "bg-muted" : "bg-background",
          )}
          style={
            !done && accent
              ? { backgroundColor: `${accent}14`, boxShadow: `0 0 0 1px ${accent}38` }
              : undefined
          }
          aria-hidden
        >
          {row.icon && !done ? (
            <span aria-hidden>{row.icon}</span>
          ) : (
            <span
              className={cn("size-2 rounded-full", done && "bg-muted-foreground/45")}
              style={!done ? { backgroundColor: dotColor } : undefined}
              aria-hidden
            />
          )}
        </div>
      </div>

      <div
        className="w-[3px] shrink-0 self-stretch rounded-full"
        style={{ backgroundColor: stripColor }}
        aria-hidden
      />

      <div className="min-w-0 pb-0.5">
        <div className="flex items-start gap-2.5">
          {onToggleDone ? (
            <TaskDoneCheckbox
              checked={done}
              disabled={togglePending}
              onCheckedChange={() => onToggleDone(row.id)}
              onClick={(e) => e.stopPropagation()}
              className="mt-0.5 size-4 shrink-0 data-[disabled]:opacity-60"
              aria-label={done ? "Mark as todo" : "Mark done"}
            />
          ) : null}

          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link
                to="/app/tasks/$taskId"
                params={{ taskId: row.id }}
                search={search}
                className={cn(
                  "group/title inline-flex max-w-full min-w-0 items-center gap-1 font-medium tracking-tight text-foreground",
                  done && "text-muted-foreground line-through",
                )}
              >
                <span className="truncate decoration-border/50 underline-offset-4 group-hover/title:underline">
                  {row.title}
                </span>
                <ArrowUpRightIcon
                  className="size-3.5 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-70"
                  aria-hidden
                />
              </Link>
              {spaceInline ? (
                <span className="shrink-0 text-xs text-muted-foreground">{spaceInline}</span>
              ) : null}
            </div>

            <p className="text-xs leading-relaxed text-muted-foreground">{metaLine}</p>

            {row.notes ? (
              <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground/90">
                {row.notes}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              <time
                className="text-[11px] text-muted-foreground tabular-nums"
                dateTime={when.toISOString()}
              >
                {timeFmt.format(when)}
              </time>
              {badge === "overdue" ? (
                <span className="text-[10px] font-medium text-destructive">Overdue</span>
              ) : null}
              {badge === "soon" ? (
                <span className="text-[10px] font-medium text-amber-800 dark:text-amber-400">
                  Soon
                </span>
              ) : null}
              {row.isPublic ? (
                <span className="text-[10px] text-muted-foreground uppercase">Public</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
