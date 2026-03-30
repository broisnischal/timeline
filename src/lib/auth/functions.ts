import { createServerFn, createServerOnlyFn } from "@tanstack/react-start";
import { getRequest, setResponseHeader } from "@tanstack/react-start/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/lib/auth/auth";
import { freshAuthMiddleware } from "@/lib/auth/middleware";
import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";

/**
 * This server function is meant to be called via authQueryOptions() in queries.ts,
 * which is used in the _auth layout route to protect all child routes under it (e.g. _auth/app/*)
 *
 * For securing server functions or API routes,
 * consider using authMiddleware from middleware.ts instead.
 */
export const $getUser = createServerFn({ method: "GET" }).handler(async () => {
  const user = await _getUser();
  return user;
});

interface GetUserServerQuery {
  disableCookieCache?: boolean | undefined;
  disableRefresh?: boolean | undefined;
}

/**
 * Server-only util, meant to be used by the $getUser server function and auth middleware so logic can be shared with optional query params.
 *
 * For server app logic, consider using authMiddleware instead.
 */
export const _getUser = createServerOnlyFn(async (query?: GetUserServerQuery) => {
  const session = await auth.api.getSession({
    headers: getRequest().headers,
    query,
    returnHeaders: true,
  });

  // Forward any Set-Cookie headers to the client, e.g. for session/cache refresh
  const cookies = session.headers?.getSetCookie();
  if (cookies?.length) {
    setResponseHeader("Set-Cookie", cookies);
  }

  return session.response?.user || null;
});

const updateUserImageSchema = z.object({
  imageDataUrl: z.string().trim().max(1_500_000).nullable().optional(),
});

const IMAGE_DATA_URL_RE = /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-zA-Z0-9+/=]+$/;

export const $updateUserImage = createServerFn({ method: "POST" })
  .middleware([freshAuthMiddleware])
  .inputValidator((d: unknown) => updateUserImageSchema.parse(d ?? {}))
  .handler(async ({ context, data }) => {
    const image = data.imageDataUrl?.trim() || null;

    if (image !== null && !IMAGE_DATA_URL_RE.test(image)) {
      throw new Error("Please upload a PNG, JPG, WEBP, or GIF image.");
    }

    await db.update(user).set({ image }).where(eq(user.id, context.user.id));

    return { image };
  });
