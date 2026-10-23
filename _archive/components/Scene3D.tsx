"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { DataJourneyScene } from "./three/DataJourneyScene";

interface Scene3DProps {
  scrollProgress: number;
}

/**
 * Scene3D
 * ───────
 * The React Three Fiber Canvas wrapper.
 *
 * Key decisions:
 * - `flat` mode: We manage our own tone mapping in shaders
 * - `dpr: [1, 2]`: Adaptive DPR for performance
 * - `gl.antialias: true`: Smooth edges on the pipeline tube
 * - `pointer-events: none` on the container so scroll events
 *   pass through to GSAP (critical for pinning to work)
 * - Camera setup is handled inside DataJourneyScene via useFrame
 */
export default function Scene3D({ scrollProgress }: Scene3DProps) {
  return (
    <div
      className="absolute inset-0"
      style={{ pointerEvents: "none" }}
    >
      <Canvas
        flat
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        camera={{
          fov: 50,
          near: 0.1,
          far: 200,
          position: [0, 6, 12],
        }}
        style={{ pointerEvents: "none" }}
      >
        {/* Ambient base light — very dim, scene is mostly emissive */}
        <ambientLight intensity={0.08} color="#8892b0" />

        {/* Key light from above-right with cyan tint */}
        <directionalLight
          position={[5, 10, 5]}
          intensity={0.4}
          color="#66fcf1"
        />

        {/* Fill light from below-left — subtle purple */}
        <pointLight
          position={[-5, -5, 3]}
          intensity={0.2}
          color="#7b61ff"
          decay={2}
          distance={30}
        />

        <Suspense fallback={null}>
          <DataJourneyScene scrollProgress={scrollProgress} />
        </Suspense>
      </Canvas>
    </div>
  );
}

