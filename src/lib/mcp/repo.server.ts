import "@tanstack/react-start/server-only";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { mcpApiKey } from "@/lib/db/schema/mcp.schema";

import { generateMcpSecret, keyDisplayPrefix, sha256Hex } from "./key-crypto.server";

function newId() {
  return crypto.randomUUID();
}

export type McpKeyRow = {
  id: string;
  userId: string;
  keyHash: string;
  keyPrefix: string;
  createdAt: Date;
  lastUsedAt: Date | null;
};

export async function getMcpKeyByUserId(userId: string): Promise<McpKeyRow | null> {
  const rows = await db.select().from(mcpApiKey).where(eq(mcpApiKey.userId, userId)).limit(1);
  return rows[0] ?? null;
}

export async function getMcpKeyByHash(keyHash: string): Promise<McpKeyRow | null> {
  const rows = await db.select().from(mcpApiKey).where(eq(mcpApiKey.keyHash, keyHash)).limit(1);
  return rows[0] ?? null;
}

export async function createMcpKeyForUser(
  userId: string,
): Promise<{ row: McpKeyRow; plainSecret: string }> {
  const existing = await getMcpKeyByUserId(userId);
  if (existing) {
    throw new Error("MCP access already enabled");
  }
  const plainSecret = generateMcpSecret();
  const keyHash = await sha256Hex(plainSecret);
  const id = newId();
  await db.insert(mcpApiKey).values({
    id,
    userId,
    keyHash,
    keyPrefix: keyDisplayPrefix(plainSecret),
  });
  const row = await getMcpKeyByUserId(userId);
  if (!row) throw new Error("Failed to create MCP key");
  return { row, plainSecret };
}

export async function rotateMcpKeyForUser(
  userId: string,
): Promise<{ row: McpKeyRow; plainSecret: string }> {
  const plainSecret = generateMcpSecret();
  const keyHash = await sha256Hex(plainSecret);
  const existing = await getMcpKeyByUserId(userId);
  if (existing) {
    await db
      .update(mcpApiKey)
      .set({
        keyHash,
        keyPrefix: keyDisplayPrefix(plainSecret),
        lastUsedAt: null,
      })
      .where(eq(mcpApiKey.userId, userId));
  } else {
    await db.insert(mcpApiKey).values({
      id: newId(),
      userId,
      keyHash,
      keyPrefix: keyDisplayPrefix(plainSecret),
    });
  }
  const row = await getMcpKeyByUserId(userId);
  if (!row) throw new Error("Failed to rotate MCP key");
  return { row, plainSecret };
}

export async function deleteMcpKeyForUser(userId: string): Promise<void> {
  await db.delete(mcpApiKey).where(eq(mcpApiKey.userId, userId));
}

export async function touchMcpKeyLastUsed(keyId: string): Promise<void> {
  await db.update(mcpApiKey).set({ lastUsedAt: new Date() }).where(eq(mcpApiKey.id, keyId));
}
