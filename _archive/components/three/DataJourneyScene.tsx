"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { LaptopNode } from "./nodes/LaptopNode";
import { LoadBalancerNode } from "./nodes/LoadBalancerNode";
import { ServerRackNode } from "./nodes/ServerRackNode";
import { DataPipeline } from "./DataPipeline";
import { DataPacket } from "./DataPacket";

interface DataJourneySceneProps {
  scrollProgress: number;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * DataJourneyScene — The Core 3D Scene Graph
 * ═══════════════════════════════════════════════════════════════
 *
 * Architecture:
 * ─────────────
 * This component defines the spatial layout of all 3D elements
 * and manages:
 *
 * 1. NODE POSITIONS
 *    Three fixed positions in Y-space that the camera traverses:
 *    - Top:    y = +5  → Laptop / User Terminal
 *    - Middle: y =  0  → Load Balancer / Network Switch
 *    - Bottom: y = -5  → Server Rack
 *
 * 2. SPLINE PATH (CatmullRomCurve3)
 *    A smooth 3D spline connecting all three nodes.
 *    This curve serves triple duty:
 *    a) Generates the TubeGeometry for the pipeline
 *    b) Provides the path for the data packet animation
 *    c) Provides camera positioning (offset from the spline)
 *
 * 3. CAMERA ANIMATION
 *    Camera position is interpolated along a PARALLEL spline
 *    offset from the data path. The camera always looks at the
 *    current node being approached.
 *
 * 4. SCROLL → ANIMATION MAPPING
 *    scrollProgress (0 → 1) maps directly to:
 *    - curve.getPointAt(t) for data packet position
 *    - camera spline position with smooth lerp
 *    - Node activation states (glow intensity)
 *
 * Coordinate System:
 * ──────────────────
 * - Y axis: vertical flow direction (top → bottom)
 * - Z axis: depth (camera sits in positive Z, looking at origin)
 * - X axis: lateral offsets for visual interest
 */
