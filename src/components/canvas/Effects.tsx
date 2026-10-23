"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  Noise,
  ToneMapping,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction, ToneMappingMode } from "postprocessing";
import { MathUtils, Vector2 } from "three";
import { useStory } from "@/lib/store";
import { RANGE_BY_ID } from "@/lib/story";

type DoF = { bokehScale: number };
type CA = { offset: Vector2 };

/** Camera → laptop screen distance on the hero shot. */
const FOCUS_DISTANCE = 9.5;

/**
 * Post stack. Bloom threshold is high so only emissives and the packet glow;
 * chromatic aberration scales with scroll velocity; depth of field is strongest on the hero
 * shots and fades to nothing after them. The graph is built once and never changes: adding or
 * removing a pass at runtime breaks the composer's MSAA resolve (glBlitFramebuffer errors).
 * Neither DoF nor CA exist on mobile.
 */
export function Effects({ lowPower }: { lowPower: boolean }) {
  const isMobile = useStory((s) => s.isMobile);
  const reduced = useStory((s) => s.reducedMotion);
  const dof = useRef<DoF | null>(null);
  const ca = useRef<CA | null>(null);
  const smooth = useRef(0);

  useFrame((_, delta) => {
    const { progress, velocity } = useStory.getState();
    if (dof.current) {
      // Hero: shallow focus on the screen; relaxes as the packet leaves the desk.
      const r = RANGE_BY_ID.request;
      const heroFade = 1 - MathUtils.smoothstep(progress, RANGE_BY_ID.origin.end, r.start + (r.end - r.start) * 0.45);
      dof.current.bokehScale = 2 * heroFade;
    }
    if (ca.current) {
      // The time-lapse home reads as motion blur: aberration swells through the run.
      const rl = (progress - RANGE_BY_ID.response.start) / (RANGE_BY_ID.response.end - RANGE_BY_ID.response.start);
      const run = Math.sin(Math.PI * MathUtils.clamp(rl / 0.78, 0, 1)) ** 1.5 * (rl >= 0 && rl < 0.8 ? 1 : 0) * 0.003;
      smooth.current = MathUtils.damp(smooth.current, Math.min(Math.min(Math.abs(velocity) * 0.22, 0.003) + run, 0.003), 5, delta);
      ca.current.offset.set(smooth.current, smooth.current * 0.7);
    }
  });

  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <>
        {false ? (
          <DepthOfField ref={dof as never} worldFocusDistance={FOCUS_DISTANCE} worldFocusRange={5} bokehScale={2} resolutionScale={0.4} />
        ) : (
          <></>
        )}
        {isMobile ? <></> : (
        <Bloom
          mipmapBlur
          resolutionScale={0.5}
          levels={isMobile ? 5 : 8}
          luminanceThreshold={isMobile ? 1.4 : 1.3}
          luminanceSmoothing={0.15}
          intensity={isMobile ? 0.5 : 0.8}
          radius={0.72}
        />
        )}
        {false ? <ChromaticAberration ref={ca as never} offset={new Vector2(0, 0)} radialModulation={false} modulationOffset={0} /> : <></>}
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
        <Vignette eskil={false} offset={0.28} darkness={0.78} />
        <></>
      </>
    </EffectComposer>
  );
}
