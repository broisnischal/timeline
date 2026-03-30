import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getRouteApi } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react";
import { lazy, Suspense, useMemo } from "react";
import { toast } from "sonner";

import type { TaskListRow } from "@/components/timeline/task-list";
import { TimelineQuickAdd } from "@/components/timeline/timeline-quick-add";
import { UpcomingTasksShimmer } from "@/components/timeline/upcoming-tasks-shimmer";
import { Button } from "@/components/ui/button";
import { appSearchSchema } from "@/lib/timeline/app-search";
import { $seedDemoTimeline } from "@/lib/timeline/functions";
import { spacesQueryOptions, tasksQueryOptions } from "@/lib/timeline/queries";
import { timelineFixedRange } from "@/lib/timeline/range";

const TimelineView = lazy(() =>
  import("@/components/timeline/timeline-view").then((m) => ({ default: m.TimelineView })),
);

const appRouteApi = getRouteApi("/_auth/app");

function startOfTodayLocal() {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return n;
}

function endOfNextSevenDays() {
  const n = new Date();
  n.setHours(23, 59, 59, 999);
  n.setDate(n.getDate() + 7);
  return n;
}

function countDueSoon(rows: TaskListRow[]) {
  let n = 0;
  const lo = startOfTodayLocal();
  const hi = endOfNextSevenDays();
  for (const row of rows) {
    if (row.status !== "todo" || !row.dueAt) continue;
    const d = new Date(row.dueAt);
    if (d < lo) continue;
    if (d <= hi) n++;
  }
  return n;
}

export const Route = createFileRoute("/_auth/app/timeline")({
  component: TimelinePage,
  loader: async ({ context, location }) => {
    const search = appSearchSchema.parse(location.search ?? {});
    const range = timelineFixedRange();
    await Promise.all([
      context.queryClient.ensureQueryData(spacesQueryOptions()),
      context.queryClient.ensureQueryData(
        tasksQueryOptions({
          ...range,
          ...(search.space ? { spaceId: search.space } : {}),
        }),
      ),
    ]);
  },
});

function TimelinePage() {
  const qc = useQueryClient();
  const search = appRouteApi.useSearch();
  const range = useMemo(() => timelineFixedRange(), []);
  const tasks = useQuery({
    ...tasksQueryOptions({
      ...range,
      ...(search.space ? { spaceId: search.space } : {}),
    }),
    placeholderData: keepPreviousData,
  });

  const spaces = useQuery({
    ...spacesQueryOptions(),
    placeholderData: keepPreviousData,
  });

  const activeSpaceId = search.space ?? spaces.data?.[0]?.id ?? "";

  const seedMut = useMutation({
    mutationFn: () => $seedDemoTimeline({ data: {} }),
    onSuccess: (res) => {
      if (res.skipped) {
        toast.message("Sample tasks skipped", {
          description: "You already have tasks. Clear them first if you want a fresh demo.",
        });
        return;
      }
      toast.success(`Added ${res.inserted} sample tasks`);
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["spaces"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not add samples"),
  });

  const soonCount = tasks.data ? countDueSoon(tasks.data) : 0;

  const initialSpacesLoading = spaces.isPending && spaces.data === undefined;
  const initialTasksLoading = tasks.isPending && tasks.data === undefined;
  const spaceRefreshing = tasks.isFetching && tasks.isPlaceholderData;

  if (initialSpacesLoading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="timeline-shimmer-bg h-8 max-w-[12rem] rounded-md bg-muted" />
          <div className="timeline-shimmer-bg h-4 max-w-xl rounded-md bg-muted/80" />
        </div>
        <div className="timeline-shimmer-bg h-24 rounded-xl border border-border/50 bg-muted/30" />
        <UpcomingTasksShimmer rows={8} className="min-h-[24rem]" />
      </div>
    );
  }

  if (spaces.isError && spaces.data === undefined) {
    return <p className="text-center text-sm text-destructive">Could not load spaces.</p>;
  }

  if (tasks.isError && tasks.data === undefined) {
    return <p className="text-center text-sm text-destructive">Could not load timeline.</p>;
  }

  const empty = tasks.data !== undefined && tasks.data.length === 0;

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
        <p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
          See what&apos;s overdue, what&apos;s due soon, and the full calendar for the next few
          weeks.
          {soonCount > 0 ? (
            <>
              {" "}
              <span className="font-medium text-foreground">{soonCount} due in the next week.</span>
            </>
          ) : null}
        </p>
      </div>

      <TimelineQuickAdd activeSpaceId={activeSpaceId} />

      {spaceRefreshing ? (
        <div
          className="h-0.5 w-full overflow-hidden rounded-full bg-muted"
          role="status"
          aria-label="Updating tasks"
        >
          <div className="timeline-bar-indeterminate h-full w-1/3 rounded-full bg-primary/70" />
        </div>
      ) : null}

      {initialTasksLoading ? (
        <UpcomingTasksShimmer rows={8} className="min-h-[28rem]" />
      ) : empty ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center">
          <SparklesIcon
            className="mx-auto mb-3 size-8 text-muted-foreground opacity-70"
            aria-hidden
          />
          <p className="text-sm font-medium text-foreground">No tasks in this range yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Add a task above, create plans from Home, or load sample data to preview the layout.
          </p>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="mt-6 rounded-full"
            disabled={seedMut.isPending}
            onClick={() => seedMut.mutate()}
          >
            {seedMut.isPending ? "Adding…" : "Load sample tasks"}
          </Button>
        </div>
      ) : (
        <div className="relative min-h-[20rem]">
          <Suspense fallback={<UpcomingTasksShimmer rows={8} className="min-h-[28rem]" />}>
            <TimelineView tasks={tasks.data!} search={search as Record<string, unknown>} />
          </Suspense>
        </div>
      )}
    </div>
  );
}
