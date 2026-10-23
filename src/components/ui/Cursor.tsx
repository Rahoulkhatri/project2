"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { bindPointer, pointer } from "@/lib/pointer";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, [data-cursor]";

/**
 * Dot + trailing ring. The ring grows over interactive elements and shows the
 * element's `data-cursor` label ("copy", "view", "drag"). Fine pointers only.
 */
export function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [enabled, setEnabled] = useState(false);
  const [label, setLabel] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const sync = () => {
      setEnabled(mq.matches);
      document.documentElement.classList.toggle("has-cursor", mq.matches);
    };
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    bindPointer();

    const rx = { x: pointer.x, y: pointer.y };
    let raf = 0;
    const loop = () => {
      // Ring trails the dot with a frame-rate–independent-enough lerp.
      rx.x += (pointer.x - rx.x) * 0.18;
      rx.y += (pointer.y - rx.y) * 0.18;
      if (dot.current) dot.current.style.transform = `translate3d(${pointer.x}px, ${pointer.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${rx.x}px, ${rx.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onOver = (e: PointerEvent) => {
      const target = (e.target as Element | null)?.closest(INTERACTIVE);
      setHovering(!!target);
      setLabel(target?.getAttribute("data-cursor") ?? null);
    };
    const onLeave = () => {
      pointer.x = -100;
      pointer.y = -100;
    };
    window.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, [enabled]);

  if (!enabled) return null;

  const size = label ? 68 : hovering ? 48 : 30;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[100]">
      <div ref={ring} className="absolute left-0 top-0 will-change-transform">
        <motion.div
          className="grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border"
          animate={{
            width: size,
            height: size,
            borderColor: label ? "rgba(56,189,248,0.9)" : "rgba(232,237,245,0.35)",
            backgroundColor: label ? "rgba(56,189,248,0.12)" : "rgba(56,189,248,0)",
          }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence>
            {label && (
              <motion.span
                key={label}
                className="t-label text-[10px] text-sky"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                {label}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
      <div ref={dot} className="absolute left-0 top-0 will-change-transform">
        <motion.div
          className="h-[5px] w-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink"
          animate={{ scale: hovering ? 0 : 1 }}
          transition={{ duration: 0.25, ease: [0.33, 1, 0.68, 1] }}
        />
      </div>
    </div>
  );
}
