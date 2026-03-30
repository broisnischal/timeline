import { createFileRoute } from "@tanstack/react-router";
import * as z from "zod";

import { jsonError, jsonResponse, optionsResponse } from "@/lib/mcp/http.server";
import { getUserIdFromMcpBearer } from "@/lib/mcp/request-auth.server";
import { createTaskRow, listTasksForUser } from "@/lib/timeline/repo.server";
import { rpcSafe } from "@/lib/timeline/rpc-safe";
import { createTaskSchema } from "@/lib/timeline/validators";

export const Route = createFileRoute("/api/mcp/v1/tasks")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const userId = await getUserIdFromMcpBearer(request);
        if (!userId) {
          return jsonError("unauthorized", 401);
        }
        const url = new URL(request.url);
        const spaceId = url.searchParams.get("spaceId") ?? undefined;
        const from = url.searchParams.get("from") ?? undefined;
        const to = url.searchParams.get("to") ?? undefined;
        const rows = await listTasksForUser(userId, { spaceId, from, to });
        return jsonResponse(rpcSafe(rows));
      },
      POST: async ({ request }) => {
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
        const parsed = createTaskSchema.safeParse(raw);
        if (!parsed.success) {
          return jsonResponse(
            { error: "validation_error", details: z.treeifyError(parsed.error) },
            { status: 400 },
          );
        }
        try {
          const row = await createTaskRow(userId, parsed.data);
          return jsonResponse(rpcSafe(row), { status: 201 });
        } catch (e) {
          const msg = e instanceof Error ? e.message : "error";
          if (msg.includes("Space not found")) {
            return jsonError("space_not_found", 404);
          }
          return jsonError("create_failed", 500);
        }
      },
    },
  },
});
