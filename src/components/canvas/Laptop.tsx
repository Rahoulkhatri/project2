"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import {
  AdditiveBlending,
  CanvasTexture,
  Color,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SRGBColorSpace,
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
  type Group,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useStory } from "@/lib/store";
import { fx } from "@/lib/fx";
import { PACKET_START, RESPONSE_RUN } from "@/lib/world";
import { RANGE_BY_ID, toLocal } from "@/lib/story";
import { SceneGroup } from "./SceneGroup";

const URL_TEXT = "app.yourstore.com";
const SKY = new Color("#38BDF8");

/* ── Screen texture ─────────────────────────────────────── */

type ScreenState = { typed: number; caret: boolean; sent: boolean; load: number; page: boolean };

/** The page that comes back: a dark storefront in the platform's own palette. */
function drawPage(ctx: CanvasRenderingContext2D, mono: string) {
  const sans = "system-ui, -apple-system, sans-serif";
  ctx.fillStyle = "#0A0F18";
  ctx.fillRect(0, 100, 1024, 540);
  ctx.textBaseline = "middle";
  // Header
  ctx.fillStyle = "#E8EDF5";
  ctx.font = `700 26px ${sans}`;
  ctx.fillText("Meridian", 48, 140);
  ctx.fillStyle = "#7B8798";
  ctx.font = `500 15px ${sans}`;
  ["Shop", "Journal", "Care"].forEach((t, i) => ctx.fillText(t, 560 + i * 90, 140));
  ctx.strokeStyle = "#A3E635";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(840, 122, 136, 36, 18);
  ctx.stroke();
  ctx.fillStyle = "#A3E635";
  ctx.font = `500 14px ${mono}`;
  ctx.fillText("CART · 2", 870, 141);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(48, 176, 928, 1);
  // Headline
  ctx.fillStyle = "#E8EDF5";
  ctx.font = `600 54px ${sans}`;
  ctx.fillText("Quiet tools", 48, 250);
  ctx.fillStyle = "#A3E635";
  ctx.fillText("for long days.", 48, 310);
  ctx.fillStyle = "#7B8798";
  ctx.font = `400 17px ${sans}`;
  ctx.fillText("48 pieces, made to be used for a decade.", 48, 362);
  ctx.fillStyle = "#A3E635";
  ctx.beginPath();
  ctx.roundRect(48, 394, 176, 46, 23);
  ctx.fill();
  ctx.fillStyle = "#0A0F18";
  ctx.font = `600 16px ${sans}`;
  ctx.fillText("Shop the range", 76, 418);
  // Product tiles
  const tiles: [string, string, string][] = [
    ["#A3E635", "Field lamp", "$84"],
    ["#38BDF8", "Task chair", "$420"],
    ["#FB923C", "Planter set", "$56"],
  ];
  tiles.forEach(([accent, name, price], i) => {
    const x = 470 + i * 172;
    ctx.fillStyle = "#0F1724";
    ctx.strokeStyle = "rgba(255,255,255,0.09)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x, 214, 156, 212, 12);
    ctx.fill();
    ctx.stroke();
    const g = ctx.createRadialGradient(x + 78, 296, 4, x + 78, 296, 62);
    g.addColorStop(0, accent);
    g.addColorStop(1, "rgba(10,15,24,0)");
    ctx.fillStyle = g;
    ctx.globalAlpha = 0.55;
    ctx.fillRect(x + 10, 224, 136, 140);
    ctx.globalAlpha = 1;
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.arc(x + 78, 296, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#E8EDF5";
    ctx.font = `500 14px ${sans}`;
    ctx.fillText(name, x + 14, 388);
    ctx.fillStyle = accent;
    ctx.font = `500 13px ${mono}`;
    ctx.fillText(price, x + 14, 410);
  });
  // Status strip with the real number
  ctx.fillStyle = "#060A11";
  ctx.fillRect(0, 596, 1024, 44);
  ctx.fillStyle = "#A3E635";
  ctx.font = `500 14px ${mono}`;
  ctx.fillText("200 OK · 14.2 KB br · served by KHI-1 · 87 ms", 48, 618);
}

function drawScreen(ctx: CanvasRenderingContext2D, s: ScreenState, mono: string) {
  const W = 1024;
  const H = 640;
  ctx.fillStyle = "#070b12";
  ctx.fillRect(0, 0, W, H);

  // Chrome
  ctx.fillStyle = "#0c121c";
  ctx.fillRect(0, 0, W, 96);
  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(0, 95, W, 1);
  [0, 1, 2].forEach((i) => {
    ctx.beginPath();
    ctx.arc(38 + i * 28, 48, 7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(232,237,245,0.16)";
    ctx.fill();
  });

  // Address pill
  const px = 160;
  const pw = 760;
  ctx.fillStyle = "#04070c";
  ctx.strokeStyle = s.typed > 0 ? "rgba(56,189,248,0.55)" : "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(px, 22, pw, 54, 27);
  ctx.fill();
  ctx.stroke();

  // Lock glyph
  ctx.strokeStyle = "#7B8798";
  ctx.lineWidth = 3;
  ctx.strokeRect(px + 26, 46, 16, 12);
  ctx.beginPath();
  ctx.arc(px + 34, 46, 6, Math.PI, 0);
  ctx.stroke();

  ctx.font = `500 30px ${mono}`;
  ctx.textBaseline = "middle";
  const text = URL_TEXT.slice(0, s.typed);
  ctx.fillStyle = "#E8EDF5";
  ctx.fillText(text, px + 62, 51);
  if (s.caret && !s.sent) {
    const cx = px + 62 + ctx.measureText(text).width + 3;
    ctx.fillStyle = "#38BDF8";
    ctx.fillRect(cx, 32, 14, 38);
  }

  // Page area
  if (s.page) {
    drawPage(ctx, mono);
    ctx.fillStyle = "#A3E635";
    ctx.fillRect(0, 96, W, 4);
  } else if (!s.sent) {
    ctx.fillStyle = "rgba(123,135,152,0.55)";
    ctx.font = `400 20px ${mono}`;
    ctx.fillText("new tab", 56, 160);
    ctx.fillStyle = "rgba(255,255,255,0.04)";
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.roundRect(56 + i * 156, 210, 132, 132, 14);
      ctx.fill();
    }
  } else {
    // Request in flight: progress sliver under the chrome + status.
    ctx.fillStyle = "rgba(255,255,255,0.06)";
    ctx.fillRect(0, 96, W, 4);
    ctx.fillStyle = "#38BDF8";
    ctx.fillRect(0, 96, W * Math.min(0.88, s.load * 0.88), 4);
    ctx.fillStyle = "#7B8798";
    ctx.font = `400 22px ${mono}`;
    ctx.fillText("GET /products   HTTP/3", 56, 170);
    ctx.fillStyle = "#38BDF8";
    ctx.fillText("waiting for app.yourstore.com", 56, 210);
  }
}

/* ── Keyboard layout ────────────────────────────────────── */

const ROWS: number[][] = [
  Array(14).fill(1),
  Array(14).fill(1),
  [1.5, ...Array(11).fill(1), 1.5], // last entry is Enter
  [2, ...Array(10).fill(1), 2],
  [1.2, 1.2, 1.2, 5.6, 1.2, 1.2, 1.2],
];
const PITCH = 0.2;
const KEYBOARD_W = 14 * PITCH;
const ROW_Z0 = -0.82;
const ROW_PITCH = 0.21;

type Key = { x: number; z: number; w: number };
const { KEYS, ENTER } = (() => {
  const keys: Key[] = [];
  let enter: Key = { x: 0, z: 0, w: 1.5 };
  ROWS.forEach((row, r) => {
    const sum = row.reduce((a, b) => a + b, 0);
    const k = 14 / sum;
    let cursor = 0;
    row.forEach((w0, i) => {
      const w = w0 * k;
      const key = { x: (cursor + w / 2) * PITCH - KEYBOARD_W / 2, z: ROW_Z0 + r * ROW_PITCH, w };
      cursor += w;
      if (r === 2 && i === row.length - 1) enter = key;
      else keys.push(key);
    });
  });
  return { KEYS: keys, ENTER: enter };
})();

const KEY_H = 0.05;
const KEY_Y = 0.12 + 0.02;

function Keyboard({ pressRef, glowRef }: { pressRef: React.RefObject<Mesh | null>; glowRef: React.RefObject<MeshBasicMaterial | null> }) {
  const caps = useRef<InstancedMesh>(null);
  const glow = useRef<InstancedMesh>(null);
  const capGeo = useMemo(() => new RoundedBoxGeometry(0.17, KEY_H, 0.17, 3, 0.012), []);
  const enterGeo = useMemo(() => new RoundedBoxGeometry(0.17, KEY_H, 0.17, 3, 0.012), []);

  useEffect(() => {
    const o = new Object3D();
    KEYS.forEach((k, i) => {
      o.position.set(k.x, KEY_Y, k.z);
      o.scale.set((k.w * PITCH - 0.03) / 0.17, 1, 1);
      o.updateMatrix();
      caps.current!.setMatrixAt(i, o.matrix);
      o.position.set(k.x, 0.1255, k.z);
      o.scale.set((k.w * PITCH - 0.006) / 0.17, 1, 1);
      o.updateMatrix();
      glow.current!.setMatrixAt(i, o.matrix);
    });
    caps.current!.instanceMatrix.needsUpdate = true;
    glow.current!.instanceMatrix.needsUpdate = true;
    return () => {
      capGeo.dispose();
      enterGeo.dispose();
    };
  }, [capGeo, enterGeo]);

  return (
    <group>
      {/* Backlight tiles sit just under the keycaps, visible as a hairline glow around each. */}
      <instancedMesh ref={glow} args={[undefined, undefined, KEYS.length + 1]} frustumCulled={false}>
        <boxGeometry args={[0.17, 0.004, 0.17]} />
        <meshBasicMaterial ref={glowRef} color={SKY.clone().multiplyScalar(1.6)} toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[capGeo, undefined, KEYS.length]} frustumCulled={false}>
        <meshStandardMaterial color="#0b0f16" metalness={0.15} roughness={0.5} />
      </instancedMesh>
      <mesh ref={pressRef} geometry={enterGeo} position={[ENTER.x, KEY_Y, ENTER.z]} scale={[(ENTER.w * PITCH - 0.03) / 0.17, 1, 1]}>
        <meshStandardMaterial color="#0b0f16" metalness={0.15} roughness={0.5} emissive="#38BDF8" emissiveIntensity={0.25} />
      </mesh>
    </group>
  );
}

