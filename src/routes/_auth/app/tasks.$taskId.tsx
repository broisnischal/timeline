import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getRouteApi } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { TaskDetailForm } from "@/components/timeline/task-detail-form";
import { appSearchSchema } from "@/lib/timeline/app-search";
import { spacesQueryOptions, taskQueryOptions } from "@/lib/timeline/queries";
import { findTaskInCachedLists } from "@/lib/timeline/task-cache-helpers";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app/tasks/$taskId")({
  validateSearch: (search) => appSearchSchema.parse(search),
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(taskQueryOptions(params.taskId)),
      context.queryClient.ensureQueryData(spacesQueryOptions()),
    ]);
  },
  component: TaskDetailPage,
});

function TaskDetailPage() {
  const { taskId } = Route.useParams();
  const search = appRouteApi.useSearch();
  const qc = useQueryClient();
  const task = useQuery({
    ...taskQueryOptions(taskId),
    placeholderData: () => findTaskInCachedLists(qc, taskId),
  });
  const spaces = useQuery(spacesQueryOptions());

  const initialSpacesLoading = spaces.isPending && spaces.data === undefined;
  const initialTaskLoading = task.isPending && task.data === undefined;

  if (initialSpacesLoading) {
    return (
      <div className="space-y-8">
        <div className="timeline-shimmer-bg h-4 w-32 rounded-md bg-muted/80" />
        <div className="timeline-shimmer-bg h-40 rounded-2xl bg-muted/40" />
      </div>
    );
  }

  if (initialTaskLoading) {
    return (
      <div className="space-y-8">
        <div className="timeline-shimmer-bg h-4 w-32 rounded-md bg-muted/80" />
        <div className="timeline-shimmer-bg h-9 max-w-md rounded-lg bg-muted/70" />
        <div className="timeline-shimmer-bg h-40 rounded-2xl bg-muted/40" />
        <div className="timeline-shimmer-bg h-24 rounded-xl bg-muted/30" />
      </div>
    );
  }

  if (task.data == null) {
    return (
      <div className="space-y-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          This task doesn&apos;t exist or was deleted.
        </p>
        <Link
          to="/app/timeline"
          search={search}
          className="text-sm font-medium text-primary underline underline-offset-4"
        >
          Back to timeline
        </Link>
      </div>
    );
  }

  const data = task.data;

  return (
    <div className="space-y-8">
      <Link
        to="/app/timeline"
        search={search}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" aria-hidden />
        Timeline
      </Link>
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Task</h1>
        <p className="text-sm text-muted-foreground">
          Edit details, appearance, subtasks, and activity in one place.
        </p>
      </div>
      <TaskDetailForm
        key={taskId}
        row={data}
        spaces={(spaces.data ?? []).map((s) => ({ id: s.id, name: s.name }))}
        search={search}
      />
    </div>
  );
}
