import { Color, Vector3 } from "three";

/**
 * Per-frame lighting cues written by scene components and consumed by the permanent
 * light rig. Lights must never be added, removed or hidden mid-scroll: three.js keys
 * shader programs on the light count, so a changing count recompiles every lit material.
 * Scenes therefore write their wishes here and the rig drives fixed lights.
 */
export const fx = {
  /** Brightness of the glow cast by the laptop screen. */
  screen: 0.07,
  /** The one glowing packet that currently lights its surroundings. */
  packet: { on: false, intensity: 0, position: new Vector3(), color: new Color("#38BDF8") },
};
