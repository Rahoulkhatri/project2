"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BoxGeometry, Color, InstancedMesh, MathUtils, Object3D, Vector3, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { useStory } from "@/lib/store";
import { inResponse, toLocal } from "@/lib/story";
import { WORLD } from "@/lib/world";
import { SceneGroup, SceneHtml as Html } from "./SceneGroup";

const H = WORLD.balancer;
const SKY = new Color("#38BDF8");
const LIME = new Color("#A3E635");
const HOT = new Color("#FB923C");

/** Three outputs fanning toward the racks; C is the one the request is sent to. */
const OUTPUTS = [
  { name: "A", angle: -0.75, load: 0.88 },
  { name: "B", angle: 0.1, load: 0.54 },
  { name: "C", angle: 0.95, load: 0.31 },
];
const ARM = 5;
const REACH = 10;

/** The nine unit faces of a rack, merged into one mesh. */
const faceLines = mergeGeometries(
  Array.from({ length: 9 }, (_, k) => new BoxGeometry(1.28, 0.2, 0.04).translate(0, -0.9 + k * 0.28, 0.56)),
)!;

const loadColor = (l: number) => (l > 0.7 ? HOT : l > 0.4 ? SKY : LIME);
const dirOf = (a: number) => new Vector3(Math.sin(a), 0, -Math.cos(a));

