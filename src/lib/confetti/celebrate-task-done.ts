import confetti from "canvas-confetti";

/** Short burst when a task is marked done — works without a click origin (viewport-centered). */
export function celebrateTaskDone() {
  const colors = ["#7c3aed", "#a78bfa", "#e879f9", "#38bdf8", "#fbbf24", "#34d399"];
  const base = {
    spread: 78,
    ticks: 100,
    gravity: 0.9,
    decay: 0.91,
    scalar: 0.75,
    startVelocity: 32,
    colors,
  } as const;

  void confetti({ ...base, particleCount: 90, origin: { x: 0.5, y: 0.72 } });
  void confetti({
    ...base,
    particleCount: 55,
    spread: 120,
    origin: { x: 0.42, y: 0.74 },
  });
  void confetti({
    ...base,
    particleCount: 55,
    spread: 120,
    origin: { x: 0.58, y: 0.74 },
  });
}
