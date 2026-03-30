import * as z from "zod";

/** No body — e.g. demo seed endpoint. */
export const emptyObjectSchema = z.object({});

export const slugSchema = z
  .string()
  .min(2)
  .max(32)
  .regex(/^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/, "Use lowercase letters, numbers, and hyphens.");

export const createSpaceSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  color: z.string().max(32).optional(),
});

export const updateSpaceSchema = z.object({
  id: z.string(),
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(2000).nullable().optional(),
  color: z.string().max(32).nullable().optional(),
  sortOrder: z.number().int().optional(),
});

export const deleteSpaceSchema = z.object({
  id: z.string(),
});

export const listTasksSchema = z.object({
  spaceId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export const createTaskSchema = z.object({
  spaceId: z.string(),
  title: z.string().min(1).max(500),
  notes: z.string().max(20000).optional(),
  outcome: z.string().max(20000).optional(),
  startsAt: z.string().optional(),
  dueAt: z.string().optional(),
  durationMinutes: z.number().int().min(0).max(10080).optional(),
  isPublic: z.boolean().optional(),
});

export const updateTaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500).optional(),
  notes: z.string().max(20000).nullable().optional(),
  outcome: z.string().max(20000).nullable().optional(),
  startsAt: z.string().nullable().optional(),
  dueAt: z.string().nullable().optional(),
  durationMinutes: z.number().int().min(0).max(10080).nullable().optional(),
  status: z.enum(["todo", "done", "cancelled"]).optional(),
  isPublic: z.boolean().optional(),
  spaceId: z.string().optional(),
});

export const taskIdSchema = z.object({
  id: z.string(),
});

export const updatePublicProfileSchema = z.object({
  slug: slugSchema,
  enabled: z.boolean(),
});

export const publicSlugParamSchema = z.object({
  slug: slugSchema,
});

export const yearActivityInputSchema = z.object({
  year: z.number().int().min(2000).max(2100).optional(),
});
