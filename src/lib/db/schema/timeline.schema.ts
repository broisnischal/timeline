import { relations } from "drizzle-orm";
import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth.schema";

/** Categories / folders (e.g. Content, Reading, Blog). */
export const taskStatusEnum = pgEnum("task_status", ["todo", "done", "cancelled"]);

export const space = pgTable(
  "space",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [index("space_user_idx").on(t.userId)],
);

export const task = pgTable(
  "task",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    spaceId: text("space_id")
      .notNull()
      .references(() => space.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    notes: text("notes"),
    /** Outcome / output once done (what shipped, what you learned). */
    outcome: text("outcome"),
    startsAt: timestamp("starts_at"),
    dueAt: timestamp("due_at"),
    durationMinutes: integer("duration_minutes"),
    status: taskStatusEnum("status").default("todo").notNull(),
    /** Included on public list when profile is enabled. */
    isPublic: boolean("is_public").default(false).notNull(),
    completedAt: timestamp("completed_at"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    index("task_user_idx").on(t.userId),
    index("task_space_idx").on(t.spaceId),
    index("task_starts_idx").on(t.startsAt),
    index("task_due_idx").on(t.dueAt),
  ],
);

export const publicProfile = pgTable(
  "public_profile",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    enabled: boolean("enabled").default(false).notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [index("public_profile_slug_idx").on(t.slug)],
);

export const spaceRelations = relations(space, ({ one, many }) => ({
  user: one(user, { fields: [space.userId], references: [user.id] }),
  tasks: many(task),
}));

export const taskRelations = relations(task, ({ one }) => ({
  user: one(user, { fields: [task.userId], references: [user.id] }),
  space: one(space, { fields: [task.spaceId], references: [space.id] }),
}));

export const publicProfileRelations = relations(publicProfile, ({ one }) => ({
  user: one(user, { fields: [publicProfile.userId], references: [user.id] }),
}));
