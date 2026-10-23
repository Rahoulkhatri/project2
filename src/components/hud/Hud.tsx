"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStory } from "@/lib/store";
import { LAST_SCENE_CODE, RANGES, TRACE, TRACE_TOTAL, toLocal } from "@/lib/story";
import Link from "next/link";
import { Magnetic } from "@/components/ui/Magnetic";
import { NAV } from "@/lib/nav";
import { NavMenu } from "@/components/site/NavMenu";
import { scrollToTarget } from "@/components/scroll/SmoothScroll";

const EXPO_OUT = [0.16, 1, 0.3, 1] as const;

function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
      <path d="M2 16.5 11 5l9 11.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M6.5 16.5 11 10.7l4.5 5.8" stroke="var(--sky)" strokeWidth="1.4" />
      <circle cx="11" cy="16.5" r="1.3" fill="var(--sky)" />
    </svg>
  );
}

function TopBar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex h-[var(--hud-h)] items-center justify-between px-[var(--gutter)]">
      <a
        href="#scene-00"
        onClick={(e) => {
          e.preventDefault();
          scrollToTarget(0);
        }}
        className="pointer-events-auto flex min-h-[44px] items-center gap-2.5 text-ink"
        aria-label="Kestrel Cloud, back to start"
      >
        <LogoMark />
        <span className="t-display text-[20px] tracking-[-0.02em]">Kestrel</span>
        <span className="t-label hidden text-muted md:inline">/ cloud</span>
      </a>

      <div className="t-label hidden items-center gap-4 text-muted lg:flex">
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-lime" />
          284 edge nodes online
        </span>
        <span className="h-3 w-px bg-line-strong" />
        <span>trace 7f3c·e21a</span>
        <span className="h-3 w-px bg-line-strong" />
        <span>GET /products</span>
      </div>

      <nav className="pointer-events-auto flex items-center gap-6 md:gap-8" aria-label="Primary">
        {NAV.map((l) => (
          <Link key={l.href} href={l.href} className="t-label hidden text-muted transition-colors duration-300 hover:text-ink lg:inline">
            {l.label}
          </Link>
        ))}
        <Magnetic>
          <a
            href="#scene-09"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget("#scene-09");
            }}
            className="t-label group flex h-11 items-center gap-2 md:h-10 border border-line-strong bg-bg/40 px-4 text-ink backdrop-blur-sm transition-colors duration-300 hover:border-sky"
          >
            Deploy
            <span className="block h-px w-3 bg-current transition-all duration-300 group-hover:w-5 group-hover:bg-sky" />
          </a>
        </Magnetic>
        <NavMenu className="lg:hidden" />
      </nav>
    </header>
  );
}

