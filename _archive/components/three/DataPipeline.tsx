"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface DataPipelineProps {
  curve: THREE.CatmullRomCurve3;
  scrollProgress: number;
}

/**
 * DataPipeline
 * ────────────
 * The visible tube/pipeline connecting all three nodes.
 *
 * Renders the CatmullRomCurve3 as a TubeGeometry with a
 * semi-transparent glass-like material. The tube has:
 *
 * - 128 tubular segments (smooth even on close-up)
 * - radius: 0.06 (thin, elegant, not chunky)
 * - radial segments: 12 (round enough for a tube)
 * - MeshPhysicalMaterial with transmission for glass effect
 *
 * The tube is NOT the data flow animation — that's handled
 * by DataPacket. This is purely structural.
 */
export function DataPipeline({ curve, scrollProgress }: DataPipelineProps) {
  const tubeGeometry = useMemo(() => {
    return new THREE.TubeGeometry(
      curve,
      128,   // tubularSegments — high for smooth curves
      0.06,  // radius — thin elegant pipeline
      12,    // radialSegments
      false  // closed
    );
  }, [curve]);

  return (
    <group>
      {/* Main tube — glass material */}
      <mesh geometry={tubeGeometry}>
        <meshPhysicalMaterial
          color="#1a2a3a"
          transparent
          opacity={0.15}
          roughness={0.1}
          metalness={0.3}
          transmission={0.6}
          thickness={0.5}
          envMapIntensity={0.5}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner glow line — a slightly larger tube with additive blending */}
      <mesh geometry={tubeGeometry} scale={[1.01, 1.01, 1.01]}>
        <meshBasicMaterial
          color="#66fcf1"
          transparent
          opacity={0.04}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Energy flow lines — thin wireframe along the tube */}
      <lineSegments>
        <wireframeGeometry args={[tubeGeometry]} />
        <lineBasicMaterial
          color="#66fcf1"
          transparent
          opacity={0.02}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

