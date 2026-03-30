import "@tanstack/react-start/server-only";
import {
  type SQL,
  and,
  asc,
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  max,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/lib/db";
import {
  type TaskActivityEntry,
  type TaskSubtask,
  publicProfile,
  space,
  task,
} from "@/lib/db/schema/timeline.schema";

import type { YearActivityCell } from "./year-activity.types";

function newId() {
  return crypto.randomUUID();
}

export async function ensureDefaultSpace(userId: string) {
  const rows = await db
    .select()
    .from(space)
    .where(eq(space.userId, userId))
    .orderBy(asc(space.sortOrder))
    .limit(1);
  if (rows[0]) return rows[0];
  const id = newId();
  await db.insert(space).values({ id, userId, name: "Inbox", sortOrder: 0 });
  const created = await db.select().from(space).where(eq(space.id, id));
  return created[0]!;
}

export async function listSpacesWithCounts(userId: string) {
  const inbox = await ensureDefaultSpace(userId);
  const spaces = await db
    .select()
    .from(space)
    .where(eq(space.userId, userId))
    .orderBy(asc(space.sortOrder), asc(space.name));
  const counts = await db
    .select({
      spaceId: task.spaceId,
      n: count(),
    })
    .from(task)
    .where(eq(task.userId, userId))
    .groupBy(task.spaceId);
  const map = new Map(counts.map((c) => [c.spaceId, Number(c.n)]));
  return spaces.map((s) => ({
    ...s,
    taskCount: map.get(s.id) ?? 0,
    isDefault: s.id === inbox.id,
  }));
}

export async function createSpaceRow(
  userId: string,
  input: { name: string; description?: string | undefined; color?: string | undefined },
) {
  const maxOrder = await db
    .select({ m: max(space.sortOrder) })
    .from(space)
    .where(eq(space.userId, userId));
  const next = Number(maxOrder[0]?.m ?? -1) + 1;
  const id = newId();
  await db.insert(space).values({
    id,
    userId,
    name: input.name,
    description: input.description,
    color: input.color,
    sortOrder: next,
  });
  const row = await db.select().from(space).where(eq(space.id, id));
  return row[0]!;
}

export async function updateSpaceRow(
  userId: string,
  input: {
    id: string;
    name?: string | undefined;
    description?: string | null | undefined;
    color?: string | null | undefined;
    sortOrder?: number | undefined;
  },
) {
  const [owned] = await db
    .select({ id: space.id })
    .from(space)
    .where(and(eq(space.id, input.id), eq(space.userId, userId)));
  if (!owned) throw new Error("Space not found");
  await db
    .update(space)
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.color !== undefined ? { color: input.color } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    })
    .where(eq(space.id, input.id));
  const row = await db.select().from(space).where(eq(space.id, input.id));
  return row[0]!;
}

export async function deleteSpaceRow(userId: string, spaceId: string) {
  const [s] = await db
    .select()
    .from(space)
    .where(and(eq(space.id, spaceId), eq(space.userId, userId)));
  if (!s) throw new Error("Space not found");
  const inbox = await ensureDefaultSpace(userId);
  if (s.id === inbox.id) throw new Error("Cannot delete your default space");
  /** Tasks cascade-delete via FK; do not reassign to inbox. */
  await db.delete(space).where(eq(space.id, spaceId));
}

function parseOptionalDate(s: string | undefined) {
  if (!s || s === "") return undefined;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return undefined;
  return d;
}

