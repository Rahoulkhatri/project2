import { gsap } from "gsap";
import { CatmullRomCurve3, Vector3 } from "three";
import { toGlobal, type SceneId } from "./story";

/**
 * Camera rail. Named keyframes pinned to scene-local time; the camera rides
 * two Catmull-Rom curves (position + lookAt target) and interpolates fov and
 * roll. Each segment has its own ease, so the camera settles on the shots
 * that matter and moves continuously through chase sections.
 */
type Keyframe = {
  name: string;
  scene: SceneId;
  /** Scene-local time 0..1. */
  t: number;
  pos: [number, number, number];
  target: [number, number, number];
  fov: number;
  /** Radians around the view axis. */
  roll?: number;
  /** Ease used to arrive at this keyframe from the previous one. */
  ease?: string;
};

const KEYFRAMES: Keyframe[] = [
  { name: "desk-wide", scene: "origin", t: 0, pos: [3.4, 2.3, 8.6], target: [-1.9, 0.85, 0], fov: 32 },
  { name: "desk-push", scene: "request", t: 0.1, pos: [2.2, 1.9, 6.6], target: [-0.9, 0.95, 0], fov: 34 },
  { name: "packet-out", scene: "request", t: 0.38, pos: [0.4, 2.6, 3.4], target: [0, 2.4, 0], fov: 38, ease: "power3.inOut" },
  { name: "chase-lid", scene: "request", t: 0.7, pos: [-0.8, 4.4, 2], target: [2, 4.6, -8], fov: 44, roll: 0.06, ease: "sine.inOut" },
  { name: "chase-cable", scene: "request", t: 1, pos: [4, 7, -12], target: [10, 9, -26], fov: 48, roll: -0.05, ease: "sine.inOut" },
  { name: "globe-rise", scene: "internet", t: 0.25, pos: [28, 24, -6], target: [22, 3, -50], fov: 42, ease: "power2.inOut" },
  { name: "globe-orbit", scene: "internet", t: 0.8, pos: [44, 20, -26], target: [27, 5, -54], fov: 42, ease: "sine.inOut" },
  { name: "tunnel-mouth", scene: "handshake", t: 0.05, pos: [30, 6.4, -56], target: [30, 6, -70], fov: 55, ease: "power3.inOut" },
  { name: "tunnel-exit", scene: "handshake", t: 0.9, pos: [30, 6.2, -90], target: [30, 6, -104], fov: 60, roll: 0.04, ease: "sine.inOut" },
  { name: "cache-wall", scene: "edge", t: 0.2, pos: [20, 7.5, -90], target: [37, 5.8, -112], fov: 45, ease: "power3.out" },
  { name: "cache-split", scene: "edge", t: 0.8, pos: [22, 8.5, -91], target: [39, 5.4, -113], fov: 45, ease: "power2.inOut" },
  { name: "balancer", scene: "balancer", t: 0.2, pos: [42, 10, -108], target: [45, 4.5, -129], fov: 40, ease: "power3.inOut" },
  { name: "balancer-arms", scene: "balancer", t: 0.85, pos: [47, 9, -108], target: [48, 4, -130], fov: 40, ease: "power2.inOut" },
  { name: "aisle", scene: "runtime", t: 0.1, pos: [62, 1.9, -133], target: [64, 1.6, -152], fov: 38, ease: "power3.inOut" },
  { name: "server-pull", scene: "runtime", t: 0.6, pos: [61.6, 1.6, -150], target: [63.4, 1.2, -156], fov: 34, ease: "power2.inOut" },
  { name: "server-lid", scene: "runtime", t: 0.95, pos: [62.2, 2.6, -153.5], target: [63.4, 1, -155.8], fov: 32, ease: "power3.inOut" },
  { name: "db", scene: "database", t: 0.2, pos: [74, 6, -178], target: [80, 2, -188], fov: 40, ease: "power3.inOut" },
  { name: "db-orbit", scene: "database", t: 0.85, pos: [84, 4, -180], target: [80, 1, -188], fov: 40, ease: "sine.inOut" },
  { name: "overview", scene: "response", t: 0.14, pos: [-54, 20, -100], target: [36, 3, -100], fov: 58, ease: "expo.inOut" },
  { name: "pullback", scene: "response", t: 0.5, pos: [-40, 26, -34], target: [22, 4, -60], fov: 68, ease: "sine.inOut" },
  { name: "return", scene: "response", t: 0.76, pos: [10, 14, 16], target: [0, 2, -8], fov: 46, ease: "power2.inOut" },
  { name: "screen", scene: "response", t: 1, pos: [3.4, 2.1, 7.4], target: [-1.7, 1, 0], fov: 33, ease: "power3.out" },
  { name: "grid", scene: "deploy", t: 0.35, pos: [0, 6, 13], target: [0, 0, -3], fov: 38, ease: "power3.inOut" },
  { name: "grid-settle", scene: "deploy", t: 1, pos: [0, 7, 15], target: [0, 0, -3], fov: 38, ease: "sine.inOut" },
];

const keys = KEYFRAMES.map((k) => ({
  ...k,
  at: toGlobal(k.scene, k.t),
  easeFn: gsap.parseEase(k.ease ?? "power2.inOut"),
}));

const posCurve = new CatmullRomCurve3(
  keys.map((k) => new Vector3(...k.pos)),
  false,
  "centripetal",
);
const targetCurve = new CatmullRomCurve3(
  keys.map((k) => new Vector3(...k.target)),
  false,
  "centripetal",
);

const LAST = keys.length - 1;

export type RailSample = { fov: number; roll: number; key: number };

/**
 * Sample the rail at a global progress. Writes into `outPos` / `outTarget`
 * to keep useFrame allocation-free.
 */
export function sampleRail(
  progress: number,
  outPos: Vector3,
  outTarget: Vector3,
  out: RailSample,
): RailSample {
  let i = 0;
  while (i < LAST && progress >= keys[i + 1].at) i++;

  let s = 0;
  if (i < LAST && progress > keys[i].at) {
    const a = keys[i];
    const b = keys[i + 1];
    s = b.easeFn((progress - a.at) / (b.at - a.at));
  }

  // Index-parameterised getPoint: keyframe k lives exactly at u = k / LAST.
  const u = Math.min(1, (i + s) / LAST);
  posCurve.getPoint(u, outPos);
  targetCurve.getPoint(u, outTarget);

  const a = keys[i];
  const b = keys[Math.min(i + 1, LAST)];
  out.fov = a.fov + (b.fov - a.fov) * s;
  out.roll = (a.roll ?? 0) + ((b.roll ?? 0) - (a.roll ?? 0)) * s;
  out.key = i;
  return out;
}

/** Keyframe nearest each scene's middle — used for reduced-motion cuts. */
export function posterProgress(progress: number, ranges: { start: number; end: number }[]) {
  const r = ranges.find((x) => progress >= x.start && progress <= x.end) ?? ranges[0];
  return (r.start + r.end) / 2;
}
