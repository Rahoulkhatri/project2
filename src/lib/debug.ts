/**
 * Dev-only switches (`?snap`, `?debug=1`). They are compiled out of production
 * builds unless the build is made with NEXT_PUBLIC_DEBUG=1, which the test
 * harness uses for screenshots and draw-call measurements.
 */
export const DEBUG_ENABLED = process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_DEBUG === "1";

export const hasFlag = (name: string) =>
  DEBUG_ENABLED && typeof location !== "undefined" && new URLSearchParams(location.search).has(name);
