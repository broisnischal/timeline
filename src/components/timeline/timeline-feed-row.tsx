import { Link } from "@tanstack/react-router";
import { ArrowUpRightIcon } from "lucide-react";
import type { CSSProperties } from "react";

import type { TaskListRow } from "@/components/timeline/task-list";
import { Checkbox } from "@/components/ui/checkbox";
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
  readonly search: Record<string, unknown>;
  readonly onToggleDone?: (id: string) => void;
  readonly togglePending?: boolean;
};

export function TimelineFeedRow({ row, search, onToggleDone, togglePending }: Props) {
  const accent = resolveAccent(row);
  const badge = priorityBadge(row);
  const done = row.status === "done";
  const when = anchor(row);

  const metaLine = [
    row.spaceName,
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

  const dotColor = done ? "hsl(var(--muted-foreground) / 0.35)" : (accent ?? "hsl(var(--primary))");

  const accentBarStyle: CSSProperties = {
    borderLeftColor: done
      ? "hsl(var(--border) / 0.45)"
      : accent
        ? accent
        : "hsl(var(--border) / 0.8)",
  };

  return (
    <div className="group/row relative flex gap-3 sm:gap-4">
      <div className="relative flex w-10 shrink-0 justify-center pt-1">
        <div
          className={cn(
            "relative z-10 flex size-5 shrink-0 items-center justify-center rounded-full border border-background text-[13px] leading-none shadow-sm ring-1 ring-border/45",
            done && "bg-muted",
          )}
          style={
            !done && accent
              ? { backgroundColor: `${accent}12`, boxShadow: `0 0 0 1px ${accent}35` }
              : undefined
          }
          aria-hidden
        >
          {row.icon && !done ? (
            <span aria-hidden>{row.icon}</span>
          ) : (
            <span
              className={cn("size-2 rounded-full", done && "bg-muted-foreground/40")}
              style={!done ? { backgroundColor: dotColor } : undefined}
              aria-hidden
            />
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 border-l-2 pl-3" style={accentBarStyle}>
        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
          <Link
            to="/app/tasks/$taskId"
            params={{ taskId: row.id }}
            search={search}
            className={cn(
              "group/title inline-flex min-w-0 items-center gap-1 font-medium tracking-tight text-foreground",
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
          {onToggleDone ? (
            <div className="ml-auto shrink-0 sm:ml-0">
              <Checkbox
                checked={done}
                disabled={togglePending}
                onCheckedChange={() => onToggleDone(row.id)}
                onClick={(e) => e.stopPropagation()}
                className="size-4"
                aria-label={done ? "Mark as todo" : "Mark done"}
              />
            </div>
          ) : null}
        </div>

        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{metaLine}</p>

        {row.notes ? (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground/90">
            {row.notes}
          </p>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2">
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
            <span className="text-[10px] font-medium text-amber-800 dark:text-amber-400">Soon</span>
          ) : null}
          {row.isPublic ? (
            <span className="text-[10px] text-muted-foreground uppercase">Public</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
