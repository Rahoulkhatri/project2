"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";

import { AdditiveBlending, CatmullRomCurve3, Color, InstancedMesh, MathUtils, Object3D, ShaderMaterial, Vector3 } from "three";
import { useStory } from "@/lib/store";
import { inResponse, toLocal } from "@/lib/story";
import { WORLD } from "@/lib/world";
import { SceneGroup, SceneHtml as Html } from "./SceneGroup";
import { CurvePacket } from "./CurvePacket";

const COLS = 12;
const ROWS = 8;
const W = WORLD.edgeWall;
const GAP = new Set(["5,3", "6,3", "5,4", "6,4"]); // opening the request passes through
const HIT = { c: 8, r: 5 };
const MISS = { c: 3, r: 2 };

const cell = (c: number, r: number) => new Vector3(W.x + (c - (COLS - 1) / 2), W.y + (r - (ROWS - 1) / 2), W.z);

const SKY = new Color("#38BDF8");
const LIME = new Color("#A3E635");
const HOT = new Color("#FB923C");
const BASE = new Color("#2a4560");

const scanVert = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const scanFrag = /* glsl */ `
  uniform float uOpacity;
  varying vec2 vUv;
  void main() {
    float x = abs(vUv.x - 0.5) * 2.0;
    float core = exp(-x * x * 90.0);
    float halo = exp(-x * x * 5.0) * 0.28;
    float fade = smoothstep(0.0, 0.12, vUv.y) * smoothstep(1.0, 0.88, vUv.y);
    gl_FragColor = vec4(vec3(0.3, 0.85, 1.4) * (core + halo), (core + halo) * fade * uOpacity);
  }
`;

/** Miss branch: out of the wall's front, through the gap, and deeper into the building. */
const MISS_PATH = (() => {
  const m = cell(MISS.c, MISS.r);
  return new CatmullRomCurve3([
    m.clone().add(new Vector3(0, 0, 0.5)),
    m.clone().add(new Vector3(0.4, 0.5, 1.6)),
    new Vector3(W.x - 0.3, W.y - 0.2, W.z + 1.1),
    new Vector3(W.x, W.y, W.z - 0.2),
    new Vector3(W.x + 0.6, W.y + 0.3, W.z - 4),
    new Vector3(W.x + 3.5, W.y + 1.2, W.z - 9),
  ]);
})();

