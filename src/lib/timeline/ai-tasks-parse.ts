import * as z from "zod";

const draftTaskSchema = z.object({
  title: z.string().min(1).max(500),
  notes: z.string().max(20000).optional(),
});

const draftTasksArraySchema = z.array(draftTaskSchema);

export type DraftTimelineTask = z.infer<typeof draftTaskSchema>;

/** Month-style roadmaps can need ~31 rows. */
export const MAX_ASSISTANT_TASKS = 35;

function extractJsonArraySlice(text: string): string | null {
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

function cleanTitle(s: string): string {
  return s
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim()
    .slice(0, 500);
}

function parseNumberedLines(text: string): DraftTimelineTask[] {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: DraftTimelineTask[] = [];
  for (const line of lines) {
    const m = line.match(/^\d+[.)]\s*(.+)$/);
    if (!m) continue;
    const title = cleanTitle(m[1].replace(/^[-*•]\s*/, ""));
    if (title.length > 0) out.push({ title });
    if (out.length >= MAX_ASSISTANT_TASKS) break;
  }
  return out;
}

function parseBulletLines(text: string): DraftTimelineTask[] {
  const lines = text
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: DraftTimelineTask[] = [];
  for (const line of lines) {
    const m = line.match(/^[-*•]\s*(.+)$/);
    if (!m) continue;
    const title = cleanTitle(m[1]);
    if (title.length > 0) out.push({ title });
    if (out.length >= MAX_ASSISTANT_TASKS) break;
  }
  return out;
}

/** Single-line or compact lists: "a; b; c" */
function parseSemicolonList(text: string): DraftTimelineTask[] {
  const oneLine = text.replace(/\s+/g, " ").trim();
  if (!oneLine.includes(";") || oneLine.includes("\n")) return [];
  const parts = oneLine
    .split(";")
    .map((p) => cleanTitle(p))
    .filter((p) => p.length > 1);
  if (parts.length < 2) return [];
  return parts.slice(0, MAX_ASSISTANT_TASKS).map((title) => ({ title }));
}

/**
 * When the goal reads like a daily / monthly habit plan, synthesize one task per day.
 * Covers cases where tiny seq2seq models return prose instead of lists.
 */
export function inferFallbackTasksFromGoal(goal: string): DraftTimelineTask[] {
  const g = goal.trim();
  if (!g) return [];
  const lower = g.toLowerCase();

  const dailyCue =
    /\b(each|every)\s+day\b/.test(lower) ||
    /\ba\s+new\b/.test(lower) ||
    /\bdaily\b/.test(lower) ||
    /\bper\s+day\b/.test(lower) ||
    /\bone\s+month\b/.test(lower) ||
    /\b1\s*month\b/.test(lower) ||
    /\bfor\s+the\s+month\b/.test(lower) ||
    /\b30\s*days?\b/.test(lower) ||
    /\b31\s*days?\b/.test(lower);

  if (!dailyCue) return [];

  let n = 30;
  const dayMatch = lower.match(/\b(\d{1,2})\s*days?\b/);
  if (dayMatch) {
    n = Math.min(MAX_ASSISTANT_TASKS, Math.max(1, parseInt(dayMatch[1], 10)));
  } else if (/\b31\s*days?\b/.test(lower)) {
    n = 31;
  } else if (/\b28\s*days?\b/.test(lower) || /\b4\s*weeks?\b/.test(lower)) {
    n = 28;
  }

  let label = g
    .replace(/\s+/g, " ")
    .replace(/^create\s+(a\s+|the\s+)?roadmap\s+(for\s+)?/i, "")
    .replace(/\s+for\s+\d+\s+months?[\s\S]*$/i, "")
    .replace(/\s+for\s+one\s+month[\s\S]*$/i, "")
    .replace(/\s+for\s+1\s+month[\s\S]*$/i, "")
    .replace(/\s+(each|every)\s+day[\s\S]*$/i, "")
    .replace(/\s+a\s+new\s+news[\s\S]*$/i, "")
    .replace(/\s+if you don'?t have[\s\S]*$/i, "")
    .trim();

  if (label.length < 2) label = "Daily item";

  const tasks: DraftTimelineTask[] = [];
  for (let i = 1; i <= n; i++) {
    const title = `Day ${i}: ${label}`.slice(0, 500);
    tasks.push({
      title,
      notes: `Part of your ${n}-day plan from the assistant.\nOriginal goal: ${g}`.slice(0, 2000),
    });
  }
  return tasks;
}

/**
 * Parse model output: JSON array, numbered lines, bullets, semicolon list.
 */
export function parseDraftTasksFromModelText(raw: string): DraftTimelineTask[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];

  const slice = extractJsonArraySlice(trimmed);
  if (slice) {
    try {
      const parsed: unknown = JSON.parse(slice);
      const arr = draftTasksArraySchema.safeParse(parsed);
      if (arr.success && arr.data.length > 0) {
        return arr.data.slice(0, MAX_ASSISTANT_TASKS);
      }
    } catch {
      /* fall through */
    }
  }

  const numbered = parseNumberedLines(trimmed);
  if (numbered.length > 0) return numbered;

  const bullets = parseBulletLines(trimmed);
  if (bullets.length > 0) return bullets;

  const semi = parseSemicolonList(trimmed);
  if (semi.length > 0) return semi;

  return [];
}

export function draftTasksFromAssistantModel(
  raw: string,
  userGoal: string,
): {
  tasks: DraftTimelineTask[];
  source: "model" | "fallback";
} {
  const fromModel = parseDraftTasksFromModelText(raw);
  if (fromModel.length > 0) return { tasks: fromModel, source: "model" };
  const fallback = inferFallbackTasksFromGoal(userGoal);
  if (fallback.length > 0) return { tasks: fallback, source: "fallback" };
  return { tasks: [], source: "fallback" };
}
