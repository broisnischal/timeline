import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { authQueryOptions } from "@/lib/auth/queries";
import { SITE_GITHUB_URL } from "@/lib/site";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app/about")({
  component: AboutPage,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(authQueryOptions());
  },
});

function AboutPage() {
  const search = appRouteApi.useSearch();

  return (
    <div className="space-y-8">
      <div>
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
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">About Timeline</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          A calm workspace for plans that have a start, an end, and optional notes — grouped by
          category and shown on a simple timeline. Built with TanStack Start, Drizzle, and Better
          Auth.
        </p>
      </div>

      <ul className="max-w-xl space-y-2 text-sm leading-relaxed text-muted-foreground">
        <li>• Categories (spaces) keep work scoped without heavy project overhead.</li>
        <li>• Tasks anchor to dates so your timeline reflects real intent.</li>
        <li>• Optional public profile and API for sharing a curated list when you want to.</li>
      </ul>

      <p className="text-sm text-muted-foreground">
        Source and updates:{" "}
        <a
          href={SITE_GITHUB_URL}
          className="text-foreground underline underline-offset-4 hover:opacity-80"
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
        .
      </p>
    </div>
  );
}
