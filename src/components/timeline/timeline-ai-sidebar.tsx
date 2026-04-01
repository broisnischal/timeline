import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Loader2Icon, SparklesIcon, XIcon } from "lucide-react";
import { memo, useCallback, useId, useState } from "react";
import { toast } from "sonner";

import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { mcpAccessQueryOptions } from "@/lib/mcp/queries";
import {
  parseDraftTasksFromModelText,
  type DraftTimelineTask,
} from "@/lib/timeline/ai-tasks-parse";
import type { AppSearch } from "@/lib/timeline/app-search";
import { $createTask } from "@/lib/timeline/functions";
import { spacesQueryOptions } from "@/lib/timeline/queries";
import {
  buildTimelineAiPrompt,
  loadTimelineAiPipeline,
  TIMELINE_AI_MODEL_ID,
} from "@/lib/timeline/timeline-ai-model";
import { cn } from "@/lib/utils";

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  search: AppSearch;
};

const PANEL_WIDTH_CLASS = "w-full min-w-full lg:min-w-[30rem] lg:max-w-[30rem]";

export const TimelineAiSidebar = memo(function TimelineAiSidebar({
  open,
  onOpenChange,
  search,
}: Props) {
  const headingId = useId();
  const qc = useQueryClient();
  const mcp = useQuery(mcpAccessQueryOptions());
  const spacesQ = useQuery(spacesQueryOptions());

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [loadPct, setLoadPct] = useState<number | null>(null);
  const [loadLabel, setLoadLabel] = useState<string | null>(null);
  const [modelLoading, setModelLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [draftTasks, setDraftTasks] = useState<DraftTimelineTask[] | null>(null);
  const [rawModelOutput, setRawModelOutput] = useState<string | null>(null);
  const [targetSpaceId, setTargetSpaceId] = useState<string | null>(null);

  const spaces = spacesQ.data ?? [];
  const mcpEnabled = mcp.data?.enabled ?? false;

  const defaultSpaceId =
    search.space && spaces.some((s) => s.id === search.space)
      ? search.space
      : (spaces[0]?.id ?? null);

  const effectiveSpaceId = targetSpaceId ?? defaultSpaceId;

  const createMut = useMutation({
    mutationFn: async (tasks: DraftTimelineTask[]) => {
      if (!effectiveSpaceId) throw new Error("No space");
      for (const t of tasks) {
        await $createTask({
          data: {
            spaceId: effectiveSpaceId,
            title: t.title,
            ...(t.notes ? { notes: t.notes } : {}),
          },
        });
      }
    },
    onSuccess: (_, tasks) => {
      void qc.invalidateQueries({ queryKey: ["timelineInfinite"] });
      void qc.invalidateQueries({ queryKey: ["tasks"] });
      void qc.invalidateQueries({ queryKey: ["spaces"] });
      toast.success(`Created ${tasks.length} task${tasks.length === 1 ? "" : "s"}`);
      setDraftTasks(null);
      setRawModelOutput(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || "Could not create tasks");
    },
  });

  const ensureModel = useCallback(async () => {
    setModelLoading(true);
    setLoadPct(0);
    setLoadLabel("Loading model…");
    try {
      await loadTimelineAiPipeline((p) => {
        if (typeof p.progress === "number") setLoadPct(Math.round(p.progress));
        if (p.file) setLoadLabel(p.file);
      });
    } finally {
      setModelLoading(false);
      setLoadPct(null);
      setLoadLabel(null);
    }
  }, []);

  const runGenerate = useCallback(async () => {
    const goal = input.trim();
    if (!goal) {
      toast.message("Describe what you want on your timeline");
      return;
    }
    if (!mcpEnabled) {
      toast.error("Turn on MCP in Profile first");
      return;
    }
    if (!effectiveSpaceId) {
      toast.error("Create a space before using the assistant");
      return;
    }

    setMessages((m) => [...m, { role: "user", content: goal }]);
    setInput("");
    setDraftTasks(null);
    setRawModelOutput(null);
    setGenerating(true);

    try {
      const generator = await loadTimelineAiPipeline((p) => {
        if (typeof p.progress === "number") setLoadPct(Math.round(p.progress));
      });
      const prompt = buildTimelineAiPrompt(goal);
      const out = await generator(prompt, { max_new_tokens: 384 });
      const text = out[0]?.generated_text ?? "";
      setRawModelOutput(text);
      const tasks = parseDraftTasksFromModelText(text);
      setDraftTasks(tasks);

      const summary =
        tasks.length > 0
          ? `Draft plan (${tasks.length} tasks). Review below and add to your timeline.`
          : `Could not read a task list from the model output. Try a shorter goal or rephrase. Raw output is shown below for debugging.`;

      setMessages((m) => [...m, { role: "assistant", content: summary }]);

      if (tasks.length === 0) {
        toast.message("No structured tasks parsed — check raw output");
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      toast.error(msg);
      setMessages((m) => [...m, { role: "assistant", content: `Error: ${msg}` }]);
    } finally {
      setGenerating(false);
      setLoadPct(null);
    }
  }, [input, mcpEnabled, effectiveSpaceId]);

  const profileSearchLink = search;

  return (
    <aside
      aria-hidden={!open}
      aria-labelledby={headingId}
      className={cn(
        "flex min-h-0 shrink-0 flex-col overflow-hidden border-border/50 bg-background motion-reduce:transition-none",
        "transition-[height,width,border-color,box-shadow] duration-200 ease-out",
        open
          ? "max-h-[min(88dvh,40rem)] shrink-0 border-t lg:h-full lg:max-h-none lg:w-[30rem] lg:border-t-0 lg:border-l"
          : "pointer-events-none h-0 border-t-0 lg:h-0 lg:w-0 lg:border-l-0",
      )}
    >
      <div className={cn("flex h-full min-h-0 flex-1 flex-col", PANEL_WIDTH_CLASS)}>
        <div className="relative shrink-0 border-b border-border/50 px-5 py-3 pr-14 text-left">
          <h2
            id={headingId}
            className="flex flex-wrap items-center gap-x-2 gap-y-1 font-heading text-base font-medium"
          >
            <span className="inline-flex items-center gap-2">
              <SparklesIcon className="size-4 text-primary" aria-hidden />
              Timeline assistant
            </span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] font-normal text-muted-foreground">
              {TIMELINE_AI_MODEL_ID}
            </code>
          </h2>
          <p className="sr-only">
            Local model in your browser; task creation uses your signed-in session when MCP is
            enabled.
          </p>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-3 right-3 rounded-lg text-muted-foreground hover:text-foreground"
            aria-label="Close timeline assistant"
            onClick={() => onOpenChange(false)}
          >
            <XIcon className="size-4" aria-hidden />
          </Button>
        </div>

        {!mcp.data ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 [scrollbar-gutter:stable]">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Checking access…
            </div>
          </div>
        ) : !mcpEnabled ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 [scrollbar-gutter:stable]">
            <div className="space-y-3 rounded-xl border border-amber-500/35 bg-amber-500/[0.06] p-4 dark:bg-amber-950/20">
              <p className="text-sm font-medium text-foreground">
                Enable MCP to use this assistant
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Turn on MCP under Profile so automated access to your workspace is explicitly
                enabled. The assistant then creates tasks in your account (aligned with the Timeline
                MCP tools).
              </p>
              <Link
                to="/app/profile"
                search={profileSearchLink}
                className={cn(
                  buttonVariants({ variant: "secondary", size: "sm" }),
                  "w-full rounded-lg",
                )}
              >
                Open Profile — MCP
              </Link>
            </div>
          </div>
        ) : spaces.length === 0 ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 [scrollbar-gutter:stable]">
            <p className="text-sm text-muted-foreground">
              Create a space first, then open this assistant again.
            </p>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-border/40 px-5 py-3">
              <div className="space-y-2">
                <Label htmlFor="ai-space" className="text-xs text-muted-foreground">
                  Add tasks to
                </Label>
                <select
                  id="ai-space"
                  className={cn(
                    "h-9 w-full rounded-lg border border-border/60 bg-background px-2 text-sm",
                    "outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  )}
                  value={effectiveSpaceId ?? ""}
                  onChange={(e) => setTargetSpaceId(e.target.value || null)}
                >
                  {spaces.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 py-4 [scrollbar-gutter:stable]"
                aria-label="Assistant conversation and draft output"
              >
                {messages.length > 0 ? (
                  <ul className="mb-4 space-y-3">
                    {messages.map((msg, i) => (
                      <li
                        key={`${i}-${msg.role}`}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm leading-relaxed",
                          msg.role === "user"
                            ? "ml-4 border border-border/50 bg-muted/40"
                            : "mr-4 border border-border/40 bg-background",
                        )}
                      >
                        <span className="mb-1 block text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                          {msg.role === "user" ? "You" : "Assistant"}
                        </span>
                        {msg.content}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mb-4 text-sm text-muted-foreground">
                    Example: “Create a timeline for learning backend development” — you will get
                    draft tasks to add to the selected space.
                  </p>
                )}

                {draftTasks && draftTasks.length > 0 ? (
                  <div className="space-y-3 border-t border-border/50 pt-4">
                    <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                      Draft tasks ({draftTasks.length})
                    </p>
                    <ol className="list-decimal space-y-2 pl-4 text-sm">
                      {draftTasks.map((t, i) => (
                        <li key={i} className="leading-snug">
                          <span className="font-medium text-foreground">{t.title}</span>
                          {t.notes ? (
                            <span className="mt-0.5 block text-muted-foreground">{t.notes}</span>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                    <Button
                      type="button"
                      className="w-full rounded-lg"
                      disabled={createMut.isPending}
                      onClick={() => void createMut.mutateAsync(draftTasks)}
                    >
                      {createMut.isPending ? (
                        <>
                          <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                          Creating…
                        </>
                      ) : (
                        "Add tasks to timeline"
                      )}
                    </Button>
                  </div>
                ) : null}

                {rawModelOutput && draftTasks !== null && draftTasks.length === 0 ? (
                  <details className="mt-4 rounded-lg border border-border/50 bg-muted/25 p-3 text-xs">
                    <summary className="cursor-pointer font-medium text-foreground">
                      Raw model output
                    </summary>
                    <pre className="mt-2 max-h-48 overflow-y-auto overscroll-y-contain font-mono text-[11px] whitespace-pre-wrap text-muted-foreground [scrollbar-gutter:stable]">
                      {rawModelOutput}
                    </pre>
                  </details>
                ) : null}
              </div>

              <div
                className="shrink-0 border-t border-border/50 bg-background px-5 py-3 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-sm"
                aria-label="Assistant input"
              >
                <div className="space-y-2">
                  <Label htmlFor="ai-input" className="text-xs text-muted-foreground">
                    Your goal
                  </Label>
                  <Textarea
                    id="ai-input"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g. Complete backend developer roadmap in 3 months"
                    rows={3}
                    disabled={generating || modelLoading}
                    className="resize-none rounded-xl text-sm"
                  />
                </div>

                {(modelLoading || generating) && loadPct !== null ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {loadLabel ? `${loadLabel} — ` : ""}
                    {loadPct}%
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="rounded-lg"
                    disabled={modelLoading || generating}
                    onClick={() => void ensureModel()}
                  >
                    {modelLoading ? (
                      <>
                        <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                        Loading model…
                      </>
                    ) : (
                      "Preload model"
                    )}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="rounded-lg"
                    disabled={modelLoading || generating || !input.trim()}
                    onClick={() => void runGenerate()}
                  >
                    {generating ? (
                      <>
                        <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                        Generating…
                      </>
                    ) : (
                      "Generate plan"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </aside>
  );
});
