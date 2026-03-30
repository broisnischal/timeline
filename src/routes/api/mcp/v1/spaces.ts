import { createFileRoute } from "@tanstack/react-router";

import { jsonError, jsonResponse, optionsResponse } from "@/lib/mcp/http.server";
import { getUserIdFromMcpBearer } from "@/lib/mcp/request-auth.server";
import { listSpacesWithCounts } from "@/lib/timeline/repo.server";
import { rpcSafe } from "@/lib/timeline/rpc-safe";

export const Route = createFileRoute("/api/mcp/v1/spaces")({
  server: {
    handlers: {
      OPTIONS: () => optionsResponse(),
      GET: async ({ request }) => {
        const userId = await getUserIdFromMcpBearer(request);
        if (!userId) {
          return jsonError("unauthorized", 401);
        }
        const rows = await listSpacesWithCounts(userId);
        return jsonResponse(rpcSafe(rows));
      },
    },
  },
});
