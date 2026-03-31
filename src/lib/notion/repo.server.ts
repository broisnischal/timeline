import "@tanstack/react-start/server-only";
import { and, eq, lt } from "drizzle-orm";

import { db } from "@/lib/db";
import { notionConnection, notionOauthState, notionTaskMap } from "@/lib/db/schema";

import { decryptSecret, encryptSecret } from "./crypto.server";

function newId() {
  return crypto.randomUUID();
}

export async function createNotionOauthState(userId: string, state: string) {
  const expiresAt = new Date(Date.now() + 10 * 60_000);
  await db.insert(notionOauthState).values({
    id: newId(),
    userId,
    state,
    expiresAt,
  });
  await db.delete(notionOauthState).where(lt(notionOauthState.expiresAt, new Date()));
}

export async function consumeNotionOauthState(userId: string, state: string) {
  const [row] = await db
    .select()
    .from(notionOauthState)
    .where(and(eq(notionOauthState.userId, userId), eq(notionOauthState.state, state)));
  if (!row) return false;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(notionOauthState).where(eq(notionOauthState.id, row.id));
    return false;
  }
  await db.delete(notionOauthState).where(eq(notionOauthState.id, row.id));
  return true;
}

export async function upsertNotionConnection(input: {
  userId: string;
  workspaceId: string;
  workspaceName?: string | null | undefined;
  workspaceIcon?: string | null | undefined;
  botId?: string | null | undefined;
  tokenType: string;
  accessToken: string;
  refreshToken?: string | null | undefined;
}) {
  const existing = await getNotionConnectionByUserId(input.userId);
  const payload = {
    workspaceId: input.workspaceId,
    workspaceName: input.workspaceName ?? null,
    workspaceIcon: input.workspaceIcon ?? null,
    botId: input.botId ?? null,
    tokenType: input.tokenType || "bearer",
    accessTokenEncrypted: encryptSecret(input.accessToken),
    refreshTokenEncrypted: input.refreshToken ? encryptSecret(input.refreshToken) : null,
  };
  if (existing) {
    await db.update(notionConnection).set(payload).where(eq(notionConnection.userId, input.userId));
    return;
  }
  await db.insert(notionConnection).values({
    id: newId(),
    userId: input.userId,
    ...payload,
  });
}

export async function getNotionConnectionByUserId(userId: string) {
  const [row] = await db
    .select()
    .from(notionConnection)
    .where(eq(notionConnection.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function getNotionConnectionWithTokens(userId: string) {
  const row = await getNotionConnectionByUserId(userId);
  if (!row) return null;
  return {
    ...row,
    accessToken: decryptSecret(row.accessTokenEncrypted),
    refreshToken: row.refreshTokenEncrypted ? decryptSecret(row.refreshTokenEncrypted) : null,
  };
}

export async function deleteNotionConnection(userId: string) {
  await db.delete(notionConnection).where(eq(notionConnection.userId, userId));
}

export async function setNotionSelectedDatabase(userId: string, databaseId: string | null) {
  await db
    .update(notionConnection)
    .set({ selectedDatabaseId: databaseId })
    .where(eq(notionConnection.userId, userId));
}

export async function setNotionImportStamp(userId: string) {
  await db
    .update(notionConnection)
    .set({ lastImportedAt: new Date() })
    .where(eq(notionConnection.userId, userId));
}

export async function setNotionPushStamp(userId: string) {
  await db
    .update(notionConnection)
    .set({ lastPushedAt: new Date() })
    .where(eq(notionConnection.userId, userId));
}

export async function upsertTaskPageMap(input: {
  userId: string;
  taskId: string;
  notionPageId: string;
  notionLastEditedTime?: string | null | undefined;
}) {
  const [existing] = await db
    .select()
    .from(notionTaskMap)
    .where(and(eq(notionTaskMap.userId, input.userId), eq(notionTaskMap.taskId, input.taskId)))
    .limit(1);

  const notionLastEditedTime = input.notionLastEditedTime
    ? new Date(input.notionLastEditedTime)
    : null;
  if (existing) {
    await db
      .update(notionTaskMap)
      .set({
        notionPageId: input.notionPageId,
        notionLastEditedTime,
        lastSyncedAt: new Date(),
      })
      .where(eq(notionTaskMap.id, existing.id));
    return;
  }

  await db.insert(notionTaskMap).values({
    id: newId(),
    userId: input.userId,
    taskId: input.taskId,
    notionPageId: input.notionPageId,
    notionLastEditedTime,
    lastSyncedAt: new Date(),
  });
}

export async function getTaskMapByTaskId(userId: string, taskId: string) {
  const [row] = await db
    .select()
    .from(notionTaskMap)
    .where(and(eq(notionTaskMap.userId, userId), eq(notionTaskMap.taskId, taskId)))
    .limit(1);
  return row ?? null;
}

export async function getTaskMapByPageId(userId: string, notionPageId: string) {
  const [row] = await db
    .select()
    .from(notionTaskMap)
    .where(and(eq(notionTaskMap.userId, userId), eq(notionTaskMap.notionPageId, notionPageId)))
    .limit(1);
  return row ?? null;
}
