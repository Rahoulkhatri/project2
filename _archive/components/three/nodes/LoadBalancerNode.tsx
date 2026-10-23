"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface LoadBalancerNodeProps {
  intensity: number;
}

/**
 * LoadBalancerNode — Node B
 * ─────────────────────────
 * Abstract network switch / load balancer geometry.
 *
 * Design: An octahedral core surrounded by orbiting ring segments
 * and radiating connection lines — represents traffic distribution.
 *
 * When intensity > 0.5, secondary "split packets" appear,
 * visualizing the load balancing in action.
 *
 * REPLACEMENT GUIDE:
 * Same as LaptopNode — wrap a .glb with useGLTF,
 * keep the <group> and animation logic.
 */
export function LoadBalancerNode({ intensity }: LoadBalancerNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Group>(null);

  // Connection line endpoints (radiating outward)
  const connectionPoints = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      pts.push(
        new THREE.Vector3(
          Math.cos(angle) * 1.2,
          (Math.random() - 0.5) * 0.3,
          Math.sin(angle) * 1.2
        )
      );
    }
    return pts;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // Slow rotation
    groupRef.current.rotation.y = clock.elapsedTime * 0.3;

    // Core pulsing
    if (coreRef.current) {
      const scale =
        1 + Math.sin(clock.elapsedTime * 2) * 0.05 * intensity;
      coreRef.current.scale.setScalar(scale);

      const mat = coreRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity =
        intensity * (0.4 + Math.sin(clock.elapsedTime * 3) * 0.2);
    }

    // Ring rotation
    if (ringsRef.current) {
      ringsRef.current.children.forEach((ring, i) => {
        ring.rotation.x =
          clock.elapsedTime * (0.4 + i * 0.2);
        ring.rotation.z =
          clock.elapsedTime * (0.3 + i * 0.15);
      });
    }
  });

  const accentColor = new THREE.Color("#66fcf1");

  return (
    <group ref={groupRef}>
      {/* ─── Core: Octahedron ─── */}
      <mesh ref={coreRef}>
        <octahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color="#1a2a3a"
          metalness={0.9}
          roughness={0.1}
          emissive={accentColor}
          emissiveIntensity={intensity * 0.4}
          wireframe={false}
        />
      </mesh>

      {/* ─── Core wireframe overlay ─── */}
      <mesh>
        <octahedronGeometry args={[0.42, 0]} />
        <meshBasicMaterial
          color="#66fcf1"
          wireframe
          transparent
          opacity={intensity * 0.3}
          depthWrite={false}
        />
      </mesh>

      {/* ─── Orbiting Rings ─── */}
      <group ref={ringsRef}>
        {[0.6, 0.8, 1.0].map((radius, i) => (
          <mesh key={i} rotation={[i * 0.5, i * 0.3, 0]}>
            <torusGeometry args={[radius, 0.006, 6, 64]} />
            <meshBasicMaterial
              color="#66fcf1"
              transparent
              opacity={intensity * 0.25}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* ─── Radiating Connection Lines ─── */}
      {connectionPoints.map((pt, i) => {
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          pt,
        ]);
        return (
          <line key={i} geometry={lineGeo}>
            <lineBasicMaterial
              color="#66fcf1"
              transparent
              opacity={intensity * 0.2}
              depthWrite={false}
            />
          </line>
        );
      })}

      {/* ─── Connection endpoint dots ─── */}
      {connectionPoints.map((pt, i) => (
        <mesh key={`dot-${i}`} position={pt.toArray()}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial
            color="#66fcf1"
            transparent
            opacity={intensity * 0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ─── Ground glow ─── */}
      <mesh
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[1.2, 32]} />
        <meshBasicMaterial
          color="#66fcf1"
          transparent
          opacity={intensity * 0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