export async function listTasksForUser(
  userId: string,
  opts: { spaceId?: string | undefined; from?: string | undefined; to?: string | undefined },
) {
  const fromD = opts.from ? new Date(opts.from) : undefined;
  const toD = opts.to ? new Date(opts.to) : undefined;
  const conditions: SQL[] = [eq(task.userId, userId)];
  if (opts.spaceId) conditions.push(eq(task.spaceId, opts.spaceId));
  // postgres.js cannot bind JS Date — use ISO strings (PG compares as timestamptz).
  if (fromD && !Number.isNaN(fromD.getTime())) {
    conditions.push(
      sql`coalesce(${task.startsAt}, ${task.dueAt}, ${task.createdAt}) >= ${fromD.toISOString()}`,
    );
  }
  if (toD && !Number.isNaN(toD.getTime())) {
    conditions.push(
      sql`coalesce(${task.startsAt}, ${task.dueAt}, ${task.createdAt}) <= ${toD.toISOString()}`,
    );
  }

  const whereClause = conditions.length === 1 ? conditions[0]! : and(...conditions);
  const anchor = sql`coalesce(${task.startsAt}, ${task.dueAt}, ${task.createdAt})`;

  return db
    .select({
      ...getTableColumns(task),
      spaceName: space.name,
      spaceColor: space.color,
    })
    .from(task)
    .innerJoin(space, eq(task.spaceId, space.id))
    .where(whereClause)
    .orderBy(asc(anchor), desc(task.createdAt));
}

export async function getTaskByIdForUser(userId: string, taskId: string) {
  const rows = await db
    .select({
      ...getTableColumns(task),
      spaceName: space.name,
      spaceColor: space.color,
    })
    .from(task)
    .innerJoin(space, eq(task.spaceId, space.id))
    .where(and(eq(task.id, taskId), eq(task.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createTaskRow(
  userId: string,
  input: {
    spaceId: string;
    title: string;
    notes?: string | undefined;
    outcome?: string | undefined;
    startsAt?: string | undefined;
    dueAt?: string | undefined;
    durationMinutes?: number | undefined;
    isPublic?: boolean | undefined;
    icon?: string | undefined;
    accentColor?: string | undefined;
  },
) {
  const [sp] = await db
    .select()
    .from(space)
    .where(and(eq(space.id, input.spaceId), eq(space.userId, userId)));
  if (!sp) throw new Error("Space not found");
  const id = newId();
  const startsAt = parseOptionalDate(input.startsAt);
  const dueAt = parseOptionalDate(input.dueAt);
  await db.insert(task).values({
    id,
    userId,
    spaceId: input.spaceId,
    title: input.title,
    icon: input.icon?.trim() || null,
    accentColor: input.accentColor?.trim() || null,
    notes: input.notes,
    outcome: input.outcome,
    startsAt,
    dueAt,
    durationMinutes: input.durationMinutes,
    isPublic: input.isPublic ?? false,
    status: "todo",
  });
  const row = await db.select().from(task).where(eq(task.id, id));
  return row[0]!;
}

export async function updateTaskRow(
  userId: string,
  input: {
    id: string;
    title?: string | undefined;
    notes?: string | null | undefined;
    outcome?: string | null | undefined;
    startsAt?: string | null | undefined;
    dueAt?: string | null | undefined;
    durationMinutes?: number | null | undefined;
    status?: "todo" | "done" | "cancelled" | undefined;
    isPublic?: boolean | undefined;
    spaceId?: string | undefined;
    icon?: string | null | undefined;
    accentColor?: string | null | undefined;
    subtasks?: TaskSubtask[] | undefined;
  },
) {
  const [t] = await db
    .select()
    .from(task)
    .where(and(eq(task.id, input.id), eq(task.userId, userId)));
  if (!t) throw new Error("Task not found");
  if (input.spaceId) {
    const [sp] = await db
      .select()
      .from(space)
      .where(and(eq(space.id, input.spaceId), eq(space.userId, userId)));
    if (!sp) throw new Error("Space not found");
  }
  const startsAt =
    input.startsAt === undefined
      ? undefined
      : input.startsAt === null
        ? null
        : parseOptionalDate(input.startsAt);
  const dueAt =
    input.dueAt === undefined
      ? undefined
      : input.dueAt === null
        ? null
        : parseOptionalDate(input.dueAt);

  let completedAt: Date | null | undefined;
  if (input.status === "done") completedAt = t.completedAt ?? new Date();
  else if (input.status === "todo" || input.status === "cancelled") completedAt = null;

  await db
    .update(task)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.outcome !== undefined ? { outcome: input.outcome } : {}),
      ...(input.startsAt !== undefined ? { startsAt } : {}),
      ...(input.dueAt !== undefined ? { dueAt } : {}),
      ...(input.durationMinutes !== undefined ? { durationMinutes: input.durationMinutes } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
      ...(input.spaceId !== undefined ? { spaceId: input.spaceId } : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.accentColor !== undefined ? { accentColor: input.accentColor } : {}),
      ...(input.subtasks !== undefined ? { subtasks: input.subtasks } : {}),
      ...(completedAt !== undefined ? { completedAt } : {}),
    })
    .where(eq(task.id, input.id));

  const row = await db.select().from(task).where(eq(task.id, input.id));
  return row[0]!;
}

export async function appendTaskActivityRow(userId: string, taskId: string, body: string) {
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Log text is empty");
  const [t] = await db
    .select()
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)));
  if (!t) throw new Error("Task not found");
  const log = (t.activityLog as TaskActivityEntry[]) ?? [];
  const next: TaskActivityEntry[] = [
    ...log,
    { id: newId(), at: new Date().toISOString(), body: trimmed },
  ];
  await db.update(task).set({ activityLog: next }).where(eq(task.id, taskId));
  const row = await db.select().from(task).where(eq(task.id, taskId));
  return row[0]!;
}

