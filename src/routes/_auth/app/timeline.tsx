import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getRouteApi } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { toast } from "sonner";

import type { TaskListRow } from "@/components/timeline/task-list";
import { TimelineToolbar } from "@/components/timeline/timeline-toolbar";
import { TimelineView } from "@/components/timeline/timeline-view";
import { UpcomingTasksShimmer } from "@/components/timeline/upcoming-tasks-shimmer";
import { Button } from "@/components/ui/button";
import { appSearchSchema } from "@/lib/timeline/app-search";
import { $seedDemoTimeline } from "@/lib/timeline/functions";
import { spacesQueryOptions, timelineInfiniteQueryOptions } from "@/lib/timeline/queries";
import { timelineRangeFromPreset } from "@/lib/timeline/range";

const appRouteApi = getRouteApi("/_auth/app");

function tasksMatchingQuery(rows: TaskListRow[], query: string | undefined) {
  const q = query?.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((t) => {
    const hay = `${t.title} ${t.notes ?? ""} ${t.spaceName ?? ""}`.toLowerCase();
    return hay.includes(q);
  });
}

export const Route = createFileRoute("/_auth/app/timeline")({
  component: TimelinePage,
  loader: async ({ context, location }) => {
    const search = appSearchSchema.parse(location.search ?? {});
    const range = timelineRangeFromPreset(search.range ?? "1m");
    await Promise.all([
      context.queryClient.ensureQueryData(spacesQueryOptions()),
      context.queryClient.ensureInfiniteQueryData(
        timelineInfiniteQueryOptions({
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
  const range = useMemo(() => timelineRangeFromPreset(search.range ?? "1m"), [search.range]);

  const tasks = useInfiniteQuery({
    ...timelineInfiniteQueryOptions({
      ...range,
      ...(search.space ? { spaceId: search.space } : {}),
    }),
  });
  const {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isFetching: isFetchingTimeline,
    isPending: isPendingTimeline,
    isError: isTimelineError,
    data: timelineData,
  } = tasks;

  const spaces = useQuery({
    ...spacesQueryOptions(),
    placeholderData: keepPreviousData,
  });

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node) return;
    if (!hasNextPage) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (!isFetchingNextPage) void fetchNextPage();
      },
      { rootMargin: "600px 0px" },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const taskRows = useMemo(() => timelineData?.pages.flatMap((p) => p.items) ?? [], [timelineData]);

  const filteredTasks = useMemo(() => tasksMatchingQuery(taskRows, search.q), [taskRows, search.q]);

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

  const initialSpacesLoading = spaces.isPending && spaces.data === undefined;
  const initialTasksLoading = isPendingTimeline && timelineData === undefined;
  const spaceRefreshing = isFetchingTimeline && !isFetchingNextPage && timelineData !== undefined;

  if (initialSpacesLoading) {
    return (
      <div className="space-y-8">
        <div className="timeline-shimmer-bg h-8 max-w-40 rounded-md bg-muted" />
        <div className="timeline-shimmer-bg h-10 max-w-full rounded-md bg-muted/70" />
        <UpcomingTasksShimmer rows={8} className="min-h-96" />
      </div>
    );
  }

  if (spaces.isError && spaces.data === undefined) {
    return <p className="text-center text-sm text-destructive">Could not load spaces.</p>;
  }

  if (isTimelineError && timelineData === undefined) {
    return <p className="text-center text-sm text-destructive">Could not load timeline.</p>;
  }

  const emptyRange = timelineData !== undefined && taskRows.length === 0;
  const emptySearch =
    timelineData !== undefined &&
    taskRows.length > 0 &&
    filteredTasks.length === 0 &&
    Boolean(search.q?.trim());

  return (
    <div className="space-y-5">
      <TimelineToolbar search={search} />

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
        <UpcomingTasksShimmer rows={8} className="min-h-112" />
      ) : emptySearch ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          No tasks match your search.
        </p>
      ) : emptyRange ? (
        <div className="border border-dashed border-border/60 bg-muted/15 px-6 py-14 text-center">
          <SparklesIcon
            className="mx-auto mb-3 size-8 text-muted-foreground opacity-70"
            aria-hidden
          />
          <p className="text-sm font-medium text-foreground">Nothing in this range</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Widen the range above or add tasks from Home.
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
        <div className="relative min-h-80 space-y-4">
          <TimelineView tasks={filteredTasks} search={search} />
          <div ref={loadMoreRef} className="h-1 w-full" aria-hidden />
          {isFetchingNextPage ? (
            <div className="py-2 text-center text-xs text-muted-foreground">Loading more…</div>
          ) : null}
          {!hasNextPage && taskRows.length > 0 ? (
            <div className="py-2 text-center text-xs text-muted-foreground">End of timeline</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
