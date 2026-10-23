import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

/**
 * Global story store.
 *
 * `progress` and `velocity` change every frame. Nothing renders from them
 * through React: 3D code reads `useStory.getState()` inside useFrame, and DOM
 * consumers use `useStory.subscribe(selector, cb)` to write styles directly.
 * Only the low-frequency fields below are meant for React selectors.
 */
type StoryState = {
  /** Smoothed (scrub: 1) global story progress, 0..1. */
  progress: number;
  /** Progress units per second, signed. Drives motion-blur style effects. */
  velocity: number;

  sceneIndex: number;
  /** Assets loaded (drei useProgress reached 100). */
  loaded: boolean;
  /** Shaders for the first screen are compiled (async, off the main thread). */
  compiled: boolean;
  /** Preloader finished its power-on; the world is live. */
  booted: boolean;
  /** Story track is on screen; when false the canvas stops rendering. */
  canvasActive: boolean;

  sound: boolean;
  isMobile: boolean;
  reducedMotion: boolean;

  set: (partial: Partial<Omit<StoryState, "set">>) => void;
};

export const useStory = create<StoryState>()(
  subscribeWithSelector((set) => ({
    progress: 0,
    velocity: 0,
    sceneIndex: 0,
    loaded: false,
    compiled: false,
    booted: false,
    canvasActive: true,
    sound: false,
    isMobile: false,
    reducedMotion: false,
    set: (partial) => set(partial),
  })),
);