/** Sample tasks for empty accounts — only runs when the user has zero tasks. */
export async function seedDemoTimelineTasks(userId: string) {
  const [{ n }] = await db.select({ n: count() }).from(task).where(eq(task.userId, userId));
  if (Number(n) > 0) {
    return { inserted: 0, skipped: true as const };
  }

  const inbox = await ensureDefaultSpace(userId);
  const rows = await db
    .select()
    .from(space)
    .where(and(eq(space.userId, userId), eq(space.name, "Work")));
  const workSpace = rows[0] ?? (await createSpaceRow(userId, { name: "Work" }));

  const dayStart = (offset: number) => {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString();
  };
  const dayEnd = (offset: number) => {
    const d = new Date();
    d.setUTCHours(23, 59, 59, 999);
    d.setUTCDate(d.getUTCDate() + offset);
    return d.toISOString();
  };

  type SeedRow = {
    title: string;
    notes?: string;
    spaceId: string;
    startsAt: string;
    dueAt: string;
    done?: boolean;
    outcome?: string;
  };

  const samples: SeedRow[] = [
    {
      title: "Ship landing refresh",
      notes: "Tighten hero, spacing, and nav.",
      spaceId: inbox.id,
      startsAt: dayStart(-6),
      dueAt: dayEnd(-3),
      done: true,
      outcome: "Merged and deployed.",
    },
    {
      title: "Weekly sync notes",
      notes: "Blockers and next steps.",
      spaceId: workSpace.id,
      startsAt: dayStart(-7),
      dueAt: dayEnd(-1),
      done: true,
      outcome: "Shared in Slack.",
    },
    {
      title: "Timeline polish",
      notes: "Rails, grouping, empty states.",
      spaceId: inbox.id,
      startsAt: dayStart(0),
      dueAt: dayEnd(2),
    },
    {
      title: "Draft blog outline",
      notes: "Hooks, sections, CTA.",
      spaceId: workSpace.id,
      startsAt: dayStart(-1),
      dueAt: dayEnd(4),
    },
    {
      title: "Review analytics",
      notes: "Funnel and retention.",
      spaceId: workSpace.id,
      startsAt: dayStart(2),
      dueAt: dayEnd(7),
    },
    {
      title: "Inbox zero",
      notes: "Clear stale items.",
      spaceId: inbox.id,
      startsAt: dayStart(0),
      dueAt: dayEnd(1),
    },
    {
      title: "Plan Q2 roadmap",
      notes: "Themes and milestones.",
      spaceId: workSpace.id,
      startsAt: dayStart(5),
      dueAt: dayEnd(18),
    },
    {
      title: "Quarterly reflection",
      notes: "What worked, what to change.",
      spaceId: inbox.id,
      startsAt: dayStart(10),
      dueAt: dayEnd(24),
    },
  ];

  let inserted = 0;
  for (const s of samples) {
    const created = await createTaskRow(userId, {
      spaceId: s.spaceId,
      title: s.title,
      notes: s.notes,
      startsAt: s.startsAt,
      dueAt: s.dueAt,
    });
    inserted++;
    if (s.done) {
      await updateTaskRow(userId, {
        id: created.id,
        status: "done",
        outcome: s.outcome ?? "Done.",
      });
    }
  }

  return { inserted, skipped: false as const };
}

