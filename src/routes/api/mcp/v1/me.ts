import { createFileRoute } from "@tanstack/react-router";

import { env } from "@/env/server";
import { jsonError, jsonResponse, optionsResponse } from "@/lib/mcp/http.server";
import { getUserIdFromMcpBearer } from "@/lib/mcp/request-auth.server";

export const Route = createFileRoute("/api/mcp/v1/me")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const userId = await getUserIdFromMcpBearer(request);
        if (!userId) {
          return jsonError("unauthorized", 401);
        }
        const origin = env.VITE_BASE_URL.replace(/\/$/, "");
        return jsonResponse({
          userId,
          api: {
            baseUrl: `${origin}/api/mcp/v1`,
            mcpStreamUrl: `${origin}/v1/mcp`,
            auth: "Send header Authorization: Bearer <your key from Profile → MCP access>.",
          },
          capabilities: {
            tasks:
              "List, create (POST /tasks), read, and patch tasks (title, notes, outcome, dates, status, subtasks, activity log). Use toggleDone to flip done/todo; appendActivity adds a progress note for the AI and your future self.",
            spaces: "List spaces to choose spaceId when creating tasks.",
          },
        });
      },
    },
  },
});
