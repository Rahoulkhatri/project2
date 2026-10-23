"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, MathUtils, ShaderMaterial, type Group } from "three";
import { pointer } from "@/lib/pointer";

const R = 3.4;

const vert = /* glsl */ `
  uniform float uTime;
  uniform float uPx;
  uniform float uR;
  attribute vec3 aDir;
  attribute float aSeed;
  varying float vLife;
  void main() {
    float speed = 0.5 + aSeed;
    float life = fract(uTime * 0.16 * speed + aSeed * 7.0);
    float e = 1.0 - pow(1.0 - life, 3.0);
    vec3 p = aDir * e * uR * (0.55 + 0.45 * fract(aSeed * 13.0));
    vLife = life;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPx * (2.0 + 3.2 * (1.0 - life)) * (9.0 / -mv.z);
  }
`;
const frag = /* glsl */ `
  varying float vLife;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    if (r > 1.0) discard;
    vec3 c = mix(vec3(0.22, 0.74, 0.97), vec3(0.64, 0.9, 0.21), smoothstep(0.55, 1.0, vLife));
    gl_FragColor = vec4(c * 1.6, (1.0 - r * r) * (1.0 - vLife * 0.55));
  }
`;

/** One deploy at the centre, streaming out to a shell of nodes. */
export default function FanoutModel({ mobile }: { mobile: boolean }) {
  const group = useRef<Group>(null);
  const wire = useRef<Group>(null);
  const N = mobile ? 700 : 2200;
  const NODES = mobile ? 120 : 284;

  const { geo, mat, nodes } = useMemo(() => {
    const dir = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const golden = Math.PI * (3 - Math.sqrt(5));
    let rs = 7;
    for (let i = 0; i < N; i++) {
      const y = 1 - ((i + 0.5) / N) * 2;
      const r = Math.sqrt(1 - y * y);
      dir.set([Math.cos(golden * i) * r, y, Math.sin(golden * i) * r], i * 3);
      seed[i] = (rs = (rs * 16807) % 2147483647) / 2147483647;
    }
    const geo = new BufferGeometry();
    geo.setAttribute("position", new BufferAttribute(new Float32Array(N * 3), 3));
    geo.setAttribute("aDir", new BufferAttribute(dir, 3));
    geo.setAttribute("aSeed", new BufferAttribute(seed, 1));
    const mat = new ShaderMaterial({ vertexShader: vert, fragmentShader: frag, transparent: true, depthWrite: false, blending: AdditiveBlending, uniforms: { uTime: { value: 0 }, uPx: { value: 1 }, uR: { value: R } } });

    const np = new Float32Array(NODES * 3);
    for (let i = 0; i < NODES; i++) {
      const y = 1 - ((i + 0.5) / NODES) * 2;
      const r = Math.sqrt(1 - y * y);
      np.set([Math.cos(golden * i * 1.7) * r * R, y * R, Math.sin(golden * i * 1.7) * r * R], i * 3);
    }
    const nodes = new BufferGeometry();
    nodes.setAttribute("position", new BufferAttribute(np, 3));
    return { geo, mat, nodes };
  }, [N, NODES]);

  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
      nodes.dispose();
    },
    [geo, mat, nodes],
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    mat.uniforms.uTime.value = t;
    mat.uniforms.uPx.value = state.gl.getPixelRatio();
    const g = group.current!;
    g.rotation.y = MathUtils.damp(g.rotation.y, t * 0.1 + pointer.nx * 0.5, 3, dt);
    g.rotation.x = MathUtils.damp(g.rotation.x, 0.2 - pointer.ny * 0.25, 3, dt);
    wire.current!.rotation.y = -t * 0.6;
    wire.current!.rotation.x = t * 0.35;
  });

  return (
    <group ref={group}>
      <points geometry={geo} material={mat} frustumCulled={false} />
      <points geometry={nodes} frustumCulled={false}>
        <pointsMaterial size={0.05} color="#7B8798" transparent opacity={0.7} sizeAttenuation depthWrite={false} />
      </points>
      <mesh>
        <icosahedronGeometry args={[0.32, 1]} />
        <meshBasicMaterial color="#9fdcff" toneMapped={false} />
      </mesh>
      <group ref={wire}>
        <mesh>
          <icosahedronGeometry args={[0.62, 1]} />
          <meshBasicMaterial color="#38BDF8" wireframe transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}
