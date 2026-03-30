import * as z from "zod";

/** Shared URL state for `/app` and `/app/timeline`. */
export const appSearchSchema = z.object({
  space: z.string().optional(),
});

export type AppSearch = z.infer<typeof appSearchSchema>;
