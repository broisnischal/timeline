import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { ArrowLeftIcon, KeyboardIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd, KbdGroup } from "@/components/ui/kbd";

const appRouteApi = getRouteApi("/_auth/app");

export const Route = createFileRoute("/_auth/app/shortcuts")({
  component: ShortcutsPage,
});

function Row({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border/55 bg-background/50 px-3 py-2 text-sm">
      <span>{label}</span>
      <KbdGroup>
        {keys.map((k) => (
          <Kbd key={`${label}-${k}`}>{k}</Kbd>
        ))}
      </KbdGroup>
    </div>
  );
}

function ShortcutsPage() {
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
          <KeyboardIcon className="size-5 text-primary" />
          <h1 className="text-xl font-semibold tracking-tight">Keyboard shortcuts</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Mod means <code>Ctrl</code> on Windows/Linux and <code>Cmd</code> on macOS.
        </p>
        <div className="mt-4 space-y-2">
          <Row label="Open profile" keys={["Mod", "Shift", "P"]} />
          <Row label="Go home" keys={["Mod", "Shift", "H"]} />
          <Row label="Go timeline" keys={["Mod", "Shift", "T"]} />
          <Row label="Go focus" keys={["Mod", "Shift", "F"]} />
          <Row label="Open learning" keys={["Mod", "Shift", "L"]} />
          <Row label="Open shortcuts" keys={["Mod", "Shift", "K"]} />
          <Row label="Toggle timeline assistant" keys={["Mod", "I"]} />
        </div>
      </section>
    </div>
  );
}
