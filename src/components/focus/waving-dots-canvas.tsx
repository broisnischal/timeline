import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

type Particle = {
  readonly baseX: number;
  readonly baseY: number;
  readonly r: number;
  readonly phase: number;
};

function pickFill(): string {
  return document.documentElement.classList.contains("dark")
    ? "rgba(255,255,255,0.05)"
    : "rgba(15,23,42,0.055)";
}

/**
 * Soft drifting dots behind the focus view (canvas, no p5 — small bundle, smooth on HiDPI).
 */
export function WavingDotsBackground({ className }: { readonly className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const particles: Particle[] = [];
    let raf = 0;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const layout = () => {
      const dpr = Math.min(window.devicePixelRatio ?? 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles.length = 0;
      const step = 52;
      for (let y = -step; y < h + step; y += step) {
        for (let x = -step; x < w + step; x += step) {
          particles.push({
            baseX: x + (Math.random() - 0.5) * 20,
            baseY: y + (Math.random() - 0.5) * 20,
            r: 0.5 + Math.random() * 1.05,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    };

    const drawStatic = () => {
      const w = canvas.width / (window.devicePixelRatio ?? 1);
      const h = canvas.height / (window.devicePixelRatio ?? 1);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = pickFill();
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.baseX, p.baseY, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    layout();
    const onResize = () => {
      layout();
      if (reduceMotion) drawStatic();
    };
    window.addEventListener("resize", onResize);

    if (reduceMotion) {
      drawStatic();
    } else {
      const t0 = performance.now();
      const loop = (now: number) => {
        const elapsed = (now - t0) / 1000;
        const w = canvas.width / (window.devicePixelRatio ?? 1);
        const h = canvas.height / (window.devicePixelRatio ?? 1);
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = pickFill();
        for (const p of particles) {
          const wave =
            Math.sin(elapsed * 0.42 + p.phase) * 4.2 +
            Math.sin(elapsed * 0.21 + p.baseX * 0.0075) * 2.8;
          const ox = Math.cos(elapsed * 0.27 + p.phase * 1.2) * 3.4;
          ctx.beginPath();
          ctx.arc(p.baseX + ox, p.baseY + wave, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={cn("pointer-events-none fixed inset-0 z-[1] h-full w-full", className)}
      aria-hidden
    />
  );
}