export function EdgeWall() {
  const isMobile = useStory((s) => s.isMobile);
  const cubes = useRef<InstancedMesh>(null);
  const hitLabel = useRef<HTMLDivElement>(null);
  const missLabel = useRef<HTMLDivElement>(null);
  const scanMesh = useRef<Object3D>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);
  const cells = useMemo(() => {
    const out: { c: number; r: number; x: number; y: number }[] = [];
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) if (!GAP.has(`${c},${r}`)) out.push({ c, r, x: c - (COLS - 1) / 2, y: r - (ROWS - 1) / 2 });
    return out;
  }, []);

  const scanMat = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: scanVert,
        fragmentShader: scanFrag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: { uOpacity: { value: 0 } },
      }),
    [],
  );
  useEffect(() => () => scanMat.dispose(), [scanMat]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const prog = useStory.getState().progress;
    const s = toLocal("edge", prog);
    const fadeOut = inResponse(prog) ? 0 : 1;
    const sweep = MathUtils.smoothstep(s, 0.1, 0.5);
    const scanX = -7.5 + sweep * 15;
    const scanning = s > 0.08 && s < 0.54;
    const hitOn = MathUtils.smoothstep(s, 0.46, 0.54);
    const missOn = MathUtils.smoothstep(s, 0.6, 0.66);

    cells.forEach((cl, i) => {
      const near = scanning ? Math.exp(-((cl.x - scanX) ** 2) / 0.9) : 0;
      const idle = 0.5 + 0.5 * Math.sin(t * 0.9 + cl.c * 0.7 + cl.r * 1.3);
      const isHit = cl.c === HIT.c && cl.r === HIT.r;
      const isMiss = cl.c === MISS.c && cl.r === MISS.r;
      color.copy(BASE).multiplyScalar(0.35 + idle * 0.25);
      color.lerp(SKY, near * 0.9).multiplyScalar(1 + near * 1.4);
      let pop = 1 + near * 0.12;
      if (isHit && hitOn > 0) {
        color.copy(LIME).multiplyScalar(0.5 + hitOn * 3);
        pop = 1 + hitOn * 0.25;
      }
      if (isMiss && missOn > 0) {
        color.lerp(HOT, missOn).multiplyScalar(1 + missOn * 2.2);
        pop = 1 + missOn * 0.18;
      }
      dummy.position.set(cl.x, cl.y, 0);
      dummy.scale.set(pop, pop, 1 + (isHit ? hitOn * 0.5 : 0));
      dummy.updateMatrix();
      cubes.current!.setMatrixAt(i, dummy.matrix);
      cubes.current!.setColorAt(i, color);
    });
    cubes.current!.instanceMatrix.needsUpdate = true;
    cubes.current!.instanceColor!.needsUpdate = true;

    if (scanMesh.current) {
      scanMesh.current.position.x = scanX;
      scanMat.uniforms.uOpacity.value = scanning ? 1 : 0;
    }
    if (hitLabel.current) hitLabel.current.style.opacity = String(hitOn * fadeOut);
    if (missLabel.current) missLabel.current.style.opacity = String(missOn * fadeOut);
  });

  const hitPos = cell(HIT.c, HIT.r).sub(W);
  const missPos = cell(MISS.c, MISS.r).sub(W);

  return (
    <SceneGroup retireAfterRun windows={[["handshake", "balancer"], ["response", "response"]]} pad={0.01}>
      <group position={W}>
        <instancedMesh ref={cubes} args={[undefined, undefined, cells.length]} frustumCulled={false}>
          <boxGeometry args={[0.78, 0.78, 0.5]} />
          <meshBasicMaterial toneMapped={false} />
        </instancedMesh>

        {/* Structure: back panel, frame rails, floor */}
        <mesh position={[0, 0, -0.45]}>
          <boxGeometry args={[12.6, 8.6, 0.2]} />
          <meshStandardMaterial color="#05080d" roughness={0.9} metalness={0.3} />
        </mesh>
        {[-4.45, 4.45].map((y) => (
          <mesh key={y} position={[0, y, 0.05]}>
            <boxGeometry args={[12.8, 0.1, 0.5]} />
            <meshPhysicalMaterial color="#9aa3b2" metalness={1} roughness={0.35} />
          </mesh>
        ))}
        {[-6.45, 6.45].map((x) => (
          <mesh key={x} position={[x, 0, 0.05]}>
            <boxGeometry args={[0.1, 8.9, 0.5]} />
            <meshPhysicalMaterial color="#9aa3b2" metalness={1} roughness={0.35} />
          </mesh>
        ))}

        <mesh ref={scanMesh} position={[0, 0, 0.55]}>
          <planeGeometry args={[1.6, 9]} />
          <primitive object={scanMat} attach="material" />
        </mesh>

        <Html position={[hitPos.x, hitPos.y + 0.5, 0.5]} zIndexRange={[4, 0]} pointerEvents="none">
          <div ref={hitLabel} style={{ opacity: 0 }}>
            <div className="anno">
              <div className="anno-body t-label text-[10px]">
                <div className="text-lime">CACHE HIT</div>
                <div className="text-muted">/home · 2 ms</div>
              </div>
            </div>
          </div>
        </Html>
        <Html position={[missPos.x, missPos.y + 0.5, 0.5]} zIndexRange={[4, 0]} pointerEvents="none">
          <div ref={missLabel} style={{ opacity: 0 }}>
            <div className="anno">
              <div className="anno-body t-label text-[10px]">
                <div style={{ color: "var(--hot)" }}>MISS → ORIGIN</div>
                <div className="text-muted">/products · +46 ms</div>
              </div>
            </div>
          </div>
        </Html>
      </group>

      {!isMobile && (
        <CurvePacket
          curve={MISS_PATH}
          progress={() => useStory.getState().progress}
          getU={(p) => {
            const s = toLocal("edge", p);
            return s > 0.64 && s < 0.97 ? MathUtils.smoothstep(s, 0.64, 0.97) : null;
          }}
          color="#FB923C"
          size={0.14}
          trail={26}
        />
      )}
    </SceneGroup>
  );
}
