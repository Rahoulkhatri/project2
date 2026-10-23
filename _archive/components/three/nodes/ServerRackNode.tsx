"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface ServerRackNodeProps {
  intensity: number;
}

/**
 * ServerRackNode — Node C
 * ───────────────────────
 * Massive server rack / data center unit.
 *
 * Geometry: Stacked horizontal slabs (rack units) with
 * LED indicator dots and a pulsing cyan glow when active.
 *
 * When intensity approaches 1.0, the entire rack illuminates
 * with the bright cyan (#66FCF1) as specified.
 *
 * REPLACEMENT GUIDE:
 * Same pattern — useGLTF + <primitive object={scene} />
 * inside the <group>.
 */
export function ServerRackNode({ intensity }: ServerRackNodeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ledsRef = useRef<THREE.InstancedMesh>(null);

  // Rack unit count and configuration
  const RACK_UNITS = 6;

  // LED positions within each rack unit
  const ledData = useMemo(() => {
    const data: { position: THREE.Vector3; color: THREE.Color }[] = [];
    for (let row = 0; row < RACK_UNITS; row++) {
      const y = row * 0.28 - (RACK_UNITS * 0.28) / 2 + 0.14;
      for (let col = 0; col < 4; col++) {
        const x = col * 0.15 - 0.225;
        data.push({
          position: new THREE.Vector3(x, y, 0.46),
          color: new THREE.Color(
            Math.random() > 0.3 ? "#66fcf1" : "#4ade80"
          ),
        });
      }
    }
    return data;
  }, []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    // Subtle breathing animation
    groupRef.current.position.y =
      Math.sin(clock.elapsedTime * 1) * 0.02;

    // LED blinking pattern
    if (ledsRef.current) {
      const dummy = new THREE.Object3D();
      const color = new THREE.Color();

      ledData.forEach((led, i) => {
        dummy.position.copy(led.position);

        // Staggered blinking
        const blink =
          Math.sin(clock.elapsedTime * 4 + i * 0.7) > 0
            ? intensity
            : intensity * 0.3;
        dummy.scale.setScalar(0.8 + blink * 0.4);
        dummy.updateMatrix();

        ledsRef.current!.setMatrixAt(i, dummy.matrix);

        // Color shifts slightly when active
        color.copy(led.color).multiplyScalar(0.3 + blink * 0.7);
        ledsRef.current!.setColorAt(i, color);
      });

      ledsRef.current.instanceMatrix.needsUpdate = true;
      if (ledsRef.current.instanceColor) {
        ledsRef.current.instanceColor.needsUpdate = true;
      }
    }
  });

  const accentColor = new THREE.Color("#66fcf1");

  return (
    <group ref={groupRef}>
      {/* ─── Main Rack Body ─── */}
      <mesh>
        <boxGeometry args={[1.2, RACK_UNITS * 0.28 + 0.2, 0.9]} />
        <meshStandardMaterial
          color="#0d1117"
          metalness={0.8}
          roughness={0.3}
          emissive={accentColor}
          emissiveIntensity={intensity * 0.15}
        />
      </mesh>

      {/* ─── Rack Unit Dividers ─── */}
      {Array.from({ length: RACK_UNITS + 1 }, (_, i) => {
        const y =
          i * 0.28 - (RACK_UNITS * 0.28) / 2;
        return (
          <mesh key={i} position={[0, y, 0]}>
            <boxGeometry args={[1.22, 0.01, 0.92]} />
            <meshStandardMaterial
              color="#1a2332"
              metalness={0.6}
              roughness={0.4}
            />
          </mesh>
        );
      })}

      {/* ─── Front Panel Face ─── */}
      <mesh position={[0, 0, 0.451]}>
        <planeGeometry
          args={[1.18, RACK_UNITS * 0.28 + 0.15]}
        />
        <meshStandardMaterial
          color="#111827"
          metalness={0.7}
          roughness={0.4}
          emissive={accentColor}
          emissiveIntensity={intensity * 0.05}
        />
      </mesh>

      {/* ─── LED Indicators (InstancedMesh for performance) ─── */}
      <instancedMesh
        ref={ledsRef}
        args={[undefined, undefined, ledData.length]}
      >
        <sphereGeometry args={[0.015, 6, 6]} />
        <meshBasicMaterial
          color="#66fcf1"
          toneMapped={false}
        />
      </instancedMesh>

      {/* ─── Side vents ─── */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {Array.from({ length: 8 }, (_, i) => (
            <mesh
              key={i}
              position={[
                side * 0.61,
                i * 0.2 - 0.7,
                0,
              ]}
            >
              <boxGeometry args={[0.01, 0.08, 0.6]} />
              <meshStandardMaterial
                color="#1a2332"
                metalness={0.5}
                roughness={0.5}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* ─── Activation Glow (visible when intensity is high) ─── */}
      <mesh>
        <boxGeometry
          args={[1.4, RACK_UNITS * 0.28 + 0.4, 1.1]}
        />
        <meshBasicMaterial
          color="#66fcf1"
          transparent
          opacity={intensity * 0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.BackSide}
        />
      </mesh>

      {/* ─── Ground glow ─── */}
      <mesh
        position={[0, -(RACK_UNITS * 0.28) / 2 - 0.15, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[1.5, 32]} />
        <meshBasicMaterial
          color="#66fcf1"
          transparent
          opacity={intensity * 0.1}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

