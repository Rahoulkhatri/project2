"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  AdditiveBlending,
  Color,
  InstancedMesh,
  MathUtils,
  Object3D,
  TorusGeometry,
  type Group,
  type Mesh,
} from "three";
import { useStory } from "@/lib/store";
import { inResponse } from "@/lib/story";
import { M, WORLD, milestoneU, requestRouteU } from "@/lib/world";
import { SceneGroup, SceneHtml as Html } from "./SceneGroup";

const { start, end, rings: RING_COUNT } = WORLD.tunnel;
const LENGTH = start.z - end.z; // positive, tunnel runs toward -z
const SPACING = LENGTH / (RING_COUNT - 1);
const ARCS_PER_RING = 3;
const GREY = new Color("#4a5565");
const SKY = new Color("#38BDF8").multiplyScalar(2.2);

const DNS_RING = 2;
const TLS_RING = 6;

/** z of ring i along the tunnel. */
const ringZ = (i: number) => start.z - i * SPACING;

/** Route parameter at which the packet crosses z. The tunnel is a straight run. */
const uAtZ = (z: number) => {
  const a = milestoneU(M.tunnelMouth);
  const b = milestoneU(M.tunnelExit);
  return a + ((start.z - z) / LENGTH) * (b - a);
};

function Lock({ ring }: { ring: number }) {
  const shackle = useRef<Group>(null);
  const body = useRef<Mesh>(null);
  const light = useRef<Mesh>(null);

  useFrame((state) => {
    const u = requestRouteU(useStory.getState().progress);
    // Unlocks as the packet approaches, finishing as it passes through.
    const open = MathUtils.smoothstep(u, uAtZ(ringZ(ring)) - 0.012, uAtZ(ringZ(ring)) - 0.001);
    if (shackle.current) {
      shackle.current.position.y = 0.34 + open * 0.14;
      shackle.current.rotation.y = open * Math.PI * 0.85;
    }
    if (light.current) {
      const m = light.current.material as unknown as { color: Color };
      m.color.copy(GREY).lerp(SKY, open).multiplyScalar(0.7 + open * 1.2 + Math.sin(state.clock.elapsedTime * 3) * 0.05);
    }
  });

  return (
    <group position={[0, 2.2, ringZ(ring)]} scale={1.9}>
      <RoundedBox ref={body} args={[0.62, 0.46, 0.2]} radius={0.06} smoothness={4}>
        <meshPhysicalMaterial color="#aeb7c4" metalness={1} roughness={0.28} clearcoat={0.3} />
      </RoundedBox>
      <mesh ref={light} position={[0, 0, 0.105]}>
        <circleGeometry args={[0.055, 16]} />
        <meshBasicMaterial color="#4a5565" toneMapped={false} />
      </mesh>
      <group ref={shackle} position={[0.0, 0.34, 0]}>
        {/* Shackle: a half torus pivoting on one leg. */}
        <mesh position={[-0.18, 0, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.18, 0.04, 10, 28, Math.PI]} />
          <meshPhysicalMaterial color="#c5ccd8" metalness={1} roughness={0.22} />
        </mesh>
        <mesh position={[-0.36, -0.1, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.2, 10]} />
          <meshPhysicalMaterial color="#c5ccd8" metalness={1} roughness={0.22} />
        </mesh>
      </group>
    </group>
  );
}

/** DNS gate: four resolver nodes orbiting a ring, flaring as the packet is answered. */
function DnsNodes() {
  const group = useRef<Group>(null);
  const meshes = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const u = requestRouteU(useStory.getState().progress);
    const near = MathUtils.smoothstep(u, uAtZ(ringZ(DNS_RING)) - 0.012, uAtZ(ringZ(DNS_RING)));
    for (let i = 0; i < 4; i++) {
      const a = t * 0.7 + (i / 4) * Math.PI * 2;
      dummy.position.set(Math.cos(a) * 3.55, Math.sin(a) * 3.55, 0);
      dummy.scale.setScalar(0.12 + near * 0.08);
      dummy.updateMatrix();
      meshes.current!.setMatrixAt(i, dummy.matrix);
      meshes.current!.setColorAt(i, color.copy(GREY).lerp(SKY, near).multiplyScalar(1 + near));
    }
    meshes.current!.instanceMatrix.needsUpdate = true;
    meshes.current!.instanceColor!.needsUpdate = true;
  });

  return (
    <group ref={group} position={[0, 0, ringZ(DNS_RING)]}>
      <instancedMesh ref={meshes} args={[undefined, undefined, 4]} frustumCulled={false}>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

function Label({ ring, children, side = 1 }: { ring: number; children: React.ReactNode; side?: 1 | -1 }) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const prog = useStory.getState().progress;
    const u = requestRouteU(prog);
    const on = u >= uAtZ(ringZ(ring)) - 0.01 && !inResponse(prog) ? 1 : 0;
    if (ref.current) {
      ref.current.style.opacity = String(on);
      ref.current.style.transform = `translateY(${on ? 0 : 6}px)`;
    }
  });
  return (
    <Html position={[side * 3.7, 0, ringZ(ring)]} zIndexRange={[4, 0]} pointerEvents="none">
      <div ref={ref} style={{ transition: "opacity .5s, transform .5s", opacity: 0 }}>
        <div className="anno">
          <div className="anno-body t-label text-[10px]">{children}</div>
        </div>
      </div>
    </Html>
  );
}

