"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Smooth scroll for the inner pages (the story has its own engine tied to ScrollTrigger).
 * Also releases the scroll lock the root layout sets for the home preloader, which these
 * pages don't have.
 */
export function PageScroll() {
  useEffect(() => {
    document.documentElement.classList.remove("is-booting");
    window.scrollTo(0, 0);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.1, wheelMultiplier: 0.9 });
    return () => lenis.destroy();
  }, []);

  return null;
}
