import { createServerFn } from "@tanstack/react-start";
import * as z from "zod";

import { freshAuthMiddleware, authMiddleware } from "@/lib/auth/middleware";
import { rpcSafe } from "@/lib/timeline/rpc-safe";

import {
  deleteNotionConnection,
  getNotionConnectionByUserId,
  setNotionSelectedDatabase,
} from "./repo.server";
import { importFromNotion, pushToNotion } from "./sync.server";

const setDatabaseSchema = z.object({
  databaseId: z.string().trim().min(1),
});

const importSchema = z.object({
  databaseId: z.string().trim().min(1).optional(),
  spaceId: z.string().trim().min(1).optional(),
});

const pushSchema = z.object({
  databaseId: z.string().trim().min(1).optional(),
});

const notionConnectPath = "/api/integrations/notion/connect";

export const $getNotionStatus = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const row = await getNotionConnectionByUserId(context.user.id);
    if (!row) {
      return {
        connected: false as const,
        connectUrl: notionConnectPath,
      };
    }
    return rpcSafe({
      connected: true as const,
      workspaceName: row.workspaceName,
      workspaceId: row.workspaceId,
      selectedDatabaseId: row.selectedDatabaseId,
      lastImportedAt: row.lastImportedAt?.toISOString() ?? null,
      lastPushedAt: row.lastPushedAt?.toISOString() ?? null,
      connectUrl: notionConnectPath,
    });
  });

export const $setNotionDatabase = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => setDatabaseSchema.parse(d))
  .handler(async ({ context, data }) => {
    await setNotionSelectedDatabase(context.user.id, data.databaseId);
  });

export const $disconnectNotion = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .handler(async ({ context }) => {
    await deleteNotionConnection(context.user.id);
  });

export const $importFromNotion = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => importSchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const row = await getNotionConnectionByUserId(context.user.id);
    const databaseId = data.databaseId ?? row?.selectedDatabaseId ?? null;
    if (!databaseId) {
      throw new Error("Set a Notion database ID first.");
    }
    if (!row?.selectedDatabaseId || row.selectedDatabaseId !== databaseId) {
      await setNotionSelectedDatabase(context.user.id, databaseId);
    }
    return rpcSafe(await importFromNotion(context.user.id, { databaseId, spaceId: data.spaceId }));
  });

export const $pushToNotion = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => pushSchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const row = await getNotionConnectionByUserId(context.user.id);
    const databaseId = data.databaseId ?? row?.selectedDatabaseId ?? null;
    if (!databaseId) {
      throw new Error("Set a Notion database ID first.");
    }
    if (!row?.selectedDatabaseId || row.selectedDatabaseId !== databaseId) {
      await setNotionSelectedDatabase(context.user.id, databaseId);
    }
    return rpcSafe(await pushToNotion(context.user.id, { databaseId }));
  });
