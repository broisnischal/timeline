import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";
import { task } from "./timeline.schema";

export const notionConnection = pgTable(
  "notion_connection",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    workspaceId: text("workspace_id").notNull(),
    workspaceName: text("workspace_name"),
    workspaceIcon: text("workspace_icon"),
    botId: text("bot_id"),
    tokenType: text("token_type").notNull().default("bearer"),
    accessTokenEncrypted: text("access_token_encrypted").notNull(),
    refreshTokenEncrypted: text("refresh_token_encrypted"),
    selectedDatabaseId: text("selected_database_id"),
    lastImportedAt: timestamp("last_imported_at"),
    lastPushedAt: timestamp("last_pushed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [index("notion_connection_user_idx").on(t.userId)],
);

export const notionTaskMap = pgTable(
  "notion_task_map",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    taskId: text("task_id")
      .notNull()
      .references(() => task.id, { onDelete: "cascade" }),
    notionPageId: text("notion_page_id").notNull(),
    notionLastEditedTime: timestamp("notion_last_edited_time"),
    lastSyncedAt: timestamp("last_synced_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    index("notion_task_map_user_idx").on(t.userId),
    index("notion_task_map_task_idx").on(t.taskId),
    index("notion_task_map_page_idx").on(t.notionPageId),
    uniqueIndex("notion_task_map_user_task_uq").on(t.userId, t.taskId),
    uniqueIndex("notion_task_map_user_page_uq").on(t.userId, t.notionPageId),
  ],
);

export const notionOauthState = pgTable(
  "notion_oauth_state",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    state: text("state").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("notion_oauth_state_user_idx").on(t.userId),
    index("notion_oauth_state_exp_idx").on(t.expiresAt),
  ],
);

export const notionConnectionRelations = relations(notionConnection, ({ one }) => ({
  user: one(user, { fields: [notionConnection.userId], references: [user.id] }),
}));

export const notionTaskMapRelations = relations(notionTaskMap, ({ one }) => ({
  user: one(user, { fields: [notionTaskMap.userId], references: [user.id] }),
  task: one(task, { fields: [notionTaskMap.taskId], references: [task.id] }),
}));
