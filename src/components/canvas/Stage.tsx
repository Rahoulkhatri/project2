"use client";

import { Suspense, lazy, useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Color, FogExp2, MathUtils, Object3D, type PointLight, type SpotLight } from "three";
import { fx } from "@/lib/fx";
import { WORLD } from "@/lib/world";
import { PerformanceMonitor, useProgress } from "@react-three/drei";
import { RANGE_BY_ID } from "@/lib/story";
import { useStory } from "@/lib/store";
import { ROUTE, responseRouteU } from "@/lib/world";
import { hasFlag } from "@/lib/debug";
import { detectLowPowerGpu } from "@/lib/gpu";
import { CameraRig } from "./CameraRig";
import { CurvePacket } from "./CurvePacket";
import { DeployFloor } from "./DeployFloor";
import { RoutePacket } from "./RoutePacket";
import { Laptop, LaptopTag } from "./Laptop";
import { Desk, Env } from "./Env";
import { Dust } from "./Dust";
import { LightPath } from "./LightPath";
import { Effects } from "./Effects";

/* Heavy scenes are separate chunks, mounted only near the reader's position. */
const loaders = {
  globe: () => import("./Globe").then((m) => ({ default: m.Globe })),
  tunnel: () => import("./Tunnel").then((m) => ({ default: m.Tunnel })),
  edge: () => import("./EdgeWall").then((m) => ({ default: m.EdgeWall })),
  balancer: () => import("./Balancer").then((m) => ({ default: m.Balancer })),
  aisle: () => import("./Aisle").then((m) => ({ default: m.Aisle })),
  database: () => import("./Database").then((m) => ({ default: m.Database })),
};
const Globe = lazy(loaders.globe);
const Tunnel = lazy(loaders.tunnel);
const EdgeWall = lazy(loaders.edge);
const Balancer = lazy(loaders.balancer);
const Aisle = lazy(loaders.aisle);
const Database = lazy(loaders.database);

/**
 * Mounts a scene while the reader is within one scene of it, and for the whole
 * response run (which revisits the entire route). Unmounting disposes its GPU
 * resources; each scene has its own Suspense so a loading chunk never hides the rest.
 */
function Scene({ index, children }: { index: number; children: ReactNode }) {
  const current = useStory((s) => s.sceneIndex);
  const on = current <= 8 && (current === 8 || Math.abs(current - index) <= 1);
  return on ? <Suspense fallback={null}>{children}</Suspense> : null;
}

/** Warm the network cache for far scenes once the first screen is live. */
function PrefetchScenes() {
  const loaded = useStory((s) => s.loaded);
  useEffect(() => {
    if (!loaded) return;
    const id = window.setTimeout(() => Object.values(loaders).forEach((l) => void l()), 1200);
    return () => window.clearTimeout(id);
  }, [loaded]);
  return null;
}

/**
 * Compiles the first screen's shaders with KHR_parallel_shader_compile, so the
 * main thread (and the boot log) keeps running instead of freezing on a sync compile.
 */
function AsyncCompile() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let alive = true;
    const done = () => {
      if (!alive) return;
      performance.mark("kestrel:compiled");
      useStory.getState().set({ compiled: true });
    };
    gl.compileAsync(scene, camera).then(done, done);
    const fallback = window.setTimeout(done, 5000); // never block the world on a stuck compile
    return () => {
      alive = false;
      window.clearTimeout(fallback);
    };
  }, [gl, scene, camera]);
  return null;
}

/**
 * Flags the world as loaded once nothing is pending in the loading manager
 * and a few frames have actually been drawn (shaders compiled, first paint).
 */
function ReadySignal() {
  const { active } = useProgress();
  const frames = useRef(0);
  const done = useRef(false);

  useFrame(() => {
    if (done.current) return;
    frames.current++;
    if (frames.current === 1) performance.mark("kestrel:frame-1");
    if (frames.current === 4) performance.mark("kestrel:frame-4");
    if (!active && useStory.getState().compiled && frames.current > 2) {
      done.current = true;
      performance.mark("kestrel:world-loaded");
      useStory.getState().set({ loaded: true });
    }
  });

  return null;
}

const FOG_BASE = new Color("#04060A");
const FOG_AISLE = new Color("#02100f");

