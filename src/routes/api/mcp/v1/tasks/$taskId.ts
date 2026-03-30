import { createFileRoute } from "@tanstack/react-router";

import { jsonError, jsonResponse, optionsResponse } from "@/lib/mcp/http.server";
import { getUserIdFromMcpBearer } from "@/lib/mcp/request-auth.server";
import { applyMcpTaskPatch, mcpGetTask } from "@/lib/mcp/task-api.server";

export const Route = createFileRoute("/api/mcp/v1/tasks/$taskId")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request, params }) => {
        const userId = await getUserIdFromMcpBearer(request);
        if (!userId) {
          return jsonError("unauthorized", 401);
        }
        const task = await mcpGetTask(userId, params.taskId);
        if (!task) {
          return jsonError("not_found", 404);
        }
        return jsonResponse(task);
      },
      PATCH: async ({ request, params }) => {
        const userId = await getUserIdFromMcpBearer(request);
        if (!userId) {
          return jsonError("unauthorized", 401);
        }
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return jsonError("invalid_json", 400);
        }
        const result = await applyMcpTaskPatch(userId, params.taskId, raw);
        if ("error" in result) {
          return jsonResponse(
            { error: "validation_error", details: result.error },
            { status: 400 },
          );
        }
        if (result.notFound) {
          return jsonError("not_found", 404);
        }
        return jsonResponse(result.task);
      },
    },
  },
});
