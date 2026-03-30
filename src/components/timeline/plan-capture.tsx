import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { PlusIcon } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

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

export function PlanCapture({
  activeSpaceId,
  initialTitle,
  variant = "app",
}: {
  readonly activeSpaceId: string;
  readonly initialTitle?: string | undefined;
  readonly variant?: "app" | "landing";
}) {
  const qc = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const formId = useId();
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
      toast.error("Loading categories…");
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
      toast.success("Plan added");
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

  return (
    <>
      <div className="flex items-center gap-3 rounded-2xl bg-card/50 px-3 py-2.5 ring-1 ring-border/80">
        <PlusIcon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <Input
          ref={inputRef}
          id={`${formId}-plan`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              openFlow();
            }
          }}
          placeholder="Add your plan, a link, or plain text…"
          className="h-10 flex-1 border-0 bg-transparent text-base shadow-none ring-0 placeholder:text-muted-foreground/70 focus-visible:ring-0"
          autoComplete="off"
        />
        <KbdGroup className="hidden shrink-0 text-muted-foreground sm:inline-flex">
          <Kbd suppressHydrationWarning>{modKey}</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
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
        <DialogContent className="max-w-md sm:max-w-lg" showCloseButton>
          {step === "auth" && (
            <>
              <DialogHeader>
                <DialogTitle>Save your plan</DialogTitle>
                <DialogDescription>
                  Create a free account to pick dates, add notes, and keep everything in one
                  timeline.
                </DialogDescription>
              </DialogHeader>
              <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
                &ldquo;{title.trim()}&rdquo;
              </p>
              <DialogFooter className="gap-2 sm:justify-start">
                <Button nativeButton={false} render={<Link to="/signup" />}>
                  Sign up
                </Button>
                <Button nativeButton={false} render={<Link to="/login" />} variant="outline">
                  Log in
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "range" && (
            <>
              <DialogHeader>
                <DialogTitle>When?</DialogTitle>
                <DialogDescription>
                  Choose the window for this plan — drag across days or tap start and end.
                </DialogDescription>
              </DialogHeader>
              <p className="font-medium text-foreground">{title.trim()}</p>
              <div className="flex justify-center">
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={setRange}
                  numberOfMonths={1}
                  defaultMonth={new Date()}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setStep("idle")}>
                  Back
                </Button>
                <Button
                  type="button"
                  disabled={!canContinueRange && !canSingleDay}
                  onClick={goToNotes}
                >
                  Next
                </Button>
              </DialogFooter>
              {canSingleDay && !range?.to ? (
                <p className="text-center text-xs text-muted-foreground">
                  Select an end date, or click Next to use a single day.
                </p>
              ) : null}
            </>
          )}

          {step === "notes" && range?.from && (
            <>
              <DialogHeader>
                <DialogTitle>Any notes?</DialogTitle>
                <DialogDescription>
                  Optional — links, context, or how you&apos;ll know it&apos;s done.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <Label htmlFor={`${formId}-notes`} className="sr-only">
                  Notes
                </Label>
                <Textarea
                  id={`${formId}-notes`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Links, checklist, context…"
                  rows={4}
                  className="resize-none"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setStep("range")}>
                  Back
                </Button>
                <Button
                  type="button"
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
