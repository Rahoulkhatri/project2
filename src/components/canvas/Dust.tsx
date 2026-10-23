"use client";

import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial, Vector3 } from "three";
import { useStory } from "@/lib/store";

const SIZE = 30;

const vert = /* glsl */ `
  uniform float uTime;
  uniform vec3 uCam;
  uniform float uPx;
  attribute float aSeed;
  varying float vAlpha;
  void main() {
    vec3 p = position;
    p.x += sin(uTime * 0.12 + aSeed * 40.0) * 0.6;
    p.y += sin(uTime * 0.17 + aSeed * 90.0) * 0.5 + uTime * 0.03 * (0.5 + aSeed);
    p.z += cos(uTime * 0.1 + aSeed * 60.0) * 0.6;
    // Wrap into a box that follows the camera, so density is constant everywhere.
    p = mod(p - uCam + ${(SIZE / 2).toFixed(1)}, ${SIZE.toFixed(1)}) - ${(SIZE / 2).toFixed(1)};
    vec4 mv = viewMatrix * vec4(p + uCam, 1.0);
    gl_Position = projectionMatrix * mv;
    float d = length(p);
    vAlpha = smoothstep(1.2, 3.5, d) * (1.0 - smoothstep(4.0, ${(SIZE / 2).toFixed(1)}, d)) * (0.25 + 0.75 * fract(aSeed * 7.0));
    vAlpha *= 0.55 + 0.45 * sin(uTime * (0.6 + aSeed * 1.5) + aSeed * 50.0);
    gl_PointSize = min(uPx * (0.6 + aSeed) * (14.0 / -mv.z), uPx * 9.0);
  }
`;

const frag = /* glsl */ `
  varying float vAlpha;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float a = smoothstep(1.0, 0.0, r);
    gl_FragColor = vec4(vec3(0.62, 0.8, 1.0), a * a * vAlpha * 0.55);
  }
`;

/** Floating motes that follow the camera. Always alive, even when not scrolling. */
export function Dust() {
  const isMobile = useStory((s) => s.isMobile);
  const count = isMobile ? 1 : 600;

  const { geometry, material } = useMemo(() => {
    const g = new BufferGeometry();
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    let rs = 1337;
    const rnd = () => ((rs = (rs * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rnd() - 0.5) * SIZE;
      pos[i * 3 + 1] = (rnd() - 0.5) * SIZE;
      pos[i * 3 + 2] = (rnd() - 0.5) * SIZE;
      seed[i] = rnd();
    }
    g.setAttribute("position", new BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new BufferAttribute(seed, 1));
    const m = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: { uTime: { value: 0 }, uCam: { value: new Vector3() }, uPx: { value: 3 } },
    });
    return { geometry: g, material: m };
  }, [count]);

  useFrame((state) => {
    material.uniforms.uTime.value = useStory.getState().reducedMotion ? 0 : state.clock.elapsedTime;
    material.uniforms.uCam.value.copy(state.camera.position);
    material.uniforms.uPx.value = 3 * state.gl.getPixelRatio();
  });

  return <points geometry={geometry} material={material} frustumCulled={false} />;
}