/** Exponential fog that thickens to a dark teal-black through the server aisle. */
function FogRig() {
  const scene = useThree((s) => s.scene);
  useFrame(() => {
    const p = useStory.getState().progress;
    const a = RANGE_BY_ID.balancer.end;
    const b = RANGE_BY_ID.runtime.start;
    const c = RANGE_BY_ID.runtime.end;
    const d = RANGE_BY_ID.database.start + (RANGE_BY_ID.database.end - RANGE_BY_ID.database.start) * 0.2;
    const w = MathUtils.smoothstep(p, a - 0.02, b + 0.02) * (1 - MathUtils.smoothstep(p, c - 0.02, d));
    const fog = scene.fog as FogExp2 | null;
    if (!fog) return;
    fog.density = MathUtils.lerp(0.0055, 0.024, w);
    fog.color.copy(FOG_BASE).lerp(FOG_AISLE, w);
    scene.environmentIntensity = MathUtils.lerp(0.8, 0.22, w);
  });
  return null;
}

type Stats = { fps: number; perScene: Record<number, { maxCalls: number; maxTris: number }> };
declare global {
  interface Window {
    __stats?: Stats;
  }
}

/** `?debug=1`: draw calls, triangles and FPS (all render passes included), tracked per scene. */
function DebugStats() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const box = useRef<HTMLPreElement | null>(null);
  const last = useRef({ t: 0, frames: 0, scene: -1, settled: 0 });

  useEffect(() => {
    gl.info.autoReset = false;
    last.current.t = performance.now();
    const el = document.createElement("pre");
    el.style.cssText = "position:fixed;left:8px;top:72px;z-index:200;margin:0;padding:6px 8px;background:#000a;color:#A3E635;font:11px/1.4 monospace;pointer-events:none";
    document.body.appendChild(el);
    box.current = el;
    window.__stats = { fps: 0, perScene: {} };
    const w = window as unknown as { __scene?: unknown; __gl?: unknown; __cam?: unknown };
    w.__scene = scene;
    w.__gl = gl;
    w.__cam = camera;
    return () => {
      gl.info.autoReset = true;
      el.remove();
    };
  }, [gl, scene, camera]);

  // Priority 2 runs after the composer's render (priority 1), so info holds the whole frame.
  useFrame(() => {
    const { calls, triangles } = gl.info.render;
    const s = window.__stats!;
    const idx = useStory.getState().sceneIndex;
    const ps = (s.perScene[idx] ??= { maxCalls: 0, maxTris: 0 });
    const l = last.current;
    // Ignore the frames right after a scene change: mounts and visibility flips are transient.
    if (l.scene !== idx) {
      l.scene = idx;
      l.settled = 0;
    }
    if (++l.settled > 45) {
      ps.maxCalls = Math.max(ps.maxCalls, calls);
      ps.maxTris = Math.max(ps.maxTris, triangles);
    }
    l.frames++;
    const now = performance.now();
    if (now - l.t > 1000) {
      s.fps = Math.round((l.frames * 1000) / (now - l.t));
      l.t = now;
      l.frames = 0;
    }
    if (box.current) box.current.textContent = `S${String(idx).padStart(2, "0")}  ${s.fps} fps\ncalls ${calls} (max ${ps.maxCalls})\ntris  ${(triangles / 1000).toFixed(0)}k\ngeom ${gl.info.memory.geometries} tex ${gl.info.memory.textures}`;
    gl.info.reset();
  }, 2);

  return null;
}

const HERO_TARGET = new Object3D();
HERO_TARGET.position.set(WORLD.aisle.server.x - 0.3, WORLD.aisle.server.y, -155.7);

/**
 * The only lights in the world, all permanent. Their count never changes (so no shader ever
 * recompiles mid-scroll); scenes steer them through intensity, via `fx` and the story progress.
 */
