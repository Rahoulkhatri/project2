"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
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
import { RANGE_BY_ID, toLocal } from "@/lib/story";
import { PACKET_START, ROUTE, requestRouteU } from "@/lib/world";

const TRAIL = 40;
const SKY = new Color("#38BDF8");

const tmpA = new Vector3();
const tmpB = new Vector3();

/** Distance covered per unit of route parameter near u (for even trail spacing). */
function routeSpeed(u: number) {
  const e = 0.0008;
  return ROUTE.getPoint(Math.min(1, u + e), tmpA).distanceTo(ROUTE.getPoint(Math.max(0, u), tmpB)) / e;
}

/** The request packet: bright core, spinning wire shell, point light, fading trail. */
function RequestPacket() {
  const group = useRef<Group>(null);
  const core = useRef<Group>(null);
  const shell = useRef<Group>(null);
  const trail = useRef<InstancedMesh>(null);
  const label = useRef<HTMLDivElement>(null);
  const tmp = useRef(new Vector3()).current;
  const dummy = useMemo(() => new Object3D(), []);
  const color = useMemo(() => new Color(), []);

  const { coreGeo, shellGeo } = useMemo(() => {
    const c = new RoundedBoxGeometry(0.2, 0.2, 0.2, 3, 0.04);
    const s = new EdgesGeometry(new RoundedBoxGeometry(0.34, 0.34, 0.34, 1, 0.0));
    return { coreGeo: c, shellGeo: s };
  }, []);

  useEffect(
    () => () => {
      coreGeo.dispose();
      shellGeo.dispose();
    },
    [coreGeo, shellGeo],
  );

  useFrame((state) => {
    const { progress } = useStory.getState();
    const t = useStory.getState().reducedMotion ? 0 : state.clock.elapsedTime;
    const resStart = RANGE_BY_ID.response.start;
    const show = progress >= PACKET_START && progress < resStart;
    if (group.current) group.current.visible = show;
    if (trail.current) trail.current.visible = show;
    if (!show) return;

    const u = requestRouteU(progress);
    ROUTE.getPoint(u, tmp);
    group.current!.position.copy(tmp);

    // Keep the packet legible at any camera distance.
    const dist = state.camera.position.distanceTo(tmp);
    const k = MathUtils.clamp(dist * 0.11, 1, 5);
    core.current!.scale.setScalar(k);
    core.current!.rotation.set(t * 0.9, t * 1.3, 0);
    shell.current!.scale.setScalar(k * (1 + Math.sin(t * 3) * 0.04));
    shell.current!.rotation.set(-t * 0.5, t * 0.8, t * 0.3);
    fx.packet.on = true;
    fx.packet.intensity = 5 + Math.sin(t * 9) * 1.2;
    fx.packet.position.copy(tmp);
    fx.packet.color.copy(SKY);

    // Trail: points on the route behind the head, spaced evenly in world units.
    const step = (0.09 * k) / Math.max(routeSpeed(u), 1e-3);
    for (let i = 0; i < TRAIL; i++) {
      const ui = u - step * (i + 1);
      const f = 1 - (i + 1) / (TRAIL + 1);
      if (ui < 0) {
        dummy.scale.setScalar(0);
      } else {
        ROUTE.getPoint(ui, dummy.position);
        dummy.scale.setScalar(0.05 * k * f ** 1.2);
      }
      dummy.updateMatrix();
      trail.current!.setMatrixAt(i, dummy.matrix);
      trail.current!.setColorAt(i, color.copy(SKY).multiplyScalar(0.9 * f * f));
    }
    trail.current!.instanceMatrix.needsUpdate = true;
    if (trail.current!.instanceColor) trail.current!.instanceColor.needsUpdate = true;

    // Label shows through the chase, retires as the globe takes over.
    const req = toLocal("request", progress);
    const intl = toLocal("internet", progress);
    const op = MathUtils.smoothstep(req, 0.38, 0.5) * (1 - MathUtils.smoothstep(intl, 0.0, 0.1));
    if (label.current) {
      label.current.style.opacity = String(op);
      label.current.style.display = op > 0.01 ? "block" : "none";
    }
  });

  return (
    <>
      <instancedMesh ref={trail} args={[undefined, undefined, TRAIL]} frustumCulled={false} visible={false}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshBasicMaterial toneMapped={false} blending={AdditiveBlending} depthWrite={false} transparent />
      </instancedMesh>
      <group ref={group} visible={false}>
        <group ref={core}>
          <mesh geometry={coreGeo}>
            <meshBasicMaterial color={SKY.clone().multiplyScalar(2.4)} toneMapped={false} />
          </mesh>
        </group>
        <group ref={shell}>
          <lineSegments geometry={shellGeo}>
            <lineBasicMaterial color={SKY.clone().multiplyScalar(1.6)} toneMapped={false} transparent opacity={0.85} />
          </lineSegments>
        </group>
        <Html position={[0.5, 0.6, 0]} zIndexRange={[4, 0]} pointerEvents="none">
          <div ref={label} style={{ display: "none" }}>
            <div className="anno">
              <div className="anno-body t-label text-[10px]">
                <div className="text-ink">
                  <span className="text-sky">01</span> / HTTP REQUEST
                </div>
                <div className="text-muted">GET /products · 42 bytes headers</div>
              </div>
            </div>
          </div>
        </Html>
      </group>
    </>
  );
}

export function RoutePacket() {
  return (
    <>
      <RequestPacket />
    </>
  );
}
