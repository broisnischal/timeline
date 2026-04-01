import { useHotkeys } from "@tanstack/react-hotkeys";
import { createFileRoute, Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { getRouteApi } from "@tanstack/react-router";
import { CalendarDaysIcon, FocusIcon, LayoutGridIcon, SparklesIcon } from "lucide-react";
import { useState } from "react";

import { AppUserMenu } from "@/components/app-user-menu";
import { useTheme } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { AppSpaceDropdown } from "@/components/timeline/app-space-dropdown";
import { TimelineAiSidebar } from "@/components/timeline/timeline-ai-sidebar";
import { Button } from "@/components/ui/button";
import { mcpAccessQueryOptions } from "@/lib/mcp/queries";
import { THEME_TOGGLE_HOTKEY } from "@/lib/site";
import { appSearchSchema } from "@/lib/timeline/app-search";
import { spacesQueryOptions } from "@/lib/timeline/queries";
import { cn } from "@/lib/utils";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app")({
  validateSearch: (search) => appSearchSchema.parse(search),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(spacesQueryOptions()),
      context.queryClient.ensureQueryData(mcpAccessQueryOptions()),
    ]);
  },
  component: AppLayout,
});

function AppLayout() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const search = appRouteApi.useSearch();
  const [aiOpen, setAiOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/app" || pathname === "/app/";
  const isFocus = pathname === "/app/focus" || pathname === "/app/focus/";
  const isTimeline = pathname.startsWith("/app/timeline") || pathname.startsWith("/app/tasks/");

  useHotkeys(
    [
      {
        hotkey: "Mod+Shift+P",
        callback: () => {
          void router.navigate({ to: "/app/profile", search });
        },
      },
      {
        hotkey: "Mod+Shift+H",
        callback: () => {
          void router.navigate({ to: "/app", search });
        },
      },
      {
        hotkey: "Mod+Shift+T",
        callback: () => {
          void router.navigate({ to: "/app/timeline", search });
        },
      },
      {
        hotkey: "Mod+Shift+F",
        callback: () => {
          void router.navigate({ to: "/app/focus", search });
        },
      },
      {
        hotkey: "Mod+Shift+L",
        callback: () => {
          void router.navigate({ to: "/app/learning", search });
        },
      },
      {
        hotkey: "Mod+Shift+K",
        callback: () => {
          void router.navigate({ to: "/app/shortcuts", search });
        },
      },
      {
        hotkey: "Mod+I",
        callback: () => {
          setAiOpen((o) => !o);
        },
      },
      {
        hotkey: THEME_TOGGLE_HOTKEY,
        callback: () => {
          if (typeof document === "undefined") return;
          const isDark = document.documentElement.classList.contains("dark");
          setTheme(isDark ? "light" : "dark");
        },
      },
    ],
    { preventDefault: true },
  );

  if (isFocus) {
    return (
      <div className="relative min-h-svh bg-background text-foreground">
        <div
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_75%_45%_at_50%_-15%,hsl(var(--primary)/0.07),transparent)]"
          aria-hidden
        />
        <div className="pointer-events-auto fixed top-4 left-4 z-50 flex items-center gap-2">
          <Link
            to="/app"
            search={search}
            className="rounded-full border border-border/45 bg-background/85 px-3 py-1.5 text-sm text-muted-foreground shadow-sm backdrop-blur-sm transition-[color,background-color] hover:bg-muted/55 hover:text-foreground"
          >
            Workspace
          </Link>
          <ThemeToggle />
        </div>
        <div className="pointer-events-auto fixed top-4 right-4 z-50">
          <AppUserMenu />
        </div>
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="relative z-40 shrink-0 border-b border-border/40 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex w-full max-w-none items-center justify-between gap-3 px-4 py-2.5 sm:gap-4 lg:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <Link
              to="/app"
              search={search}
              className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold tracking-tight text-foreground transition-opacity hover:opacity-85 sm:text-base"
            >
              <CalendarDaysIcon className="size-4 opacity-80" aria-hidden />
              <span>Timeline</span>
            </Link>
            <div className="max-w-[min(100%,13rem)] min-w-0 flex-1 sm:max-w-[15rem]">
              <AppSpaceDropdown />
            </div>
          </div>

          <nav
            className="flex shrink-0 items-center gap-0.5 rounded-full border border-border/50 bg-muted/35 p-0.5"
            aria-label="Primary"
          >
            <Link
              to="/app"
              search={search}
              aria-current={isHome ? "page" : undefined}
              aria-label="Home"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-[color,background-color,box-shadow] duration-200 ease-out sm:px-3",
                isHome
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/55"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <LayoutGridIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/app/timeline"
              search={search}
              aria-current={isTimeline ? "page" : undefined}
              aria-label="Timeline"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-[color,background-color,box-shadow] duration-200 ease-out sm:px-3",
                isTimeline
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/55"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <CalendarDaysIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
              <span className="hidden sm:inline">Timeline</span>
            </Link>
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              to="/app/focus"
              search={search}
              aria-current={isFocus ? "page" : undefined}
              aria-label="Focus"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm transition-[color,background-color,box-shadow] duration-200 ease-out sm:px-3",
                isFocus
                  ? "bg-background text-foreground shadow-sm ring-1 ring-border/55"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <FocusIcon className="size-3.5 shrink-0 opacity-70" aria-hidden />
              <span className="hidden sm:inline">Focus</span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle timeline AI assistant"
              aria-keyshortcuts="Control+I Meta+I"
              aria-expanded={aiOpen}
              onClick={() => setAiOpen((o) => !o)}
              className={cn(
                "rounded-full border border-border/50 bg-muted/35 text-muted-foreground hover:bg-muted/55 hover:text-foreground",
                aiOpen && "bg-background text-foreground ring-1 ring-border/55",
              )}
            >
              <SparklesIcon className="size-3.5 shrink-0 opacity-80" aria-hidden />
            </Button>
            <AppUserMenu />
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col items-stretch lg:flex-row">
        <main className="mx-auto min-h-0 w-full max-w-3xl min-w-0 flex-1 overflow-y-auto px-4 py-8 motion-safe:transition-[opacity,transform] motion-safe:duration-200 motion-safe:ease-out">
          <Outlet />
        </main>
        <TimelineAiSidebar open={aiOpen} onOpenChange={setAiOpen} search={search} />
      </div>
    </div>
  );
}
