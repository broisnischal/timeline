import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRightIcon,
  CalendarDaysIcon,
  CheckCircle2Icon,
  CpuIcon,
  FocusIcon,
  FolderIcon,
  GlobeIcon,
  SparklesIcon,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { HomeNavbar } from "@/components/home/home-navbar";
import { PlanCapture } from "@/components/timeline/plan-capture";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth/hooks";
import { authQueryOptions } from "@/lib/auth/queries";
import { appSearchEmpty } from "@/lib/timeline/app-search";
import { spacesQueryOptions } from "@/lib/timeline/queries";

const HOME_SELECTED_SPACE_KEY = "homeSelectedSpaceId";

export const Route = createFileRoute("/")({
  component: HomePage,
  loader: async ({ context }) => {
    const user = await context.queryClient.ensureQueryData(authQueryOptions());
    if (user) {
      await context.queryClient.ensureQueryData(spacesQueryOptions());
    }
  },
});

function HomePage() {
  const { user, isPending } = useAuth();
  const spaces = useQuery({
    ...spacesQueryOptions(),
    enabled: Boolean(user),
  });

  const [pickedSpaceId, setPickedSpaceId] = useState<string | undefined>(() => {
    if (typeof window === "undefined") return undefined;
    return sessionStorage.getItem(HOME_SELECTED_SPACE_KEY) ?? undefined;
  });

  const activeSpaceId = useMemo(() => {
    const list = spaces.data ?? [];
    if (!list.length) return "";
    if (pickedSpaceId && list.some((s) => s.id === pickedSpaceId)) return pickedSpaceId;
    return list[0]?.id ?? "";
  }, [spaces.data, pickedSpaceId]);

  const activeSpaceRow = useMemo(
    () => spaces.data?.find((s) => s.id === activeSpaceId),
    [spaces.data, activeSpaceId],
  );

  const handleSpaceChange = useCallback((id: string) => {
    setPickedSpaceId(id);
    sessionStorage.setItem(HOME_SELECTED_SPACE_KEY, id);
  }, []);

  return (
    <div className="min-h-svh bg-background text-foreground">
      <HomeNavbar
        loggedIn={Boolean(user)}
        authPending={isPending}
        spaces={spaces.data}
        spacesPending={spaces.isPending}
        activeSpaceId={activeSpaceId}
        onSpaceChange={handleSpaceChange}
      />

      <main className="mx-auto max-w-3xl px-4 pt-12 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <SparklesIcon className="size-3.5" />
            Calm task & timeline workspace
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Organize what you will do.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Quickly add plans in a single line and let AI organize your tasks always know what's
            next and stay on track.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-2xl">
          <div className="mx-auto w-full max-w-xl">
            {!isPending && user && spaces.data?.length ? (
              <PlanCapture
                activeSpaceId={activeSpaceId}
                activeSpace={
                  activeSpaceRow
                    ? { name: activeSpaceRow.name, color: activeSpaceRow.color }
                    : undefined
                }
                variant="app"
              />
            ) : (
              <PlanCapture activeSpaceId="" variant="landing" />
            )}
          </div>
          <div className="mt-5 grid grid-cols-[1fr_auto] gap-4 border-b border-dashed border-border/60 pb-2 text-left text-[11px] font-medium tracking-wide text-muted-foreground/80 uppercase">
            <span>Title</span>
            <span className="pr-1">Created</span>
          </div>
          <p className="mt-5 text-center text-sm leading-relaxed text-muted-foreground">
            {user
              ? "Plans save to the category you chose in the bar above. Open the full workspace for timeline and categories."
              : "Sign up to save plans and sync across devices."}
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          {!isPending && user ? (
            <Button
              nativeButton={false}
              render={<Link to="/app" search={() => appSearchEmpty} />}
              size="lg"
            >
              Full workspace
              <ArrowRightIcon className="size-4" />
            </Button>
          ) : (
            <>
              <Button nativeButton={false} render={<Link to="/signup" />} size="lg">
                Get started
              </Button>
              <Button
                nativeButton={false}
                render={<Link to="/login" />}
                size="lg"
                variant="outline"
              >
                I have an account
              </Button>
            </>
          )}
        </div>

        <section className="mx-auto mt-20 max-w-3xl">
          <div className="mb-6 text-center">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Available now
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Everything you need to plan and ship
            </h2>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {[
              {
                icon: FolderIcon,
                title: "Spaces",
                body: "Keep personal, work, and side projects separated with quick space switching.",
              },
              {
                icon: CalendarDaysIcon,
                title: "Timeline ranges",
                body: "Browse one week to one year views and keep your schedule grounded in real dates.",
              },
              {
                icon: FocusIcon,
                title: "Focus mode",
                body: "Jump into a calmer view for what matters now, including activity logs and progress.",
              },
              {
                icon: CheckCircle2Icon,
                title: "Outcomes",
                body: "Record what shipped so tasks become a lightweight history, not just a checklist.",
              },
              {
                icon: GlobeIcon,
                title: "Public timeline",
                body: "Share selected work on your own public page and expose a clean JSON endpoint.",
              },
              {
                icon: CpuIcon,
                title: "MCP ready",
                body: "Connect tools and automations through MCP settings directly from your profile.",
              },
            ].map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-border/60 bg-card/35 p-5 backdrop-blur-sm"
              >
                <item.icon className="mb-3 size-5 text-foreground/80" aria-hidden />
                <h3 className="font-medium tracking-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
        </section>

        <footer className="mx-auto mt-16 max-w-3xl border-t border-border/50 py-6">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-muted-foreground sm:flex-row">
            <p>Built with Timeline for calm planning.</p>
            <div className="flex items-center gap-4">
              <Link to="/login" className="transition-colors hover:text-foreground">
                Log in
              </Link>
              <Link to="/signup" className="transition-colors hover:text-foreground">
                Sign up
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