function Rack({ out, i }: { out: (typeof OUTPUTS)[number]; i: number }) {
  const pos = dirOf(out.angle).multiplyScalar(REACH);
  const lights = useRef<(Mesh | null)[]>([]);
  const label = useRef<HTMLDivElement>(null);
  const lit = Math.ceil(out.load * 4);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const prog = useStory.getState().progress;
    const s = toLocal("balancer", prog);
    const active = MathUtils.smoothstep(s, 0.15, 0.5);
    const show = inResponse(prog) ? 0 : 1;
    lights.current.forEach((m, k) => {
      if (!m) return;
      const on = k < lit;
      const c = loadColor(out.load);
      const blink = on ? 0.8 + 0.2 * Math.sin(t * (2 + i) + k) : 0.12;
      (m.material as MeshBasicMaterial).color.copy(c).multiplyScalar(blink * (0.5 + active * 2.4));
    });
    if (label.current) label.current.style.opacity = String(active * show);
  });

  return (
    <group position={[pos.x, -0.4, pos.z]} rotation={[0, -out.angle, 0]}>
      <RoundedBox args={[1.5, 3.2, 1.5]} radius={0.06} smoothness={4} position={[0, 0.4, -0.2]}>
        <meshPhysicalMaterial color="#0c121b" metalness={0.8} roughness={0.35} clearcoat={0.4} />
      </RoundedBox>
      {/* Face: unit lines and the load lights */}
      <mesh geometry={faceLines}>
        <meshStandardMaterial color="#141c28" metalness={0.9} roughness={0.4} />
      </mesh>
      {Array.from({ length: 4 }, (_, k) => (
        <mesh key={k} ref={(m) => { lights.current[k] = m; }} position={[0.55, 1.5 - k * 0.16, 0.6]}>
          <sphereGeometry args={[0.05, 10, 8]} />
          <meshBasicMaterial color="#222" toneMapped={false} />
        </mesh>
      ))}
      <Html position={[0.9, 2.1, 0.4]} zIndexRange={[4, 0]} pointerEvents="none">
        <div ref={label} style={{ opacity: 0 }}>
          <div className="anno">
            <div className="anno-body t-label text-[10px]">
              <div className="text-ink">RACK {out.name}</div>
              <div style={{ color: `#${loadColor(out.load).getHexString()}` }}>
                {Math.round(out.load * 100)}% {out.name === "C" ? "· selected" : out.load > 0.7 ? "· draining" : ""}
              </div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

export function Balancer() {
  const isMobile = useStory((s) => s.isMobile);
  const vane = useRef<Group>(null);
  const ring = useRef<Mesh>(null);
  const arms = useRef<(Group | null)[]>([]);
  const flow = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  const FLOW = isMobile ? 4 : 8;

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const { progress, velocity } = useStory.getState();
    const s = toLocal("balancer", progress);
    if (vane.current) vane.current.rotation.y += delta * (0.7 + Math.abs(velocity) * 60);
    if (ring.current) ring.current.rotation.y -= delta * 0.35;

    // Arms swing out to their racks as the packet arrives; C extends furthest.
    OUTPUTS.forEach((o, i) => {
      const g = arms.current[i];
      if (!g) return;
      const k = MathUtils.smoothstep(s, 0.05 + i * 0.05, 0.45 + i * 0.05);
      g.scale.z = 0.15 + k * 0.85;
    });

    // Background traffic on the arms, speed by load.
    let n = 0;
    OUTPUTS.forEach((o, i) => {
      const d = dirOf(o.angle);
      for (let k = 0; k < FLOW; k++) {
        const f = (t * (0.18 + o.load * 0.5) + k / FLOW + i * 0.13) % 1;
        const reach = (0.3 + MathUtils.smoothstep(s, 0.05, 0.45) * 0.7) * (ARM + 1.6);
        dummy.position.set(d.x * (1 + f * reach), 0, d.z * (1 + f * reach));
        dummy.scale.setScalar(0.07 * (1 - f * 0.5));
        dummy.updateMatrix();
        flow.current!.setMatrixAt(n, dummy.matrix);
        flow.current!.setColorAt(n, color.copy(loadColor(o.load)).multiplyScalar(1.6));
        n++;
      }
    });
    flow.current!.instanceMatrix.needsUpdate = true;
    flow.current!.instanceColor!.needsUpdate = true;
  });

  return (
    <SceneGroup retireAfterRun windows={[["balancer", "balancer"], ["response", "response"]]} pad={0.01}>
      <group position={H}>
        {/* Hub: a six-sided prism with a counter-rotating collar */}
        <mesh>
          <cylinderGeometry args={[1.25, 1.25, 1.2, 6]} />
          <meshPhysicalMaterial color="#aab2bf" metalness={1} roughness={0.28} clearcoat={0.3} />
        </mesh>
        <mesh position={[0, 0.62, 0]}>
          <cylinderGeometry args={[0.9, 1.1, 0.06, 6]} />
          <meshBasicMaterial color={SKY.clone().multiplyScalar(2.2)} toneMapped={false} />
        </mesh>
        <mesh ref={ring} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.55, 0.06, 10, 48]} />
          <meshPhysicalMaterial color="#c5ccd8" metalness={1} roughness={0.25} />
        </mesh>
        <group ref={vane}>
          {[0, 1, 2].map((k) => (
            <mesh key={k} rotation={[0, (k / 3) * Math.PI * 2, 0]} position={[0, 0.7, 0]}>
              <boxGeometry args={[1.5, 0.08, 0.1]} />
              <meshPhysicalMaterial color="#0a1018" metalness={1} roughness={0.2} />
            </mesh>
          ))}
        </group>

        {OUTPUTS.map((o, i) => {
          const hot = o.name === "C";
          return (
            <group key={o.name} rotation={[0, -o.angle, 0]}>
              <group ref={(g) => { arms.current[i] = g; }} position={[0, 0, -1]}>
                <RoundedBox args={[0.5, 0.45, ARM]} radius={0.08} smoothness={3} position={[0, 0, -ARM / 2]}>
                  <meshPhysicalMaterial color="#9aa3b2" metalness={1} roughness={0.32} clearcoat={0.2} />
                </RoundedBox>
                <mesh position={[0, 0.235, -ARM / 2]}>
                  <boxGeometry args={[0.12, 0.02, ARM - 0.4]} />
                  <meshBasicMaterial color={(hot ? LIME : loadColor(o.load)).clone().multiplyScalar(1.8)} toneMapped={false} />
                </mesh>
              </group>
            </group>
          );
        })}

        <instancedMesh ref={flow} args={[undefined, undefined, FLOW * 3]} frustumCulled={false}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>

        {OUTPUTS.map((o, i) => (
          <Rack key={o.name} out={o} i={i} />
        ))}

        <Html position={[-2.4, -1.3, 1.4]} zIndexRange={[4, 0]} pointerEvents="none">
          <div className="anno">
            <div className="anno-body t-label text-[10px]">
              <div className="text-ink">
                <span className="text-sky">LB-KHI</span> / SPLITTER
              </div>
              <div className="text-muted">least-loaded · 250 ms sample</div>
            </div>
          </div>
        </Html>
      </group>
    </SceneGroup>
  );
}
