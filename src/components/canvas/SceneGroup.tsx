"use client";

import { useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import { useStory } from "@/lib/store";
import { RESPONSE_RUN } from "@/lib/world";
import { RANGE_BY_ID, inResponse, type SceneId } from "@/lib/story";

type Props = {
  /** Inclusive [fromScene, toScene] spans in which the group renders. */
  windows: [SceneId, SceneId][];
  /** Extra global progress kept visible on either side of each span. */
  pad?: number;
  onToggle?: (visible: boolean) => void;
  /** Far scenes retire once the response packet has landed, so the arrival shot stays cheap. */
  retireAfterRun?: boolean;
  children: ReactNode;
};

/**
 * Gates a scene's subtree by story progress. Toggling `visible` (rather than
 * unmounting) keeps programs compiled, so entering a scene never hitches.
 */
export function SceneGroup({ windows, pad = 0.012, onToggle, retireAfterRun, children }: Props) {
  const ref = useRef<Group>(null);
  const visible = useRef<boolean | null>(null);

  const bounds = useMemo(
    () =>
      windows.map(([a, b]) => {
        const end = retireAfterRun && b === "response" ? RANGE_BY_ID.response.start + (RANGE_BY_ID.response.end - RANGE_BY_ID.response.start) * RESPONSE_RUN : RANGE_BY_ID[b].end;
        return [RANGE_BY_ID[a].start - pad, end + pad] as const;
      }),
    [windows, pad, retireAfterRun],
  );

  // Visibility at mount: only groups that are on screen at the current progress take part in the first shader compile.
  const [initial] = useState(() => {
    const p0 = useStory.getState().progress;
    return bounds.some(([s, e]) => p0 >= s && p0 <= e);
  });

  useFrame(() => {
    const p = useStory.getState().progress;
    const next = bounds.some(([s, e]) => p >= s && p <= e);
    if (next === visible.current || !ref.current) return;
    visible.current = next;
    ref.current.visible = next;
    onToggle?.(next);
  });

  return (
    <group ref={ref} visible={initial}>
      {children}
    </group>
  );
}

/** Scene-local 0..1 progress, for use inside useFrame. */
export function sceneProgress(id: SceneId) {
  const r = RANGE_BY_ID[id];
  const t = (useStory.getState().progress - r.start) / (r.end - r.start);
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * drei's Html keeps drawing when its parent group is hidden. This one follows
 * ancestor visibility and, unless `keepInResponse`, retires once the response
 * run starts so the time-lapse stays clean.
 */
export function SceneHtml({ children, keepInResponse, ...props }: ComponentProps<typeof Html> & { keepInResponse?: boolean }) {
  const anchor = useRef<Group>(null);
  const box = useRef<HTMLDivElement>(null);
  const isMobile = useStory((s) => s.isMobile);

  useFrame(() => {
    if (!anchor.current || !box.current) return;
    let visible = true;
    for (let o: Group["parent"] = anchor.current; o; o = o.parent) {
      if (!o.visible) {
        visible = false;
        break;
      }
    }
    if (!keepInResponse && inResponse(useStory.getState().progress)) visible = false;
    const v = visible ? "visible" : "hidden";
    if (box.current.style.visibility !== v) box.current.style.visibility = v;
  });

  // Phones skip the floating tags entirely: the pinned copy says the same, and each one costs a projection per frame.
  if (isMobile) return null;

  return (
    <group ref={anchor}>
      <Html {...props}>
        <div ref={box}>{children}</div>
      </Html>
    </group>
  );
}
