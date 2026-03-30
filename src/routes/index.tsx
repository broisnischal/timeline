import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRightIcon, BookmarkIcon, FolderIcon, SparklesIcon, TimerIcon } from "lucide-react";
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

      <main className="mx-auto max-w-5xl px-4 pt-12 pb-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-4 inline-flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <SparklesIcon className="size-3.5" />
            Calm task & timeline workspace
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Organize what you will do.
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-lg leading-relaxed text-muted-foreground">
            Add a plan in one line. Pick a date range, drop a note, and you&apos;re done.
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

        <ul className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-2">
          {[
            {
              icon: FolderIcon,
              title: "Folders, not noise",
              body: "Group work like bookmarks — blog, reading, deep work — without a heavy project system.",
            },
            {
              icon: TimerIcon,
              title: "Time-aware",
              body: "Start and due windows so your timeline reflects real intent, not just titles.",
            },
            {
              icon: BookmarkIcon,
              title: "Outcomes",
              body: "Capture what shipped when it is done. Your timeline doubles as a lightweight log.",
            },
            {
              icon: SparklesIcon,
              title: "Built for what is next",
              body: "Calendar sync, desktop surfaces, and MCP hooks fit naturally on this foundation.",
            },
          ].map((item) => (
            <li
              key={item.title}
              className="rounded-2xl bg-card/40 p-6 ring-1 ring-foreground/8 backdrop-blur-sm"
            >
              <item.icon className="mb-3 size-5 text-foreground/80" aria-hidden />
              <h2 className="font-medium tracking-tight">{item.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
