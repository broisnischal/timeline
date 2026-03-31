import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  CalendarIcon,
  MessageSquareTextIcon,
  PaletteIcon,
  SmileIcon,
  Trash2Icon,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";

import { AccentColorPicker } from "@/components/timeline/accent-color-picker";
import { TaskDoneCheckbox } from "@/components/timeline/task-done-checkbox";
import type { TaskListRow } from "@/components/timeline/task-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { TaskSubtask } from "@/lib/db/schema/timeline.schema";
import type { AppSearch } from "@/lib/timeline/app-search";
import { $appendTaskActivity, $deleteTask, $updateTask } from "@/lib/timeline/functions";
import { EMOJI_GRID, isHexColor, resolveAccent } from "@/lib/timeline/task-appearance";
import { useToggleTaskDone } from "@/lib/timeline/use-toggle-task-done";
import { cn } from "@/lib/utils";

const logTimeFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function startOfDayLocalFromParts(y: number, m: number, d: number) {
  const x = new Date(y, m - 1, d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

function endOfDayLocalFromParts(y: number, m: number, d: number) {
  const x = new Date(y, m - 1, d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

/** Local calendar day from stored ISO (avoids timezone shifting the displayed day). */
function localDayFromIso(iso: string | Date | null | undefined): Date | undefined {
  if (iso == null) return undefined;
  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) return undefined;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function rangeFromRow(
  startsAt?: string | Date | null,
  dueAt?: string | Date | null,
): DateRange | undefined {
  const from = localDayFromIso(startsAt ?? undefined);
  const toRaw = localDayFromIso(dueAt ?? undefined);
  if (!from && !toRaw) return undefined;
  const start = from ?? toRaw;
  if (!start) return undefined;
  const end = toRaw ?? start;
  return { from: start, to: end };
}

function rangeToTaskPatch(range: DateRange | undefined): {
  startsAt: string | null;
  dueAt: string | null;
} {
  if (!range?.from) return { startsAt: null, dueAt: null };
  const from = range.from;
  const to = range.to ?? range.from;
  return {
    startsAt: startOfDayLocalFromParts(from.getFullYear(), from.getMonth() + 1, from.getDate()),
    dueAt: endOfDayLocalFromParts(to.getFullYear(), to.getMonth() + 1, to.getDate()),
  };
}

type SpaceOption = { id: string; name: string };

function TaskScheduleFields({
  startsAt,
  dueAt,
  onSave,
}: {
  readonly startsAt: string | Date | null | undefined;
  readonly dueAt: string | Date | null | undefined;
  readonly onSave: (patch: { startsAt: string | null; dueAt: string | null }) => void;
}) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() =>
    rangeFromRow(startsAt, dueAt),
  );
  const [rangeOpen, setRangeOpen] = useState(false);

  const scheduleRangeLabel = useMemo(() => {
    if (!dateRange?.from) return null;
    const fmt = new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const start = fmt.format(dateRange.from);
    const end = dateRange.to ? fmt.format(dateRange.to) : null;
    if (!end || start === end) return start;
    return `${start} → ${end}`;
  }, [dateRange]);

  const commitDateRangeOnClose = (open: boolean) => {
    setRangeOpen(open);
    if (open) return;
    let next = dateRange;
    if (next?.from && !next.to) {
      next = { from: next.from, to: next.from };
    }
    setDateRange(next);
    const { startsAt: s, dueAt: d } = rangeToTaskPatch(next);
    const server = rangeToTaskPatch(rangeFromRow(startsAt, dueAt));
    if (s !== server.startsAt || d !== server.dueAt) {
      onSave({ startsAt: s, dueAt: d });
    }
  };

  return (
    <div>
      <p className="text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
        Schedule
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">
        Click a day, then another — or one day for a single-day task.
      </p>
      <Popover open={rangeOpen} onOpenChange={commitDateRangeOnClose}>
        <PopoverTrigger
          className={cn(
            buttonVariants({ variant: "outline", size: "default" }),
            "mt-3 h-auto min-h-10 w-full max-w-md justify-start gap-2 px-3 py-2 text-left font-normal sm:w-auto",
          )}
          aria-expanded={rangeOpen}
          aria-label="Edit date range"
        >
          <CalendarIcon className="size-4 shrink-0 opacity-70" aria-hidden />
          <span className="min-w-0 flex-1 truncate">
            {scheduleRangeLabel ?? "No dates — tap to add a range"}
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-auto gap-0 p-0" align="start">
          <div className="border-b border-border/60 px-3 py-2">
            <p className="text-xs font-medium text-foreground">Date range</p>
            <p className="text-[11px] text-muted-foreground">
              Drag across days or tap twice for a span.
            </p>
          </div>
          <div className="flex justify-center p-1">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={1}
              defaultMonth={dateRange?.from ?? new Date()}
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-border/60 p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => {
                setDateRange(undefined);
                onSave({ startsAt: null, dueAt: null });
                setRangeOpen(false);
              }}
            >
              Clear dates
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function TaskDetailForm({
  row,
  spaces,
  search,
}: {
  readonly row: TaskListRow;
  readonly spaces: SpaceOption[];
  readonly search: AppSearch;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const accent = resolveAccent(row);
  const subtasks = useMemo(
    () => (Array.isArray(row.subtasks) ? row.subtasks : []) as TaskSubtask[],
    [row.subtasks],
  );
  const activityLog = useMemo(() => {
    const raw = row.activityLog;
    if (!Array.isArray(raw)) return [];
    return [...raw].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [row.activityLog]);

  const [title, setTitle] = useState(row.title);
  const [notes, setNotes] = useState(row.notes ?? "");
  const [outcome, setOutcome] = useState(row.outcome ?? "");
  const [spaceId, setSpaceId] = useState(row.spaceId);
  const [subDraft, setSubDraft] = useState("");
  const [logDraft, setLogDraft] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["tasks"] });
    void qc.invalidateQueries({ queryKey: ["task", row.id] });
    void qc.invalidateQueries({ queryKey: ["streak"] });
  };

  type TaskPatch = {
    title?: string;
    notes?: string | null;
    outcome?: string | null;
    startsAt?: string | null;
    dueAt?: string | null;
    spaceId?: string;
    icon?: string | null;
    accentColor?: string | null;
    subtasks?: TaskSubtask[];
    isPublic?: boolean;
  };

  const patch = useMutation({
    mutationFn: (data: { id: string } & TaskPatch) => $updateTask({ data }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const saveField = (partial: TaskPatch, opts?: { ok?: string }) => {
    patch.mutate(
      { id: row.id, ...partial },
      opts?.ok ? { onSuccess: () => toast.success(opts.ok!) } : undefined,
    );
  };

  const setSubtasks = (next: TaskSubtask[], ok?: string) => {
    patch.mutate(
      { id: row.id, subtasks: next },
      ok ? { onSuccess: () => toast.success(ok) } : undefined,
    );
  };

  const toggle = useToggleTaskDone();

  const appendLog = useMutation({
    mutationFn: (body: string) => $appendTaskActivity({ data: { taskId: row.id, body } }),
    onSuccess: () => {
      setLogDraft("");
      invalidate();
      toast.success("Activity logged");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => $deleteTask({ data: { id: row.id } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const done = row.status === "done";

  return (
    <div className="space-y-10">
      <div className="divide-y divide-border/50">
        <div className="flex flex-wrap items-start gap-4 pb-8">
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-background text-2xl shadow-sm ring-1 ring-border/40",
              !accent && "bg-muted/80",
            )}
            style={
              accent ? { backgroundColor: `${accent}22`, borderColor: `${accent}66` } : undefined
            }
          >
            {row.icon ? (
              <span aria-hidden>{row.icon}</span>
            ) : (
              <span
                className="size-3 rounded-full"
                style={{ backgroundColor: accent ?? "hsl(var(--primary))" }}
              />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-5">
            <div className="flex flex-wrap items-start gap-2 sm:items-center">
              <Label htmlFor="task-title" className="sr-only">
                Title
              </Label>
              <Input
                id="task-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  const t = title.trim();
                  if (t && t !== row.title) saveField({ title: t });
                }}
                className={cn(
                  "min-h-11 flex-1 border-0 bg-transparent px-0 text-xl font-semibold tracking-tight shadow-none",
                  "ring-0 focus-visible:ring-0 md:text-2xl",
                )}
              />
              <div className="flex shrink-0 gap-1">
                <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
                  <PopoverTrigger
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon-sm" }),
                      "shrink-0",
                    )}
                    aria-label="Choose emoji"
                  >
                    <SmileIcon className="size-4" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(100vw-2rem,18rem)] gap-0 p-3" align="end">
                    <p className="mb-2 text-[11px] font-medium text-muted-foreground">Emoji</p>
                    <div className="grid max-h-44 grid-cols-8 gap-0.5 overflow-y-auto pr-1">
                      {EMOJI_GRID.map((em) => (
                        <button
                          key={em}
                          type="button"
                          className="flex size-8 items-center justify-center rounded-md text-base transition-colors hover:bg-muted"
                          onClick={() => {
                            saveField({ icon: em }, { ok: "Emoji updated" });
                            setEmojiOpen(false);
                          }}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full text-xs"
                      onClick={() => {
                        saveField({ icon: null }, { ok: "Emoji cleared" });
                        setEmojiOpen(false);
                      }}
                    >
                      Clear emoji
                    </Button>
                  </PopoverContent>
                </Popover>
                <Popover open={colorOpen} onOpenChange={setColorOpen}>
                  <PopoverTrigger
                    className={cn(
                      buttonVariants({ variant: "outline", size: "icon-sm" }),
                      "shrink-0",
                    )}
                    aria-label="Choose accent color"
                  >
                    <PaletteIcon className="size-4" />
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(100vw-2rem,16rem)] gap-0 p-3" align="end">
                    <p className="mb-2 text-[11px] font-medium text-muted-foreground">Accent</p>
                    <AccentColorPicker
                      key={row.accentColor ?? "none"}
                      value={isHexColor(row.accentColor ?? undefined) ? row.accentColor : null}
                      onChange={(next) => {
                        saveField(
                          { accentColor: next },
                          { ok: next == null ? "Using space color" : "Accent updated" },
                        );
                      }}
                      clearLabel="Use space color"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <TaskDoneCheckbox
                checked={done}
                disabled={toggle.isPendingFor(row.id)}
                onCheckedChange={() => toggle.mutate(row.id)}
                id="task-done"
                className="size-5"
              />
              <Label htmlFor="task-done" className="text-sm font-normal">
                Mark complete
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-5 py-8">
          <TaskScheduleFields
            key={`${String(row.startsAt ?? "")}-${String(row.dueAt ?? "")}`}
            startsAt={row.startsAt}
            dueAt={row.dueAt}
            onSave={(p) => {
              const cleared = !p.startsAt && !p.dueAt;
              saveField(p, { ok: cleared ? "Schedule cleared" : "Schedule updated" });
            }}
          />

          <div className="grid gap-6 sm:grid-cols-2 sm:gap-8">
            <div className="space-y-2">
              <Label
                htmlFor="task-space"
                className="text-[11px] font-medium tracking-wider uppercase"
              >
                Space
              </Label>
              <select
                id="task-space"
                className={cn(
                  "flex h-10 w-full rounded-lg border border-input/60 bg-background px-3 text-sm",
                  "transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                )}
                value={spaceId}
                onChange={(e) => {
                  const next = e.target.value;
                  setSpaceId(next);
                  const name = spaces.find((s) => s.id === next)?.name ?? "space";
                  saveField({ spaceId: next }, { ok: `Moved to ${name}` });
                }}
              >
                {spaces.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <span className="text-[11px] font-medium tracking-wider text-foreground uppercase">
                Visibility
              </span>
              <div className="flex min-h-10 items-center gap-2.5 rounded-lg border border-transparent px-0 py-1">
                <Checkbox
                  checked={row.isPublic}
                  id="task-public"
                  onCheckedChange={(c) =>
                    saveField(
                      { isPublic: c === true },
                      {
                        ok: c === true ? "Shown on public profile" : "Hidden from public profile",
                      },
                    )
                  }
                />
                <Label htmlFor="task-public" className="text-sm leading-snug font-normal">
                  Show on public profile
                </Label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 pt-8">
          <div>
            <Label
              htmlFor="task-notes"
              className="text-[11px] font-medium tracking-wider uppercase"
            >
              Notes
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Context, links, acceptance criteria — whatever helps you finish.
            </p>
          </div>
          <Textarea
            id="task-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => {
              const n = notes.trim();
              if (n !== (row.notes ?? "")) saveField({ notes: n || null });
            }}
            placeholder="Write freely — markdown-style lists work well here."
            className="min-h-34 resize-y rounded-lg border-input/60 bg-background leading-relaxed placeholder:text-muted-foreground/80"
          />
        </div>

        {done ? (
          <div className="space-y-3 border-t border-border/50 pt-8">
            <div>
              <Label
                htmlFor="task-outcome"
                className="text-[11px] font-medium tracking-wider uppercase"
              >
                Outcome
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Capture what shipped or what you learned when this task is done.
              </p>
            </div>
            <Textarea
              id="task-outcome"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              onBlur={() => {
                const o = outcome.trim();
                if (o !== (row.outcome ?? "")) saveField({ outcome: o || null });
              }}
              placeholder="What shipped, what you learned…"
              className="min-h-24 resize-y rounded-lg border-input/60 bg-background leading-relaxed"
            />
          </div>
        ) : null}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Subtasks</h2>
        <ul className="space-y-2">
          {subtasks.map((s) => (
            <li
              key={s.id}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2"
            >
              <TaskDoneCheckbox
                checked={s.done}
                disabled={patch.isPending}
                onCheckedChange={() => {
                  const willBeDone = !s.done;
                  setSubtasks(
                    subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)),
                    willBeDone ? "Subtask completed" : "Subtask reopened",
                  );
                }}
                className="mt-0.5 size-4"
              />
              <span className={cn("text-sm", s.done && "text-muted-foreground line-through")}>
                {s.title}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <Input
            value={subDraft}
            onChange={(e) => setSubDraft(e.target.value)}
            placeholder="Add a subtask…"
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const t = subDraft.trim();
                if (!t) return;
                setSubtasks(
                  [...subtasks, { id: crypto.randomUUID(), title: t, done: false }],
                  "Subtask added",
                );
                setSubDraft("");
              }
            }}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={() => {
              const t = subDraft.trim();
              if (!t) return;
              setSubtasks(
                [...subtasks, { id: crypto.randomUUID(), title: t, done: false }],
                "Subtask added",
              );
              setSubDraft("");
            }}
          >
            Add
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <MessageSquareTextIcon className="size-4 opacity-70" />
          Activity log
        </h2>
        <ul className="space-y-3">
          {activityLog.map((entry) => (
            <li
              key={entry.id}
              className="rounded-xl border border-border/40 bg-muted/15 px-4 py-3 text-sm"
            >
              <p className="text-[11px] text-muted-foreground">
                {logTimeFmt.format(new Date(entry.at))}
              </p>
              <p className="mt-1 leading-relaxed whitespace-pre-wrap">
                <LinkifiedText text={entry.body} />
              </p>
            </li>
          ))}
        </ul>
        <Textarea
          value={logDraft}
          onChange={(e) => setLogDraft(e.target.value)}
          placeholder="Add a progress note…"
          className="min-h-[88px] resize-y"
        />
        <Button
          type="button"
          variant="secondary"
          disabled={appendLog.isPending || !logDraft.trim()}
          onClick={() => {
            const t = logDraft.trim();
            if (t) appendLog.mutate(t);
          }}
        >
          Add log entry
        </Button>
      </section>

      <div className="flex flex-wrap items-center gap-3 border-t border-border/50 pt-8">
        <Button
          type="button"
          variant="destructive"
          disabled={del.isPending}
          onClick={() => {
            if (typeof window !== "undefined" && window.confirm("Delete this task permanently?")) {
              del.mutate(undefined, {
                onSuccess: () => {
                  toast.success("Task deleted");
                  void qc.invalidateQueries({ queryKey: ["tasks"] });
                  qc.removeQueries({ queryKey: ["task", row.id] });
                  void navigate({ to: "/app/timeline", search });
                },
              });
            }
          }}
        >
          <Trash2Icon className="size-4" />
          Delete task
        </Button>
        <Link
          to="/app/timeline"
          search={search}
          className={cn(buttonVariants({ variant: "outline" }))}
        >
          Back to timeline
        </Link>
      </div>
    </div>
  );
}
