"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Color, InstancedMesh, MathUtils, Object3D, type Group } from "three";
import { pointer } from "@/lib/pointer";

/** One tower per plan; Pro is the tallest and brightest. A pulse of load runs up each. */
const TOWERS = [
  { x: -2.6, n: 4, color: "#38BDF8", gain: 1.4 },
  { x: 0, n: 9, color: "#38BDF8", gain: 2.6 },
  { x: 2.6, n: 7, color: "#A3E635", gain: 1.8 },
];
const SEG = 0.27;

export default function TowersModel({ mobile }: { mobile: boolean }) {
  const group = useRef<Group>(null);
  const solid = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  const parts = useMemo(() => TOWERS.flatMap((tw, ti) => Array.from({ length: tw.n }, (_, k) => ({ ti, k, ...tw }))), []);

  useMemo(() => void mobile, [mobile]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const g = group.current!;
    g.rotation.y = MathUtils.damp(g.rotation.y, Math.sin(t * 0.2) * 0.35 + pointer.nx * 0.5, 3, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, 0.16 - pointer.ny * 0.1, 3, dt);

    parts.forEach((p, i) => {
      const bob = p.ti === 1 ? Math.sin(t * 1.2 + p.k * 0.3) * 0.01 : 0;
      dummy.position.set(p.x, 0.15 + p.k * SEG + bob, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      solid.current!.setMatrixAt(i, dummy.matrix);

      const head = (t * 3 + p.ti * 2.2) % (p.n + 4);
      const lit = Math.exp(-((p.k - head + 2) ** 2) / 1.6);
      const top = p.k === p.n - 1 ? 1 : 0;
      color.set(p.color).multiplyScalar(0.18 + lit * p.gain + top * p.gain * 0.6);
      solid.current!.setColorAt(i, color);
    });
    solid.current!.instanceMatrix.needsUpdate = true;
    solid.current!.instanceColor!.needsUpdate = true;
  });

  return (
    <group ref={group} position={[0, -1.7, 0]}>
      <instancedMesh ref={solid} args={[undefined, undefined, parts.length]} frustumCulled={false}>
        <boxGeometry args={[1.1, SEG - 0.07, 1.1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8.4, 0.1, 3.4]} />
        <meshStandardMaterial color="#0a111c" metalness={0.5} roughness={0.5} />
      </mesh>
      <gridHelper args={[12, 24, "#1f3a52", "#16202e"]} position={[0, 0.06, 0]} />
    </group>
  );
}