export async function toggleTaskDone(userId: string, taskId: string) {
  const [t] = await db
    .select()
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)));
  if (!t) throw new Error("Task not found");
  const next = t.status === "done" ? "todo" : "done";
  await db
    .update(task)
    .set({
      status: next,
      completedAt: next === "done" ? new Date() : null,
    })
    .where(eq(task.id, taskId));
  const row = await db.select().from(task).where(eq(task.id, taskId));
  return row[0]!;
}

export async function deleteTaskRow(userId: string, taskId: string) {
  const [t] = await db
    .select()
    .from(task)
    .where(and(eq(task.id, taskId), eq(task.userId, userId)));
  if (!t) throw new Error("Task not found");
  await db.delete(task).where(eq(task.id, taskId));
}

/** Last `days` days of completion counts + current streak (days with ≥1 completion, ending today). */
export async function getStreakStats(userId: string, days = 14) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const start = new Date(today);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const rows = await db
    .select({ completedAt: task.completedAt })
    .from(task)
    .where(
      and(
        eq(task.userId, userId),
        eq(task.status, "done"),
        sql`${task.completedAt} >= ${start.toISOString()}`,
        sql`${task.completedAt} is not null`,
      ),
    );

  const byDay = new Map<string, number>();
  for (const r of rows) {
    if (!r.completedAt) continue;
    const key = r.completedAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + 1);
  }

  const series: { day: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ day: key, count: byDay.get(key) ?? 0 });
  }

  let streak = 0;
  for (let i = days - 1; i >= 0; i--) {
    if (series[i].count > 0) streak++;
    else break;
  }

  return { series, streak, todayKey: today.toISOString().slice(0, 10) };
}

