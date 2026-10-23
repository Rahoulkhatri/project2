"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface DataPacketProps {
  curve: THREE.CatmullRomCurve3;
  scrollProgress: number;
}

/**
 * DataPacket
 * ──────────
 * The glowing data pulse that travels along the CatmullRomCurve3.
 *
 * Rendering approach:
 * ───────────────────
 * Rather than a custom ShaderMaterial (reserved for Step 2's
 * advanced version), this uses a layered sphere approach:
 *
 * 1. CORE:  Small bright sphere (the "data")
 * 2. GLOW:  Larger transparent sphere with additive blending
 * 3. HALO:  Even larger soft sphere for the bloom-like effect
 * 4. TRAIL: Multiple smaller spheres trailing behind on the curve
 * 5. LIGHT: A PointLight attached to illuminate nearby geometry
 *
 * Position is computed via `curve.getPointAt(t)` where t = scrollProgress.
 * The trail particles sample the curve at slightly earlier t values.
 */
export function DataPacket({ curve, scrollProgress }: DataPacketProps) {
  const groupRef = useRef<THREE.Group>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const pulseRef = useRef(0);

  // Number of trail particles
  const TRAIL_COUNT = 12;

  // Precompute trail offsets (evenly spaced behind the main packet)
  const trailOffsets = useMemo(
    () =>
      Array.from({ length: TRAIL_COUNT }, (_, i) => (i + 1) * 0.015),
    []
  );

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    const t = THREE.MathUtils.clamp(scrollProgress, 0.001, 0.999);

    // Get position on curve
    const position = curve.getPointAt(t);
    groupRef.current.position.copy(position);

    // Pulsing scale animation
    pulseRef.current = Math.sin(clock.elapsedTime * 4) * 0.15 + 1;
    groupRef.current.scale.setScalar(pulseRef.current);

    // Update point light position
    if (lightRef.current) {
      lightRef.current.position.copy(position);
      // Intensity varies with pulse
      lightRef.current.intensity =
        1.5 + Math.sin(clock.elapsedTime * 4) * 0.5;
    }

    // Update trail particles
    const trailGroup = groupRef.current.children;
    // Trail particles start at index 3 (after core, glow, halo)
    for (let i = 0; i < TRAIL_COUNT; i++) {
      const child = trailGroup[i + 3]; // Skip core, glow, halo meshes
      if (!child) continue;

      const trailT = Math.max(0.001, t - trailOffsets[i]);
      const trailPos = curve.getPointAt(trailT);

      // Position relative to group (which is at main packet position)
      child.position.copy(trailPos).sub(position);

      // Fade and shrink trail particles with distance
      const fade = 1 - (i + 1) / (TRAIL_COUNT + 1);
      child.scale.setScalar(fade * 0.6);
      if ((child as THREE.Mesh).material) {
        ((child as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity =
          fade * 0.4;
      }
    }
  });

  return (
    <>
      {/* Dynamic point light that follows the packet */}
      <pointLight
        ref={lightRef}
        color="#66fcf1"
        intensity={1.5}
        distance={8}
        decay={2}
      />

      <group ref={groupRef}>
        {/* Core sphere — bright solid center */}
        <mesh>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Glow sphere — additive cyan glow */}
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial
            color="#66fcf1"
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Halo sphere — soft outer bloom */}
        <mesh>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshBasicMaterial
            color="#66fcf1"
            transparent
            opacity={0.1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* Trail particles */}
        {trailOffsets.map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshBasicMaterial
              color="#66fcf1"
              transparent
              opacity={0.3}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