export function DataJourneyScene({
  scrollProgress,
}: DataJourneySceneProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);

  /**
   * ─── Node Positions ───
   * Defined as constants so every component references the same coords.
   * The slight X offsets create visual depth when the camera moves.
   */
  const nodePositions = useMemo(
    () => ({
      laptop: new THREE.Vector3(0, 5, 0),
      balancer: new THREE.Vector3(1.5, 0, -1),
      server: new THREE.Vector3(-0.5, -5.5, 0),
    }),
    []
  );

  /**
   * ─── Data Path Spline ───
   * CatmullRomCurve3 through all three nodes with intermediate
   * control points for elegant S-curves.
   * Tension: 0.4 gives smooth but not too loose curves.
   */
  const dataCurve = useMemo(() => {
    const points = [
      // Start slightly above the laptop
      new THREE.Vector3(0, 6, 0),
      // Laptop position
      nodePositions.laptop.clone(),
      // Transition: gentle rightward arc
      new THREE.Vector3(1.2, 3, -0.5),
      // Mid-control: creates the S-curve
      new THREE.Vector3(2, 1.5, -1),
      // Load balancer position
      nodePositions.balancer.clone(),
      // Transition: sweep left and down
      new THREE.Vector3(0.5, -2, -0.5),
      // Mid-control: another curve inflection
      new THREE.Vector3(-0.8, -3.5, 0.3),
      // Server position
      nodePositions.server.clone(),
      // End slightly below the server
      new THREE.Vector3(-0.5, -7, 0),
    ];

    return new THREE.CatmullRomCurve3(points, false, "catmullrom", 0.4);
  }, [nodePositions]);

  /**
   * ─── Camera Path Spline ───
   * Offset from the data curve — camera sits at z+10, x+2
   * to give a 3/4 perspective view of the pipeline.
   */
  const cameraCurve = useMemo(() => {
    const cameraPoints = [
      new THREE.Vector3(2, 7, 12),
      new THREE.Vector3(2, 5, 11),
      new THREE.Vector3(3, 3, 10.5),
      new THREE.Vector3(4, 1, 10),
      new THREE.Vector3(3.5, 0, 10),
      new THREE.Vector3(2, -2, 10.5),
      new THREE.Vector3(1, -4, 11),
      new THREE.Vector3(1, -5.5, 10.5),
      new THREE.Vector3(1, -7, 10),
    ];
    return new THREE.CatmullRomCurve3(
      cameraPoints,
      false,
      "catmullrom",
      0.3
    );
  }, []);

  /**
   * ─── Per-Frame Updates ───
   * This runs every frame (~60fps). We:
   * 1. Interpolate camera position along the camera spline
   * 2. Smooth the camera movement with lerp for cinematic feel
   * 3. Point camera at the data packet's approximate position
   */
  const targetCamPos = useRef(new THREE.Vector3(2, 7, 12));
  const targetLookAt = useRef(new THREE.Vector3(0, 5, 0));

  useFrame(() => {
    // Clamp progress to valid range
    const t = THREE.MathUtils.clamp(scrollProgress, 0, 1);

    // Get target camera position from camera spline
    const newCamPos = cameraCurve.getPointAt(t);
    targetCamPos.current.lerp(newCamPos, 0.08);

    // Get look-at target from data spline (where the action is)
    const dataPos = dataCurve.getPointAt(t);
    targetLookAt.current.lerp(dataPos, 0.06);

    // Apply to camera with smooth interpolation
    camera.position.lerp(targetCamPos.current, 0.1);
    camera.lookAt(targetLookAt.current);
  });

  /**
   * ─── Node Activation ───
   * Each node glows based on how close the scroll progress
   * is to its position on the spline.
   */
  const laptopIntensity = useMemo(() => {
    return scrollProgress < 0.4
      ? 1 - scrollProgress / 0.4
      : 0;
  }, [scrollProgress]);

  const balancerIntensity = useMemo(() => {
    if (scrollProgress < 0.25 || scrollProgress > 0.75) return 0;
    if (scrollProgress < 0.5)
      return (scrollProgress - 0.25) / 0.25;
    return 1 - (scrollProgress - 0.5) / 0.25;
  }, [scrollProgress]);

  const serverIntensity = useMemo(() => {
    return scrollProgress > 0.6
      ? (scrollProgress - 0.6) / 0.4
      : 0;
  }, [scrollProgress]);

  return (
    <group ref={groupRef}>
      {/* ═══ THE PIPELINE TUBE ═══ */}
      <DataPipeline curve={dataCurve} scrollProgress={scrollProgress} />

      {/* ═══ THE DATA PACKET (animated along the curve) ═══ */}
      <DataPacket curve={dataCurve} scrollProgress={scrollProgress} />

      {/* ═══ NODE A: Laptop / User Terminal ═══ */}
      <group position={nodePositions.laptop.toArray()}>
        <LaptopNode intensity={laptopIntensity} />
      </group>

      {/* ═══ NODE B: Load Balancer / Network Switch ═══ */}
      <group position={nodePositions.balancer.toArray()}>
        <LoadBalancerNode intensity={balancerIntensity} />
      </group>

      {/* ═══ NODE C: Server Rack ═══ */}
      <group position={nodePositions.server.toArray()}>
        <ServerRackNode intensity={serverIntensity} />
      </group>

      {/* ═══ ENVIRONMENT: Floating Particles ═══ */}
      <AmbientParticles />
    </group>
  );
}

/**
 * AmbientParticles
 * ────────────────
 * Sparse floating particles that add depth to the scene.
 * Uses a BufferGeometry with random positions and a
 * PointsMaterial for efficient rendering.
 */
function AmbientParticles() {
  const particlesRef = useRef<THREE.Points>(null);

  const [positions, count] = useMemo(() => {
    const n = 200;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return [pos, n] as const;
  }, []);

  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    particlesRef.current.rotation.y = clock.elapsedTime * 0.01;
    particlesRef.current.rotation.x =
      Math.sin(clock.elapsedTime * 0.005) * 0.05;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#66fcf1"
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

