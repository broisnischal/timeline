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

/** Default span for the timeline page: past week + next four weeks. */
export function timelineFixedRange() {
  return timelineRangeFromHorizonDays(28);
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
