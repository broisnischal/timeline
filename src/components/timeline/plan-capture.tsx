import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { SpaceColorDot } from "@/components/timeline/space-color-dot";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Kbd, KbdGroup } from "@/components/ui/kbd";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { $createTask } from "@/lib/timeline/functions";
import { mergeCreatedTaskIntoCaches } from "@/lib/timeline/task-cache-helpers";
import { cn } from "@/lib/utils";

type Step = "idle" | "range" | "notes" | "auth";

function startOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function endOfDayLocal(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

function PlanContextSummary({
  titleText,
  space,
  variant,
}: {
  readonly titleText: string;
  readonly space: { name: string; color: string | null } | undefined;
  readonly variant: "app" | "landing";
}) {
  if (variant === "app" && space) {
    return (
      <div className="rounded-xl border border-border/50 bg-muted/20 p-3.5">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          New plan in
        </p>
        <div className="mt-2 flex items-center gap-2">
          <SpaceColorDot color={space.color} />
          <span className="min-w-0 truncate text-sm font-medium text-foreground">{space.name}</span>
        </div>
        <p className="mt-3 border-t border-border/50 pt-3 text-sm leading-snug text-foreground">
          {titleText}
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
          Saved here and visible on your timeline for this space.
        </p>
      </div>
    );
  }
  return (
    <p className="rounded-lg border border-border/50 bg-muted/15 px-3 py-2.5 text-sm leading-snug font-medium text-foreground">
      {titleText}
    </p>
  );
}

export function PlanCapture({
  activeSpaceId,
  activeSpace,
  initialTitle,
  variant = "app",
}: {
  readonly activeSpaceId: string;
  readonly activeSpace?: { name: string; color: string | null } | undefined;
  readonly initialTitle?: string | undefined;
  readonly variant?: "app" | "landing";
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const formId = useId();
  const hintId = useId();
  const [title, setTitle] = useState(() => initialTitle ?? "");
  const [step, setStep] = useState<Step>(() => (initialTitle?.trim() ? "range" : "idle"));
  const [range, setRange] = useState<DateRange | undefined>();
  const [notes, setNotes] = useState("");
  const modKey = useSyncExternalStore(
    () => () => {},
    () =>
      typeof navigator !== "undefined" && !navigator.platform?.toLowerCase().includes("mac")
        ? "Ctrl"
        : "⌘",
    () => "⌘",
  );

  const openFlow = useCallback(() => {
    if (!title.trim()) {
      toast.error("Add a short title first");
      return;
    }
    if (variant === "landing") {
      sessionStorage.setItem("planDraftTitle", title.trim());
      setStep("auth");
      return;
    }
    if (!activeSpaceId) {
      toast.error("Loading spaces…");
      return;
    }
    setStep("range");
  }, [title, activeSpaceId, variant]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const createMut = useMutation({
    mutationFn: async () => {
      if (!activeSpaceId || !range?.from) throw new Error("Missing data");
      const fromDay = range.from;
      const toDay = range.to ?? range.from;
      return $createTask({
        data: {
          spaceId: activeSpaceId,
          title: title.trim(),
          notes: notes.trim() || undefined,
          startsAt: startOfDayLocal(fromDay),
          dueAt: endOfDayLocal(toDay),
        },
      });
    },
    onSuccess: (created) => {
      mergeCreatedTaskIntoCaches(qc, created);
      toast.success("Task created");
      setTitle("");
      setNotes("");
      setRange(undefined);
      setStep("idle");
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["streak"] });
    },
    onError: (e: Error) => toast.error(e.message || "Could not save"),
  });

  const canContinueRange = Boolean(range?.from && range?.to);
  const canSingleDay = Boolean(range?.from && !range?.to);

  const goToNotes = () => {
    if (!range?.from) return;
    if (!range.to) {
      setRange({ from: range.from, to: range.from });
    }
    setStep("notes");
  };

  const dialogOpen = step !== "idle";
  const planInputId = `${formId}-plan`;

  return (
    <>
      <div className="relative min-w-0">
        <label htmlFor={planInputId} className="sr-only">
          Add a plan
        </label>
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-muted-foreground/65"
          aria-hidden
        />
        <Input
          ref={inputRef}
          id={planInputId}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              openFlow();
            }
          }}
          placeholder="Add your plan, a link, or plain text…"
          autoComplete="off"
          title={`Continue — ${modKey}+K to focus`}
          aria-describedby={hintId}
          className={cn(
            "h-9 rounded-full border border-border/50 bg-muted/15 py-1 pr-[4.25rem] pl-9 text-sm shadow-none",
            "placeholder:text-muted-foreground/70",
            "focus-visible:border-border focus-visible:ring-1 focus-visible:ring-ring/35",
          )}
        />
        <span
          id={hintId}
          className="pointer-events-none absolute top-1/2 right-2 hidden -translate-y-1/2 items-center gap-0.5 sm:flex"
        >
          <KbdGroup className="opacity-60">
            <Kbd className="h-4 min-w-6 px-1 text-[10px]" suppressHydrationWarning>
              {modKey}
            </Kbd>
            <Kbd className="h-4 min-w-[1.125rem] px-1 text-[10px]">K</Kbd>
          </KbdGroup>
        </span>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(o) => {
          if (!o) {
            setStep("idle");
            setRange(undefined);
            setNotes("");
          }
        }}
      >
        <DialogContent className="max-w-[min(100%-1.5rem,30rem)] gap-5 sm:max-w-lg" showCloseButton>
          {step === "auth" && (
            <>
              <DialogHeader className="gap-2">
                <DialogTitle>Save your plan</DialogTitle>
                <DialogDescription>
                  Create a free account to pick dates and add notes. Your plans stay on your
                  personal timeline.
                </DialogDescription>
              </DialogHeader>
              <p className="rounded-xl border border-border/50 bg-muted/20 px-3.5 py-3 text-sm leading-relaxed text-foreground">
                &ldquo;{title.trim()}&rdquo;
              </p>
              <DialogFooter className="gap-2 sm:justify-start">
                <Button size="sm" nativeButton={false} render={<Link to="/signup" />}>
                  Sign up
                </Button>
                <Button
                  size="sm"
                  nativeButton={false}
                  render={<Link to="/login" />}
                  variant="outline"
                >
                  Log in
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "range" && (
            <>
              <DialogHeader className="gap-2">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Step 1 of 2 · When
                </p>
                <DialogTitle>Pick when this plan lives</DialogTitle>
                <DialogDescription>
                  Drag across the calendar for a date range, or click a single day. Use{" "}
                  <span className="text-foreground/90">Next</span> to continue — one day counts as
                  both start and end.
                </DialogDescription>
              </DialogHeader>
              <PlanContextSummary titleText={title.trim()} space={activeSpace} variant={variant} />
              <div className="-mx-1 flex justify-center">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={1}
                  defaultMonth={new Date()}
                />
              </div>
              {canSingleDay && !range?.to ? (
                <p className="text-center text-[11px] text-muted-foreground">
                  One day selected — we&apos;ll use that full day as your window.
                </p>
              ) : null}
              <DialogFooter className="gap-2 sm:gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep("idle")}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={!canContinueRange && !canSingleDay}
                  onClick={goToNotes}
                >
                  Next
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "notes" && range?.from && (
            <>
              <DialogHeader className="gap-2">
                <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
                  Step 2 of 2 · Details
                </p>
                <DialogTitle>Add notes (optional)</DialogTitle>
                <DialogDescription>
                  Links, checklist, or context — skip if the title is enough.
                </DialogDescription>
              </DialogHeader>
              <PlanContextSummary titleText={title.trim()} space={activeSpace} variant={variant} />
              <div className="space-y-1.5">
                <Label htmlFor={`${formId}-notes`} className="text-xs text-muted-foreground">
                  Notes
                </Label>
                <Textarea
                  id={`${formId}-notes`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Links, checklist, context…"
                  rows={3}
                  className="min-h-[5.5rem] resize-none"
                />
              </div>
              <DialogFooter className="gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setStep("range")}>
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={createMut.isPending}
                  onClick={() => createMut.mutate()}
                >
                  Add to timeline
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
