import "@tanstack/react-start/server-only";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { task } from "@/lib/db/schema";
import {
  createTaskRow,
  ensureDefaultSpace,
  listTasksForUser,
  updateTaskRow,
} from "@/lib/timeline/repo.server";

import {
  createNotionPage,
  getNotionDataSchema,
  queryNotionDatabaseAll,
  updateNotionPage,
} from "./client.server";
import {
  getNotionConnectionWithTokens,
  getTaskMapByPageId,
  getTaskMapByTaskId,
  setNotionImportStamp,
  setNotionPushStamp,
  upsertTaskPageMap,
} from "./repo.server";

function readTitle(prop: unknown) {
  const p = prop as { type?: string; title?: Array<{ plain_text?: string }> };
  if (!p || p.type !== "title" || !Array.isArray(p.title)) return "";
  return p.title
    .map((r) => r.plain_text ?? "")
    .join("")
    .trim();
}

function readRichText(prop: unknown) {
  const p = prop as { type?: string; rich_text?: Array<{ plain_text?: string }> };
  if (!p || p.type !== "rich_text" || !Array.isArray(p.rich_text)) return null;
  const out = p.rich_text
    .map((r) => r.plain_text ?? "")
    .join("")
    .trim();
  return out || null;
}

function readSelect(prop: unknown) {
  const p = prop as {
    type?: string;
    select?: { name?: string } | null;
    status?: { name?: string } | null;
  };
  if (!p) return null;
  if (p.type === "select") return p.select?.name?.trim() || null;
  if (p.type === "status") return p.status?.name?.trim() || null;
  return null;
}

function readDateStart(prop: unknown) {
  const p = prop as { type?: string; date?: { start?: string } | null };
  if (!p || p.type !== "date") return null;
  return p.date?.start ?? null;
}

function readNumber(prop: unknown) {
  const p = prop as { type?: string; number?: number | null };
  if (!p || p.type !== "number") return null;
  return p.number ?? null;
}

function statusFromNotion(name: string | null): "todo" | "done" | "cancelled" {
  const v = (name ?? "").toLowerCase();
  if (v === "done" || v === "complete" || v === "completed") return "done";
  if (v === "cancelled" || v === "canceled") return "cancelled";
  return "todo";
}

function statusToNotion(name: string, options?: string[]) {
  if (!options || options.length === 0) {
    if (name === "done") return "Done";
    if (name === "cancelled") return "Cancelled";
    return "Todo";
  }
  const lower = options.map((o) => o.toLowerCase());
  if (name === "done") {
    const i = lower.findIndex((o) => o === "done" || o === "complete" || o === "completed");
    if (i >= 0) return options[i]!;
  }
  if (name === "cancelled") {
    const i = lower.findIndex((o) => o === "cancelled" || o === "canceled");
    if (i >= 0) return options[i]!;
  }
  const i = lower.findIndex(
    (o) => o === "todo" || o === "to do" || o === "not started" || o === "backlog",
  );
  if (i >= 0) return options[i]!;
  return options[0]!;
}

