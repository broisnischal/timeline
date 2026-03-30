#!/usr/bin/env bun
/**
 * Stdio MCP (optional). Prefer HTTP MCP in Cursor: URL + Bearer — see Profile → How to use.
 *
 *   TIMELINE_API_URL — app origin
 *   TIMELINE_API_KEY — secret from Profile
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createTimelineMcpServer } from "../src/lib/mcp/timeline-mcp-tools.server";

const baseUrl = process.env.TIMELINE_API_URL?.replace(/\/$/, "");
const apiKey = process.env.TIMELINE_API_KEY;

if (!baseUrl || !apiKey) {
  console.error("Set TIMELINE_API_URL and TIMELINE_API_KEY.");
  process.exit(1);
}

async function api(path: string, init?: RequestInit): Promise<unknown> {
  const res = await fetch(`${baseUrl}/api/mcp/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return text ? JSON.parse(text) : null;
}

const mcpServer = createTimelineMcpServer(api);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
