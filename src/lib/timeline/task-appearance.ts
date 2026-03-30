import type { TaskListRow } from "@/components/timeline/task-list";

/** Curated, muted palette — neutrals + one tone per hue (works on light/dark UI). */
export const ACCENT_PRESETS = [
  "#52525b",
  "#57534e",
  "#44403c",
  "#0f766e",
  "#0369a1",
  "#4338ca",
  "#6b21a8",
  "#9f1239",
  "#9a3412",
  "#a16207",
  "#3f6212",
  "#1e3a5f",
] as const;

/** Parse user hex input (#RGB or #RRGGBB). Returns lowercase #rrggbb or null. */
export function normalizeHexInput(s: string): string | null {
  const raw = s.trim();
  if (!raw) return null;
  const withHash = raw.startsWith("#") ? raw : `#${raw}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(withHash)) return withHash.toLowerCase();
  if (/^#[0-9A-Fa-f]{3}$/.test(withHash)) {
    const r = withHash[1]!;
    const g = withHash[2]!;
    const b = withHash[3]!;
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return null;
}

export const EMOJI_GRID: string[] = (
  "✅ 📌 📋 🎯 🚀 💡 🔥 ⚡ 🛠️ 📣 🧠 📝 ✏️ 🗓️ ⏰ 🏃 🏠 💼 🎨 🔒 🌱 📊 💬 🧩 🔭 " +
  "❤️ ⭐ 🎉 🤝 ☕ 📎 🐛 ✨ 🙌 🧘 📚 🎓 🏁"
)
  .trim()
  .split(/\s+/);

export function isHexColor(s: string | null | undefined): s is string {
  return Boolean(s && /^#[0-9A-Fa-f]{6}$/.test(s));
}

export function resolveAccent(row: TaskListRow): string | undefined {
  if (isHexColor(row.accentColor)) return row.accentColor;
  if (isHexColor(row.spaceColor ?? undefined)) return row.spaceColor ?? undefined;
  return undefined;
}

function startOfTodayLocal() {
  const n = new Date();
  n.setHours(0, 0, 0, 0);
  return n;
}

function endOfNextSevenDays() {
  const n = new Date();
  n.setHours(23, 59, 59, 999);
  n.setDate(n.getDate() + 7);
  return n;
}

export function priorityBadge(row: TaskListRow): "overdue" | "soon" | null {
  if (row.status !== "todo") return null;
  if (row.dueAt && new Date(row.dueAt) < startOfTodayLocal()) return "overdue";
  if (row.dueAt) {
    const d = new Date(row.dueAt);
    if (d >= startOfTodayLocal() && d <= endOfNextSevenDays()) return "soon";
  }
  return null;
}
