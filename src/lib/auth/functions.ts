import { createServerFn } from "@tanstack/react-start";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { freshAuthMiddleware } from "@/lib/auth/middleware";
import { _getUser } from "@/lib/auth/session.server";
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
