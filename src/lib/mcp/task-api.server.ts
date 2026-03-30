import "@tanstack/react-start/server-only";
import * as z from "zod";

import {
  appendTaskActivityRow,
  getTaskByIdForUser,
  toggleTaskDone,
  updateTaskRow,
} from "@/lib/timeline/repo.server";
import { rpcSafe } from "@/lib/timeline/rpc-safe";
import { taskSubtaskSchema } from "@/lib/timeline/validators";

const mcpTaskPatchSchema = z
  .object({
    toggleDone: z.boolean().optional(),
    appendActivity: z.string().min(1).max(5000).optional(),
    title: z.string().min(1).max(500).optional(),
    notes: z.string().max(20000).nullable().optional(),
    outcome: z.string().max(20000).nullable().optional(),
    startsAt: z.string().nullable().optional(),
    dueAt: z.string().nullable().optional(),
    durationMinutes: z.number().int().min(0).max(10080).nullable().optional(),
    status: z.enum(["todo", "done", "cancelled"]).optional(),
    isPublic: z.boolean().optional(),
    spaceId: z.string().optional(),
    icon: z.string().max(16).nullable().optional(),
    accentColor: z
      .string()
      .max(32)
      .nullable()
      .optional()
      .refine((s) => s == null || s === "" || /^#[0-9A-Fa-f]{6}$/.test(s), "Use a hex color"),
    subtasks: z.array(taskSubtaskSchema).optional(),
  })
  .refine(
    (o) =>
      Object.keys(o).length > 0 &&
      (o.toggleDone !== undefined ||
        o.appendActivity !== undefined ||
        o.title !== undefined ||
        o.notes !== undefined ||
        o.outcome !== undefined ||
        o.startsAt !== undefined ||
        o.dueAt !== undefined ||
        o.durationMinutes !== undefined ||
        o.status !== undefined ||
        o.isPublic !== undefined ||
        o.spaceId !== undefined ||
        o.icon !== undefined ||
        o.accentColor !== undefined ||
        o.subtasks !== undefined),
    { message: "At least one field is required" },
  );

export async function applyMcpTaskPatch(userId: string, taskId: string, rawBody: unknown) {
  const parsed = mcpTaskPatchSchema.safeParse(rawBody);
  if (!parsed.success) {
    return { error: z.treeifyError(parsed.error) } as const;
  }
  const body = parsed.data;

  try {
    if (body.toggleDone === true) {
      await toggleTaskDone(userId, taskId);
    }

    if (body.appendActivity) {
      await appendTaskActivityRow(userId, taskId, body.appendActivity);
    }

    const hasFieldUpdates =
      body.title !== undefined ||
      body.notes !== undefined ||
      body.outcome !== undefined ||
      body.startsAt !== undefined ||
      body.dueAt !== undefined ||
      body.durationMinutes !== undefined ||
      body.status !== undefined ||
      body.isPublic !== undefined ||
      body.spaceId !== undefined ||
      body.icon !== undefined ||
      body.accentColor !== undefined ||
      body.subtasks !== undefined;

    if (hasFieldUpdates) {
      await updateTaskRow(userId, {
        id: taskId,
        ...(body.title !== undefined ? { title: body.title } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
        ...(body.outcome !== undefined ? { outcome: body.outcome } : {}),
        ...(body.startsAt !== undefined ? { startsAt: body.startsAt } : {}),
        ...(body.dueAt !== undefined ? { dueAt: body.dueAt } : {}),
        ...(body.durationMinutes !== undefined ? { durationMinutes: body.durationMinutes } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.isPublic !== undefined ? { isPublic: body.isPublic } : {}),
        ...(body.spaceId !== undefined ? { spaceId: body.spaceId } : {}),
        ...(body.icon !== undefined ? { icon: body.icon } : {}),
        ...(body.accentColor !== undefined ? { accentColor: body.accentColor } : {}),
        ...(body.subtasks !== undefined ? { subtasks: body.subtasks } : {}),
      });
    }

    const row = await getTaskByIdForUser(userId, taskId);
    if (!row) return { notFound: true as const };
    return { task: rpcSafe(row) } as const;
  } catch {
    return { notFound: true as const };
  }
}

export async function mcpGetTask(userId: string, taskId: string) {
  const row = await getTaskByIdForUser(userId, taskId);
  if (!row) return null;
  return rpcSafe(row);
}
