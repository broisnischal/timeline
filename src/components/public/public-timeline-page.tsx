import { Link } from "@tanstack/react-router";
import {
  ArrowUpRightIcon,
  CheckCircle2Icon,
  CircleDashedIcon,
  ExternalLinkIcon,
  LayersIcon,
  SparklesIcon,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ThemeToggle } from "@/components/theme-toggle";
import { SpaceColorDot } from "@/components/timeline/space-color-dot";
import { Button } from "@/components/ui/button";
import { isUrlOnlyText, LinkifiedText, toExternalHref } from "@/components/ui/linkified-text";
import { isHexColor } from "@/lib/timeline/task-appearance";
import { cn } from "@/lib/utils";

type PublicTaskRow = {
  id: string;
  title: string;
  notes: string | null;
  outcome: string | null;
  icon: string | null;
  accentColor: string | null;
  status: string;
  startsAt: string | Date | null;
  dueAt: string | Date | null;
  spaceName: string;
  spaceColor: string | null;
};

export type PublicPageData = {
  profile: { slug: string };
  owner: { name: string; image: string | null };
  selectedSpace?: { id: string; name: string; publicSlug: string } | null;
  tasks: PublicTaskRow[];
};

const dateFmt = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" });

function parseBoundary(v: string | Date | null | undefined): Date | null {
  if (v == null) return null;
  const d = v instanceof Date ? v : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTaskWindow(row: PublicTaskRow): string | null {
  const due = parseBoundary(row.dueAt);
  const start = parseBoundary(row.startsAt);
  if (due) return `Due ${dateFmt.format(due)}`;
  if (start) return `Starts ${dateFmt.format(start)}`;
  return null;
}

function OwnerAvatar({
  name,
  image,
  className,
}: {
  readonly name: string;
  readonly image: string | null;
  readonly className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-muted to-muted/50 shadow-inner ring-2 ring-border/50 ring-offset-4 ring-offset-background",
        className,
      )}
    >
      {image ? (
        <img src={image} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
      ) : (
        <div
          className="flex size-full items-center justify-center font-semibold tracking-tight text-muted-foreground"
          aria-hidden
        >
          {initials || "?"}
        </div>
      )}
    </div>
  );
}

function railColor(accent: string | null, space: string | null): string | null {
  if (isHexColor(accent)) return accent;
  if (isHexColor(space)) return space;
  return null;
}

type Filter = "all" | "todo" | "done";