function SceneCounter() {
  const index = useStory((s) => s.sceneIndex);
  const r = RANGES[index];

  return (
    <div className="flex items-end gap-3">
      <div className="t-display relative h-[44px] w-[1.3em] overflow-hidden text-[44px] leading-none text-ink">
        <AnimatePresence initial={false} mode="popLayout">
          <motion.span
            key={r.code}
            className="absolute left-0 top-0"
            initial={{ y: "100%" }}
            animate={{ y: "0%" }}
            exit={{ y: "-100%" }}
            transition={{ duration: 0.7, ease: EXPO_OUT }}
          >
            {r.code}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="t-label pb-1 text-muted">
        <div>/ {LAST_SCENE_CODE}</div>
        <div className="relative h-[1.4em] w-[16ch] overflow-hidden text-ink">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={r.label}
              className="absolute left-0 top-0 whitespace-nowrap"
              initial={{ y: "100%" }}
              animate={{ y: "0%" }}
              exit={{ y: "-100%" }}
              transition={{ duration: 0.6, ease: EXPO_OUT, delay: 0.05 }}
            >
              {r.label}
            </motion.span>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/**
 * Request waterfall: one segment per trace step, widths proportional to ms.
 * Segments sharing a scene split that scene's progress in proportion.
 */
const SEGMENTS = (() => {
  const byScene = new Map<string, number>();
  for (const s of TRACE) byScene.set(s.id, (byScene.get(s.id) ?? 0) + s.ms);
  const used = new Map<string, number>();
  return TRACE.map((s) => {
    const total = byScene.get(s.id)!;
    const before = used.get(s.id) ?? 0;
    used.set(s.id, before + s.ms);
    return { ...s, from: before / total, to: (before + s.ms) / total };
  });
})();

function TraceBar() {
  const fills = useRef<(HTMLSpanElement | null)[]>([]);
  const elapsed = useRef<HTMLSpanElement>(null);
  const step = useRef<HTMLSpanElement>(null);

  useEffect(
    () =>
      useStory.subscribe(
        (s) => s.progress,
        (p) => {
          let ms = 0;
          let current = "idle";
          SEGMENTS.forEach((seg, i) => {
            const local = toLocal(seg.id, p);
            const f = Math.min(1, Math.max(0, (local - seg.from) / (seg.to - seg.from)));
            ms += seg.ms * f;
            // Label = the latest step that has started; "200 ok" once the last completes.
            if (f > 0) current = f >= 1 && i === SEGMENTS.length - 1 ? "200 ok" : seg.label;
            const el = fills.current[i];
            if (el) el.style.transform = `scaleX(${f})`;
          });
          if (elapsed.current) elapsed.current.textContent = ms.toFixed(1).padStart(4, "0");
          if (step.current) {
            step.current.textContent = current;
            step.current.style.color = current === "200 ok" ? "var(--lime)" : "";
          }
        },
        { fireImmediately: true },
      ),
    [],
  );

  return (
    <div className="hidden w-[min(34vw,440px)] md:block">
      <div className="t-label mb-2 flex items-baseline justify-between text-muted">
        <span>
          t+ <span ref={elapsed} className="tabular-nums text-ink">00.0</span> ms
        </span>
        <span ref={step} className="text-sky">idle</span>
        <span>of {TRACE_TOTAL} ms</span>
      </div>
      <div className="flex h-[3px] gap-[3px]">
        {SEGMENTS.map((seg, i) => (
          <span key={i} className="relative block h-full bg-line" style={{ flex: seg.ms }} title={`${seg.label} ${seg.ms} ms`}>
            <span
              ref={(el) => {
                fills.current[i] = el;
              }}
              className="absolute inset-0 origin-left scale-x-0"
              style={{ background: seg.id === "response" ? "var(--lime)" : "var(--sky)" }}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

function SoundToggle() {
  const sound = useStory((s) => s.sound);
  const set = useStory((s) => s.set);
  return (
    <button
      type="button"
      onClick={() => set({ sound: !sound })}
      className="t-label pointer-events-auto flex min-h-[44px] min-w-[44px] items-center gap-3 text-muted transition-colors duration-300 hover:text-ink"
      aria-pressed={sound}
      aria-label={sound ? "Sound on (visual only)" : "Sound off"}
    >
      <span className="flex h-3 items-end gap-[2px]" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="block h-full w-[2px] origin-bottom bg-current"
            style={{
              transform: sound ? undefined : `scaleY(${[0.35, 0.6, 0.45, 0.25][i]})`,
              animation: sound ? `sound-bar ${0.7 + i * 0.13}s ${i * 0.09}s ease-in-out infinite` : "none",
            }}
          />
        ))}
      </span>
      Sound {sound ? "on" : "off"}
    </button>
  );
}

function ProgressLine() {
  const fill = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      useStory.subscribe(
        (s) => s.progress,
        (p) => {
          if (fill.current) fill.current.style.transform = `scaleX(${p})`;
        },
        { fireImmediately: true },
      ),
    [],
  );
  return (
    <div className="absolute inset-x-0 bottom-0 h-px bg-line">
      <div ref={fill} className="absolute inset-0 origin-left scale-x-0 bg-sky" />
      {RANGES.slice(1).map((r) => (
        <span key={r.id} className="absolute bottom-0 h-[5px] w-px bg-line-strong" style={{ left: `${r.start * 100}%` }} />
      ))}
    </div>
  );
}

function CropMarks() {
  const mark = "absolute h-3 w-3 border-ink/40";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-3 z-40 md:inset-4">
      <span className={`${mark} left-0 top-0 border-l border-t`} />
      <span className={`${mark} right-0 top-0 border-r border-t`} />
      <span className={`${mark} bottom-0 left-0 border-b border-l`} />
      <span className={`${mark} bottom-0 right-0 border-b border-r`} />
    </div>
  );
}

function GridOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[5] grid grid-cols-4 px-[var(--gutter)] md:grid-cols-12">
      {Array.from({ length: 12 }, (_, i) => (
        <span key={i} className={`border-l border-white/[0.028] ${i === 11 ? "border-r" : ""} ${i >= 4 ? "hidden md:block" : ""} ${i === 3 ? "max-md:border-r" : ""}`} />
      ))}
    </div>
  );
}

export function Hud() {
  const booted = useStory((s) => s.booted);
  const inStory = useStory((s) => s.canvasActive);

  return (
    <motion.div
      initial={false}
      animate={{ opacity: booted ? 1 : 0 }}
      transition={{ duration: 1, ease: EXPO_OUT, delay: booted ? 0.5 : 0 }}
    >
      <GridOverlay />
      <CropMarks />
      <TopBar />
      <motion.div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40"
        animate={{ opacity: inStory ? 1 : 0, y: inStory ? 0 : 12 }}
        transition={{ duration: 0.6, ease: EXPO_OUT }}
      >
        <div className="flex items-end justify-between px-[var(--gutter)] pb-6 md:pb-7">
          <div aria-hidden>
            <SceneCounter />
          </div>
          <div aria-hidden>
            <TraceBar />
          </div>
          <SoundToggle />
        </div>
        <ProgressLine />
      </motion.div>
    </motion.div>
  );
}
