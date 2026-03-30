import { createServerFn } from "@tanstack/react-start";

import { authMiddleware, freshAuthMiddleware } from "@/lib/auth/middleware";
import { rpcSafe } from "@/lib/timeline/rpc-safe";
import { emptyObjectSchema } from "@/lib/timeline/validators";

import {
  createMcpKeyForUser,
  deleteMcpKeyForUser,
  getMcpKeyByUserId,
  rotateMcpKeyForUser,
} from "./repo.server";

export const $getMcpAccess = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const row = await getMcpKeyByUserId(context.user.id);
    if (!row) {
      return {
        enabled: false as const,
        keyPrefix: null as string | null,
        createdAt: null as string | null,
      };
    }
    return rpcSafe({
      enabled: true as const,
      keyPrefix: row.keyPrefix,
      createdAt: row.createdAt.toISOString(),
    });
  });

export const $enableMcpAccess = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => emptyObjectSchema.parse(d ?? {}))
  .handler(async ({ context }) => {
    const existing = await getMcpKeyByUserId(context.user.id);
    if (existing) {
      return {
        kind: "already_active" as const,
        keyPrefix: existing.keyPrefix,
        createdAt: existing.createdAt.toISOString(),
      };
    }
    const { plainSecret } = await createMcpKeyForUser(context.user.id);
    return { kind: "created" as const, apiKey: plainSecret };
  });

export const $rotateMcpKey = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => emptyObjectSchema.parse(d ?? {}))
  .handler(async ({ context }) => {
    const { plainSecret } = await rotateMcpKeyForUser(context.user.id);
    return { apiKey: plainSecret };
  });

export const $revokeMcpAccess = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => emptyObjectSchema.parse(d ?? {}))
  .handler(async ({ context }) => {
    await deleteMcpKeyForUser(context.user.id);
  });