export function PublicTimelinePage({ data }: { readonly data: PublicPageData }) {
  const { profile, owner, tasks, selectedSpace } = data;
  const [filter, setFilter] = useState<Filter>("all");
  const spaceQuery = selectedSpace?.publicSlug
    ? `?space=${encodeURIComponent(selectedSpace.publicSlug)}`
    : "";
  const apiBase = `/api/public/${profile.slug}${spaceQuery}`;

  const filtered = useMemo(() => {
    if (filter === "all") return tasks;
    return tasks.filter((t) => t.status === filter);
  }, [tasks, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, PublicTaskRow[]>();
    for (const t of filtered) {
      const list = map.get(t.spaceName) ?? [];
      list.push(t);
      map.set(t.spaceName, list);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const openCount = tasks.filter((t) => t.status === "todo").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;

  return (
    <div className="relative min-h-svh bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-48 left-1/2 h-[min(70vh,520px)] w-[min(120vw,900px)] -translate-x-1/2 rounded-[100%] bg-[radial-gradient(ellipse_at_center,oklch(0.55_0.12_264/0.14),transparent_65%)] dark:bg-[radial-gradient(ellipse_at_center,oklch(0.55_0.14_264/0.22),transparent_65%)]" />
        <div className="absolute top-32 right-[10%] h-40 w-40 rounded-full bg-chart-2/10 blur-3xl dark:bg-chart-2/15" />
        <div className="absolute bottom-[20%] left-[5%] h-56 w-56 rounded-full bg-primary/5 blur-3xl dark:bg-primary/10" />
        <div
          className="absolute inset-0 opacity-[0.35] dark:opacity-[0.2]"
          style={{
            backgroundImage: `linear-gradient(to right, oklch(0.5 0 0 / 6%) 1px, transparent 1px),
              linear-gradient(to bottom, oklch(0.5 0 0 / 6%) 1px, transparent 1px)`,
            backgroundSize: "48px 48px",
          }}
        />
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

      <div className="mx-auto max-w-3xl px-4 pt-8 pb-20 sm:px-6 sm:pt-10">
        <div className="space-y-3 border-b border-border/55 pb-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 font-semibold tracking-widest text-muted-foreground uppercase">
              <SparklesIcon className="size-3.5" aria-hidden />
              Public timeline
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="inline-flex items-center gap-1.5 text-foreground">
              <OwnerAvatar name={owner.name} image={owner.image} className="size-4.5" />
              <span className="text-xs font-medium">{owner.name}</span>
            </span>
            <span className="font-mono text-muted-foreground">/p/{profile.slug}</span>
            {selectedSpace ? (
              <span className="text-muted-foreground">#{selectedSpace.name}</span>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <CircleDashedIcon className="size-3.5 text-chart-2" aria-hidden />
              <span className="tabular-nums">{openCount}</span> open
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2Icon
                className="size-3.5 text-emerald-600 dark:text-emerald-400"
                aria-hidden
              />
              <span className="tabular-nums">{doneCount}</span> done
            </span>
            <a
              href={apiBase}
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
            >
              JSON
              <ExternalLinkIcon className="size-3.5" aria-hidden />
            </a>
            <a
              href={`${apiBase}${spaceQuery ? "&" : "?"}format=raw`}
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
            >
              Raw
              <ExternalLinkIcon className="size-3.5" aria-hidden />
            </a>
            <a
              href={`${apiBase}${spaceQuery ? "&" : "?"}format=rss`}
              className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
            >
              RSS
              <ExternalLinkIcon className="size-3.5" aria-hidden />
            </a>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
          {(
            [
              ["all", "All"],
              ["todo", "Open"],
              ["done", "Done"],
            ] as const
          ).map(([key, label]) => (
            <Button
              key={key}
              type="button"
              size="sm"
              variant={filter === key ? "default" : "outline"}
              className={cn("rounded-full px-5", filter === key && "shadow-sm")}
              onClick={() => setFilter(key)}
            >
              {label}
            </Button>
          ))}
        </div>

        <div className="mt-8 space-y-10">
          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/80 bg-card/30 px-6 py-16 text-center backdrop-blur-sm">
              <LayersIcon className="mx-auto size-10 text-muted-foreground/50" aria-hidden />
              <p className="mt-4 text-sm font-medium text-foreground">Nothing here yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {filter === "all"
                  ? "This creator has not published any public tasks."
                  : filter === "todo"
                    ? "No open public tasks right now."
                    : "No completed public tasks to show."}
              </p>
            </div>
          ) : (
            grouped.map(([spaceName, rows]) => (
              <section key={spaceName} className="scroll-mt-24">
                <div className="mb-5 flex items-center gap-2">
                  <SpaceColorDot color={rows[0]?.spaceColor} />
                  <h2 className="text-sm font-semibold tracking-tight text-foreground/90">
                    {spaceName}
                  </h2>
                  <span className="text-xs text-muted-foreground tabular-nums">{rows.length}</span>
                </div>
                <ul className="space-y-0">
                  {rows.map((t) => {
                    const windowLabel = formatTaskWindow(t);
                    const hex = railColor(t.accentColor, t.spaceColor);
                    return (
                      <li
                        key={t.id}
                        className={cn(
                          "flex overflow-hidden border-b border-border/55 bg-transparent py-3 transition-colors hover:bg-muted/20",
                          t.status === "done" && "opacity-95",
                        )}
                      >
                        <div
                          className={cn(
                            "w-0.5 shrink-0 self-stretch",
                            !hex && "bg-muted-foreground/20",
                          )}
                          style={hex ? { backgroundColor: hex } : undefined}
                        />
                        <div className="min-w-0 flex-1 px-3 py-1 sm:px-4">
                          <div className="flex flex-wrap items-start gap-3">
                            {t.icon ? (
                              <span className="text-xl leading-none select-none" aria-hidden>
                                {t.icon}
                              </span>
                            ) : null}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                {isUrlOnlyText(t.title) ? (
                                  <a
                                    href={toExternalHref(t.title)}
                                    target="_blank"
                                    rel="noreferrer noopener"
                                    className={cn(
                                      "text-base font-medium tracking-tight underline decoration-border/70 underline-offset-2 hover:text-foreground",
                                      t.status === "done" &&
                                        "text-muted-foreground line-through decoration-foreground/25",
                                    )}
                                  >
                                    {t.title}
                                  </a>
                                ) : (
                                  <span
                                    className={cn(
                                      "text-base font-medium tracking-tight",
                                      t.status === "done" &&
                                        "text-muted-foreground line-through decoration-foreground/25",
                                    )}
                                  >
                                    {t.title}
                                  </span>
                                )}
                                {t.status === "done" ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                    <CheckCircle2Icon className="size-3" aria-hidden />
                                    Shipped
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                    Open
                                  </span>
                                )}
                              </div>
                              {windowLabel ? (
                                <p className="mt-1.5 font-mono text-xs text-muted-foreground">
                                  {windowLabel}
                                </p>
                              ) : null}
                              {t.notes ? (
                                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                                  <LinkifiedText text={t.notes} />
                                </p>
                              ) : null}
                              {t.outcome && t.status === "done" ? (
                                <blockquote className="mt-4 border-l-2 border-foreground/20 pl-4 text-sm leading-relaxed text-foreground/90 italic">
                                  <LinkifiedText text={t.outcome} />
                                </blockquote>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </div>

        <footer className="mt-20 border-t border-border/40 pt-10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              Shared with{" "}
              <Link
                to="/"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Timeline
              </Link>
              . Only tasks the owner marked public appear here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground underline-offset-4 hover:underline"
            >
              Create your own
              <ArrowUpRightIcon className="size-3.5" aria-hidden />
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
