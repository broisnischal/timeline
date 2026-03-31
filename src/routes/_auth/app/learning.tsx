import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, BookOpenCheckIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app/learning")({
  component: LearningPage,
});

function LearningPage() {
  const search = appRouteApi.useSearch();
  return (
    <div className="space-y-6">
      <Button
        nativeButton={false}
        render={<Link to="/app" search={search} />}
        variant="ghost"
        size="sm"
        className="-ml-2 gap-1.5 text-muted-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Back to app
      </Button>

      <section className="rounded-2xl border border-border/60 bg-card/35 p-6">
        <div className="flex items-center gap-2">
          <BookOpenCheckIcon className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Learning</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Curate notes, resources, and experiments here. You can use this section as a lightweight
          learning hub linked to your timeline tasks.
        </p>
        <div className="mt-5 rounded-xl border border-dashed border-border/60 bg-background/40 p-4 text-sm text-muted-foreground">
          <p className="inline-flex items-center gap-1.5">
            <SparklesIcon className="size-4" />
            Start by adding your first learning task in Timeline and tag it with a Learning space.
          </p>
        </div>
      </section>
    </div>
  );
}
