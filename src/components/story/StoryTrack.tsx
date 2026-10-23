"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useStory } from "@/lib/store";
import { RANGES, STORY_LENGTH, posterAt, sceneIndexAt } from "@/lib/story";
import { StoryCopy } from "./StoryCopy";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The story track: one tall element whose scroll distance *is* the story.
 * A sticky viewport inside it holds every copy layer; invisible markers give
 * each scene an anchor (#scene-03) for HUD navigation and deep links.
 */
export function StoryTrack() {
  const track = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const set = useStory.getState().set;
      const proxy = { p: 0 };

      // ease "none" is deliberate: scroll distance maps 1:1 to progress, and all
      // choreography easing happens downstream (rail segments, scene timelines).
      gsap.to(proxy, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: track.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });

      // The canvas only renders while the track is on screen.
      ScrollTrigger.create({
        trigger: track.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => set({ canvasActive: self.isActive }),
      });

      let last = 0;
      let velocity = 0;
      const tick = (_time: number, deltaMs: number) => {
        const dt = Math.max(deltaMs, 1) / 1000;
        const reduced = useStory.getState().reducedMotion;
        // Reduced motion: cut between fixed poster frames instead of scrubbing.
        const p = reduced ? posterAt(proxy.p) : proxy.p;
        velocity = reduced ? 0 : velocity + ((p - last) / dt - velocity) * Math.min(1, dt * 8);
        last = p;
        const state = useStory.getState();
        const sceneIndex = sceneIndexAt(p);
        if (p !== state.progress || Math.abs(velocity - state.velocity) > 1e-6 || sceneIndex !== state.sceneIndex) {
          set({ progress: p, velocity, sceneIndex });
        }
      };
      gsap.ticker.add(tick);

      document.fonts.ready.then(() => ScrollTrigger.refresh());

      return () => gsap.ticker.remove(tick);
    },
    { scope: track },
  );

  return (
    <section
      ref={track}
      id="story"
      aria-label="The journey of a request"
      className="relative"
      style={{ height: `${STORY_LENGTH}vh` }}
    >
      {RANGES.map((r) => (
        <span
          key={r.id}
          id={`scene-${r.code}`}
          aria-hidden
          className="pointer-events-none absolute left-0 w-px"
          style={{ top: `${r.offset}vh`, height: `${r.length}vh` }}
        />
      ))}
      <div className="sticky top-0 z-10 h-screen w-full overflow-hidden">
        <StoryCopy />
      </div>
    </section>
  );
}
