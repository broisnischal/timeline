/** Default window for dashboard task list (anchor date). */
export function defaultTaskRange() {
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(from.getUTCDate() - 7);
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  to.setUTCDate(to.getUTCDate() + 28);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** URL-driven presets for `/app/timeline` (anchor window). */
export const TIMELINE_RANGE_PRESETS = ["2w", "1m", "3m", "all"] as const;
export type TimelineRangePreset = (typeof TIMELINE_RANGE_PRESETS)[number];

const PRESET_LABEL: Record<TimelineRangePreset, string> = {
  "2w": "2 weeks",
  "1m": "1 month",
  "3m": "3 months",
  all: "All",
};

export function timelineRangePresetLabel(preset: TimelineRangePreset): string {
  return PRESET_LABEL[preset];
}

/** Maps a timeline preset to `{ from, to }` ISO bounds on the task anchor. */
export function timelineRangeFromPreset(preset: TimelineRangePreset) {
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  switch (preset) {
    case "2w":
      from.setUTCDate(from.getUTCDate() - 7);
      to.setUTCDate(to.getUTCDate() + 14);
      break;
    case "1m":
      from.setUTCDate(from.getUTCDate() - 14);
      to.setUTCDate(to.getUTCDate() + 44);
      break;
    case "3m":
      from.setUTCDate(from.getUTCDate() - 30);
      to.setUTCDate(to.getUTCDate() + 90);
      break;
    case "all":
      from.setUTCFullYear(from.getUTCFullYear() - 2);
      to.setUTCFullYear(to.getUTCFullYear() + 2);
      break;
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Default span for the timeline page when no preset is stored (matches previous “~month” feel). */
export function timelineFixedRange() {
  return timelineRangeFromPreset("1m");
}

/** Past 7 days + next `forwardDays` (forward clamped 14–90). */
export function timelineRangeFromHorizonDays(forwardDays: number) {
  const d = Math.min(90, Math.max(14, Math.round(forwardDays)));
  const from = new Date();
  from.setUTCHours(0, 0, 0, 0);
  from.setUTCDate(from.getUTCDate() - 7);
  const to = new Date();
  to.setUTCHours(23, 59, 59, 999);
  to.setUTCDate(to.getUTCDate() + d);
  return { from: from.toISOString(), to: to.toISOString() };
}
