import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";

/** One API key per user for MCP / external automation (Bearer token). */
export const mcpApiKey = pgTable(
  "mcp_api_key",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    /** SHA-256 hex digest of the full secret (never store plaintext). */
    keyHash: text("key_hash").notNull().unique(),
    /** First characters of the secret for display (e.g. `tln_mcp_ab12…`). */
    keyPrefix: text("key_prefix").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at"),
  },
  (t) => [index("mcp_api_key_user_idx").on(t.userId)],
);

export const mcpApiKeyRelations = relations(mcpApiKey, ({ one }) => ({
  user: one(user, { fields: [mcpApiKey.userId], references: [user.id] }),
}));
