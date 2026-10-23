/**
 * Story timeline — the single source of truth shared by the HTML overlay,
 * the HUD and the 3D world. Lengths are in viewport heights; ranges are
 * derived so the DOM spacers and the scene progress can never drift apart.
 */

export type SceneId =
  | "origin"
  | "request"
  | "internet"
  | "handshake"
  | "edge"
  | "balancer"
  | "runtime"
  | "database"
  | "response"
  | "deploy";

export type SceneDef = {
  id: SceneId;
  /** Two-digit code shown in labels and the HUD counter. */
  code: string;
  /** Short mono label, e.g. "DNS + TLS". */
  label: string;
  /** Scroll length in vh. Includes the time the step stays pinned. */
  length: number;
};

export const SCENES: SceneDef[] = [
  { id: "origin", code: "00", label: "ORIGIN", length: 130 },
  { id: "request", code: "01", label: "HTTP REQUEST", length: 150 },
  { id: "internet", code: "02", label: "THE INTERNET", length: 170 },
  { id: "handshake", code: "03", label: "DNS + TLS", length: 150 },
  { id: "edge", code: "04", label: "EDGE CACHE", length: 180 },
  { id: "balancer", code: "05", label: "LOAD BALANCER", length: 140 },
  { id: "runtime", code: "06", label: "RUNTIME", length: 200 },
  { id: "database", code: "07", label: "DATABASE", length: 150 },
  { id: "response", code: "08", label: "RESPONSE", length: 170 },
  // The last scene loses 100vh to the viewport, so it's padded accordingly.
  { id: "deploy", code: "09", label: "DEPLOY", length: 240 },
];

export const LAST_SCENE_CODE = SCENES[SCENES.length - 1].code;

/** Total height of the story track in vh. */
export const STORY_LENGTH = SCENES.reduce((sum, s) => sum + s.length, 0);

/**
 * Scrollable distance is the track minus one viewport, because the master
 * ScrollTrigger runs "top top" → "bottom bottom".
 */
const SCROLLABLE = STORY_LENGTH - 100;

export type SceneRange = SceneDef & {
  index: number;
  start: number;
  end: number;
  /** Offset of the spacer from the top of the track, in vh. */
  offset: number;
};

export const RANGES: SceneRange[] = (() => {
  let cursor = 0;
  return SCENES.map((scene, index) => {
    const start = cursor / SCROLLABLE;
    const end = Math.min(1, (cursor + scene.length) / SCROLLABLE);
    const range = { ...scene, index, start, end, offset: cursor };
    cursor += scene.length;
    return range;
  });
})();

export const RANGE_BY_ID = Object.fromEntries(
  RANGES.map((r) => [r.id, r]),
) as Record<SceneId, SceneRange>;

/** Global progress → index of the scene that owns it. */
export function sceneIndexAt(progress: number): number {
  for (let i = RANGES.length - 1; i >= 0; i--) {
    if (progress >= RANGES[i].start) return i;
  }
  return 0;
}

/** Scene-local time (0..1) → global progress. */
export function toGlobal(id: SceneId, local: number): number {
  const r = RANGE_BY_ID[id];
  return r.start + (r.end - r.start) * local;
}

/** Global progress → scene-local 0..1, clamped. */
export function toLocal(id: SceneId, progress: number): number {
  const r = RANGE_BY_ID[id];
  const t = (progress - r.start) / (r.end - r.start);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * The request trace. Sums to exactly 87 ms; the HUD "elapsed" readout
 * accumulates these as the matching scene plays.
 */
export const TRACE: { id: SceneId; label: string; ms: number }[] = [
  { id: "internet", label: "transit KHI-1", ms: 9 },
  { id: "handshake", label: "dns", ms: 4 },
  { id: "handshake", label: "tls 1.3", ms: 11 },
  { id: "edge", label: "cache lookup", ms: 2 },
  { id: "balancer", label: "route", ms: 1 },
  { id: "runtime", label: "cold start", ms: 38 },
  { id: "database", label: "query", ms: 6 },
  { id: "response", label: "transfer", ms: 16 },
];

export const TRACE_TOTAL = TRACE.reduce((sum, t) => sum + t.ms, 0);

/** Elapsed request time (ms) at a given global progress. */
export function elapsedAt(progress: number): number {
  let ms = 0;
  const perScene = new Map<SceneId, number>();
  for (const seg of TRACE) perScene.set(seg.id, (perScene.get(seg.id) ?? 0) + seg.ms);
  for (const [id, total] of perScene) ms += total * toLocal(id, progress);
  return ms;
}

/** True once the response run has begun; 3D annotations retire so the time-lapse stays clean. */
export const inResponse = (p: number) => p >= RANGE_BY_ID.response.start;

/** One composed moment per scene for prefers-reduced-motion (scene-local time). */
const POSTER_LOCAL: Record<SceneId, number> = {
  origin: 0.3,
  request: 0.6,
  internet: 0.5,
  handshake: 0.62,
  edge: 0.66,
  balancer: 0.55,
  runtime: 0.88,
  database: 0.72,
  response: 0.985,
  deploy: 0.3,
};

/** Snap any progress to its scene's poster frame. The deploy scene has two: the CTA, then pricing. */
export function posterAt(progress: number): number {
  const r = RANGES[sceneIndexAt(progress)];
  if (r.id === "deploy") return toGlobal("deploy", toLocal("deploy", progress) < 0.54 ? 0.3 : 0.8);
  return toGlobal(r.id, POSTER_LOCAL[r.id]);
}
