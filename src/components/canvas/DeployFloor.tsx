"use client";

import { Grid } from "@react-three/drei";
import { SceneGroup } from "./SceneGroup";

/** The calm ending: everything else fades away and the laptop rests on a quiet grid. */
export function DeployFloor() {
  return (
    <SceneGroup windows={[["deploy", "deploy"]]} pad={0.03}>
      <Grid
        position={[0, -0.001, 0]}
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#16202e"
        sectionSize={4}
        sectionThickness={0.9}
        sectionColor="#1f3a52"
        fadeDistance={42}
        fadeStrength={1.6}
      />
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <circleGeometry args={[5.5, 64]} />
        <meshBasicMaterial color="#38BDF8" transparent opacity={0.05} depthWrite={false} toneMapped={false} />
      </mesh>
    </SceneGroup>
  );
}
