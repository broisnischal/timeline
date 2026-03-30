import { useHotkeys } from "@tanstack/react-hotkeys";
import { createFileRoute, Link, Outlet, useRouter, useRouterState } from "@tanstack/react-router";
import { getRouteApi } from "@tanstack/react-router";
import { CalendarDaysIcon, LayoutGridIcon } from "lucide-react";

import { AppUserMenu } from "@/components/app-user-menu";
import { useTheme } from "@/components/theme-provider";
import { AppSpaceDropdown } from "@/components/timeline/app-space-dropdown";
import { THEME_TOGGLE_HOTKEY } from "@/lib/site";
import { appSearchSchema } from "@/lib/timeline/app-search";
import { spacesQueryOptions } from "@/lib/timeline/queries";
import { cn } from "@/lib/utils";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app")({
  validateSearch: (search) => appSearchSchema.parse(search),
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(spacesQueryOptions());
  },
  component: AppLayout,
});

function AppLayout() {
  const router = useRouter();
  const { setTheme } = useTheme();
  const search = appRouteApi.useSearch();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isHome = pathname === "/app" || pathname === "/app/";
  const isTimeline = pathname.startsWith("/app/timeline");

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

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/90 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5 sm:gap-4">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3">
            <Link
              to="/app"
              search={search}
              className="shrink-0 text-sm font-semibold tracking-tight text-foreground transition-opacity hover:opacity-85 sm:text-base"
            >
              Timeline
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

          <div className="flex shrink-0 items-center">
            <AppUserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
