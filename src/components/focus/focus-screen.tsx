import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { WavingDotsBackground } from "@/components/focus/waving-dots-canvas";
import { YearActivityWall } from "@/components/home/year-activity-wall";
import { UpcomingTaskLines } from "@/components/timeline/upcoming-task-lines";
import { UpcomingTasksShimmer } from "@/components/timeline/upcoming-tasks-shimmer";
import type { AppSearch } from "@/lib/timeline/app-search";
import { isTaskTouchingToday, sortTodayTasks } from "@/lib/timeline/focus-today";
import {
  recentActivityQueryOptions,
  spacesQueryOptions,
  tasksQueryOptions,
} from "@/lib/timeline/queries";

const timeFmt = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
});

const logTimeFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function ActivityLine({
  body,
  at,
  taskTitle,
  taskId,
  spaceName,
  search,
}: {
  readonly body: string;
  readonly at: string;
  readonly taskTitle: string;
  readonly taskId: string;
  readonly spaceName: string;
  readonly search: AppSearch;
}) {
  const when = new Date(at);
  const label = Number.isNaN(when.getTime()) ? at : logTimeFmt.format(when);

  return (
    <li className="border-b border-border/30 py-3 last:border-b-0">
      <p className="text-[13px] leading-snug text-foreground/90">{body}</p>
      <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground/25" aria-hidden>
          ·
        </span>
        <Link
          to="/app/tasks/$taskId"
          params={{ taskId }}
          search={search}
          className="underline decoration-border/60 underline-offset-2 hover:text-foreground"
        >
          {taskTitle}
        </Link>
        <span className="text-foreground/25 max-sm:hidden" aria-hidden>
          ·
        </span>
        <span className="max-sm:hidden">{spaceName}</span>
      </p>
    </li>
  );
}

export function FocusScreen({
  range,
  search,
}: {
  readonly range: { from: string; to: string };
  readonly search: AppSearch;
}) {
  const spaces = useQuery({
    ...spacesQueryOptions(),
    placeholderData: keepPreviousData,
  });
  const tasks = useQuery({
    ...tasksQueryOptions({
      ...range,
      ...(search.space ? { spaceId: search.space } : {}),
    }),
    placeholderData: keepPreviousData,
  });
  const activity = useQuery({
    ...recentActivityQueryOptions(48),
    placeholderData: keepPreviousData,
  });

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const todayTasks = useMemo(() => {
    const list = tasks.data ?? [];
    return sortTodayTasks(list.filter(isTaskTouchingToday));
  }, [tasks.data]);

  const spaceLabel = useMemo(() => {
    if (!search.space) return "All spaces";
    const name = spaces.data?.find((s) => s.id === search.space)?.name;
    return name ?? "Space";
  }, [search.space, spaces.data]);

  const initialLoading =
    (spaces.isPending && spaces.data === undefined) ||
    (tasks.isPending && tasks.data === undefined);

  if (initialLoading) {
    return (
      <div className="relative">
        <WavingDotsBackground />
        <div className="relative z-[2] mx-auto max-w-2xl px-4 py-16 sm:py-20">
          <div className="timeline-shimmer-bg mb-10 h-10 max-w-[12rem] rounded-lg bg-muted/60" />
          <div className="timeline-shimmer-bg mb-16 h-24 rounded-xl bg-muted/40" />
          <div className="timeline-shimmer-bg mb-4 h-3 w-28 rounded bg-muted/70" />
          <UpcomingTasksShimmer rows={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <WavingDotsBackground />
      <div className="relative z-[2] mx-auto max-w-2xl px-4 py-16 sm:py-20">
        <header className="mb-14 text-center">
          <p className="mb-2 text-[11px] font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Focus
          </p>
          <p className="font-clock text-4xl font-light tracking-[-0.02em] text-foreground sm:text-5xl">
            {timeFmt.format(now)}
          </p>
          <p className="mt-3 font-sans text-sm text-muted-foreground">{dateFmt.format(now)}</p>
          <p className="mt-3 text-xs text-muted-foreground/80">{spaceLabel}</p>
        </header>

        <section className="mb-16" aria-labelledby="focus-today-heading">
          <h2
            id="focus-today-heading"
            className="mb-5 text-center text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase"
          >
            Today
          </h2>
          {tasks.isFetching && tasks.isPlaceholderData ? (
            <div
              className="mb-6 h-px w-full overflow-hidden rounded-full bg-muted"
              role="status"
              aria-label="Updating"
            >
              <div className="timeline-bar-indeterminate h-full w-1/3 rounded-full bg-primary/50" />
            </div>
          ) : null}
          {todayTasks.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nothing scheduled for today yet. Add a task from the workspace.
            </p>
          ) : (
            <UpcomingTaskLines tasks={todayTasks} search={search} />
          )}
        </section>

        <section className="mb-16" aria-labelledby="focus-activity-heading">
          <h2
            id="focus-activity-heading"
            className="mb-4 text-center text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase"
          >
            Activity
          </h2>
          {activity.isPending && activity.data === undefined ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="timeline-shimmer-bg h-14 rounded-lg bg-muted/35" />
              ))}
            </div>
          ) : !(activity.data?.length ?? 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Log progress on any task to see it here.
            </p>
          ) : (
            <ul className="rounded-xl border border-border/40 bg-card/20 px-4 backdrop-blur-sm">
              {(activity.data ?? []).map((e) => (
                <ActivityLine
                  key={`${e.taskId}-${e.entryId}`}
                  body={e.body}
                  at={e.at}
                  taskTitle={e.taskTitle}
                  taskId={e.taskId}
                  spaceName={e.spaceName}
                  search={search}
                />
              ))}
            </ul>
          )}
        </section>

        <section aria-label="Completions this year">
          <YearActivityWall hasUser variant="focus" />
        </section>
      </div>
    </div>
  );
}
