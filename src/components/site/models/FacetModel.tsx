"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { Color, MathUtils, type Group } from "three";
import { pointer } from "@/lib/pointer";

/** A faceted crystal with two orbit rings and packets circling it. Abstract, like the brand mark. */
export default function FacetModel({ mobile }: { mobile: boolean }) {
  const group = useRef<Group>(null);
  const ringA = useRef<Group>(null);
  const ringB = useRef<Group>(null);
  const inner = useRef<Group>(null);
  void mobile;

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const g = group.current!;
    g.rotation.y = MathUtils.damp(g.rotation.y, t * 0.22 + pointer.nx * 0.7, 3, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, 0.25 - pointer.ny * 0.3, 3, dt);
    g.position.y = Math.sin(t * 0.8) * 0.12;
    ringA.current!.rotation.z = t * 0.6;
    ringB.current!.rotation.z = -t * 0.45;
    inner.current!.rotation.set(t * 0.5, t * 0.7, 0);
  });

  return (
    <group ref={group}>
      <mesh>
        <icosahedronGeometry args={[1.7, 1]} />
        <meshStandardMaterial color="#141d2c" metalness={0.8} roughness={0.28} flatShading />
        <Edges color="#38BDF8" threshold={1} />
      </mesh>
      <group ref={inner}>
        <mesh>
          <icosahedronGeometry args={[0.85, 0]} />
          <meshBasicMaterial color={new Color("#38BDF8").multiplyScalar(2.4)} toneMapped={false} wireframe />
        </mesh>
      </group>

      <group rotation={[1.2, 0.3, 0]}>
        <group ref={ringA}>
          <mesh>
            <torusGeometry args={[2.7, 0.012, 6, 96]} />
            <meshBasicMaterial color="#7B8798" toneMapped={false} />
          </mesh>
          <mesh position={[2.7, 0, 0]}>
            <boxGeometry args={[0.16, 0.16, 0.16]} />
            <meshBasicMaterial color={new Color("#A3E635").multiplyScalar(1.3)} toneMapped={false} />
          </mesh>
        </group>
      </group>
      <group rotation={[0.4, 0.2, 0.6]}>
        <group ref={ringB}>
          <mesh>
            <torusGeometry args={[3.2, 0.012, 6, 96]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.5} toneMapped={false} />
          </mesh>
          <mesh position={[-3.2, 0, 0]}>
            <boxGeometry args={[0.13, 0.13, 0.13]} />
            <meshBasicMaterial color={new Color("#38BDF8").multiplyScalar(1.3)} toneMapped={false} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