function Lights() {
  const packet = useRef<PointLight>(null);
  const screen = useRef<PointLight>(null);
  const spot = useRef<SpotLight>(null);
  const fillA = useRef<PointLight>(null);
  const fillB = useRef<PointLight>(null);

  useFrame(() => {
    const p = useStory.getState().progress;
    const aisle =
      MathUtils.smoothstep(p, RANGE_BY_ID.runtime.start - 0.02, RANGE_BY_ID.runtime.start + 0.02) *
      (1 - MathUtils.smoothstep(p, RANGE_BY_ID.runtime.end - 0.01, RANGE_BY_ID.database.start + 0.02));
    if (spot.current) spot.current.intensity = 70 * aisle;
    if (fillA.current) fillA.current.intensity = 1.4 * aisle;
    if (fillB.current) fillB.current.intensity = 1.4 * aisle;

    if (screen.current) screen.current.intensity = fx.screen;
    if (packet.current) {
      packet.current.intensity = fx.packet.on ? fx.packet.intensity : 0;
      packet.current.position.copy(fx.packet.position);
      packet.current.color.copy(fx.packet.color);
    }
    fx.packet.on = false; // packets re-assert it next frame while they are visible
  });

  return (
    <>
      <ambientLight intensity={0.05} />
      {/* Key: cool white, high and front-right. */}
      <directionalLight position={[6, 10, 7]} intensity={1.3} color="#dfe8f5" />
      {/* Rim: brand sky from behind-left. */}
      <directionalLight position={[-8, 4, -6]} intensity={2.2} color="#38BDF8" />
      {/* Glow of whichever packet is in flight. */}
      <pointLight ref={packet} intensity={0} distance={14} decay={2} />
      {/* Light thrown by the laptop screen (world position of the lid front). */}
      <pointLight ref={screen} position={[0, 1.42, -0.34]} color="#38BDF8" intensity={0.07} distance={5} decay={2} />
      {/* Aisle: one key on the hero server, two low fills. */}
      <spotLight ref={spot} position={[WORLD.aisle.server.x - 1.4, 3.3, -154.6]} target={HERO_TARGET} color="#d4ebff" intensity={0} angle={0.34} penumbra={0.85} distance={9} decay={2} />
      <primitive object={HERO_TARGET} />
      <pointLight ref={fillA} position={[62, 3.2, -143]} color="#7fb6c9" intensity={0} distance={9} decay={2} />
      <pointLight ref={fillB} position={[62, 3.2, -158]} color="#7fb6c9" intensity={0} distance={9} decay={2} />
    </>
  );
}

/**
 * The one persistent canvas. Fixed, full-screen, behind all HTML (z-0).
 * Rendering stops entirely once the story track has scrolled away.
 */
export default function Stage() {
  const active = useStory((s) => s.canvasActive);
  const isMobile = useStory((s) => s.isMobile);
  const loaded = useStory((s) => s.loaded);
  const compiled = useStory((s) => s.compiled);
  // Adaptive resolution: PerformanceMonitor trims DPR when the frame rate sags and restores it when it recovers.
  const [quality, setQuality] = useState(1);
  // Chosen once: the post graph is fixed for the page's lifetime (see Effects).
  const [lowPower] = useState(() => detectLowPowerGpu());
  const maxDpr = isMobile ? 1 : 1.25;

  return (
    <div aria-hidden className="fixed inset-0 z-0 overflow-hidden transition-opacity duration-[1400ms] ease-out" style={{ opacity: loaded ? 1 : 0 }}>
      <Canvas
        dpr={[1, 1 + (maxDpr - 1) * quality]}
        // Hold rendering until shaders are compiled off-thread, so the boot log never freezes.
        frameloop={active && compiled ? "always" : "never"}
        gl={{ antialias: !isMobile, powerPreference: "high-performance", stencil: false }}
        camera={{ fov: 32, near: 0.05, far: 500, position: [3.4, 2.3, 8.6] }}
        onCreated={({ gl }) => {
          // Skip the per-program error query in production: it forces a synchronous wait on the driver's shader compile.
          gl.debug.checkShaderErrors = process.env.NODE_ENV !== "production";
          performance.mark("kestrel:canvas-created");
        }}
      >
        <color attach="background" args={["#04060A"]} />
        <fogExp2 attach="fog" args={["#04060A", 0.0055]} />
        <FogRig />
        <PerformanceMonitor onDecline={() => setQuality((q) => Math.max(0, q - 0.34))} onIncline={() => setQuality((q) => Math.min(1, q + 0.34))} flipflops={4} />
        <Lights />
        <CameraRig />
        <ReadySignal />
        <PrefetchScenes />
        {hasFlag("debug") && <DebugStats />}
        <Suspense fallback={null}>
          <Env />
          <Desk />
          <Laptop />
          <LaptopTag />
          <DeployFloor />
          <LightPath />
          <LightPath mode="response" />
          <RoutePacket />
          <CurvePacket
            curve={ROUTE}
            progress={() => useStory.getState().progress}
            getU={responseRouteU}
            dir={-1}
            color="#A3E635"
            size={0.3}
            trail={64}
            compensate={0.13}
            intensity={3.6}
          />
          <Dust />
          <Effects lowPower={lowPower} />
          <AsyncCompile />
        </Suspense>
        <Scene index={2}>
          <Globe />
        </Scene>
        <Scene index={3}>
          <Tunnel />
        </Scene>
        <Scene index={4}>
          <EdgeWall />
        </Scene>
        <Scene index={5}>
          <Balancer />
        </Scene>
        <Scene index={6}>
          <Aisle />
        </Scene>
        <Scene index={7}>
          <Database />
        </Scene>
      </Canvas>
    </div>
  );
}
