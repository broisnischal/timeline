import type { TaskListRow } from "@/components/timeline/task-list";

export const ACCENT_PRESETS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#0ea5e9",
  "#64748b",
] as const;

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
