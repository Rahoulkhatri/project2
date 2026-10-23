"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedMesh,
  MathUtils,
  Matrix4,
  Object3D,
  ShaderMaterial,
  SRGBColorSpace,
  TubeGeometry,
  Vector3,
  type Group,
  type Mesh,
} from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useStory } from "@/lib/store";
import { RANGE_BY_ID, inResponse, toLocal } from "@/lib/story";
import { WORLD } from "@/lib/world";
import { SceneGroup, SceneHtml as Html } from "./SceneGroup";

const AX = 62; // aisle centre x
const FACE = 1.8; // face distance from aisle centre
const Z0 = -139.5;
const PITCH = 0.9;
const RACK_H = 3.3;
const SERVER = WORLD.aisle.server; // (63.4, 1.2, -156)
const HERO_RACK = 18;
const HERO_Z = Z0 - HERO_RACK * PITCH;
const SKY = new Color("#38BDF8");
const LIME = new Color("#A3E635");
const HOT = new Color("#FB923C");

/* ── Deterministic RNG ──────────────────────────────────── */
const rng = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

/* ── LED shader ─────────────────────────────────────────── */
const ledVert = /* glsl */ `
  uniform float uTime;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3 aColor;
  varying vec3 vColor;
  varying float vOn;
  void main() {
    float f = fract(uTime * aSpeed * 0.5 + aPhase);
    // Only ~15% of LEDs are lit at any moment; the rest sit near black.
    vOn = step(f, 0.15) * (0.6 + 0.4 * step(0.5, fract(f * 23.0)));
    vColor = aColor;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;
const ledFrag = /* glsl */ `
  varying vec3 vColor;
  varying float vOn;
  void main() { gl_FragColor = vec4(vColor * (0.04 + vOn * 2.0), 1.0); }
