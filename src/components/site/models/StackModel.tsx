"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Edges } from "@react-three/drei";
import { Color, InstancedMesh, MathUtils, Object3D, type Group } from "three";
import { pointer } from "@/lib/pointer";

const LAYERS = [
  { name: "Runtime", color: "#38BDF8" },
  { name: "Cache", color: "#A3E635" },
  { name: "Routing", color: "#38BDF8" },
  { name: "Postgres", color: "#FB923C" },
  { name: "Observability", color: "#A3E635" },
];

/** The platform as a stack of slabs that breathe apart, with requests falling through all of them. */
export default function StackModel({ mobile }: { mobile: boolean }) {
  const group = useRef<Group>(null);
  const slabs = useRef<(Group | null)[]>([]);
  const packets = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const PACKETS = mobile ? 3 : 6;

  useEffect(() => {
    const c = new Color("#38BDF8").multiplyScalar(1.6);
    for (let i = 0; i < PACKETS; i++) packets.current!.setColorAt(i, c);
    packets.current!.instanceColor!.needsUpdate = true;
  }, [PACKETS]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const g = group.current!;
    g.rotation.y = MathUtils.damp(g.rotation.y, t * 0.16 + pointer.nx * 0.6, 3, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, 0.28 - pointer.ny * 0.18, 3, dt);

    const spread = 0.64 + 0.14 * Math.sin(t * 0.7);
    slabs.current.forEach((s, i) => s && (s.position.y = (i - 2) * spread));

    const top = 2 * spread + 0.8;
    for (let i = 0; i < PACKETS; i++) {
      const f = (t * 0.32 + i / PACKETS) % 1;
      dummy.position.set(Math.sin(i * 2.1) * 0.9, top - f * 2 * top, Math.cos(i * 2.1) * 0.5);
      dummy.scale.setScalar(0.1 * Math.sin(Math.PI * f) + 0.02);
      dummy.updateMatrix();
      packets.current!.setMatrixAt(i, dummy.matrix);
    }
    packets.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group} position={[0, 0, 0]}>
      {LAYERS.map((l, i) => (
        <group key={l.name} ref={(el) => { slabs.current[i] = el; }}>
          <mesh>
            <boxGeometry args={[3.4, 0.2, 2.4]} />
            <meshStandardMaterial color="#0f1826" metalness={0.6} roughness={0.4} />
            <Edges color={l.color} threshold={15} />
          </mesh>
          <mesh position={[0, 0.02, 1.21]}>
            <boxGeometry args={[2.6, 0.04, 0.02]} />
            <meshBasicMaterial color={new Color(l.color).multiplyScalar(2.4)} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <instancedMesh ref={packets} args={[undefined, undefined, PACKETS]} frustumCulled={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