/* ── Laptop ─────────────────────────────────────────────── */

const LID_ANGLE = -0.32;
const SCREEN_W = 2.95;
const SCREEN_H = 1.85;

function useScreen() {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 640;
    const ctx = canvas.getContext("2d")!;
    const tex = new CanvasTexture(canvas);
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = 8;
    return { canvas, ctx, tex };
  }, []);
}

/** Cumulative typing times with a human-ish rhythm. */
const TYPE_TIMES = (() => {
  let t = 0;
  return Array.from(URL_TEXT, (_, i) => (t += 0.07 + 0.06 * Math.abs(Math.sin(i * 12.9898) * 43758.5453 % 1)));
})();

/**
 * Projects the lid-top anchor to the screen and moves the DOM tag `#laptop-tag`
 * (rendered in Experience) onto it. Plain DOM, so it can't be starved by the canvas.
 */
const TAG_ANCHOR = new Vector3(0.2, 2.35, -1.45);
const tagNdc = new Vector3();

export function LaptopTag() {
  useFrame((state) => {
    const el = document.getElementById("laptop-tag");
    if (!el) return;
    const { progress, booted } = useStory.getState();
    const req = toLocal("request", progress);
    const op = booted ? 1 - MathUtils.smoothstep(req, 0.05, 0.25) : 0;
    tagNdc.copy(TAG_ANCHOR).project(state.camera);
    const x = (tagNdc.x * 0.5 + 0.5) * state.size.width;
    const y = (-tagNdc.y * 0.5 + 0.5) * state.size.height;
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    el.style.opacity = String(tagNdc.z < 1 ? op : 0);
  });
  return null;
}