`;

function ventTexture() {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 32;
  const g = c.getContext("2d")!;
  g.fillStyle = "#020305";
  g.fillRect(0, 0, 128, 32);
  g.fillStyle = "#0e1522";
  for (let i = 0; i < 24; i++) g.fillRect(4 + i * 5, 4, 2.4, 24);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
}

type UnitDef = { y: number; h: number; hash: number };

function layoutRack(seed: number): UnitDef[] {
  const r = rng(seed);
  const out: UnitDef[] = [];
  let y = 0.18;
  while (true) {
    const h = r() > 0.72 ? 0.22 : 0.105;
    if (y + h > RACK_H - 0.12) break;
    out.push({ y: y + h / 2, h, hash: r() });
    y += h + 0.012;
  }
  return out;
}

/** One row of racks: cabinets, unit faces, vents, handles and blinking LEDs, all instanced. */
function Row({ side, racks }: { side: 1 | -1; racks: number }) {
  const cab = useRef<InstancedMesh>(null);
  const faces = useRef<InstancedMesh>(null);
  const vents = useRef<InstancedMesh>(null);
  const handles = useRef<InstancedMesh>(null);
  const leds = useRef<InstancedMesh>(null);

  const { units, ledMat, ventTex } = useMemo(() => {
    const list: { x: number; y: number; z: number; h: number; hash: number }[] = [];
    for (let k = 0; k < racks; k++) {
      const z = Z0 - k * PITCH;
      layoutRack(k * 31 + (side > 0 ? 7 : 3)).forEach((u) => {
        // The hero server slot is modelled separately, right side only.
        if (side > 0 && k === HERO_RACK && Math.abs(u.y - SERVER.y) < 0.25) return;
        list.push({ x: AX + side * FACE, y: u.y, z, h: u.h, hash: u.hash });
      });
    }
    const mat = new ShaderMaterial({
      vertexShader: ledVert,
      fragmentShader: ledFrag,
      uniforms: { uTime: { value: 0 } },
    });
    return { units: list, ledMat: mat, ventTex: ventTexture() };
  }, [racks, side]);

  useEffect(() => {
    const o = new Object3D();
    const n = units.length;
    // Faces: the front plate of each unit.
    units.forEach((u, i) => {
      o.rotation.set(0, 0, 0);
      o.position.set(u.x, u.y, u.z);
      o.scale.set(1, u.h / 0.1, 1);
      o.updateMatrix();
      faces.current!.setMatrixAt(i, o.matrix);

      // Vent: plane facing the aisle.
      o.rotation.set(0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0);
      o.position.set(u.x - side * 0.027, u.y, u.z + 0.12);
      o.scale.set(0.32, Math.min(1, u.h / 0.1) * 0.85, 1);
      o.updateMatrix();
      vents.current!.setMatrixAt(i, o.matrix);

      // Handles at both ends.
      o.rotation.set(0, 0, 0);
      o.scale.set(1, u.h / 0.1 > 1.5 ? 1.6 : 1, 1);
      o.position.set(u.x - side * 0.04, u.y, u.z + 0.34);
      o.updateMatrix();
      handles.current!.setMatrixAt(i * 2, o.matrix);
      o.position.set(u.x - side * 0.04, u.y, u.z - 0.34);
      o.updateMatrix();
      handles.current!.setMatrixAt(i * 2 + 1, o.matrix);

      // LED strip.
      o.position.set(u.x - side * 0.03, u.y + (u.h > 0.15 ? 0.05 : 0.0), u.z - 0.2);
      o.scale.set(1, 1, 1);
      o.updateMatrix();
      leds.current!.setMatrixAt(i, o.matrix);
    });
    [faces, vents, handles, leds].forEach((r) => (r.current!.instanceMatrix.needsUpdate = true));

    const phase = new Float32Array(n);
    const speed = new Float32Array(n);
    const col = new Float32Array(n * 3);
    units.forEach((u, i) => {
      const r = rng(Math.floor(u.hash * 1e6) + i + 11);
      phase[i] = r();
      speed[i] = 0.15 + r() * 0.9;
      const pick = r();
      const c = pick < 0.72 ? SKY : pick < 0.95 ? LIME : HOT;
      col.set([c.r, c.g, c.b], i * 3);
    });
    const g = leds.current!.geometry;
    g.setAttribute("aPhase", new InstancedBufferAttribute(phase, 1));
    g.setAttribute("aSpeed", new InstancedBufferAttribute(speed, 1));
    g.setAttribute("aColor", new InstancedBufferAttribute(col, 3));

    // Cabinets.
    const m = new Matrix4();
    for (let k = 0; k < racks; k++) {
      m.makeTranslation(AX + side * (FACE + 0.62), RACK_H / 2, Z0 - k * PITCH);
      cab.current!.setMatrixAt(k, m);
    }
    cab.current!.instanceMatrix.needsUpdate = true;
  }, [units, side, racks]);

  useEffect(
    () => () => {
      ledMat.dispose();
      ventTex.dispose();
    },
    [ledMat, ventTex],
  );

  useFrame((state) => {
    ledMat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <group>
      <instancedMesh ref={cab} args={[undefined, undefined, racks]} frustumCulled={false}>
        <boxGeometry args={[1.3, RACK_H, 0.86]} />
        <meshStandardMaterial color="#070b11" metalness={0.7} roughness={0.55} />
      </instancedMesh>
      <instancedMesh ref={faces} args={[undefined, undefined, units.length]} frustumCulled={false}>
        <boxGeometry args={[0.05, 0.1, 0.78]} />
        <meshPhysicalMaterial color="#1b2434" metalness={0.7} roughness={0.45} clearcoat={0.25} />
      </instancedMesh>
      <instancedMesh ref={vents} args={[undefined, undefined, units.length]} frustumCulled={false}>
        <planeGeometry args={[1, 0.1]} />
        <meshBasicMaterial map={ventTex} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={handles} args={[undefined, undefined, units.length * 2]} frustumCulled={false}>
        <boxGeometry args={[0.035, 0.04, 0.025]} />
        <meshPhysicalMaterial color="#9aa3b2" metalness={1} roughness={0.3} />
      </instancedMesh>
      <instancedMesh ref={leds} args={[undefined, undefined, units.length]} frustumCulled={false}>
        <boxGeometry args={[0.012, 0.018, 0.16]} />
        <primitive object={ledMat} attach="material" />
      </instancedMesh>
    </group>
  );
}

/* ── Cabling ────────────────────────────────────────────── */

function useCables(racks: number) {
  return useMemo(() => {
    const r = rng(99);
    const parts: BufferGeometry[] = [];
    const len = racks * PITCH;
    for (const side of [-1, 1]) {
      const x = AX + side * (FACE + 0.5);
      // Overhead trays: three parallel bundles with a lazy sag between supports.
      for (let b = 0; b < 3; b++) {
        const pts: Vector3[] = [];
        for (let i = 0; i <= 18; i++) {
          const f = i / 18;
          pts.push(new Vector3(x + (b - 1) * 0.16, RACK_H + 0.28 + b * 0.04 - Math.sin(((f * len) / 3) * Math.PI) ** 2 * 0.05, Z0 + 0.5 - f * len));
        }
        parts.push(new TubeGeometry(new CatmullRomCurve3(pts), 140, 0.075 + b * 0.012, 8, false));
      }
      // Drops into the racks.
      for (let d = 0; d < 22; d++) {
        const z = Z0 - r() * len;
        const ty = 0.8 + r() * (RACK_H - 1.3);
        const sway = (r() - 0.5) * 0.5;
        const c = new CatmullRomCurve3([
          new Vector3(x, RACK_H + 0.3, z),
          new Vector3(x - side * 0.15, RACK_H - 0.2, z + sway * 0.3),
          new Vector3(x - side * 0.95, (RACK_H + ty) / 2, z + sway),
          new Vector3(x - side * 1.15, ty + 0.1, z + sway * 0.4),
          new Vector3(x - side * 1.3, ty, z),
        ]);
        parts.push(new TubeGeometry(c, 40, 0.028, 6, false));
      }
    }
    // Trunk between rows, floor level.
    const trunk: Vector3[] = [];
    for (let i = 0; i <= 14; i++) {
      const f = i / 14;
      trunk.push(new Vector3(AX + Math.sin(f * 9) * 0.25, 0.04, Z0 - f * len));
    }
    parts.push(new TubeGeometry(new CatmullRomCurve3(trunk), 120, 0.05, 8, false));
    return mergeGeometries(parts, false)!;
  }, [racks]);
}

/* ── Cold-aisle light cones ─────────────────────────────── */

const coneVert = /* glsl */ `
  varying float vH; varying vec3 vN; varying vec3 vV;
  void main() {
    vH = uv.y;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
const coneFrag = /* glsl */ `
  uniform float uTime;
  varying float vH; varying vec3 vN; varying vec3 vV;
  void main() {
    float f = pow(abs(dot(vN, vV)), 1.6);
    float a = (1.0 - vH) * f * 0.05 * (0.9 + 0.1 * sin(uTime * 0.7));
    gl_FragColor = vec4(vec3(0.5, 0.82, 1.0) * 0.9, a);
  }
`;

/* ── Hero server ────────────────────────────────────────── */

const UNIT_W = 0.76;
const UNIT_H = 0.3;
const UNIT_D = 1.1;
const HERO_SCALE = 1.4;

/** A box with a baked vertex colour, ready to merge into one draw call. */
function bakedBox(w: number, h: number, d: number, x: number, y: number, z: number, hex: string) {
  const g = new BoxGeometry(w, h, d);
  g.translate(x, y, z);
  const c = new Color(hex);
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set([c.r, c.g, c.b], i * 3);
  g.setAttribute("color", new BufferAttribute(col, 3));
  return g;
}

type Glow = { p: [number, number, number]; s: [number, number, number]; c: Color };

/**
 * The hero unit. Everything static is merged into one mesh, every glowing part
 * is one instanced mesh, so the whole server costs about nine draw calls.
 */
function HeroServer() {
  const unit = useRef<Group>(null);
  const lid = useRef<Group>(null);
  const glowMesh = useRef<InstancedMesh>(null);
  const fans = useRef<(Mesh | null)[]>([]);
  const label = useRef<HTMLDivElement>(null);
  const tmp = useMemo(() => new Color(), []);
  const dummy = useMemo(() => new Object3D(), []);

  const { chassis, glows, fanGeo } = useMemo(() => {
    const parts: BufferGeometry[] = [];
    const glows: Glow[] = [];
    // NVMe bays on the front plate
    for (let i = 0; i < 6; i++) {
      const z = -0.3 + i * 0.12;
      parts.push(bakedBox(0.02, 0.14, 0.095, -0.03, 0.06, z, "#0a0f17"));
      glows.push({ p: [-0.042, 0.115, z], s: [0.006, 0.014, 0.05], c: SKY });
    }
    parts.push(bakedBox(0.01, 0.04, 0.62, -0.03, -0.095, 0, "#05080d"));
    // Tray, side walls, back wall, PSU
    parts.push(bakedBox(UNIT_D, 0.02, UNIT_W - 0.02, UNIT_D / 2, -UNIT_H / 2 + 0.01, 0, "#0b1019"));
    parts.push(bakedBox(UNIT_D, UNIT_H, 0.02, UNIT_D / 2, 0, -UNIT_W / 2 + 0.01, "#121a26"));
    parts.push(bakedBox(UNIT_D, UNIT_H, 0.02, UNIT_D / 2, 0, UNIT_W / 2 - 0.01, "#121a26"));
    parts.push(bakedBox(0.02, UNIT_H, UNIT_W, UNIT_D, 0, 0, "#121a26"));
    parts.push(bakedBox(0.24, 0.2, 0.3, UNIT_D - 0.14, -0.04, 0.2, "#080c13"));
    // CPUs: finned heatsinks over a glowing base plate
    for (const z of [-0.17, 0.17]) {
      glows.push({ p: [0.55, -0.067, z], s: [0.24, 0.008, 0.24], c: SKY });
      for (let i = 0; i < 9; i++) parts.push(bakedBox(0.22, 0.12, 0.006, 0.55, -0.005, z - 0.1 + i * 0.025, "#aab2bf"));
    }
    // RAM banks
    for (const z of [-0.33, 0, 0.33]) {
      const count = z === 0 ? 8 : 4;
      for (let i = 0; i < count; i++) {
        const x = 0.4 + (z === 0 ? i * 0.05 - 0.17 : 0);
        const zz = z === 0 ? 0 : z + (i - 1.5) * 0.04;
        parts.push(bakedBox(0.012, 0.1, 0.3, x, -0.04, zz, "#0d2417"));
        glows.push({ p: [x, 0.012, zz], s: [0.014, 0.006, 0.28], c: LIME });
      }
    }
    // One fan = ring + five blades, merged
    const blade: BufferGeometry[] = [new CylinderGeometry(0.07, 0.07, 0.04, 20, 1, true).rotateZ(Math.PI / 2)];
    for (let b2 = 0; b2 < 5; b2++) blade.push(new BoxGeometry(0.012, 0.01, 0.12).rotateX((b2 / 5) * Math.PI * 2));
    return { chassis: mergeGeometries(parts)!, glows, fanGeo: mergeGeometries(blade)! };
  }, []);

  useEffect(() => {
    glows.forEach((g, i) => {
      dummy.position.set(...g.p);
      dummy.scale.set(...g.s);
      dummy.updateMatrix();
      glowMesh.current!.setMatrixAt(i, dummy.matrix);
    });
    glowMesh.current!.instanceMatrix.needsUpdate = true;
    return () => {
      chassis.dispose();
      fanGeo.dispose();
    };
  }, [glows, dummy, chassis, fanGeo]);

  useFrame((state, delta) => {
    const prog = useStory.getState().progress;
    const s = toLocal("runtime", prog);
    const slide = MathUtils.smoothstep(s, 0.3, 0.5);
    const open = MathUtils.smoothstep(s, 0.58, 0.8);
    const glow = MathUtils.smoothstep(s, 0.62, 0.9);
    const t = state.clock.elapsedTime;

    if (unit.current) unit.current.position.x = SERVER.x + 0.4 - slide * 1.0;
    if (lid.current) {
      lid.current.rotation.z = -open * 1.05;
      lid.current.position.y = UNIT_H / 2 + open * 0.1;
    }
    fans.current.forEach((f, i) => f && (f.rotation.x += delta * (2 + glow * 22 + i * 0.3)));
    glows.forEach((g, i) => {
      glowMesh.current!.setColorAt(i, tmp.copy(g.c).multiplyScalar(0.1 + glow * (3.4 + 0.5 * Math.sin(t * 2.5 + i))));
    });
    if (glowMesh.current!.instanceColor) glowMesh.current!.instanceColor.needsUpdate = true;
    if (label.current) label.current.style.opacity = String(MathUtils.smoothstep(s, 0.62, 0.8) * (inResponse(prog) ? 0 : 1));
  });

  return (
    <group ref={unit} position={[SERVER.x, SERVER.y, HERO_Z]} scale={HERO_SCALE}>
      {/* Local axes: front plate at x = 0 facing the aisle (-x), body runs +x. */}
      <RoundedBox args={[0.05, UNIT_H, UNIT_W]} radius={0.01} smoothness={3}>
        <meshPhysicalMaterial color="#1a2230" metalness={0.9} roughness={0.36} clearcoat={0.3} />
      </RoundedBox>
      <mesh geometry={chassis}>
        <meshStandardMaterial vertexColors metalness={0.8} roughness={0.45} />
      </mesh>
      <instancedMesh ref={glowMesh} args={[undefined, undefined, glows.length]} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {[-0.26, -0.09, 0.09, 0.26].map((z, i) => (
        <mesh
          key={z}
          ref={(m) => {
            fans.current[i] = m;
          }}
          geometry={fanGeo}
          position={[0.18, -0.03, z]}
        >
          <meshStandardMaterial color="#222c3a" metalness={0.6} roughness={0.5} side={DoubleSide} />
        </mesh>
      ))}

      {/* Lid hinged at the back edge */}
      <group position={[UNIT_D, 0, 0]}>
        <group ref={lid} position={[0, UNIT_H / 2, 0]}>
          <RoundedBox args={[UNIT_D, 0.02, UNIT_W]} radius={0.005} smoothness={2} position={[-UNIT_D / 2, 0.01, 0]}>
            <meshPhysicalMaterial color="#9aa3b2" metalness={1} roughness={0.32} clearcoat={0.2} />
          </RoundedBox>
        </group>
      </group>

      <Html position={[0.5, 0.45, 0]} zIndexRange={[4, 0]} pointerEvents="none">
        <div ref={label} style={{ opacity: 0 }}>
          <div className="anno">
            <div className="anno-body t-label text-[10px]">
              <div className="text-ink">
                <span className="text-lime">RUNTIME</span> / Node 22
              </div>
              <div className="text-muted">cold start 38 ms · 2 vCPU · 512 MB</div>
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

/* ── Aisle ──────────────────────────────────────────────── */

export function Aisle() {
  const isMobile = useStory((s) => s.isMobile);
  const racks = isMobile ? 22 : 30;
  const cables = useCables(racks);
  const coneMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: coneVert,
        fragmentShader: coneFrag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: BackSide,
        uniforms: { uTime: { value: 0 } },
      }),
    [],
  );
  const fixtures = useMemo(() => Array.from({ length: isMobile ? 5 : 8 }, (_, i) => Z0 - 2 - i * 4.2), [isMobile]);

  useEffect(
    () => () => {
      cables.dispose();
      coneMat.dispose();
    },
    [cables, coneMat],
  );
  useFrame((state) => {
    coneMat.uniforms.uTime.value = state.clock.elapsedTime;
  });

  const len = racks * PITCH;
  const seamCount = Math.ceil(len / 0.6);
  const seams = useRef<InstancedMesh>(null);
  const strips = useRef<InstancedMesh>(null);
  const cones = useRef<InstancedMesh>(null);
  // Mounted only while the aisle is on screen: the reflector re-renders the scene every frame it exists.
  const inAisle = useStory((s) => s.progress >= RANGE_BY_ID.runtime.start - 0.01 && s.progress <= RANGE_BY_ID.database.end);

  useEffect(() => {
    const o = new Object3D();
    for (let i = 0; i < seamCount; i++) {
      o.position.set(AX, 0.002, Z0 + 0.5 - i * 0.6);
      o.rotation.set(-Math.PI / 2, 0, 0);
      o.updateMatrix();
      seams.current!.setMatrixAt(i, o.matrix);
    }
    seams.current!.instanceMatrix.needsUpdate = true;
    o.rotation.set(0, 0, 0);
    fixtures.forEach((z, i) => {
      o.position.set(AX, RACK_H + 0.9, z);
      o.updateMatrix();
      strips.current!.setMatrixAt(i, o.matrix);
      o.position.set(AX, (RACK_H + 0.9) / 2, z);
      o.updateMatrix();
      cones.current!.setMatrixAt(i, o.matrix);
    });
    strips.current!.instanceMatrix.needsUpdate = true;
    cones.current!.instanceMatrix.needsUpdate = true;
  }, [seamCount, fixtures]);

  return (
    <SceneGroup retireAfterRun windows={[["runtime", "database"], ["response", "response"]]} pad={0.012}>
      {/* Reflective floor */}
      {inAisle && (
      <mesh rotation-x={-Math.PI / 2} position={[AX, 0, Z0 - len / 2 + 2]}>
        <planeGeometry args={[11, len + 14]} />
        {isMobile ? (
          <meshStandardMaterial color="#05080d" roughness={0.3} metalness={0.8} />
        ) : (
          <MeshReflectorMaterial
            color="#04070b"
            blur={[300, 80]}
            resolution={256}
            mixBlur={1}
            mixStrength={9}
            mirror={0.6}
            roughness={0.7}
            metalness={0.6}
            depthScale={0.8}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.4}
          />
        )}
      </mesh>
      )}
      {/* Floor tile seams: one instanced mesh */}
      <instancedMesh ref={seams} args={[undefined, undefined, seamCount]} frustumCulled={false}>
        <planeGeometry args={[3.4, 0.01]} />
        <meshBasicMaterial color="#1a2433" transparent opacity={0.6} />
      </instancedMesh>

      <Row side={-1} racks={racks} />
      <Row side={1} racks={racks} />
      <mesh geometry={cables}>
        <meshStandardMaterial color="#0a0d13" roughness={0.55} metalness={0.2} />
      </mesh>

      {/* Ceiling fixtures and the cold light they throw down the aisle */}
      <instancedMesh ref={strips} args={[undefined, undefined, fixtures.length]} frustumCulled={false}>
        <boxGeometry args={[1.8, 0.04, 0.12]} />
        <meshBasicMaterial color={new Color(1.3, 1.9, 2.6)} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={cones} args={[undefined, undefined, fixtures.length]} frustumCulled={false}>
        <coneGeometry args={[1.7, RACK_H + 0.9, 28, 1, true]} />
        <primitive object={coneMat} attach="material" />
      </instancedMesh>
      {/* Lighting lives in the permanent rig (Stage): everything stays in shadow except the hero unit. */}

      <HeroServer />
    </SceneGroup>
  );
}
