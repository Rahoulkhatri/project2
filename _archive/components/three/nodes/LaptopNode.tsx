"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LaptopNodeProps {
  intensity: number; // 0 → 1, drives glow brightness
}

/**
 * LaptopNode — Node A
 * ────────────────────
 * Futuristic user terminal / laptop placeholder.
 *
 * Geometry:
 * - Base: Flat rounded box (laptop body)
 * - Screen: Angled thin box (laptop lid)
 * - Screen glow: Emissive plane on the screen face
 * - Accent rings: Thin torus geometry for holographic accents
 *
 * REPLACEMENT GUIDE:
 * To swap with a .glb model:
 * 1. Import useGLTF from '@react-three/drei'
 * 2. Replace the geometry JSX with: <primitive object={scene} />
 * 3. Keep the <group> wrapper and its animations
 * 4. Adjust scale to match current bounding box (~2 units wide)
 */
export function LaptopNode({ intensity }: LaptopNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const screenGlowRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // Subtle hover animation
    groupRef.current.position.y =
      Math.sin(clock.elapsedTime * 1.5) * 0.05;
    groupRef.current.rotation.y =
      Math.sin(clock.elapsedTime * 0.5) * 0.05;

    // Screen glow pulses with intensity
    if (screenGlowRef.current) {
      const mat = screenGlowRef.current
        .material as THREE.MeshBasicMaterial;
      mat.opacity =
        intensity * (0.6 + Math.sin(clock.elapsedTime * 3) * 0.2);
    }

    // Holographic ring rotation
    if (ringRef.current) {
      ringRef.current.rotation.z = clock.elapsedTime * 0.8;
      ringRef.current.rotation.x = clock.elapsedTime * 0.3;
    }
  });

  const accentColor = new THREE.Color("#66fcf1");

  return (
    <group ref={groupRef}>
      {/* ─── Laptop Base ─── */}
      <mesh position={[0, -0.1, 0]} rotation={[-0.05, 0, 0]}>
        <boxGeometry args={[1.6, 0.08, 1.0]} />
        <meshStandardMaterial
          color="#1a1e2e"
          metalness={0.7}
          roughness={0.3}
          emissive={accentColor}
          emissiveIntensity={intensity * 0.1}
        />
      </mesh>

      {/* ─── Keyboard surface detail ─── */}
      <mesh position={[0, -0.05, 0.05]} rotation={[-0.05, 0, 0]}>
        <boxGeometry args={[1.2, 0.01, 0.6]} />
        <meshStandardMaterial
          color="#0f1123"
          metalness={0.5}
          roughness={0.6}
        />
      </mesh>

      {/* ─── Screen (Lid) ─── */}
      <group
        position={[0, 0.45, -0.45]}
        rotation={[-0.3, 0, 0]}
      >
        <mesh>
          <boxGeometry args={[1.5, 0.9, 0.04]} />
          <meshStandardMaterial
            color="#1a1e2e"
            metalness={0.8}
            roughness={0.2}
            emissive={accentColor}
            emissiveIntensity={intensity * 0.05}
          />
        </mesh>

        {/* Screen glow face */}
        <mesh ref={screenGlowRef} position={[0, 0, 0.025]}>
          <planeGeometry args={[1.3, 0.75]} />
          <meshBasicMaterial
            color="#66fcf1"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* ─── Holographic Accent Ring ─── */}
      <mesh ref={ringRef} position={[0, 0.3, 0]}>
        <torusGeometry args={[0.9, 0.008, 8, 64]} />
        <meshBasicMaterial
          color="#66fcf1"
          transparent
          opacity={intensity * 0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* ─── Base glow (spotlight effect on ground) ─── */}
      <mesh
        position={[0, -0.15, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[1.0, 32]} />
        <meshBasicMaterial
          color="#66fcf1"
          transparent
          opacity={intensity * 0.08}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

