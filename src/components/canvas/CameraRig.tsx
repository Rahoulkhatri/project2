"use client";

import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MathUtils, PerspectiveCamera, Vector3 } from "three";
import { useStory } from "@/lib/store";
import { sampleRail, type RailSample } from "@/lib/rail";
import { hasFlag } from "@/lib/debug";
import { toGlobal } from "@/lib/story";
import { ROUTE, requestRouteU } from "@/lib/world";
import { bindPointer, pointer } from "@/lib/pointer";

const { damp, smoothstep } = MathUtils;

const UP = new Vector3(0, 1, 0);
const P = new Vector3();
const T = new Vector3();
const SIDE = new Vector3();
const CP = new Vector3();
const CT = new Vector3();

const CHASE_IN: [number, number] = [toGlobal("request", 0.3), toGlobal("request", 0.46)];
const CHASE_OUT: [number, number] = [toGlobal("internet", 0.02), toGlobal("internet", 0.14)];

/**
 * The subject of each scene, in world space. On portrait screens the copy sits in
 * the lower half, so the frame is shifted to put this point centred in the upper half.
 */
const ANCHORS: (Vector3 | null)[] = [
  new Vector3(0, 1, 0), // origin: the laptop
  null, // request: the chase cam already frames the packet
  new Vector3(14, 4, -50), // internet: the globe
  new Vector3(30, 6, -80), // handshake: the tunnel
  new Vector3(30, 6, -110), // edge: the cache wall
  new Vector3(46, 5, -126), // balancer: the hub
  new Vector3(63, 1.3, -152), // runtime: the hero server
  new Vector3(80, 2, -188), // database
  null, // response: a moving overview
  new Vector3(0, 1, 0), // deploy: the laptop on its grid
];
const NDC = new Vector3();

/** Designed for ~16:10; narrower screens widen the vertical fov (capped). */
const DESIGN_ASPECT = 1.6;

/**
 * Rides the camera rail. The rail gives the "ideal" shot for the current
 * progress; the camera chases it with exponential damping so moves feel
 * heavy, then idle sway, pointer parallax and velocity roll are layered on.
 */
export function CameraRig() {
  const goalPos = useRef(new Vector3()).current;
  const goalTarget = useRef(new Vector3()).current;
  const look = useRef(new Vector3()).current;
  const sample = useRef<RailSample>({ fov: 32, roll: 0, key: 0 }).current;
  const roll = useRef(0);
  const ready = useRef(false);
  const viewShift = useRef({ x: 0, y: 0 }).current;
  // `?snap` skips damping: lets a slow software renderer (CI, screenshots) land exactly on the rail.
  const snap = useRef(hasFlag("snap")).current;

  useEffect(bindPointer, []);

  useFrame((state, delta) => {
    const cam = state.camera as PerspectiveCamera;
    const { progress, velocity, reducedMotion, isMobile } = useStory.getState();
    const dt = Math.min(delta, 1 / 20);

    // Under reduced motion the store already holds a poster frame per scene; the camera cuts to it.
    sampleRail(progress, goalPos, goalTarget, sample);

    // Chase cam: behind and above the packet while it follows the cable.
    const chase = reducedMotion ? 0 : smoothstep(progress, CHASE_IN[0], CHASE_IN[1]) * (1 - smoothstep(progress, CHASE_OUT[0], CHASE_OUT[1]));
    if (chase > 0.001) {
      const u = requestRouteU(progress);
      ROUTE.getPoint(u, P);
      ROUTE.getTangent(u, T);
      SIDE.crossVectors(T, UP).normalize();
      goalPos.lerp(CP.copy(P).addScaledVector(T, -4.2).addScaledVector(UP, 1.3).addScaledVector(SIDE, 0.9), chase);
      goalTarget.lerp(CT.copy(P).addScaledVector(T, 5), chase);
      sample.roll += chase * 0.07;
    }

    if (!reducedMotion) {
      const t = state.clock.elapsedTime;
      const parallax = isMobile ? 0 : 1;
      goalPos.x += Math.sin(t * 0.31) * 0.05 + pointer.nx * 0.14 * parallax;
      goalPos.y += Math.sin(t * 0.47 + 1.3) * 0.035 + pointer.ny * 0.08 * parallax;
      goalTarget.x += Math.sin(t * 0.23 + 0.6) * 0.03;
    }

    if (!ready.current || reducedMotion || snap) {
      cam.position.copy(goalPos);
      look.copy(goalTarget);
      ready.current = true;
    } else {
      const k = 3.1;
      cam.position.set(
        damp(cam.position.x, goalPos.x, k, dt),
        damp(cam.position.y, goalPos.y, k, dt),
        damp(cam.position.z, goalPos.z, k, dt),
      );
      look.set(
        damp(look.x, goalTarget.x, k * 1.2, dt),
        damp(look.y, goalTarget.y, k * 1.2, dt),
        damp(look.z, goalTarget.z, k * 1.2, dt),
      );
    }

    cam.lookAt(look);
    // Fast scrolling banks the camera slightly, like a chase cam.
    const bank = MathUtils.clamp(velocity * 1.6, -0.06, 0.06);
    roll.current = damp(roll.current, sample.roll + bank, 2.4, dt);
    cam.rotateZ(roll.current);

    // Portrait: recentre the subject above the copy with a view offset (no change to the rail itself).
    const { width: vw, height: vh } = state.size;
    if (vw / vh < 0.95) {
      const anchor = ANCHORS[useStory.getState().sceneIndex];
      cam.clearViewOffset();
      cam.updateProjectionMatrix();
      cam.updateMatrixWorld();
      let tx = 0;
      let ty = 0;
      if (anchor) {
        NDC.copy(anchor).project(cam);
        if (NDC.z < 1) {
          tx = NDC.x * (vw / 2);
          ty = (0.28 - NDC.y) * (vh / 2);
        }
      }
      viewShift.x = reducedMotion || snap ? tx : damp(viewShift.x, tx, 3, dt);
      viewShift.y = reducedMotion || snap ? ty : damp(viewShift.y, ty, 3, dt);
      cam.setViewOffset(vw, vh, viewShift.x, viewShift.y, vw, vh);
    } else if (cam.view?.enabled) {
      cam.clearViewOffset();
    }

    const aspectBoost = MathUtils.clamp(Math.sqrt(DESIGN_ASPECT / (state.size.width / state.size.height)), 1, 1.75);
    const fov = damp(cam.fov, sample.fov * aspectBoost, 3, dt);
    if (Math.abs(fov - cam.fov) > 1e-3) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
