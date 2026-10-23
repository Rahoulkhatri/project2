"use client";

interface ScrollProgressProps {
  progress: number;
}

/**
 * ScrollProgress
 * ──────────────
 * A fixed vertical progress bar on the left edge of the viewport.
 * Height is driven directly by GSAP scroll progress (0→1).
 *
 * Uses a cyan→purple gradient with a soft glow — matches the
 * data pipeline aesthetic without being distracting.
 */
export function ScrollProgress({ progress }: ScrollProgressProps) {
  return (
    <div
      className="scroll-progress"
      style={{ height: `${progress * 100}%` }}
      role="progressbar"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Scroll progress"
    />
  );
}

