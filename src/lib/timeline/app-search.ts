import * as z from "zod";

/** Shared URL state for `/app` and `/app/timeline`. */
export const appSearchSchema = z.object({
  space: z.string().optional(),
  /** Days into the future to show on the timeline (slider). */
  horizon: z.coerce.number().int().min(14).max(90).optional(),
});

export type AppSearch = z.infer<typeof appSearchSchema>;

export const defaultHorizon = 42;
