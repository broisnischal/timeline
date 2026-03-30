import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { useAuth } from "@/lib/auth/hooks";
import { authQueryOptions } from "@/lib/auth/queries";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app/profile")({
  component: ProfilePage,
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(authQueryOptions());
  },
});

function ProfilePage() {
  const search = appRouteApi.useSearch();
  const { user } = useAuth();

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
        <h1 className="mt-4 text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Account details and preferences will live here. Public profile and activity moved to this
          page in a future update.
        </p>
      </div>

      <dl className="max-w-md space-y-4 border-t border-border/60 pt-6">
        <div>
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Email
          </dt>
          <dd className="mt-1 text-sm">{user?.email ?? "—"}</dd>
        </div>
      </dl>

      <section className="max-w-md border-t border-border/60 pt-6">
        <h2 className="text-sm font-medium">Keyboard shortcuts</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Cross-platform <kbd className="font-mono">Mod</kbd> is <kbd className="font-mono">⌘</kbd>{" "}
          on macOS and <kbd className="font-mono">Ctrl</kbd> on Windows/Linux.{" "}
          <a
            href="https://tanstack.com/hotkeys/latest"
            className="text-foreground underline underline-offset-4 hover:opacity-80"
            target="_blank"
            rel="noreferrer"
          >
            TanStack Hotkeys
          </a>
        </p>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center justify-between gap-4">
            <span>Open profile</span>
            <KbdGroup>
              <Kbd>Mod</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>P</Kbd>
            </KbdGroup>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>Home</span>
            <KbdGroup>
              <Kbd>Mod</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>H</Kbd>
            </KbdGroup>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>Timeline</span>
            <KbdGroup>
              <Kbd>Mod</Kbd>
              <Kbd>Shift</Kbd>
              <Kbd>T</Kbd>
            </KbdGroup>
          </li>
          <li className="flex items-center justify-between gap-4">
            <span>Toggle light / dark</span>
            <KbdGroup>
              <Kbd>Mod</Kbd>
              <Kbd>Alt</Kbd>
              <Kbd>T</Kbd>
            </KbdGroup>
          </li>
        </ul>
      </section>
    </div>
  );
}
