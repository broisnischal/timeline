import "@tanstack/react-start/server-only";

export const MCP_CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
};

export function jsonResponse(
  body: unknown,
  init: { status?: number; headers?: Record<string, string> } = {},
): Response {
  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...MCP_CORS_HEADERS,
      ...init.headers,
    },
  });
}

export function jsonError(message: string, status: number): Response {
  return jsonResponse({ error: message }, { status });
}

export function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: MCP_CORS_HEADERS });
}
