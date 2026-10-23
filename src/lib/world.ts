import { Curve, CatmullRomCurve3, Vector3 } from "three";
import { gsap } from "gsap";
import { toGlobal, toLocal } from "./story";

const v = (x: number, y: number, z: number) => new Vector3(x, y, z);

/**
 * World layout. The journey winds away from the laptop (origin) toward -Z,
 * drifting +X so the camera always has something new entering frame-right.
 * Units are loosely "decimetres": the laptop is ~3.2 wide.
 */
const GLOBE_C = v(14, 4, -50);
const GLOBE_R = 10;

/** Karachi faces the laptop; the edge node sits further round, toward the tunnel. */
export const KARACHI_DIR = v(-0.3, -0.02, 0.95).normalize();
export const EDGE_DIR = KARACHI_DIR.clone().applyAxisAngle(v(0, 1, 0), 1.0).normalize();

export const WORLD = {
  laptop: v(0, 0, 0),
  globe: { center: GLOBE_C, radius: GLOBE_R },
  tunnel: { start: v(30, 6, -64), end: v(30, 6, -94), rings: 10 },
  edge: v(30, 6, -106),
  balancer: v(46, 5, -126),
  aisle: { start: v(62, 0, -138), end: v(62, 0, -172), server: v(63.4, 1.2, -156) },
  database: v(80, 2, -188),
  edgeWall: v(30, 6, -110),
} as const;

/** Point on / above the globe along a unit direction. */
export const onGlobe = (dir: Vector3, lift = 0, out = new Vector3()) =>
  out.copy(dir).multiplyScalar(GLOBE_R * (1 + lift)).add(GLOBE_C);

/** Great-circle arc between two globe directions, lifted by sin(pi t) * lift. */
export function arcPoint(a: Vector3, b: Vector3, t: number, lift: number, out = new Vector3()) {
  const omega = Math.acos(Math.min(1, Math.max(-1, a.dot(b))));
  const s = Math.sin(omega) || 1e-6;
  out
    .copy(a)
    .multiplyScalar(Math.sin((1 - t) * omega) / s)
    .addScaledVector(b, Math.sin(t * omega) / s);
  return out.multiplyScalar(GLOBE_R * (1 + lift * Math.sin(Math.PI * t))).add(GLOBE_C);
}

const KARACHI = onGlobe(KARACHI_DIR);
const EDGE = onGlobe(EDGE_DIR);
const TUNNEL_MOUTH = WORLD.tunnel.start;

const ROUTE_POINTS = [
  v(0, 1.15, 0.2), // 0 screen
  v(0, 2.2, 1.6), // 1 out toward the viewer
  v(0, 3.6, -1.2), // 2 over the lid
  v(2.5, 5.8, -10), // 3
  v(6.5, 7.4, -22), // 4 the cable climbs
  onGlobe(KARACHI_DIR, 0.32), // 5 approach
  KARACHI, // 6 Karachi
  arcPoint(KARACHI_DIR, EDGE_DIR, 0.25, 0.3),
  arcPoint(KARACHI_DIR, EDGE_DIR, 0.5, 0.3), // 8
  arcPoint(KARACHI_DIR, EDGE_DIR, 0.75, 0.3),
  EDGE, // 10 edge node
  EDGE.clone().lerp(TUNNEL_MOUTH, 0.5).add(v(0, 3, 0)), // 11
  TUNNEL_MOUTH, // 12 tunnel mouth
  WORLD.tunnel.end, // 13 tunnel exit
  v(30, 6, -104), // 14 edge room
  v(30, 6, -109.3), // 15 cache wall
  WORLD.balancer, // 16
  v(62, 1.2, -140), // 17 aisle entry
  WORLD.aisle.server, // 18 target server
  WORLD.database, // 19
];

/** Named milestones on the route (index into ROUTE_POINTS). */
export const M = {
  screen: 0,
  karachi: 6,
  edgeNode: 10,
  tunnelMouth: 12,
  tunnelExit: 13,
  cache: 15,
  balancer: 16,
  server: 18,
  database: 19,
} as const;

/**
 * The packet route, laptop screen → database. Catmull-Rom's getPoint(t) is
 * index-parameterised: milestone k sits exactly at u = k / LAST.
 */
export const ROUTE = new CatmullRomCurve3(ROUTE_POINTS, false, "centripetal");
const ROUTE_LAST = ROUTE.points.length - 1;
export const milestoneU = (k: number) => k / ROUTE_LAST;

/** Same curve, but arc-length-free so TubeGeometry's uv.x equals the route u. */
export class IndexedRoute extends Curve<Vector3> {
  constructor() {
    super();
  }
  getPoint(t: number, target = new Vector3()) {
    return ROUTE.getPoint(t, target);
  }
  getPointAt(u: number, target = new Vector3()) {
    return this.getPoint(u, target);
  }
}

/** [global progress, route milestone] pairs; the packet lerps between them. */
export const PACKET_START = toGlobal("request", 0.3);

const PACKET_KEYS: [number, number][] = [
  [PACKET_START, M.screen],
  [toGlobal("request", 1), 4],
  [toGlobal("internet", 0.18), M.karachi],
  [toGlobal("internet", 0.78), M.edgeNode],
  [toGlobal("internet", 0.98), M.tunnelMouth],
  [toGlobal("handshake", 0.95), M.tunnelExit],
  [toGlobal("edge", 0.7), M.cache],
  [toGlobal("balancer", 0.8), M.balancer],
  [toGlobal("runtime", 0.55), M.server],
  [toGlobal("runtime", 0.9), M.server],
  [toGlobal("database", 0.6), M.database],
];

/** Global progress → route parameter u (0..1) for the outbound request. */
export function requestRouteU(progress: number): number {
  if (progress <= PACKET_KEYS[0][0]) return 0;
  for (let i = 0; i < PACKET_KEYS.length - 1; i++) {
    const [a, ka] = PACKET_KEYS[i];
    const [b, kb] = PACKET_KEYS[i + 1];
    if (progress < b) {
      const t = (progress - a) / (b - a);
      return (ka + (kb - ka) * t) / ROUTE_LAST;
    }
  }
  return 1;
}

const expoInOut = gsap.parseEase("expo.inOut");

/** Fraction of the response scene spent racing home; the rest is the arrival. */
export const RESPONSE_RUN = 0.78;

/** Response packet: global progress → route u (1 → 0 along the same route), or null when not running. */
export function responseRouteU(progress: number): number | null {
  const q = toLocal("response", progress) / RESPONSE_RUN;
  if (progress < toGlobal("response", 0) || q >= 1) return null;
  return 1 - expoInOut(Math.min(1, q));
}
