"use client";

import { Suspense, useEffect, useRef, useState, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { Canvas, useThree } from "@react-three/fiber";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { bindPointer } from "@/lib/pointer";

// Each model is its own chunk and only loads on the page that uses it.
const models = {
  stack: dynamic(() => import("./models/StackModel"), { ssr: false }),
  towers: dynamic(() => import("./models/TowersModel"), { ssr: false }),
  globe: dynamic(() => import("./models/GlobeModel"), { ssr: false }),
  fanout: dynamic(() => import("./models/FanoutModel"), { ssr: false }),
  facet: dynamic(() => import("./models/FacetModel"), { ssr: false }),
  radar: dynamic(() => import("./models/RadarModel"), { ssr: false }),
};

export type ModelName = keyof typeof models;

const CAMERA: Record<ModelName, { position: [number, number, number]; fov: number }> = {
  stack: { position: [0, 1.2, 9.5], fov: 32 },
  towers: { position: [0, 3.2, 14], fov: 32 },
  globe: { position: [0, 0, 11.8], fov: 32 },
  fanout: { position: [0, 0, 9.5], fov: 34 },
  facet: { position: [0, 0, 11.5], fov: 32 },
  radar: { position: [0, 5.2, 11.5], fov: 32 },
};

const subscribeMobile = (cb: () => void) => {
  const mq = window.matchMedia("(max-width: 767px)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
const useIsMobile = () =>
  useSyncExternalStore(
    subscribeMobile,
    () => window.matchMedia("(max-width: 767px)").matches,
    () => false,
  );

/** On wide screens the copy sits left, so the frame is shifted to put the model in the right half. */
function Rig() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    const cam = camera as import("three").PerspectiveCamera;
    if (size.width >= 768) cam.setViewOffset(size.width, size.height, -size.width * 0.2, 0, size.width, size.height);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

/**
 * A small, self-contained canvas for an inner page's hero. Cheap by design: no post-processing,
 * pixel ratio capped, and it only renders while it is actually on screen.
 */
export function HeroStage({ model, cursor }: { model: ModelName; cursor?: string }) {
  const Model = models[model];
  const wrap = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const mobile = useIsMobile();
  const reduced = useReducedMotion();

  useEffect(() => {
    bindPointer();
    const el = wrap.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin: "80px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const cam = CAMERA[model];

  return (
    <div
      ref={wrap}
      aria-hidden
      data-cursor={cursor}
      className="absolute inset-x-0 top-0 h-[58%] md:inset-0 md:h-full"
      style={{ touchAction: "pan-y" }}
    >
      <Canvas
        dpr={[1, mobile ? 1 : 1.25]}
        frameloop={inView && !reduced ? "always" : "demand"}
        gl={{ antialias: !mobile, powerPreference: "high-performance", stencil: false }}
        camera={{ position: cam.position, fov: cam.fov, near: 0.1, far: 100 }}
      >
        <color attach="background" args={["#04060A"]} />
        <fog attach="fog" args={["#04060A", 14, 34]} />
        <ambientLight intensity={0.55} />
        <directionalLight position={[4, 6, 5]} intensity={2.2} color="#dfe8f5" />
        <directionalLight position={[-6, 2, -4]} intensity={3} color="#38BDF8" />
        <Rig />
        <Suspense fallback={null}>
          <Model mobile={mobile} />
        </Suspense>
      </Canvas>
    </div>
  );
}
