import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";

import { PlanCapture } from "@/components/timeline/plan-capture";
import { UpcomingTaskLines } from "@/components/timeline/upcoming-task-lines";
import { UpcomingTasksShimmer } from "@/components/timeline/upcoming-tasks-shimmer";
import { appSearchSchema } from "@/lib/timeline/app-search";
import { spacesQueryOptions, tasksQueryOptions } from "@/lib/timeline/queries";
import { timelineFixedRange } from "@/lib/timeline/range";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app/")({
  component: AppIndex,
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
    return { range };
  },
});

function AppIndex() {
  const { range } = Route.useLoaderData();
  const search = appRouteApi.useSearch();
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

  const [composeDraft] = useState(() => {
    if (typeof window === "undefined") return undefined;
    const t = sessionStorage.getItem("planDraftTitle");
    if (t) sessionStorage.removeItem("planDraftTitle");
    return t ?? undefined;
  });

  const activeSpaceId = search.space ?? spaces.data?.[0]?.id ?? "";
  const activeSpaceRow = spaces.data?.find((s) => s.id === activeSpaceId);

  const initialSpacesLoading = spaces.isPending && spaces.data === undefined;
  const initialTasksLoading = tasks.isPending && tasks.data === undefined;
  const spaceRefreshing = tasks.isFetching && tasks.isPlaceholderData;

  if (initialSpacesLoading) {
    return (
      <div className="space-y-12">
        <div className="space-y-1">
          <div className="timeline-shimmer-bg h-8 max-w-[8rem] rounded-md bg-muted" />
          <div className="timeline-shimmer-bg mt-2 h-4 max-w-md rounded-md bg-muted/80" />
        </div>
        <div className="timeline-shimmer-bg h-40 rounded-xl border border-border/50 bg-muted/25" />
        <div>
          <div className="timeline-shimmer-bg mb-4 h-3 w-24 rounded-md bg-muted/70" />
          <UpcomingTasksShimmer rows={5} />
        </div>
      </div>
    );
  }

  if (spaces.isError && spaces.data === undefined) {
    return <p className="text-center text-sm text-destructive">Something went wrong.</p>;
  }

  if (tasks.isError && tasks.data === undefined) {
    return <p className="text-center text-sm text-destructive">Something went wrong.</p>;
  }

  return (
    <div className="space-y-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Today</h1>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          Start with a line. We&apos;ll ask when it lives and if you want notes.
        </p>
      </div>

      <PlanCapture
        key={composeDraft ?? "capture"}
        activeSpaceId={activeSpaceId}
        activeSpace={
          activeSpaceRow ? { name: activeSpaceRow.name, color: activeSpaceRow.color } : undefined
        }
        initialTitle={composeDraft}
        variant="app"
      />

      <div>
        <h2 className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Upcoming
        </h2>
        {spaceRefreshing ? (
          <div
            className="mb-4 h-0.5 w-full overflow-hidden rounded-full bg-muted"
            role="status"
            aria-label="Updating tasks"
          >
            <div className="timeline-bar-indeterminate h-full w-1/3 rounded-full bg-primary/70" />
          </div>
        ) : null}
        {initialTasksLoading ? (
          <UpcomingTasksShimmer rows={5} className="min-h-[14rem]" />
        ) : (
          <UpcomingTaskLines tasks={tasks.data!} search={search} />
        )}
      </div>
    </div>
  );
}
