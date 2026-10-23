"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, MathUtils, ShaderMaterial, type Group, type Mesh } from "three";
import { pointer } from "@/lib/pointer";

const RADIUS = 3.3;
const TWO_PI = Math.PI * 2;

const vert = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const frag = /* glsl */ `
  uniform float uAngle;
  varying vec2 vP;
  void main() {
    float a = atan(vP.y, vP.x);
    float d = mod(uAngle - a, 6.2831853);
    float tail = exp(-d * 2.4) * step(d, 4.0);
    float line = exp(-d * 90.0);
    float rad = length(vP) / ${RADIUS.toFixed(2)};
    float edge = smoothstep(1.0, 0.92, rad);
    vec3 c = vec3(0.22, 0.74, 0.97) * (tail * 0.55 + line * 2.0);
    gl_FragColor = vec4(c, (tail * 0.5 + line) * edge);
  }
`;

const BLIPS = [
  { a: 0.7, r: 0.55 },
  { a: 2.1, r: 0.8 },
  { a: 3.4, r: 0.4 },
  { a: 4.6, r: 0.7 },
  { a: 5.6, r: 0.3 },
];

/** A radar sweep that pings the slow routes it finds. */
export default function RadarModel({ mobile }: { mobile: boolean }) {
  const group = useRef<Group>(null);
  const blips = useRef<(Mesh | null)[]>([]);
  void mobile;

  const sweep = useMemo(
    () => new ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { uAngle: { value: 0 } } }),
    [],
  );
  useEffect(() => () => sweep.dispose(), [sweep]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const angle = (t * 1.1) % TWO_PI;
    sweep.uniforms.uAngle.value = angle - Math.PI; // atan range is -pi..pi
    const g = group.current!;
    g.rotation.y = MathUtils.damp(g.rotation.y, pointer.nx * 0.4, 3, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, -0.1 + pointer.ny * 0.1, 3, dt);

    BLIPS.forEach((b, i) => {
      const m = blips.current[i];
      if (!m) return;
      // The sweep disc is rotated flat, so local +y maps to world -z: a blip at (cos a, -sin a) sits at shader angle a.
      const since = (((angle - Math.PI - b.a) % TWO_PI) + TWO_PI) % TWO_PI;
      const s = 0.05 + 0.13 * Math.exp(-since * 1.4);
      m.scale.setScalar(s);
      (m.material as { opacity: number }).opacity = 0.25 + 0.75 * Math.exp(-since * 1.2);
    });
  });

  return (
    <group ref={group} rotation={[-0.1, 0, 0]}>
      <group rotation={[0, 0, 0]} position={[0, -0.4, 0]}>
        <mesh>
          <cylinderGeometry args={[RADIUS + 0.1, RADIUS + 0.1, 0.06, 64]} />
          <meshStandardMaterial color="#070c14" metalness={0.6} roughness={0.5} />
        </mesh>
        {[1, 2, 3].map((k) => (
          <mesh key={k} position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[(RADIUS * k) / 3, 0.012, 6, 96]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.35} toneMapped={false} />
          </mesh>
        ))}
        {[0, Math.PI / 2].map((r) => (
          <mesh key={r} position={[0, 0.04, 0]} rotation={[0, r, 0]}>
            <boxGeometry args={[RADIUS * 2, 0.008, 0.012]} />
            <meshBasicMaterial color="#38BDF8" transparent opacity={0.25} toneMapped={false} />
          </mesh>
        ))}
        <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[RADIUS, 64]} />
          <primitive object={sweep} attach="material" />
        </mesh>
        {BLIPS.map((b, i) => (
          <mesh
            key={i}
            ref={(m) => {
              blips.current[i] = m;
            }}
            position={[Math.cos(b.a) * b.r * RADIUS, 0.12, -Math.sin(b.a) * b.r * RADIUS]}
          >
            <sphereGeometry args={[1, 10, 8]} />
            <meshBasicMaterial color={new Color("#A3E635").multiplyScalar(1.3)} transparent toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
