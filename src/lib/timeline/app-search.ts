import * as z from "zod";

import { TIMELINE_RANGE_PRESETS } from "@/lib/timeline/range";

const rawAppSearchSchema = z.object({
  space: z.string().optional(),
  /** Timeline window preset (tasks whose anchor falls in range). Omitted on Home. */
  range: z.enum(TIMELINE_RANGE_PRESETS).optional(),
  /** Filter by title, notes, or category (client-side on loaded tasks). */
  q: z.string().max(200).optional(),
});

/** Shared URL state for `/app` and `/app/timeline`. */
export const appSearchSchema = rawAppSearchSchema.transform((o) => ({
  ...o,
  q: o.q?.trim() ? o.q.trim() : undefined,
}));

export type AppSearch = z.infer<typeof appSearchSchema>;

/** Parsed defaults for links and redirects that need a full search object. */
export const appSearchEmpty = appSearchSchema.parse({});
