"use client";

import { useEffect, useRef } from "react";
import { MathUtils } from "three";
import { useStory } from "@/lib/store";
import { toLocal } from "@/lib/story";

/** "Total: 87ms" counts up as the page paints on the laptop. */
export function TotalCounter() {
  const num = useRef<HTMLSpanElement>(null);
  useEffect(
    () =>
      useStory.subscribe(
        (s) => s.progress,
        (p) => {
          const k = MathUtils.smoothstep(toLocal("response", p), 0.74, 0.95);
          if (num.current) num.current.textContent = String(Math.round(87 * k)).padStart(2, "0");
        },
        { fireImmediately: true },
      ),
    [],
  );
  return (
    <div data-fade className="flex items-end gap-4">
      <span className="t-label pb-3 text-muted">
        Total
        <br />
        round trip
      </span>
      <span className="t-display text-[clamp(5rem,13vw,13rem)] leading-[0.8] text-lime">
        <span ref={num}>00</span>
        <span className="ml-2 text-[0.28em] text-muted">ms</span>
      </span>
    </div>
  );
}
