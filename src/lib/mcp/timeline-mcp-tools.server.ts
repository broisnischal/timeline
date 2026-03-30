import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as z from "zod";

export type TimelineApiFetch = (path: string, init?: RequestInit) => Promise<unknown>;

function textResult(data: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

/** Shared tools for stdio (`mcp/timeline-mcp.ts`) and HTTP (`/v1/mcp`). */
export function createTimelineMcpServer(api: TimelineApiFetch): McpServer {
  const mcpServer = new McpServer(
    {
      name: "timeline",
      version: "1.0.0",
    },
    {
      instructions: `Timeline tasks API. Use timeline_whoami first for base URL hints. Tasks have title, notes, outcome (what you accomplished), status (todo/done/cancelled), subtasks, activityLog (progress notes), and scheduling fields. Use timeline_append_activity to log what you are doing; use toggleDone to flip done ↔ todo.`,
    },
  );

  mcpServer.registerTool(
    "timeline_whoami",
    {
      description: "Returns your user id and API capability summary (read this when onboarding).",
      inputSchema: z.object({}),
    },
    async () => textResult(await api("/me")),
  );

  mcpServer.registerTool(
    "timeline_list_spaces",
    {
      description: "List spaces (folders); use spaceId when creating or moving tasks.",
      inputSchema: z.object({}),
    },
    async () => textResult(await api("/spaces")),
  );

  mcpServer.registerTool(
    "timeline_create_task",
    {
      description: "Create a task in a space. Requires spaceId (from timeline_list_spaces).",
      inputSchema: z.object({
        spaceId: z.string(),
        title: z.string().min(1).max(500),
        notes: z.string().max(20000).optional(),
        outcome: z.string().max(20000).optional(),
        startsAt: z.string().optional(),
        dueAt: z.string().optional(),
        durationMinutes: z.number().int().min(0).max(10080).optional(),
        isPublic: z.boolean().optional(),
        icon: z.string().max(16).optional(),
        accentColor: z
          .string()
          .max(32)
          .optional()
          .refine((s) => !s || /^#[0-9A-Fa-f]{6}$/.test(s), "Hex color"),
      }),
    },
    async (body) =>
      textResult(
        await api("/tasks", {
          method: "POST",
          body: JSON.stringify(body),
        }),
      ),
  );

  mcpServer.registerTool(
    "timeline_list_tasks",
    {
      description:
        "List tasks. Optional filters: spaceId, ISO date range from/to on the task anchor date.",
      inputSchema: z.object({
        spaceId: z.string().optional().describe("Filter by space id"),
        from: z.string().optional().describe("ISO datetime — range start"),
        to: z.string().optional().describe("ISO datetime — range end"),
      }),
    },
    async ({ spaceId, from, to }) => {
      const q = new URLSearchParams();
      if (spaceId) q.set("spaceId", spaceId);
      if (from) q.set("from", from);
      if (to) q.set("to", to);
      const suffix = q.toString() ? `?${q.toString()}` : "";
      return textResult(await api(`/tasks${suffix}`));
    },
  );

  mcpServer.registerTool(
    "timeline_get_task",
    {
      description:
        "Fetch one task by id (includes notes, outcome, subtasks, activity log, space name).",
      inputSchema: z.object({
        taskId: z.string().describe("Task id (UUID)"),
      }),
    },
    async ({ taskId }) => textResult(await api(`/tasks/${encodeURIComponent(taskId)}`)),
  );

  const patchSchema = z.object({
    taskId: z.string(),
    toggleDone: z.boolean().optional().describe("If true, flip between done and todo"),
    appendActivity: z
      .string()
      .optional()
      .describe("Append a timestamped note to the task activity log (what you did / progress)"),
    title: z.string().optional(),
    notes: z.string().nullable().optional(),
    outcome: z.string().nullable().optional(),
    startsAt: z.string().nullable().optional(),
    dueAt: z.string().nullable().optional(),
    durationMinutes: z.number().nullable().optional(),
    status: z.enum(["todo", "done", "cancelled"]).optional(),
    isPublic: z.boolean().optional(),
    spaceId: z.string().optional(),
    icon: z.string().nullable().optional(),
    accentColor: z.string().nullable().optional(),
    subtasks: z
      .array(z.object({ id: z.string(), title: z.string(), done: z.boolean() }))
      .optional(),
  });

  mcpServer.registerTool(
    "timeline_update_task",
    {
      description:
        "Update a task: metadata fields, toggleDone, and/or appendActivity. At least one field required.",
      inputSchema: patchSchema,
    },
    async (args) => {
      const { taskId, ...body } = args;
      const keys = Object.keys(body).filter((k) => body[k as keyof typeof body] !== undefined);
      if (keys.length === 0) {
        return {
          content: [
            {
              type: "text" as const,
              text: "Provide at least one of: toggleDone, appendActivity, or task fields.",
            },
          ],
        };
      }
      return textResult(
        await api(`/tasks/${encodeURIComponent(taskId)}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      );
    },
  );

  return mcpServer;
}
