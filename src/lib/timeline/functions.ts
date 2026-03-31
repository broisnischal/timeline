import { createServerFn } from "@tanstack/react-start";

import { authMiddleware, freshAuthMiddleware } from "@/lib/auth/middleware";

import { rpcSafe } from "./rpc-safe";
import {
  appendTaskActivitySchema,
  createSpaceSchema,
  createTaskSchema,
  inviteSpaceMemberSchema,
  listSpaceCollaboratorsSchema,
  listTimelinePageSchema,
  respondToSpaceInviteSchema,
  revokeSpaceInviteSchema,
  deleteSpaceSchema,
  emptyObjectSchema,
  getTaskParamsSchema,
  listTasksSchema,
  publicTasksBySlugInputSchema,
  taskIdSchema,
  updatePublicProfileSchema,
  updateSpaceSchema,
  updateTaskSchema,
  recentActivityInputSchema,
  yearActivityInputSchema,
} from "./validators";

/** Public read — no session required. */
export const $getPublicTasksBySlug = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => publicTasksBySlugInputSchema.parse(d ?? {}))
  .handler(async ({ data }) => {
    const { getPublicTasksBySlug } = await import("./repo.server");
    const result = await getPublicTasksBySlug(data.slug, { space: data.space });
    return result ? rpcSafe(result) : null;
  });

export const $listSpaces = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { listSpacesWithCounts } = await import("./repo.server");
    return rpcSafe(await listSpacesWithCounts(context.user.id));
  });

export const $createSpace = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => createSpaceSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { createSpaceRow } = await import("./repo.server");
    return rpcSafe(await createSpaceRow(context.user.id, data));
  });

export const $updateSpace = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => updateSpaceSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { updateSpaceRow } = await import("./repo.server");
    return rpcSafe(await updateSpaceRow(context.user.id, data));
  });

export const $deleteSpace = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => deleteSpaceSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { deleteSpaceRow } = await import("./repo.server");
    await deleteSpaceRow(context.user.id, data.id);
  });

export const $listSpaceCollaborators = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((d: unknown) => listSpaceCollaboratorsSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { listSpaceCollaborators } = await import("./repo.server");
    return rpcSafe(await listSpaceCollaborators(context.user.id, data.spaceId));
  });

export const $inviteSpaceMember = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => inviteSpaceMemberSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { inviteUserToSpace } = await import("./repo.server");
    return rpcSafe(await inviteUserToSpace(context.user.id, data));
  });

export const $revokeSpaceInvite = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => revokeSpaceInviteSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { revokeSpaceInvite } = await import("./repo.server");
    await revokeSpaceInvite(context.user.id, data.inviteId);
  });

export const $listMyPendingSpaceInvites = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((d: unknown) => emptyObjectSchema.parse(d ?? {}))
  .handler(async ({ context }) => {
    const { listMyPendingSpaceInvites } = await import("./repo.server");
    return rpcSafe(await listMyPendingSpaceInvites(context.user.id));
  });

export const $respondToSpaceInvite = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => respondToSpaceInviteSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { respondToSpaceInvite } = await import("./repo.server");
    return rpcSafe(await respondToSpaceInvite(context.user.id, data));
  });

export const $listTasks = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((d: unknown) => listTasksSchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { listTasksForUser } = await import("./repo.server");
    return rpcSafe(await listTasksForUser(context.user.id, data));
  });

export const $listTimelinePage = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((d: unknown) => listTimelinePageSchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { listTimelineTasksPageForUser } = await import("./repo.server");
    return rpcSafe(await listTimelineTasksPageForUser(context.user.id, data));
  });

export const $getTask = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((d: unknown) => getTaskParamsSchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { getTaskByIdForUser } = await import("./repo.server");
    const row = await getTaskByIdForUser(context.user.id, data.taskId);
    return row ? rpcSafe(row) : null;
  });

export const $createTask = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => createTaskSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { createTaskRow } = await import("./repo.server");
    return rpcSafe(await createTaskRow(context.user.id, data));
  });

export const $updateTask = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => updateTaskSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { updateTaskRow } = await import("./repo.server");
    return rpcSafe(await updateTaskRow(context.user.id, data));
  });

export const $appendTaskActivity = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => appendTaskActivitySchema.parse(d))
  .handler(async ({ context, data }) => {
    const { appendTaskActivityRow } = await import("./repo.server");
    return rpcSafe(await appendTaskActivityRow(context.user.id, data.taskId, data.body));
  });

export const $toggleTaskDone = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => taskIdSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { toggleTaskDone } = await import("./repo.server");
    return rpcSafe(await toggleTaskDone(context.user.id, data.id));
  });

export const $seedDemoTimeline = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => emptyObjectSchema.parse(d ?? {}))
  .handler(async ({ context }) => {
    const { seedDemoTimelineTasks } = await import("./repo.server");
    return rpcSafe(await seedDemoTimelineTasks(context.user.id));
  });

export const $deleteTask = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => taskIdSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { deleteTaskRow } = await import("./repo.server");
    await deleteTaskRow(context.user.id, data.id);
  });

export const $getStreakStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getStreakStats } = await import("./repo.server");
    return rpcSafe(await getStreakStats(context.user.id));
  });

export const $getYearActivityGrid = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((d: unknown) => yearActivityInputSchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { getYearActivityGrid } = await import("./repo.server");
    return rpcSafe(await getYearActivityGrid(context.user.id, data.year));
  });

export const $listRecentActivity = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .inputValidator((d: unknown) => recentActivityInputSchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const { listRecentActivityForUser } = await import("./repo.server");
    const limit = data.limit ?? 40;
    return rpcSafe(await listRecentActivityForUser(context.user.id, limit));
  });

export const $getPublicProfile = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getPublicProfileForUser } = await import("./repo.server");
    const row = await getPublicProfileForUser(context.user.id);
    return row ? rpcSafe(row) : null;
  });

export const $updatePublicProfile = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => updatePublicProfileSchema.parse(d))
  .handler(async ({ context, data }) => {
    const { upsertPublicProfile } = await import("./repo.server");
    const row = await upsertPublicProfile(context.user.id, data.slug, data.enabled);
    return row ? rpcSafe(row) : null;
  });
