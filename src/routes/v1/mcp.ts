import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createFileRoute } from "@tanstack/react-router";

import { MCP_STREAMABLE_CORS_HEADERS } from "@/lib/mcp/mcp-streamable-cors.server";
import { getUserIdFromMcpBearer } from "@/lib/mcp/request-auth.server";
import { createTimelineMcpServer } from "@/lib/mcp/timeline-mcp-tools.server";

function corsOptions(): Response {
  return new Response(null, { status: 204, headers: MCP_STREAMABLE_CORS_HEADERS });
}

async function handleMcpRequest(request: Request): Promise<Response> {
  const userId = await getUserIdFromMcpBearer(request);
  if (!userId) {
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        ...MCP_STREAMABLE_CORS_HEADERS,
      },
    });
  }

  const auth = request.headers.get("authorization") ?? "";
  const origin = new URL(request.url).origin;

  const apiFetch = async (path: string, init?: RequestInit) => {
    const res = await fetch(`${origin}/api/mcp/v1${path}`, {
      ...init,
      headers: {
        Authorization: auth,
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
    }
    return text ? JSON.parse(text) : null;
  };

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  const server = createTimelineMcpServer(apiFetch);
  await server.connect(transport);

  const response = await transport.handleRequest(request);
  const merged = new Headers(response.headers);
  for (const [k, v] of Object.entries(MCP_STREAMABLE_CORS_HEADERS)) {
    merged.set(k, v);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: merged,
  });
}

export const Route = createFileRoute("/v1/mcp")({
  server: {
    handlers: {
      OPTIONS: () => corsOptions(),
      GET: async ({ request }) => handleMcpRequest(request),
      POST: async ({ request }) => handleMcpRequest(request),
      DELETE: async ({ request }) => handleMcpRequest(request),
    },
  },
});
