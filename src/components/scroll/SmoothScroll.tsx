"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useStory } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** The live Lenis instance (null under reduced motion). */
export const getLenis = () => lenis;

/** Scroll to a target, through Lenis when it's running. */
export function scrollToTarget(target: string | number | HTMLElement, immediate = false) {
  if (lenis) {
    lenis.scrollTo(target, { duration: 2.2, easing: expoInOut, immediate });
    return;
  }
  let y = 0;
  if (typeof target === "number") y = target;
  else {
    const el = typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
    y = (el?.getBoundingClientRect().top ?? 0) + window.scrollY;
  }
  window.scrollTo({ top: y, behavior: immediate ? "auto" : "smooth" });
}

const expoInOut = (t: number) =>
  t === 0 ? 0 : t === 1 ? 1 : t < 0.5 ? 2 ** (20 * t - 10) / 2 : (2 - 2 ** (-20 * t + 10)) / 2;

/**
 * Lenis drives the scroll; GSAP's ticker drives Lenis so ScrollTrigger and
 * smooth scroll share one clock. Also publishes environment flags to the store.
 */
export function SmoothScroll() {
  useEffect(() => {
    const set = useStory.getState().set;
    const mqMobile = window.matchMedia("(max-width: 767px)");
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncEnv = () => set({ isMobile: mqMobile.matches, reducedMotion: mqReduced.matches });
    syncEnv();
    mqMobile.addEventListener("change", syncEnv);
    mqReduced.addEventListener("change", syncEnv);

    // The story always starts at the laptop.
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);

    if (!mqReduced.matches) {
      lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.85, touchMultiplier: 1.15 });
      lenis.on("scroll", ScrollTrigger.update);
      if (!useStory.getState().booted) lenis.stop();
    }

    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // Hand the scroll over once the preloader has powered on.
    const unsub = useStory.subscribe(
      (s) => s.booted,
      (booted) => {
        document.documentElement.classList.toggle("is-booting", !booted);
        if (booted) lenis?.start();
        ScrollTrigger.refresh();
      },
    );

    return () => {
      unsub();
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
      mqMobile.removeEventListener("change", syncEnv);
      mqReduced.removeEventListener("change", syncEnv);
    };
  }, []);

  return null;
}
