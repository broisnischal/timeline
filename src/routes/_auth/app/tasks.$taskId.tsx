import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { getRouteApi } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { TaskDetailForm } from "@/components/timeline/task-detail-form";
import { appSearchSchema } from "@/lib/timeline/app-search";
import { spacesQueryOptions, taskQueryOptions } from "@/lib/timeline/queries";

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
  const task = useQuery(taskQueryOptions(taskId));
  const spaces = useQuery(spacesQueryOptions());

  if (task.isPending || spaces.isPending) {
    return (
      <div className="animate-pulse py-24 text-center text-sm text-muted-foreground">Loading…</div>
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
  const updatedKey =
    typeof data.updatedAt === "string"
      ? data.updatedAt
      : data.updatedAt instanceof Date
        ? data.updatedAt.toISOString()
        : String(data.updatedAt);

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
        key={updatedKey}
        row={data}
        spaces={(spaces.data ?? []).map((s) => ({ id: s.id, name: s.name }))}
        search={search as Record<string, unknown>}
      />
    </div>
  );
}
