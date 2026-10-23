"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { useStory } from "@/lib/store";
import { toGlobal, type SceneId } from "@/lib/story";

gsap.registerPlugin(SplitText, useGSAP);

type Props = {
  scene: SceneId;
  /** Scene-local window in which this copy is on screen. */
  from?: number;
  to?: number;
  /** Accept pointer events while active (CTAs, copy buttons). */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
};

/**
 * A full-viewport layer of story copy. Elements marked `data-reveal` are split
 * into masked lines that rise from 110% → 0; `data-fade` elements fade up.
 * The layer plays in when global progress enters its window and reverses
 * (faster) when it leaves, in either direction.
 */
export function CopyLayer({ scene, from = 0.08, to = 0.92, interactive, className, children }: Props) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = root.current!;
      const start = toGlobal(scene, from);
      const end = toGlobal(scene, to);
      // Read directly: the store's flag is set in an effect that may run after this one.
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      let splits: SplitText[] = [];
      let tl: gsap.core.Timeline | null = null;
      let active = false;

      const build = () => {
        const progress = tl?.progress() ?? 0;
        tl?.kill();
        splits.forEach((s) => s.revert());

        splits = Array.from(el.querySelectorAll<HTMLElement>("[data-reveal]")).map((node) =>
          SplitText.create(node, { type: "lines", mask: "lines", linesClass: "split-line" }),
        );
        const lines = splits.flatMap((s) => s.lines);
        const fades = el.querySelectorAll<HTMLElement>("[data-fade]");

        tl = gsap.timeline({
          paused: true,
          onReverseComplete: () => gsap.set(el, { visibility: "hidden" }),
        });

        const targets = [...lines, ...fades];
        if (!targets.length) return;
        if (reduced) {
          tl.fromTo(targets, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4, ease: "power1.out" });
        } else {
          // Either list can be empty (a panel with only fades, a headline with only lines).
          if (lines.length) {
            tl.fromTo(lines, { yPercent: 110 }, { yPercent: 0, duration: 1.15, ease: "expo.out", stagger: 0.075 }, 0);
          }
          if (fades.length) {
            tl.fromTo(fades, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.06 }, 0.12);
          }
        }

        tl.progress(progress);
        if (!active && progress === 0) gsap.set(el, { visibility: "hidden" });
      };

      const update = () => {
        const { progress, booted } = useStory.getState();
        const next = booted && progress >= start && (progress < end || (end >= 1 && progress <= 1));
        if (next === active || !tl) return;
        active = next;
        el.style.pointerEvents = active && interactive ? "auto" : "none";
        el.setAttribute("aria-hidden", String(!active));
        if (active) {
          gsap.set(el, { visibility: "visible" });
          tl.timeScale(1).play();
        } else {
          tl.timeScale(2.2).reverse();
        }
      };

      let resizeTimer = 0;
      const onResize = () => {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(build, 180);
      };

      let disposed = false;
      document.fonts.ready.then(() => {
        if (disposed) return;
        build();
        update();
      });

      const unsubProgress = useStory.subscribe((s) => s.progress, update);
      const unsubBoot = useStory.subscribe((s) => s.booted, update);
      window.addEventListener("resize", onResize);

      return () => {
        disposed = true;
        unsubProgress();
        unsubBoot();
        window.removeEventListener("resize", onResize);
        window.clearTimeout(resizeTimer);
        tl?.kill();
        splits.forEach((s) => s.revert());
      };
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      data-scene={scene}
      // Hidden from the first paint: the lines are re-split once fonts load, which would otherwise register as layout shift.
      style={{ visibility: "hidden" }}
      className={`pointer-events-none absolute inset-0 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
