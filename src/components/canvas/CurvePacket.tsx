"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  Color,
  EdgesGeometry,
  InstancedMesh,
  MathUtils,
  Object3D,
  Vector3,
  type Group,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useStory } from "@/lib/store";
import { fx } from "@/lib/fx";

type PathLike = { getPoint: (u: number, target: Vector3) => Vector3 };

type Props = {
  curve: PathLike;
  /** Route parameter for this frame, or null to hide the packet. */
  getU: (progress: number) => number | null;
  progress: () => number;
  color: string;
  /** Core edge length in world units before distance compensation. */
  size?: number;
  trail?: number;
  /** +1: the packet moves toward higher u, so the trail lies at lower u. */
  dir?: 1 | -1;
  /** Keep legible from far away: scale by camera distance. */
  compensate?: number;
  intensity?: number;
};

const a = new Vector3();
const b = new Vector3();

/** A glowing packet that rides any curve, with a fading trail of instanced beads. */
export function CurvePacket({ curve, getU, progress, color, size = 0.2, trail = 40, dir = 1, compensate = 0.11, intensity = 3.2 }: Props) {
  const group = useRef<Group>(null);
  const core = useRef<Group>(null);
  const shell = useRef<Group>(null);
  const beads = useRef<InstancedMesh>(null);
  const pos = useMemo(() => new Vector3(), []);
  const dummy = useMemo(() => new Object3D(), []);
  const c = useMemo(() => new Color(color), [color]);
  const tmpColor = useMemo(() => new Color(), []);

  const { coreGeo, shellGeo } = useMemo(
    () => ({
      coreGeo: new RoundedBoxGeometry(size, size, size, 3, size * 0.2),
      shellGeo: new EdgesGeometry(new RoundedBoxGeometry(size * 2.1, size * 2.1, size * 2.1, 1, 0)),
    }),
    [size],
  );
  useEffect(
    () => () => {
      coreGeo.dispose();
      shellGeo.dispose();
    },
    [coreGeo, shellGeo],
  );

  useFrame((state) => {
    const u = getU(progress());
    const show = u !== null;
    if (group.current) group.current.visible = show;
    if (beads.current) beads.current.visible = show;
    if (!show || u === null) return;
    const t = useStory.getState().reducedMotion ? 0 : state.clock.elapsedTime;

    curve.getPoint(u, pos);
    group.current!.position.copy(pos);
    const k = MathUtils.clamp(state.camera.position.distanceTo(pos) * compensate, 1, 6);
    core.current!.scale.setScalar(k);
    core.current!.rotation.set(t * 0.9, t * 1.3, 0);
    shell.current!.scale.setScalar(k * (1 + Math.sin(t * 3) * 0.04));
    shell.current!.rotation.set(-t * 0.5, t * 0.8, t * 0.3);
    fx.packet.on = true;
    fx.packet.intensity = 5 + Math.sin(t * 9) * 1.2;
    fx.packet.position.copy(pos);
    fx.packet.color.copy(c);

    const e = 0.0008;
    const speed = curve.getPoint(Math.min(1, u + e), a).distanceTo(curve.getPoint(Math.max(0, u), b)) / e;
    const step = (size * 0.5 * k) / Math.max(speed, 1e-3);
    for (let i = 0; i < trail; i++) {
      const ui = u - dir * step * (i + 1);
      const f = 1 - (i + 1) / (trail + 1);
      if (ui < 0 || ui > 1) dummy.scale.setScalar(0);
      else {
        curve.getPoint(ui, dummy.position);
        dummy.scale.setScalar(size * 0.26 * k * f ** 1.2);
      }
      dummy.updateMatrix();
      beads.current!.setMatrixAt(i, dummy.matrix);
      beads.current!.setColorAt(i, tmpColor.copy(c).multiplyScalar(0.9 * f * f));
    }
    beads.current!.instanceMatrix.needsUpdate = true;
    if (beads.current!.instanceColor) beads.current!.instanceColor.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={beads} args={[undefined, undefined, trail]} frustumCulled={false} visible={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial toneMapped={false} blending={AdditiveBlending} depthWrite={false} transparent />
      </instancedMesh>
      <group ref={group} visible={false}>
        <group ref={core}>
          <mesh geometry={coreGeo}>
            <meshBasicMaterial color={c.clone().multiplyScalar(intensity)} toneMapped={false} />
          </mesh>
        </group>
        <group ref={shell}>
          <lineSegments geometry={shellGeo}>
            <lineBasicMaterial color={c.clone().multiplyScalar(1.6)} toneMapped={false} transparent opacity={0.85} />
          </lineSegments>
        </group>
      </group>
    </>
  );
}
