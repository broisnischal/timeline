import { createFileRoute, Link } from "@tanstack/react-router";

import { PublicTimelinePage } from "@/components/public/public-timeline-page";
import { ThemeToggle } from "@/components/theme-toggle";
import { $getPublicTasksBySlug } from "@/lib/timeline/functions";

export const Route = createFileRoute("/p/$slug")({
  component: PublicListPage,
  loader: async ({ params }) => {
    const data = await $getPublicTasksBySlug({ data: { slug: params.slug } });
    return { data };
  },
  head: ({ loaderData }) => {
    const d = loaderData?.data;
    const title =
      d?.owner?.name != null
        ? `${d.owner.name} — Public timeline`
        : d?.profile?.slug != null
          ? `/${d.profile.slug} — Public timeline`
          : "Public timeline";
    return {
      meta: [{ title }],
    };
  },
});

function PublicListPage() {
  const { data } = Route.useLoaderData();

  if (!data) {
    return (
      <div className="relative min-h-svh bg-background">
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-48 left-1/2 h-[min(70vh,520px)] w-[min(120vw,900px)] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,oklch(0.55_0.12_264/0.14),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_center,oklch(0.55_0.14_264/0.22),transparent_65%)]" />
        </div>
        <header className="z-40 border-b border-border/40 bg-background/75 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link
              to="/"
              className="text-sm font-semibold tracking-tight text-foreground/90 transition-opacity hover:opacity-80"
            >
              Timeline
            </Link>
            <ThemeToggle />
          </div>
        </header>
        <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center sm:py-32">
          <p className="text-xs font-medium tracking-[0.2em] text-muted-foreground uppercase">
            Not found
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            This public page is not available
          </h1>
          <p className="mt-3 leading-relaxed text-foreground/80 text-muted-foreground">
            The link may be wrong, or the owner has turned off their public timeline.
          </p>
          <Link
            to="/"
            className="mt-8 inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium shadow-sm transition-colors hover:bg-muted/50"
          >
            Back home
          </Link>
        </div>
      </div>
    );
  }

  return <PublicTimelinePage data={data} />;
}