function toIso(input: string | null | undefined) {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

type SchemaLite = Record<
  string,
  { type: string; statusOptions?: string[]; selectOptions?: string[] }
>;
type ResolvedSchema = {
  titleKey: string;
  statusKey?: string;
  startDateKey?: string;
  startNumberKey?: string;
  dueDateKey?: string;
  notesKey?: string;
  taskIdKey?: string;
};

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pickKeyByType(schema: SchemaLite, type: string, preferredNames: string[]) {
  for (const pref of preferredNames) {
    const hit = Object.entries(schema).find(
      ([name, p]) => p.type === type && normalize(name) === normalize(pref),
    );
    if (hit) return hit[0];
  }
  return Object.entries(schema).find(([, p]) => p.type === type)?.[0];
}

function resolveSchemaKeys(schema: SchemaLite): ResolvedSchema {
  const titleKey = pickKeyByType(schema, "title", ["Name", "Title", "Task"]);
  if (!titleKey) {
    throw new Error("Notion table must include a Title field.");
  }
  return {
    titleKey,
    statusKey: pickKeyByType(schema, "status", ["Status", "State"]),
    startDateKey: pickKeyByType(schema, "date", ["Start", "Starts", "Start Date", "Date"]),
    startNumberKey: pickKeyByType(schema, "number", ["Start", "Order", "Index"]),
    dueDateKey: pickKeyByType(schema, "date", ["Due", "Deadline", "Due Date"]),
    notesKey: pickKeyByType(schema, "rich_text", ["Notes", "Description", "Details"]),
    taskIdKey: pickKeyByType(schema, "rich_text", ["Timeline Task ID", "Task ID", "External ID"]),
  };
}

function notionTaskProperties(input: {
  keys: ResolvedSchema;
  schema: SchemaLite;
  taskId: string;
  title: string;
  notes: string | null;
  status: string;
  startsAt: Date | null;
  dueAt: Date | null;
}) {
  const out: Record<string, unknown> = {
    [input.keys.titleKey]: {
      title: [{ text: { content: input.title } }],
    },
  };
  if (input.keys.statusKey) {
    const prop = input.schema[input.keys.statusKey];
    const options =
      prop?.type === "status"
        ? prop.statusOptions
        : prop?.type === "select"
          ? prop.selectOptions
          : undefined;
    const mapped = statusToNotion(input.status, options);
    out[input.keys.statusKey] =
      prop?.type === "select" ? { select: { name: mapped } } : { status: { name: mapped } };
  }
  if (input.keys.startDateKey) {
    out[input.keys.startDateKey] = {
      date: input.startsAt ? { start: input.startsAt.toISOString() } : null,
    };
  } else if (input.keys.startNumberKey) {
    out[input.keys.startNumberKey] = {
      number: input.startsAt ? input.startsAt.getTime() : null,
    };
  }
  if (input.keys.dueDateKey) {
    out[input.keys.dueDateKey] = {
      date: input.dueAt ? { start: input.dueAt.toISOString() } : null,
    };
  }
  if (input.keys.notesKey) {
    out[input.keys.notesKey] = {
      rich_text: input.notes ? [{ text: { content: input.notes.slice(0, 1800) } }] : [],
    };
  }
  if (input.keys.taskIdKey) {
    out[input.keys.taskIdKey] = {
      rich_text: [{ text: { content: input.taskId } }],
    };
  }
  return out;
}

export async function importFromNotion(
  userId: string,
  input: { databaseId: string; spaceId?: string },
) {
  const conn = await getNotionConnectionWithTokens(userId);
  if (!conn) throw new Error("Notion is not connected");

  const pages = await queryNotionDatabaseAll({
    accessToken: conn.accessToken,
    databaseId: input.databaseId,
  });
  const schemaMap = await getNotionDataSchema({
    accessToken: conn.accessToken,
    databaseId: input.databaseId,
  });
  const schema = resolveSchemaKeys(schemaMap);

  const fallbackSpace = input.spaceId ?? (await ensureDefaultSpace(userId)).id;
  let imported = 0;
  let updated = 0;

  for (const page of pages) {
    const title = readTitle(page.properties[schema.titleKey]);
    if (!title) continue;

    const explicitTaskId = schema.taskIdKey
      ? readRichText(page.properties[schema.taskIdKey])
      : null;
    const mapped = await getTaskMapByPageId(userId, page.id);
    const candidateId = explicitTaskId || mapped?.taskId || null;
    const notes = schema.notesKey ? readRichText(page.properties[schema.notesKey]) : null;
    const status = schema.statusKey
      ? statusFromNotion(readSelect(page.properties[schema.statusKey]))
      : "todo";
    const startsAt = toIso(
      schema.startDateKey
        ? readDateStart(page.properties[schema.startDateKey])
        : (() => {
            const n = schema.startNumberKey
              ? readNumber(page.properties[schema.startNumberKey])
              : null;
            return typeof n === "number" ? new Date(n).toISOString() : null;
          })(),
    );
    const dueAt = toIso(
      schema.dueDateKey ? readDateStart(page.properties[schema.dueDateKey]) : null,
    );

    if (candidateId) {
      const [existing] = await db
        .select({ id: task.id })
        .from(task)
        .where(and(eq(task.userId, userId), eq(task.id, candidateId)))
        .limit(1);
      if (existing) {
        await updateTaskRow(userId, {
          id: existing.id,
          title,
          notes,
          status,
          startsAt,
          dueAt,
        });
        updated++;
        await upsertTaskPageMap({
          userId,
          taskId: existing.id,
          notionPageId: page.id,
          notionLastEditedTime: page.last_edited_time,
        });
        continue;
      }
    }

    const created = await createTaskRow(userId, {
      spaceId: fallbackSpace,
      title,
      notes: notes ?? undefined,
      startsAt: startsAt ?? undefined,
      dueAt: dueAt ?? undefined,
    });
    if (status !== "todo") {
      await updateTaskRow(userId, { id: created.id, status });
    }
    imported++;
    await upsertTaskPageMap({
      userId,
      taskId: created.id,
      notionPageId: page.id,
      notionLastEditedTime: page.last_edited_time,
    });
  }

  await setNotionImportStamp(userId);
  return { pagesSeen: pages.length, imported, updated };
}

export async function pushToNotion(userId: string, input: { databaseId: string }) {
  const conn = await getNotionConnectionWithTokens(userId);
  if (!conn) throw new Error("Notion is not connected");
  const schemaMap = await getNotionDataSchema({
    accessToken: conn.accessToken,
    databaseId: input.databaseId,
  });
  const schema = resolveSchemaKeys(schemaMap);
  const tasks = await listTasksForUser(userId, {});
  let created = 0;
  let updated = 0;

  for (const t of tasks) {
    const props = notionTaskProperties({
      keys: schema,
      schema: schemaMap,
      taskId: t.id,
      title: t.title,
      notes: t.notes,
      status: t.status,
      startsAt: t.startsAt,
      dueAt: t.dueAt,
    });
    const map = await getTaskMapByTaskId(userId, t.id);
    if (map) {
      const res = await updateNotionPage({
        accessToken: conn.accessToken,
        pageId: map.notionPageId,
        properties: props,
      });
      await upsertTaskPageMap({
        userId,
        taskId: t.id,
        notionPageId: res.id,
        notionLastEditedTime: res.last_edited_time,
      });
      updated++;
      continue;
    }

    const createdPage = await createNotionPage({
      accessToken: conn.accessToken,
      databaseId: input.databaseId,
      properties: props,
    });
    await upsertTaskPageMap({
      userId,
      taskId: t.id,
      notionPageId: createdPage.id,
      notionLastEditedTime: createdPage.last_edited_time,
    });
    created++;
  }

  await setNotionPushStamp(userId);
  return { totalTasks: tasks.length, created, updated };
}
