"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type RefObject,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Register GSAP plugins once at module scope
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface ScrollProviderProps {
  children: ReactNode;
  containerRef: RefObject<HTMLDivElement | null>;
  onScrollUpdate: (progress: number, section: number) => void;
}

/**
 * ScrollProvider
 * ─────────────
 * Orchestrates the GSAP ScrollTrigger system:
 *
 * 1. PINS the left canvas column so it stays fixed while
 *    the right content column scrolls.
 * 2. Creates a master ScrollTrigger that maps total scroll
 *    progress (0 → 1) to drive the 3D scene.
 * 3. Creates per-section triggers to detect which section
 *    is currently in view (for active state UI).
 *
 * Architecture Note:
 * ─────────────────
 * We use a single pinned ScrollTrigger on the canvas column
 * with `anticipatePin: 1` for buttery-smooth pin start.
 * The content column scrolls naturally — no transform hacks.
 *
 * The scroll range spans exactly 3 viewport heights (3 sections),
 * giving us precise 0→1 mapping for the data packet animation.
 */
export function ScrollProvider({
  children,
  containerRef,
  onScrollUpdate,
}: ScrollProviderProps) {
  const triggerRef = useRef<ScrollTrigger | null>(null);
  const sectionTriggersRef = useRef<ScrollTrigger[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const canvasCol = container.querySelector(
      '[data-scroll-pin="true"]'
    ) as HTMLElement;
    const contentCol = container.querySelector(
      ".content-column"
    ) as HTMLElement;

    if (!canvasCol || !contentCol) return;

    // ─── Context for clean teardown ───
    const ctx = gsap.context(() => {
      /**
       * MASTER TRIGGER
       * Pins the canvas column for the entire scroll distance.
       * `scrub: true` gives 1:1 scroll-to-progress mapping.
       * `anticipatePin: 1` prevents the jank on pin start.
       */
      triggerRef.current = ScrollTrigger.create({
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        pin: canvasCol,
        pinSpacing: false, // Content column handles spacing naturally
        scrub: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const progress = self.progress;

          // Map 0→1 progress to section index (0, 1, or 2)
          let section = 0;
          if (progress > 0.66) section = 2;
          else if (progress > 0.33) section = 1;

          onScrollUpdate(progress, section);
        },
      });

      /**
       * PER-SECTION TRIGGERS
       * Each section-panel gets its own trigger for granular
       * enter/leave detection. Used for staggered text reveals.
       */
      const sectionPanels = contentCol.querySelectorAll(".section-panel");
      sectionPanels.forEach((panel, i) => {
        const trigger = ScrollTrigger.create({
          trigger: panel,
          start: "top 60%",
          end: "bottom 40%",
          onEnter: () => {
            // Animate section content in
            gsap.to(panel.querySelectorAll(".reveal-up"), {
              y: 0,
              opacity: 1,
              duration: 0.8,
              stagger: 0.12,
              ease: "power3.out",
            });
          },
          onLeaveBack: () => {
            // Reset on scroll back up
            gsap.to(panel.querySelectorAll(".reveal-up"), {
              y: 40,
              opacity: 0,
              duration: 0.4,
              stagger: 0.05,
              ease: "power2.in",
            });
          },
        });
        sectionTriggersRef.current.push(trigger);
      });

      /**
       * INITIAL STATE
       * Set all reveal elements to their hidden starting position.
       * The first section reveals immediately on load.
       */
      gsap.set(".reveal-up", { y: 40, opacity: 0 });

      // Reveal first section after a brief delay for page load
      gsap.to(
        sectionPanels[0]?.querySelectorAll(".reveal-up") ?? [],
        {
          y: 0,
          opacity: 1,
          duration: 1,
          stagger: 0.15,
          delay: 0.5,
          ease: "power3.out",
        }
      );
    }, container);

    return () => {
      ctx.revert(); // Clean teardown of all GSAP instances
      sectionTriggersRef.current = [];
    };
  }, [containerRef, onScrollUpdate]);

  return <>{children}</>;
}

