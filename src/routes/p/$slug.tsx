import { createFileRoute, Link } from "@tanstack/react-router";
import { ExternalLinkIcon } from "lucide-react";

import { $getPublicTasksBySlug } from "@/lib/timeline/functions";

export const Route = createFileRoute("/p/$slug")({
  component: PublicListPage,
  loader: async ({ params }) => {
    const data = await $getPublicTasksBySlug({ data: { slug: params.slug } });
    return { data };
  },
});

function PublicListPage() {
  const { data } = Route.useLoaderData();

  if (!data) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center bg-background px-4">
        <p className="text-sm text-muted-foreground">
          This public list does not exist or is disabled.
        </p>
        <Link to="/" className="mt-4 text-sm text-foreground underline-offset-4 hover:underline">
          Back home
        </Link>
      </div>
    );
  }

  const { tasks } = data;

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border/60 px-4 py-6">
        <div className="mx-auto max-w-xl">
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Public list
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">/{data.profile.slug}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tasks the owner marked as public.{" "}
            <a
              className="inline-flex items-center gap-1 text-foreground underline-offset-4 hover:underline"
              href={`/api/public/${data.profile.slug}`}
            >
              JSON API
              <ExternalLinkIcon className="size-3" />
            </a>
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-xl px-4 py-8">
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground">No public tasks yet.</p>
        ) : (
          <ul className="divide-y divide-border rounded-2xl border">
            {tasks.map((t) => (
              <li key={t.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      t.status === "done" ? "text-muted-foreground line-through" : "font-medium"
                    }
                  >
                    {t.title}
                  </span>
                  <span className="rounded-md bg-muted/80 px-2 py-0.5 text-xs text-muted-foreground">
                    {t.spaceName}
                  </span>
                </div>
                {t.notes ? <p className="mt-1 text-sm text-muted-foreground">{t.notes}</p> : null}
                {t.outcome && t.status === "done" ? (
                  <p className="mt-2 border-l-2 border-foreground/15 pl-3 text-sm">{t.outcome}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