/** UTC calendar grid for the year: completions per day, plus due / in-flight todo highlights. */
export async function getYearActivityGrid(userId: string, year?: number) {
  const y = year ?? new Date().getUTCFullYear();
  const yearStart = new Date(Date.UTC(y, 0, 1, 0, 0, 0, 0));
  const yearEnd = new Date(Date.UTC(y, 11, 31, 23, 59, 59, 999));

  const tasks = await db
    .select({
      status: task.status,
      startsAt: task.startsAt,
      dueAt: task.dueAt,
      completedAt: task.completedAt,
      createdAt: task.createdAt,
    })
    .from(task)
    .where(
      and(
        eq(task.userId, userId),
        or(
          and(
            eq(task.status, "done"),
            sql`${task.completedAt} is not null`,
            sql`${task.completedAt} >= ${yearStart.toISOString()}`,
            sql`${task.completedAt} <= ${yearEnd.toISOString()}`,
          ),
          and(
            eq(task.status, "todo"),
            or(
              sql`${task.dueAt} >= ${yearStart.toISOString()} and ${task.dueAt} <= ${yearEnd.toISOString()}`,
              sql`${task.startsAt} >= ${yearStart.toISOString()} and ${task.startsAt} <= ${yearEnd.toISOString()}`,
              sql`coalesce(${task.startsAt}, ${task.createdAt}) <= ${yearEnd.toISOString()} and (${task.dueAt} is null or ${task.dueAt} >= ${yearStart.toISOString()})`,
            ),
          ),
        ),
      ),
    );

  const utcDayKey = (d: Date) => d.toISOString().slice(0, 10);
  const y0 = utcDayKey(yearStart);
  const y1 = utcDayKey(yearEnd);

  const completedByDay = new Map<string, number>();
  const dueByDay = new Map<string, number>();
  const ongoingByDay = new Map<string, number>();

  for (const t of tasks) {
    if (t.status === "done" && t.completedAt) {
      const k = utcDayKey(new Date(t.completedAt));
      if (k >= y0 && k <= y1) {
        completedByDay.set(k, (completedByDay.get(k) ?? 0) + 1);
      }
    }
    if (t.status === "todo" && t.dueAt) {
      const k = utcDayKey(new Date(t.dueAt));
      if (k >= y0 && k <= y1) {
        dueByDay.set(k, (dueByDay.get(k) ?? 0) + 1);
      }
    }
    if (t.status === "todo") {
      const intervalStart = t.startsAt ?? t.createdAt;
      const intervalEnd = t.dueAt ?? yearEnd;
      if (!intervalStart) continue;
      const is = new Date(intervalStart).getTime();
      const ie = new Date(intervalEnd).getTime();
      const lo = Math.max(is, yearStart.getTime());
      const hi = Math.min(ie, yearEnd.getTime());
      if (lo > hi) continue;
      const cur = new Date(lo);
      cur.setUTCHours(0, 0, 0, 0);
      const endDay = new Date(hi);
      endDay.setUTCHours(0, 0, 0, 0);
      while (cur.getTime() <= endDay.getTime()) {
        const k = utcDayKey(cur);
        if (k >= y0 && k <= y1) {
          ongoingByDay.set(k, (ongoingByDay.get(k) ?? 0) + 1);
        }
        cur.setUTCDate(cur.getUTCDate() + 1);
      }
    }
  }

  const cells: YearActivityCell[] = [];
  for (let m = 0; m < 12; m++) {
    const dim = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    for (let d = 1; d <= dim; d++) {
      const day = new Date(Date.UTC(y, m, d));
      const key = utcDayKey(day);
      cells.push({
        day: key,
        completed: completedByDay.get(key) ?? 0,
        due: dueByDay.get(key) ?? 0,
        ongoing: ongoingByDay.get(key) ?? 0,
      });
    }
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  return { year: y, cells, todayKey };
}

export async function getPublicProfileForUser(userId: string) {
  const row = await db
    .select()
    .from(publicProfile)
    .where(eq(publicProfile.userId, userId))
    .limit(1);
  return row[0] ?? null;
}

export async function upsertPublicProfile(userId: string, slug: string, enabled: boolean) {
  const existing = await getPublicProfileForUser(userId);
  if (existing && existing.slug !== slug) {
    const [taken] = await db
      .select()
      .from(publicProfile)
      .where(eq(publicProfile.slug, slug))
      .limit(1);
    if (taken && taken.userId !== userId) throw new Error("That URL is already taken");
  } else if (!existing) {
    const [taken] = await db
      .select()
      .from(publicProfile)
      .where(eq(publicProfile.slug, slug))
      .limit(1);
    if (taken) throw new Error("That URL is already taken");
  }

  await db.insert(publicProfile).values({ userId, slug, enabled }).onConflictDoUpdate({
    target: publicProfile.userId,
    set: { slug, enabled },
  });
  return getPublicProfileForUser(userId);
}

export async function getPublicTasksBySlug(slug: string) {
  const [profile] = await db
    .select()
    .from(publicProfile)
    .where(eq(publicProfile.slug, slug))
    .limit(1);
  if (!profile?.enabled) return null;
  const tasks = await db
    .select({
      ...getTableColumns(task),
      spaceName: space.name,
    })
    .from(task)
    .innerJoin(space, eq(task.spaceId, space.id))
    .where(
      and(
        eq(task.userId, profile.userId),
        eq(task.isPublic, true),
        inArray(task.status, ["todo", "done"]),
      ),
    )
    .orderBy(desc(task.dueAt), desc(task.startsAt), desc(task.createdAt));
  return { profile, tasks };
}
