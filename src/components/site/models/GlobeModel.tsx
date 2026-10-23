"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  Color,
  InstancedMesh,
  LineBasicMaterial,
  LineSegments,
  Object3D,
  Quaternion,
  ShaderMaterial,
  Vector3,
  type Group,
} from "three";
import { REGIONS } from "@/lib/regions";
import { atmoFrag, atmoVert, buildLandDots, dotsFrag, dotsVert, latLonToDir } from "@/components/canvas/Globe";

const R = 2.5;
const Y = new Vector3(0, 1, 0);
const X = new Vector3(1, 0, 0);
const Z = new Vector3(0, 0, 1);
const SKY = new Color("#38BDF8");
const LIME = new Color("#A3E635");

function arc(a: Vector3, b: Vector3, t: number, lift: number, out: Vector3) {
  const omega = Math.acos(Math.min(1, Math.max(-1, a.dot(b))));
  const s = Math.sin(omega) || 1e-6;
  out.copy(a).multiplyScalar(Math.sin((1 - t) * omega) / s).addScaledVector(b, Math.sin(t * omega) / s);
  return out.multiplyScalar(R * (1 + lift * Math.sin(Math.PI * t)));
}

/** A dot-matrix globe with the region pins on it. Drag with a mouse to spin; it idles on its own. */
export default function GlobeModel({ mobile }: { mobile: boolean }) {
  const group = useRef<Group>(null);
  const pins = useRef<InstancedMesh>(null);
  const rings = useRef<InstancedMesh>(null);
  const packets = useRef<InstancedMesh>(null);
  const gl = useThree((s) => s.gl);
  const drag = useRef({ on: false, x: 0, y: 0 });

  const dirs = useMemo(() => REGIONS.map((r) => latLonToDir(r.lat, r.lon)), []);
  const hub = dirs[0]; // Karachi

  const dots = useMemo(() => {
    const positions = buildLandDots(mobile ? 6500 : 14000);
    const n = positions.length / 3;
    const seed = new Float32Array(n);
    let rs = 99;
    for (let i = 0; i < n; i++) seed[i] = (rs = (rs * 16807) % 2147483647) / 2147483647;
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    g.scale(R * 1.004, R * 1.004, R * 1.004);
    const m = new ShaderMaterial({ vertexShader: dotsVert, fragmentShader: dotsFrag, transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uPx: { value: 1 } } });
    return { g, m };
  }, [mobile]);

  const atmo = useMemo(() => new ShaderMaterial({ vertexShader: atmoVert, fragmentShader: atmoFrag, transparent: true, depthWrite: false, blending: AdditiveBlending, side: BackSide }), []);

  const arcLines = useMemo(() => {
    const pos: number[] = [];
    const a = new Vector3();
    const b = new Vector3();
    for (let i = 1; i < dirs.length; i++)
      for (let k = 0; k < 40; k++) {
        arc(hub, dirs[i], k / 40, 0.22, a);
        arc(hub, dirs[i], (k + 1) / 40, 0.22, b);
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      }
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(new Float32Array(pos), 3));
    return new LineSegments(g, new LineBasicMaterial({ color: "#38BDF8", transparent: true, opacity: 0.18, depthWrite: false }));
  }, [dirs, hub]);

  useEffect(() => {
    // Start with Karachi facing the viewer.
    group.current!.quaternion.copy(new Quaternion().setFromUnitVectors(hub, new Vector3(0.1, 0.22, 1).normalize()));
    const o = new Object3D();
    dirs.forEach((d, i) => {
      o.position.copy(d).multiplyScalar(R * 1.012);
      o.quaternion.setFromUnitVectors(Z, d);
      o.scale.setScalar(1);
      o.updateMatrix();
      pins.current!.setMatrixAt(i, o.matrix);
      pins.current!.setColorAt(i, (i === 0 ? LIME : SKY).clone().multiplyScalar(1.5));
    });
    pins.current!.instanceMatrix.needsUpdate = true;
    pins.current!.instanceColor!.needsUpdate = true;

    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      drag.current = { on: true, x: e.clientX, y: e.clientY };
    };
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.on) return;
      group.current!.rotateOnWorldAxis(Y, (e.clientX - d.x) * 0.008);
      group.current!.rotateOnWorldAxis(X, (e.clientY - d.y) * 0.006);
      d.x = e.clientX;
      d.y = e.clientY;
    };
    const up = () => (drag.current.on = false);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      dots.g.dispose();
      dots.m.dispose();
      atmo.dispose();
      arcLines.geometry.dispose();
      (arcLines.material as LineBasicMaterial).dispose();
    };
  }, [gl, dirs, hub, dots, atmo, arcLines]);

  const o = useMemo(() => new Object3D(), []);
  const tmp = useMemo(() => new Vector3(), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    dots.m.uniforms.uTime.value = t;
    dots.m.uniforms.uPx.value = state.gl.getPixelRatio() * 0.8; // the shared shader is sized for the story camera, which is nearer
    if (!drag.current.on) group.current!.rotateOnWorldAxis(Y, dt * 0.1);

    dirs.forEach((d, i) => {
      const f = (t * 0.5 + i * 0.37) % 1;
      o.position.copy(d).multiplyScalar(R * 1.014);
      o.quaternion.setFromUnitVectors(Z, d);
      o.scale.setScalar(0.08 + f * 0.3);
      o.updateMatrix();
      rings.current!.setMatrixAt(i, o.matrix);
    });
    rings.current!.instanceMatrix.needsUpdate = true;

    for (let i = 1; i < dirs.length; i++) {
      const f = (t * 0.22 + i * 0.13) % 1;
      arc(hub, dirs[i], f, 0.22, tmp);
      o.position.copy(tmp);
      o.quaternion.identity();
      o.scale.setScalar(0.045);
      o.updateMatrix();
      packets.current!.setMatrixAt(i - 1, o.matrix);
    }
    packets.current!.instanceMatrix.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <points geometry={dots.g} material={dots.m} frustumCulled={false} />
      <mesh>
        <sphereGeometry args={[R * 0.992, 48, 36]} />
        <meshBasicMaterial color="#05080e" />
      </mesh>
      <mesh scale={1.1}>
        <sphereGeometry args={[R, 48, 36]} />
        <primitive object={atmo} attach="material" />
      </mesh>
      <primitive object={arcLines} />
      <instancedMesh ref={pins} args={[undefined, undefined, REGIONS.length]} frustumCulled={false}>
        <sphereGeometry args={[0.04, 10, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={rings} args={[undefined, undefined, REGIONS.length]} frustumCulled={false}>
        <ringGeometry args={[0.9, 1, 32]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.5} toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
      </instancedMesh>
      <instancedMesh ref={packets} args={[undefined, undefined, REGIONS.length - 1]} frustumCulled={false}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshBasicMaterial color={new Color("#A3E635").multiplyScalar(1.4)} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}
