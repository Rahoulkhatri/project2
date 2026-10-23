"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { Color, InstancedMesh, MathUtils, Object3D, type Mesh, type MeshBasicMaterial } from "three";
import { useStory } from "@/lib/store";
import { inResponse, toLocal } from "@/lib/story";
import { WORLD } from "@/lib/world";
import { SceneGroup, SceneHtml as Html } from "./SceneGroup";

const D = WORLD.database;
const DISCS = 14;
const GAP = 0.44;
const RECORDS = 18;
const RADIUS = 1.7;
const SKY = new Color("#38BDF8");
const LIME = new Color("#A3E635");
const GOLD = new Color("#FDE68A");

/** Translucent glass platters; rows light as the query scans down the stack. */
export function Database() {
  const isMobile = useStory((s) => s.isMobile);
  const discs = useRef<InstancedMesh>(null);
  const rings = useRef<InstancedMesh>(null);
  const rec = useRef<InstancedMesh>(null);
  const out = useRef<InstancedMesh>(null);
  const core = useRef<Mesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  const STREAM = isMobile ? 60 : 160;

  const records = useMemo(() => {
    const list: { d: number; k: number }[] = [];
    for (let d = 0; d < DISCS; d++) for (let k = 0; k < RECORDS; k++) list.push({ d, k });
    return list;
  }, []);

  useEffect(() => {
    for (let d = 0; d < DISCS; d++) {
      dummy.position.set(0, d * GAP, 0);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      discs.current!.setMatrixAt(d, dummy.matrix);
      dummy.position.set(0, d * GAP + 0.062, 0);
      dummy.rotation.set(Math.PI / 2, 0, 0);
      dummy.updateMatrix();
      rings.current!.setMatrixAt(d, dummy.matrix);
    }
    discs.current!.instanceMatrix.needsUpdate = true;
    rings.current!.instanceMatrix.needsUpdate = true;
    records.forEach(({ d, k }, i) => {
      const a = (k / RECORDS) * Math.PI * 2 + d * 0.21;
      dummy.position.set(Math.cos(a) * 1.2, d * GAP + 0.1, Math.sin(a) * 1.2);
      dummy.rotation.set(0, -a, 0);
      dummy.scale.set(0.2, 0.07, 0.11);
      dummy.updateMatrix();
      rec.current!.setMatrixAt(i, dummy.matrix);
    });
    rec.current!.instanceMatrix.needsUpdate = true;
  }, [records, dummy]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const prog = useStory.getState().progress;
    const s = toLocal("database", prog);
    // Query executes from the top of the stack down between 0.18 and 0.58.
    const scan = MathUtils.clamp((s - 0.18) / 0.4, 0, 1);
    const head = (1 - scan) * (DISCS - 1);
    const running = s > 0.16 && s < 0.62;

    for (let d = 0; d < DISCS; d++) {
      const dist = Math.abs(d - head);
      const near = running ? Math.exp(-dist * dist / 1.4) : 0;
      const done = scan > 0 && d >= head - 0.5 ? 1 : 0;
      color
        .copy(SKY)
        .lerp(LIME, done * MathUtils.smoothstep(s, 0.55, 0.7))
        .multiplyScalar(0.25 + near * 2.6 + done * 0.5 + Math.sin(t * 1.2 + d) * 0.04);
      rings.current!.setColorAt(d, color);
    }
    rings.current!.instanceColor!.needsUpdate = true;

    records.forEach(({ d, k }, i) => {
      const dist = Math.abs(d - head);
      const hit = running ? Math.exp(-dist * dist / 1.1) * (0.4 + 0.6 * ((k * 7 + d * 3) % 5) / 4) : 0;
      const seen = scan > 0 && d >= head ? 1 : 0;
      color.copy(SKY).multiplyScalar(0.12 + 0.06 * Math.sin(t + k + d));
      color.lerp(LIME, seen * MathUtils.smoothstep(s, 0.5, 0.65)).multiplyScalar(1 + seen * 2.2 + hit * 5);
      rec.current!.setColorAt(i, color);
    });
    rec.current!.instanceColor!.needsUpdate = true;

    // Result stream: lime and pale-gold grains spiral up out of the stack.
    const emit = MathUtils.smoothstep(s, 0.58, 0.72);
    for (let i = 0; i < STREAM; i++) {
      const life = (t * (0.18 + (i % 7) * 0.02) + i / STREAM) % 1;
      const a = i * 2.399 + life * 5;
      const r = 0.2 + life * (1.5 + (i % 5) * 0.5);
      dummy.position.set(Math.cos(a) * r, DISCS * GAP * 0.5 + life * 9, Math.sin(a) * r + life * 6);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(emit * 0.055 * (1 - life) * (1 + (i % 3) * 0.4));
      dummy.updateMatrix();
      out.current!.setMatrixAt(i, dummy.matrix);
      out.current!.setColorAt(i, color.copy(i % 3 ? LIME : GOLD).multiplyScalar(2.2));
    }
    out.current!.instanceMatrix.needsUpdate = true;
    out.current!.instanceColor!.needsUpdate = true;

    if (core.current) (core.current.material as MeshBasicMaterial).color.copy(SKY).multiplyScalar(0.4 + (running ? 1.4 : 0.2));
    if (label.current) label.current.style.opacity = String(MathUtils.smoothstep(s, 0.12, 0.3) * (inResponse(prog) ? 0 : 1));
  });

  return (
    <SceneGroup retireAfterRun windows={[["database", "database"], ["response", "response"]]} pad={0.012}>
      <group position={[D.x, D.y - 3, D.z]}>
        <instancedMesh ref={discs} args={[undefined, undefined, DISCS]} frustumCulled={false}>
          <cylinderGeometry args={[RADIUS, RADIUS, 0.12, 56]} />
          <meshPhysicalMaterial color="#10283a" transparent opacity={0.34} roughness={0.08} metalness={0.1} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={1.6} />
        </instancedMesh>
        <instancedMesh ref={rings} args={[undefined, undefined, DISCS]} frustumCulled={false}>
          <torusGeometry args={[RADIUS, 0.018, 8, 72]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
        <mesh ref={core} position={[0, (DISCS * GAP) / 2, 0]}>
          <cylinderGeometry args={[0.07, 0.07, DISCS * GAP + 0.6, 12]} />
          <meshBasicMaterial color="#38BDF8" toneMapped={false} />
        </mesh>
        {/* Base plinth */}
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[2.1, 2.3, 0.3, 48]} />
          <meshPhysicalMaterial color="#9aa3b2" metalness={1} roughness={0.35} clearcoat={0.2} />
        </mesh>
        <instancedMesh ref={rec} args={[undefined, undefined, records.length]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>
        <instancedMesh ref={out} args={[undefined, undefined, STREAM]} frustumCulled={false}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>

        <Html position={[2.2, DISCS * GAP * 0.62, 0]} zIndexRange={[4, 0]} pointerEvents="none">
          <div ref={label} style={{ opacity: 0 }}>
            <div className="anno">
              <div className="anno-body t-label text-[10px]">
                <div className="text-ink">
                  <span className="text-sky">PG-16</span> / READ REPLICA
                </div>
                <div className="text-muted">pg-khi-02 · lag 118 ms</div>
              </div>
            </div>
          </div>
        </Html>
      </group>
    </SceneGroup>
  );
}
