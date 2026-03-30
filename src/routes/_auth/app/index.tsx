import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getRouteApi } from "@tanstack/react-router";
import { useState } from "react";

import { PlanCapture } from "@/components/timeline/plan-capture";
import { TaskList } from "@/components/timeline/task-list";
import { appSearchSchema } from "@/lib/timeline/app-search";
import { spacesQueryOptions, tasksQueryOptions } from "@/lib/timeline/queries";
import { defaultTaskRange } from "@/lib/timeline/range";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app/")({
  component: AppIndex,
  loader: async ({ context, location }) => {
    const search = appSearchSchema.parse(location.search ?? {});
    const range = defaultTaskRange();
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
  const spaces = useQuery(spacesQueryOptions());
  const tasks = useQuery(
    tasksQueryOptions({
      ...range,
      ...(search.space ? { spaceId: search.space } : {}),
    }),
  );

  const [composeDraft] = useState(() => {
    if (typeof window === "undefined") return undefined;
    const t = sessionStorage.getItem("planDraftTitle");
    if (t) sessionStorage.removeItem("planDraftTitle");
    return t ?? undefined;
  });

  const activeSpaceId = search.space ?? spaces.data?.[0]?.id ?? "";

  if (spaces.isPending || tasks.isPending) {
    return (
      <div className="animate-pulse py-24 text-center text-sm text-muted-foreground">Loading…</div>
    );
  }

  if (spaces.isError || tasks.isError) {
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
        initialTitle={composeDraft}
        variant="app"
      />

      <div>
        <h2 className="mb-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Upcoming
        </h2>
        <TaskList tasks={tasks.data} />
      </div>
    </div>
  );
}
