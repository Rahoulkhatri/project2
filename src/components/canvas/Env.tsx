"use client";

import { Environment, Lightformer, MeshReflectorMaterial } from "@react-three/drei";
import { RANGE_BY_ID, toLocal } from "@/lib/story";
import { useStory } from "@/lib/store";
import { SceneGroup } from "./SceneGroup";

/**
 * Studio reflections from strip lights only: a long softbox overhead, a cool
 * key strip front-right and a brand-sky rim strip behind-left. Baked once.
 */
export function Env() {
  return (
    <Environment resolution={256} frames={1} environmentIntensity={0.8}>
      <color attach="background" args={["#020306"]} />
      <Lightformer form="rect" intensity={0.9} color="#dfe8f5" position={[0, 6, 2]} rotation-x={Math.PI / 2} scale={[14, 1.6, 1]} />
      <Lightformer form="rect" intensity={1.3} color="#e8f1ff" position={[7, 2.5, 5]} rotation-y={-Math.PI / 3} scale={[8, 0.6, 1]} />
      <Lightformer form="rect" intensity={1.8} color="#38BDF8" position={[-7, 2, -5]} rotation-y={Math.PI / 3} scale={[12, 0.5, 1]} />
      <Lightformer form="ring" intensity={0.4} color="#a8d8ff" position={[0, 3, -8]} scale={4} />
    </Environment>
  );
}

/** The desk: a dark glossy slab that mirrors the laptop. Cheap fallback on mobile. */
export function Desk() {
  const isMobile = useStory((s) => s.isMobile);
  // drei's reflector re-renders the whole scene every frame, even when hidden, so it is mounted only while
  // the desk is near the camera: the hero shots and the arrival. The selector flips rarely, so this is cheap.
  const near = useStory((s) => s.progress < RANGE_BY_ID.request.end || toLocal("response", s.progress) > 0.8);

  return (
    <SceneGroup
      windows={[
        ["origin", "request"],
        ["response", "response"],
      ]}
    >
      {near && (
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.001, 0]}>
        <planeGeometry args={[60, 60]} />
        {isMobile ? (
          <meshStandardMaterial color="#070a10" roughness={0.35} metalness={0.6} />
        ) : (
          <MeshReflectorMaterial
            color="#06090e"
            blur={[420, 120]}
            resolution={256}
            mixBlur={1}
            mixStrength={14}
            mirror={0.5}
            roughness={0.82}
            metalness={0.6}
            depthScale={1.2}
            minDepthThreshold={0.35}
            maxDepthThreshold={1.5}
          />
        )}
      </mesh>
      )}
    </SceneGroup>
  );
}