export function Tunnel() {
  const isMobile = useStory((s) => s.isMobile);
  const rings = useRef<InstancedMesh>(null);
  const streaks = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  const arcGeo = useMemo(() => new TorusGeometry(3.5, 0.03, 8, 64, Math.PI * 0.58), []);
  const streakCount = isMobile ? 40 : 120;

  const streakSeeds = useMemo(
    () =>
      Array.from({ length: streakCount }, (_, i) => ({
        a: (i * 2.399) % (Math.PI * 2),
        r: 1.2 + ((i * 7919) % 100) / 100 * 2,
        z: ((i * 104729) % 1000) / 1000,
        v: 0.4 + ((i * 31) % 10) / 10,
      })),
    [streakCount],
  );

  useEffect(() => () => arcGeo.dispose(), [arcGeo]);

  useFrame((state, delta) => {
    const { progress } = useStory.getState();
    const t = state.clock.elapsedTime;
    const u = requestRouteU(progress);

    for (let i = 0; i < RING_COUNT; i++) {
      // 0 = packet far, 1 = packet has gone through.
      const passed = MathUtils.smoothstep(u, uAtZ(ringZ(i)) - 0.006, uAtZ(ringZ(i)) + 0.002);
      const prox = Math.exp(-Math.pow((u - uAtZ(ringZ(i))) * 140, 2));
      for (let k = 0; k < ARCS_PER_RING; k++) {
        const idx = i * ARCS_PER_RING + k;
        dummy.position.set(0, 0, ringZ(i));
        dummy.rotation.set(0, 0, (k / ARCS_PER_RING) * Math.PI * 2 + t * (0.12 + (i % 3) * 0.05) * (i % 2 ? 1 : -1));
        dummy.scale.setScalar(1 + prox * 0.08);
        dummy.updateMatrix();
        rings.current!.setMatrixAt(idx, dummy.matrix);
        rings.current!.setColorAt(idx, color.copy(GREY).lerp(SKY, passed).multiplyScalar(0.55 + passed * 0.5 + prox * 0.9));
      }
    }
    rings.current!.instanceMatrix.needsUpdate = true;
    rings.current!.instanceColor!.needsUpdate = true;

    // Streaks rush past; faster when the user scrolls faster.
    const vel = Math.abs(useStory.getState().velocity);
    const speed = 5 + vel * 900;
    streakSeeds.forEach((s, i) => {
      s.z = (s.z + delta * 0.0016 * s.v * speed) % 1;
      dummy.position.set(Math.cos(s.a) * s.r, Math.sin(s.a) * s.r, start.z - s.z * LENGTH);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(0.012, 0.012, 0.8 + vel * 80);
      dummy.updateMatrix();
      streaks.current!.setMatrixAt(i, dummy.matrix);
    });
    streaks.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <SceneGroup retireAfterRun windows={[["internet", "edge"], ["response", "response"]]} pad={0.01}>
      <group position={[start.x, start.y, 0]}>
        <instancedMesh ref={rings} args={[arcGeo, undefined, RING_COUNT * ARCS_PER_RING]} frustumCulled={false}>
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>

        <instancedMesh ref={streaks} args={[undefined, undefined, streakCount]} frustumCulled={false}>
          <boxGeometry args={[1, 1, 1]} />
          <meshBasicMaterial color={new Color(0.35, 0.8, 1.4)} transparent opacity={0.5} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
        </instancedMesh>

        <DnsNodes />
        <Lock ring={TLS_RING} />

        <Label ring={DNS_RING}>
          <div className="text-ink">
            <span className="text-sky">DNS</span> 4ms
          </div>
          <div className="text-muted">authoritative · A 198.51.100.7</div>
        </Label>
        <Label ring={TLS_RING} side={-1}>
          <div className="text-ink">
            <span className="text-sky">TLS</span> handshake 11ms
          </div>
          <div className="text-muted">1.3 · X25519 · cert verified</div>
        </Label>
      </group>
    </SceneGroup>
  );
}
