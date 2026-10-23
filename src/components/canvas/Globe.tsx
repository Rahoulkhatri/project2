"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import land from "world-atlas/land-110m.json";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  InstancedMesh,
  LineSegments,
  LineBasicMaterial,
  MathUtils,
  Mesh,
  Object3D,
  Quaternion,
  ShaderMaterial,
  Vector3,
  type Group,
} from "three";
import { useStory } from "@/lib/store";
import { toLocal } from "@/lib/story";
import { EDGE_DIR, KARACHI_DIR, WORLD, arcPoint, onGlobe } from "@/lib/world";
import { SceneGroup, SceneHtml as Html } from "./SceneGroup";

const { center: C, radius: R } = WORLD.globe;
const KARACHI_LL = { lat: 24.86, lon: 67.01 };
const SKY = new Color("#38BDF8");

/* ── Land mask → dot positions ──────────────────────────── */

export function latLonToDir(lat: number, lon: number, out = new Vector3()) {
  const phi = MathUtils.degToRad(90 - lat);
  const theta = MathUtils.degToRad(lon + 180);
  return out.set(-Math.sin(phi) * Math.cos(theta), Math.cos(phi), Math.sin(phi) * Math.sin(theta));
}

/** Rasterise Natural Earth land (equirectangular) and keep Fibonacci points that land on it. */
export function buildLandDots(count: number) {
  const W = 1024;
  const H = 512;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff";
  const topo = land as unknown as Topology;
  const fc = feature(topo, topo.objects.land as never) as unknown as GeoJSON.FeatureCollection | GeoJSON.Feature;
  const polys: number[][][][] = [];
  const collect = (g: GeoJSON.Geometry) => {
    if (g.type === "Polygon") polys.push(g.coordinates);
    else if (g.type === "MultiPolygon") polys.push(...g.coordinates);
    else if (g.type === "GeometryCollection") g.geometries.forEach(collect);
  };
  if (fc.type === "FeatureCollection") fc.features.forEach((f) => collect(f.geometry));
  else collect(fc.geometry);
  for (const poly of polys) {
    ctx.beginPath();
    for (const ring of poly) {
      ring.forEach(([lon, lat], i) => {
        const x = ((lon + 180) / 360) * W;
        const y = ((90 - lat) / 180) * H;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
    }
    ctx.fill("evenodd");
  }
  const data = ctx.getImageData(0, 0, W, H).data;

  const pts: number[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / (count - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const a = golden * i;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const lat = MathUtils.radToDeg(Math.asin(y));
    // Inverse of latLonToDir.
    const lon = MathUtils.radToDeg(Math.atan2(z, -x)) - 180;
    const lonN = ((lon + 540) % 360) - 180;
    const px = Math.min(W - 1, Math.floor(((lonN + 180) / 360) * W));
    const py = Math.min(H - 1, Math.floor(((90 - lat) / 180) * H));
    if (data[(py * W + px) * 4] > 127) pts.push(x, y, z);
  }
  return new Float32Array(pts);
}

/* ── Shaders ────────────────────────────────────────────── */

export const dotsVert = /* glsl */ `
  uniform float uTime;
  uniform float uPx;
  attribute float aSeed;
  varying float vFacing;
  varying float vTw;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vec3 n = normalize(mat3(modelMatrix) * position);
    vec4 mv = viewMatrix * world;
    vec3 toCam = normalize(cameraPosition - world.xyz);
    vFacing = dot(n, toCam);
    vTw = 0.75 + 0.25 * sin(uTime * (0.4 + aSeed) + aSeed * 60.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPx * (0.9 + 0.4 * aSeed) * clamp(46.0 / -mv.z, 1.0, 3.2);
  }
`;
export const dotsFrag = /* glsl */ `
  varying float vFacing;
  varying float vTw;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0) discard;
    float rim = pow(1.0 - clamp(vFacing, 0.0, 1.0), 2.0);
    vec3 base = mix(vec3(0.40, 0.48, 0.60), vec3(0.22, 0.74, 0.97), rim);
    float a = (0.28 + 0.6 * clamp(vFacing, 0.0, 1.0) + 0.5 * rim) * vTw;
    gl_FragColor = vec4(base * 1.0, a * (1.0 - r * r * 0.4));
  }
`;
export const atmoVert = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
export const atmoFrag = /* glsl */ `
  varying vec3 vN; varying vec3 vV;
  void main() {
    float f = pow(1.0 - abs(dot(vN, vV)), 3.2);
    gl_FragColor = vec4(vec3(0.22, 0.74, 0.97) * 1.1, f * 0.55);
  }
`;

/* ── Other users' traffic ───────────────────────────────── */

const CITIES: [number, number][] = [
  [40.7, -74], [51.5, -0.1], [35.7, 139.7], [-23.5, -46.6], [1.35, 103.8], [28.6, 77.2], [-33.9, 151.2],
  [37.8, -122.4], [52.5, 13.4], [19.4, -99.1], [-26.2, 28], [55.7, 37.6], [30, 31.2], [37.6, 127], [6.5, 3.4],
  [25.2, 55.3], [41, 29], [34, -118.2], [48.8, 2.3], [-34.6, -58.4], [22.3, 114.2], [43.7, -79.4], [12.9, 77.6],
];

function useArcs(count: number) {
  return useMemo(() => {
    const arcs: { a: Vector3; b: Vector3; lift: number; speed: number; phase: number }[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      const ca = CITIES[Math.floor(rnd() * CITIES.length)];
      let cb = CITIES[Math.floor(rnd() * CITIES.length)];
      if (cb === ca) cb = CITIES[(CITIES.indexOf(ca) + 5) % CITIES.length];
      arcs.push({
        a: latLonToDir(ca[0], ca[1]),
        b: latLonToDir(cb[0], cb[1]),
        lift: 0.14 + rnd() * 0.22,
        speed: 0.05 + rnd() * 0.07,
        phase: rnd(),
      });
    }
    return arcs;
  }, [count]);
}

/* ── Component ──────────────────────────────────────────── */

export function Globe() {
  const isMobile = useStory((s) => s.isMobile);
  const dotCount = isMobile ? 6000 : 12000;
  const arcCount = isMobile ? 16 : 40;

  const root = useRef<Group>(null);
  const spin = useRef<Group>(null);
  const packets = useRef<InstancedMesh>(null);
  const ring = useRef<Mesh>(null);
  const ring2 = useRef<Mesh>(null);
  const counter = useRef<HTMLSpanElement>(null);
  const labels = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  const arcs = useArcs(arcCount);

  /** Rotation that carries Karachi's lat/lon onto KARACHI_DIR. */
  const orient = useMemo(() => new Quaternion().setFromUnitVectors(latLonToDir(KARACHI_LL.lat, KARACHI_LL.lon), KARACHI_DIR), []);

  const dots = useMemo(() => {
    if (typeof document === "undefined") return null;
    const positions = buildLandDots(dotCount);
    const n = positions.length / 3;
    const seed = new Float32Array(n);
    let rs = 4242;
    for (let i = 0; i < n; i++) seed[i] = (rs = (rs * 16807) % 2147483647) / 2147483647;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    g.scale(R * 1.004, R * 1.004, R * 1.004);
    const m = new ShaderMaterial({
      vertexShader: dotsVert,
      fragmentShader: dotsFrag,
      transparent: true,
      depthWrite: false,
      uniforms: { uTime: { value: 0 }, uPx: { value: 1 } },
    });
    return { g, m };
  }, [dotCount]);

  /** Faint static arcs under the travelling grey packets. */
  const arcLines = useMemo(() => {
    const seg = 48;
    const pos: number[] = [];
    const p0 = new Vector3();
    const p1 = new Vector3();
    arcs.forEach((a) => {
      for (let i = 0; i < seg; i++) {
        arcPoint(a.a, a.b, i / seg, a.lift, p0).sub(C);
        arcPoint(a.a, a.b, (i + 1) / seg, a.lift, p1).sub(C);
        pos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
      }
    });
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    const m = new LineBasicMaterial({ color: "#6a7a90", transparent: true, opacity: 0.1, depthWrite: false });
    return new LineSegments(g, m);
  }, [arcs]);

  const sphereMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: atmoVert,
        fragmentShader: atmoFrag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: BackSide,
      }),
    [],
  );

  useEffect(
    () => () => {
      dots?.g.dispose();
      dots?.m.dispose();
      arcLines.geometry.dispose();
      (arcLines.material as LineBasicMaterial).dispose();
      sphereMat.dispose();
    },
    [dots, arcLines, sphereMat],
  );

  const dummy = useMemo(() => new Object3D(), []);
  const tmp = useMemo(() => new Vector3(), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const { progress } = useStory.getState();
    if (dots) {
      dots.m.uniforms.uTime.value = t;
      dots.m.uniforms.uPx.value = state.gl.getPixelRatio();
    }

    // Grey packets from everyone else.
    arcs.forEach((a, i) => {
      const f = (t * a.speed + a.phase) % 1;
      arcPoint(a.a, a.b, f, a.lift, tmp);
      dummy.position.copy(tmp).sub(C);
      dummy.scale.setScalar(0.07 * (0.6 + 0.8 * Math.sin(Math.PI * f)));
      dummy.updateMatrix();
      packets.current!.setMatrixAt(i, dummy.matrix);
    });
    packets.current!.instanceMatrix.needsUpdate = true;

    // Pulsing rings on the edge node.
    [ring.current, ring2.current].forEach((r, i) => {
      if (!r) return;
      const f = (t * 0.6 + i * 0.5) % 1;
      r.scale.setScalar(0.6 + f * 2.2);
      (r.material as { opacity: number }).opacity = (1 - f) * 0.9;
    });

    // The "requests/sec" counter breathes around 1.2M.
    const s = toLocal("internet", progress);
    if (counter.current && Math.abs(t - lastCount.current) > 0.12) {
      lastCount.current = t;
      const shown = 1.2 + Math.sin(t * 0.9) * 0.012 + Math.sin(t * 3.1) * 0.004;
      counter.current.textContent = `${shown.toFixed(3)}M`;
    }
    if (labels.current) {
      const op = MathUtils.smoothstep(s, 0.12, 0.3) * (1 - MathUtils.smoothstep(s, 0.92, 1));
      labels.current.style.opacity = String(op);
      labels.current.style.display = op > 0.01 ? "block" : "none";
    }
  });

  const karachiPos = useMemo(() => onGlobe(KARACHI_DIR, 0.002).sub(C), []);
  const edgePos = useMemo(() => onGlobe(EDGE_DIR, 0.002).sub(C), []);
  const edgeQuat = useMemo(() => new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), EDGE_DIR), []);

  return (
    <SceneGroup retireAfterRun windows={[["request", "handshake"], ["response", "response"]]} pad={0.02}>
      <group ref={root} position={C}>
        {/* Land dots live in a frame rotated so Karachi sits where the cable lands. */}
        <group ref={spin} quaternion={orient}>
          {dots && <points geometry={dots.g} material={dots.m} frustumCulled={false} />}
          <primitive object={arcLines} />
          <instancedMesh ref={packets} args={[undefined, undefined, arcCount]} frustumCulled={false}>
            <sphereGeometry args={[1, 8, 6]} />
            <meshBasicMaterial color={new Color(0.55, 0.62, 0.72)} transparent opacity={0.55} toneMapped={false} />
          </instancedMesh>
        </group>

        {/* Occluder + atmosphere */}
        <mesh>
          <sphereGeometry args={[R * 0.992, 64, 48]} />
          <meshBasicMaterial color="#05080e" />
        </mesh>
        <mesh scale={1.1}>
          <sphereGeometry args={[R, 64, 48]} />
          <primitive object={sphereMat} attach="material" />
        </mesh>


        {/* Karachi: the user */}
        <group position={karachiPos}>
          <mesh>
            <sphereGeometry args={[0.13, 12, 10]} />
            <meshBasicMaterial color={new Color(2.4, 2.4, 2.4)} toneMapped={false} />
          </mesh>
        </group>

        {/* KHI-1: the edge node. Rings pulse outward on the surface. */}
        <group position={edgePos} quaternion={edgeQuat}>
          <mesh>
            <sphereGeometry args={[0.16, 12, 10]} />
            <meshBasicMaterial color={SKY.clone().multiplyScalar(3)} toneMapped={false} />
          </mesh>
          <mesh ref={ring}>
            <ringGeometry args={[0.46, 0.5, 48]} />
            <meshBasicMaterial color={SKY.clone().multiplyScalar(2)} transparent toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
          </mesh>
          <mesh ref={ring2}>
            <ringGeometry args={[0.46, 0.5, 48]} />
            <meshBasicMaterial color={SKY.clone().multiplyScalar(2)} transparent toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
          </mesh>
        </group>

        <Html position={karachiPos} zIndexRange={[4, 0]} pointerEvents="none">
          <div ref={labels} style={{ display: "none" }}>
            <div className="anno">
              <div className="anno-body t-label text-[10px]">
                <div className="text-ink">ORIGIN / Karachi</div>
                <div className="text-muted">anycast · 198.51.100.7</div>
              </div>
            </div>
          </div>
        </Html>
        <Html position={edgePos} zIndexRange={[4, 0]} pointerEvents="none">
          <div>
            <div className="anno">
              <div className="anno-body t-label text-[10px]">
                <div className="text-ink">
                  <span className="text-sky">KHI-1</span> / EDGE NODE
                </div>
                <div className="text-muted">9 ms · 284 online</div>
              </div>
            </div>
          </div>
        </Html>
        <Html position={[R * 0.1, R * 1.18, 0]} zIndexRange={[4, 0]} pointerEvents="none">
          <div className="hide-xs t-label whitespace-nowrap text-[10px] text-muted">
            <span className="t-display block text-[34px] leading-none text-ink">
              <span ref={counter}>1.200M</span>
            </span>
            requests / sec, worldwide
          </div>
        </Html>
      </group>
    </SceneGroup>
  );
}
