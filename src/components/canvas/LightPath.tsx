"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, Color, ShaderMaterial, TubeGeometry, type Mesh } from "three";
import { useStory } from "@/lib/store";
import { IndexedRoute, requestRouteU, responseRouteU } from "@/lib/world";

const vert = /* glsl */ `
  varying float vU;
  varying vec3 vN;
  void main() {
    vU = uv.x;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  uniform float uHead;
  uniform float uDir;
  uniform float uTime;
  uniform vec3 uColor;
  varying float vU;
  varying vec3 vN;
  void main() {
    float behind = (uHead - vU) * uDir;
    float lit = step(0.0, behind);
    // Bright just behind the packet, relaxing to a steady glow along what it has already travelled.
    float tail = exp(-max(behind, 0.0) * 14.0);
    float pulse = 0.5 + 0.5 * sin(vU * 900.0 - uTime * 7.0);
    float base = 0.07;
    float travelled = lit * (0.32 + 0.5 * tail + 0.18 * pulse * (1.0 - tail));
    float edge = 0.55 + 0.45 * abs(vN.z);
    float a = (base + travelled) * edge;
    gl_FragColor = vec4(uColor * (0.8 + 2.4 * tail * lit), a);
  }
`;

/**
 * The cable-like light path: a thin tube along the whole route. Dim where the
 * packet has yet to go, glowing and pulsing where it has been.
 */
export function LightPath({ mode = "request" }: { mode?: "request" | "response" }) {
  const geometry = useMemo(() => new TubeGeometry(new IndexedRoute(), 1100, 0.022, 6, false), []);
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        uniforms: {
          uHead: { value: 0 },
          uDir: { value: mode === "response" ? -1 : 1 },
          uTime: { value: 0 },
          uColor: { value: new Color(mode === "response" ? "#A3E635" : "#38BDF8") },
        },
      }),
    [mode],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  const mesh = useRef<Mesh>(null);

  useFrame((state) => {
    const p = useStory.getState().progress;
    if (mode === "response") {
      const u = responseRouteU(p);
      mesh.current!.visible = u !== null;
      material.uniforms.uHead.value = u ?? 1;
    } else material.uniforms.uHead.value = requestRouteU(p);
    material.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} />;
}
