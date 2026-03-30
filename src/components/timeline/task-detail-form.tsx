import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { MessageSquareTextIcon, PaletteIcon, SmileIcon, Trash2Icon } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import type { TaskListRow } from "@/components/timeline/task-list";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import type { TaskSubtask } from "@/lib/db/schema/timeline.schema";
import {
  $appendTaskActivity,
  $deleteTask,
  $toggleTaskDone,
  $updateTask,
} from "@/lib/timeline/functions";
import { ACCENT_PRESETS, EMOJI_GRID, resolveAccent } from "@/lib/timeline/task-appearance";
import { cn } from "@/lib/utils";

const logTimeFmt = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function toDateInputValue(iso: string | Date | null | undefined): string {
  if (iso == null) return "";
  const d = typeof iso === "string" ? new Date(iso) : iso;
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

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

function parseDateInput(s: string): string | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return startOfDayLocalFromParts(y, m, d);
}

function parseDueDateInput(s: string): string | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return endOfDayLocalFromParts(y, m, d);
}

type SpaceOption = { id: string; name: string };

export function TaskDetailForm({
  row,
  spaces,
  search,
}: {
  readonly row: TaskListRow;
  readonly spaces: SpaceOption[];
  readonly search: Record<string, unknown>;
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
  const [starts, setStarts] = useState(() => toDateInputValue(row.startsAt));
  const [due, setDue] = useState(() => toDateInputValue(row.dueAt));
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

  const toggle = useMutation({
    mutationFn: (id: string) => $toggleTaskDone({ data: { id } }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const appendLog = useMutation({
    mutationFn: (body: string) => $appendTaskActivity({ data: { taskId: row.id, body } }),
    onSuccess: () => {
      setLogDraft("");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: () => $deleteTask({ data: { id: row.id } }),
    onError: (e: Error) => toast.error(e.message),
  });

  const done = row.status === "done";

  const saveField = (partial: TaskPatch) => {
    patch.mutate({ id: row.id, ...partial });
  };

  const setSubtasks = (next: TaskSubtask[]) => saveField({ subtasks: next });

  return (
    <div className="space-y-10">
      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-card/50 p-6 shadow-sm",
          "ring-1 ring-foreground/[0.04]",
        )}
      >
        <div className="flex flex-wrap items-start gap-4">
          <div
            className={cn(
              "flex size-14 shrink-0 items-center justify-center rounded-2xl border-2 border-background text-2xl shadow-sm ring-1 ring-border/50",
              !accent && "bg-muted",
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
          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
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
                className="text-lg font-semibold tracking-tight"
              />
              <div className="flex gap-1">
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
                  <PopoverContent className="w-[min(100vw-2rem,20rem)] p-3" align="end">
                    <p className="mb-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      Emoji
                    </p>
                    <div className="grid max-h-48 grid-cols-8 gap-1 overflow-y-auto pr-1">
                      {EMOJI_GRID.map((em) => (
                        <button
                          key={em}
                          type="button"
                          className="flex size-9 items-center justify-center rounded-lg text-lg transition-colors hover:bg-muted"
                          onClick={() => {
                            saveField({ icon: em });
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
                        saveField({ icon: null });
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
                  <PopoverContent className="w-56 p-3" align="end">
                    <p className="mb-2 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      Accent color
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ACCENT_PRESETS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          className="size-8 rounded-full ring-2 ring-transparent transition-transform hover:scale-105 focus-visible:ring-ring"
                          style={{ backgroundColor: c }}
                          onClick={() => {
                            saveField({ accentColor: c });
                            setColorOpen(false);
                          }}
                          aria-label={`Color ${c}`}
                        />
                      ))}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="mt-2 w-full text-xs"
                      onClick={() => {
                        saveField({ accentColor: null });
                        setColorOpen(false);
                      }}
                    >
                      Use category color
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Checkbox
                checked={done}
                disabled={toggle.isPending}
                onCheckedChange={() => toggle.mutate(row.id)}
                id="task-done"
              />
              <Label htmlFor="task-done" className="text-sm font-normal">
                Mark complete
              </Label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-space">Category</Label>
                <select
                  id="task-space"
                  className={cn(
                    "flex h-10 w-full rounded-xl border border-input/80 bg-background px-3 text-sm",
                    "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  )}
                  value={spaceId}
                  onChange={(e) => {
                    const next = e.target.value;
                    setSpaceId(next);
                    saveField({ spaceId: next });
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
                <Label>Visibility</Label>
                <div className="flex h-10 items-center gap-2">
                  <Checkbox
                    checked={row.isPublic}
                    id="task-public"
                    onCheckedChange={(c) => saveField({ isPublic: c === true })}
                  />
                  <Label htmlFor="task-public" className="text-sm font-normal">
                    Show on public profile
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="task-starts">Start date</Label>
                <Input
                  id="task-starts"
                  type="date"
                  value={starts}
                  onChange={(e) => setStarts(e.target.value)}
                  onBlur={() => saveField({ startsAt: starts ? parseDateInput(starts) : null })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-due">Due date</Label>
                <Input
                  id="task-due"
                  type="date"
                  value={due}
                  onChange={(e) => setDue(e.target.value)}
                  onBlur={() => saveField({ dueAt: due ? parseDueDateInput(due) : null })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-notes">Notes</Label>
              <Textarea
                id="task-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={() => {
                  const n = notes.trim();
                  if (n !== (row.notes ?? "")) saveField({ notes: n || null });
                }}
                placeholder="Context, links, acceptance criteria…"
                className="min-h-[100px] resize-y"
              />
            </div>

            {done ? (
              <div className="space-y-2">
                <Label htmlFor="task-outcome">Outcome</Label>
                <Textarea
                  id="task-outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  onBlur={() => {
                    const o = outcome.trim();
                    if (o !== (row.outcome ?? "")) saveField({ outcome: o || null });
                  }}
                  placeholder="What shipped, what you learned…"
                  className="min-h-[80px] resize-y"
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight">Subtasks</h2>
        <ul className="space-y-2">
          {subtasks.map((s) => (
            <li
              key={s.id}
              className="flex items-start gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2"
            >
              <Checkbox
                checked={s.done}
                disabled={patch.isPending}
                onCheckedChange={() =>
                  setSubtasks(subtasks.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))
                }
                className="mt-0.5"
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
                setSubtasks([...subtasks, { id: crypto.randomUUID(), title: t, done: false }]);
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
              setSubtasks([...subtasks, { id: crypto.randomUUID(), title: t, done: false }]);
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
              <p className="mt-1 leading-relaxed whitespace-pre-wrap">{entry.body}</p>
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