export function Laptop() {
  const screen = useScreen();
  const lastKey = useRef("");
  const bootAt = useRef<number | null>(null);
  const flash = useRef<Mesh>(null);
  const flashMat = useRef<MeshBasicMaterial>(null);
  const enter = useRef<Mesh>(null);
  const glowMat = useRef<MeshBasicMaterial>(null);
  const screenMat = useRef<MeshBasicMaterial>(null);
  const led = useRef<MeshBasicMaterial>(null);
  const mono = useRef("ui-monospace, monospace");
  const group = useRef<Group>(null);

  const cable = useMemo(
    () =>
      new TubeGeometry(
        new CatmullRomCurve3([
          new Vector3(-1.62, 0.07, 0.35),
          new Vector3(-2.1, 0.02, 0.55),
          new Vector3(-2.9, 0.014, 0.35),
          new Vector3(-3.8, 0.014, 0.95),
          new Vector3(-5.2, 0.014, 0.1),
        ]),
        60,
        0.016,
        8,
      ),
    [],
  );

  useEffect(() => {
    const v = getComputedStyle(document.body).getPropertyValue("--font-geist-mono").trim();
    if (v) mono.current = `${v}, ui-monospace, monospace`;
    document.fonts.ready.then(() => (lastKey.current = ""));
    return () => {
      screen?.tex.dispose();
      cable.dispose();
    };
  }, [screen, cable]);

  useFrame((state) => {
    const { progress, booted, reducedMotion } = useStory.getState();
    const t = state.clock.elapsedTime;
    if (booted && bootAt.current === null) bootAt.current = t;

    const req = toLocal("request", progress);
    const typedByTime = bootAt.current === null ? 0 : TYPE_TIMES.filter((x) => t - bootAt.current! - 0.9 > x).length;
    const rushed = progress > RANGE_BY_ID.origin.start + (RANGE_BY_ID.origin.end - RANGE_BY_ID.origin.start) * 0.55;
    const typed = reducedMotion || rushed || progress > RANGE_BY_ID.request.start ? URL_TEXT.length : typedByTime;
    const sent = progress >= PACKET_START - 0.003;
    const page = progress >= RANGE_BY_ID.response.start && toLocal("response", progress) >= RESPONSE_RUN;
    const load = MathUtils.clamp((req - 0.3) / 0.7, 0, 1);

    if (screen) {
      const caret = Math.floor(t * 2) % 2 === 0;
      const key = `${typed}|${caret}|${sent}|${Math.round(load * 40)}|${page}`;
      if (key !== lastKey.current) {
        lastKey.current = key;
        drawScreen(screen.ctx, { typed, caret: caret && !page, sent, load, page }, mono.current);
        screen.tex.needsUpdate = true;
      }
    }

    // The page powers on over a short stretch of scroll instead of snapping to full brightness.
    if (screenMat.current) {
      const rl = toLocal("response", progress);
      const gain = page ? MathUtils.smoothstep(rl, RESPONSE_RUN, RESPONSE_RUN + 0.07) * 0.92 : 1;
      screenMat.current.color.setScalar(Math.max(gain, page ? 0.02 : 1));
    }

    // Enter is pressed, flash, packet leaves — all inside request 0.24 → 0.36.
    const press = MathUtils.clamp((req - 0.24) / 0.05, 0, 1) * (1 - MathUtils.clamp((req - 0.33) / 0.05, 0, 1));
    const spike = Math.sin(Math.PI * MathUtils.clamp((req - 0.27) / 0.1, 0, 1)) ** 2;

    if (enter.current) enter.current.position.y = KEY_Y - 0.032 * press;
    if (flashMat.current) flashMat.current.opacity = spike * 0.85;
    if (flash.current) flash.current.visible = spike > 0.002;
    fx.screen = 0.07 + spike * 2.2 + (sent ? 0.06 : 0) + Math.sin(t * 1.3) * 0.006;
    if (glowMat.current) glowMat.current.color.copy(SKY).multiplyScalar(1.5 + Math.sin(t * 1.1) * 0.25 + spike * 1.5);
    if (led.current) led.current.color.copy(SKY).multiplyScalar(1.2 + Math.sin(t * 2.4) * 0.9);
  });

  return (
    <SceneGroup
      windows={[
        ["origin", "request"],
        ["response", "deploy"],
      ]}
    >
      <group ref={group}>
        {/* Chassis */}
        <RoundedBox args={[3.2, 0.12, 2.2]} radius={0.045} smoothness={5} position={[0, 0.06, 0]} bevelSegments={4}>
          <meshStandardMaterial color="#9aa3b2" metalness={1} roughness={0.34} />
        </RoundedBox>
        {/* Keyboard well + deck inset */}
        <RoundedBox args={[3.0, 0.012, 1.3]} radius={0.01} smoothness={3} position={[0, 0.121, -0.42]}>
          <meshStandardMaterial color="#05080d" metalness={0.6} roughness={0.7} />
        </RoundedBox>
        <Keyboard pressRef={enter} glowRef={glowMat} />
        {/* Trackpad */}
        <RoundedBox args={[1.15, 0.008, 0.75]} radius={0.03} smoothness={4} position={[0, 0.123, 0.68]}>
          <meshStandardMaterial color="#8d97a7" metalness={1} roughness={0.22} />
        </RoundedBox>
        {/* Front lip notch + status LED */}
        <mesh position={[0, 0.07, 1.101]}>
          <planeGeometry args={[0.28, 0.02]} />
          <meshBasicMaterial ref={led} color="#38BDF8" toneMapped={false} />
        </mesh>
        {/* Port slots */}
        {[0.2, 0.42].map((z) => (
          <mesh key={z} position={[-1.601, 0.06, z]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[0.16, 0.035]} />
            <meshBasicMaterial color="#010203" />
          </mesh>
        ))}
        {/* Rubber feet */}
        {[[-1.4, -0.95], [1.4, -0.95], [-1.4, 0.95], [1.4, 0.95]].map(([x, z]) => (
          <mesh key={`${x}${z}`} position={[x, 0.004, z]}>
            <cylinderGeometry args={[0.07, 0.07, 0.008, 16]} />
            <meshStandardMaterial color="#05070b" roughness={0.9} />
          </mesh>
        ))}

        {/* Hinge barrel */}
        <mesh position={[0, 0.12, -1.07]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.055, 0.055, 2.7, 24]} />
          <meshStandardMaterial color="#1b2230" metalness={1} roughness={0.28} />
        </mesh>
        {[-1.35, 1.35].map((x) => (
          <mesh key={x} position={[x, 0.12, -1.07]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.065, 0.065, 0.1, 24]} />
            <meshStandardMaterial color="#aab2bf" metalness={1} roughness={0.3} />
          </mesh>
        ))}

        {/* Lid */}
        <group position={[0, 0.12, -1.07]} rotation={[LID_ANGLE, 0, 0]}>
          <RoundedBox args={[3.2, 2.1, 0.07]} radius={0.03} smoothness={5} position={[0, 1.07, 0]}>
            <meshStandardMaterial color="#9aa3b2" metalness={1} roughness={0.34} />
          </RoundedBox>
          <RoundedBox args={[3.12, 2.02, 0.012]} radius={0.015} smoothness={3} position={[0, 1.07, 0.04]}>
            <meshStandardMaterial color="#020306" roughness={0.3} metalness={0.2} />
          </RoundedBox>
          <mesh position={[0, 1.07 + SCREEN_H / 2 + 0.045, 0.0465]}>
            <circleGeometry args={[0.013, 16]} />
            <meshBasicMaterial color="#1c2535" />
          </mesh>
          <mesh position={[0, 1.07 - 0.02, 0.0475]}>
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial ref={screenMat} map={screen?.tex} toneMapped={false} />
          </mesh>
          {/* Enter flash */}
          <mesh ref={flash} position={[0, 1.07 - 0.02, 0.0485]} visible={false}>
            <planeGeometry args={[SCREEN_W, SCREEN_H]} />
            <meshBasicMaterial ref={flashMat} color={new Color(0.7, 1.4, 2.2)} transparent opacity={0} toneMapped={false} depthWrite={false} blending={AdditiveBlending} />
          </mesh>
        </group>

        {/* USB-C cable lying on the desk */}
        <mesh geometry={cable}>
          <meshStandardMaterial color="#0b0e14" roughness={0.55} />
        </mesh>
      </group>
    </SceneGroup>
  );
}
