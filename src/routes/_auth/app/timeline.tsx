import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getRouteApi } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { TimelineHorizonSlider } from "@/components/timeline/timeline-horizon-slider";
import { TimelineView } from "@/components/timeline/timeline-view";
import { Button } from "@/components/ui/button";
import { appSearchSchema, defaultHorizon } from "@/lib/timeline/app-search";
import { $seedDemoTimeline } from "@/lib/timeline/functions";
import { spacesQueryOptions, tasksQueryOptions } from "@/lib/timeline/queries";
import { timelineRangeFromHorizonDays } from "@/lib/timeline/range";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app/timeline")({
  component: TimelinePage,
  loader: async ({ context, location }) => {
    const search = appSearchSchema.parse(location.search ?? {});
    const horizon = search.horizon ?? defaultHorizon;
    const range = timelineRangeFromHorizonDays(horizon);
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
  const horizon = search.horizon ?? defaultHorizon;
  const range = useMemo(() => timelineRangeFromHorizonDays(horizon), [horizon]);
  const tasks = useQuery(
    tasksQueryOptions({
      ...range,
      ...(search.space ? { spaceId: search.space } : {}),
    }),
  );

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

  if (tasks.isPending) {
    return (
      <div className="animate-pulse py-24 text-center text-sm text-muted-foreground">Loading…</div>
    );
  }
  if (tasks.isError) {
    return <p className="text-center text-sm text-destructive">Could not load timeline.</p>;
  }

  const empty = tasks.data.length === 0;

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
        <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
          By day, then by category. Scan what is due and what you already shipped in this window.
        </p>
      </div>

      <TimelineHorizonSlider />

      {empty ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-14 text-center">
          <SparklesIcon
            className="mx-auto mb-3 size-8 text-muted-foreground opacity-70"
            aria-hidden
          />
          <p className="text-sm font-medium text-foreground">No tasks in this range yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Add plans from Home, widen the window above, or load sample data to preview the layout.
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
        <TimelineView tasks={tasks.data} />
      )}
    </div>
  );
}
