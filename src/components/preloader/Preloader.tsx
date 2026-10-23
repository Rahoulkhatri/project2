"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useProgress } from "@react-three/drei";
import { useStory } from "@/lib/store";

type BootLine = {
  text: string;
  status?: string;
  tone?: "ok" | "num" | "warn";
  /** Hold this line until the world reports loaded, showing live percent. */
  waitForWorld?: boolean;
  pause?: number;
};

const BOOT: BootLine[] = [
  { text: "kestrel-edge 4.12.0 · build 7f3c2e1 · linux/arm64", pause: 160 },
  { text: "mounting runtime snapshot node22-v8.12", status: "ok", tone: "ok" },
  { text: "resolving edge nodes", status: "284 online", tone: "num", pause: 220 },
  { text: "announcing anycast 198.51.100.0/24", status: "ok", tone: "ok" },
  { text: "handshake TLS 1.3 · X25519 · AES-128-GCM", status: "ok", tone: "ok", pause: 140 },
  { text: "warming cache shards", status: "96/96", tone: "num" },
  { text: "attaching replica pg-khi-02", status: "lag 118ms", tone: "warn" },
  { text: "compiling shaders", status: "done", tone: "ok", waitForWorld: true },
  { text: "ready — tracing GET /products from Karachi, PK", pause: 420 },
];

const toneClass = { ok: "text-lime", num: "text-sky", warn: "text-hot" } as const;

/**
 * Boot log → CRT power-on. Lines type out with real timestamps; the shader
 * line holds until the canvas reports loaded (drei useProgress + first
 * frames). Then the log collapses to a bright scanline that splits open on
 * the world. Any key or click fast-forwards the typing.
 */
export function Preloader() {
  const [gone, setGone] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const log = useRef<HTMLOListElement>(null);
  const pct = useRef<HTMLSpanElement>(null);
  const chrome = useRef<HTMLDivElement>(null);
  const scan = useRef<HTMLDivElement>(null);
  const top = useRef<HTMLDivElement>(null);
  const bottom = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (useStory.getState().booted) {
      // Coming back from another page: the world is already live, skip the boot log.
      const id = window.setTimeout(() => setGone(true), 0);
      return () => window.clearTimeout(id);
    }
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const skip = { on: reduced };
    let cancelled = false;
    const t0 = performance.now();
    const shown = { v: 0 };

    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, skip.on ? 0 : ms));
    const setPct = (target: number) =>
      gsap.to(shown, {
        v: target,
        duration: 0.5,
        ease: "power2.out",
        overwrite: true,
        onUpdate: () => {
          if (pct.current) pct.current.textContent = String(Math.round(shown.v)).padStart(3, "0");
        },
      });

    const worldPercent = () => {
      const { progress, active } = useProgress.getState();
      // No assets in flight: the only work left is first paint.
      return active ? progress : useStory.getState().loaded ? 100 : 92;
    };

    const waitForWorld = (statusEl: HTMLElement) =>
      new Promise<void>((resolve) => {
        const check = () => {
          if (cancelled) return resolve();
          const p = worldPercent();
          statusEl.textContent = `${Math.round(p)}%`;
          // Never hold the intro hostage: after 3.2 s the world simply fades in when it is ready.
          if (useStory.getState().loaded || performance.now() - t0 > 3200) return resolve();
          requestAnimationFrame(check);
        };
        check();
      });

    const powerOn = () => {
      performance.mark("kestrel:power-on");
      const set = useStory.getState().set;
      if (reduced) {
        set({ booted: true });
        gsap.to(root.current, { autoAlpha: 0, duration: 0.5, ease: "power1.out", onComplete: () => setGone(true) });
        return;
      }
      gsap
        .timeline({ onComplete: () => setGone(true) })
        .to(chrome.current, { autoAlpha: 0, y: -10, filter: "blur(6px)", duration: 0.35, ease: "power2.in" })
        .fromTo(scan.current, { scaleX: 0, autoAlpha: 1 }, { scaleX: 1, duration: 0.5, ease: "expo.out" })
        .add(() => set({ booted: true }))
        .to(top.current, { yPercent: -100, duration: 1.2, ease: "expo.inOut" }, "+=0.06")
        .to(bottom.current, { yPercent: 100, duration: 1.2, ease: "expo.inOut" }, "<")
        .to(scan.current, { scaleY: 24, autoAlpha: 0, duration: 0.7, ease: "power3.out" }, "<0.08")
        .fromTo(flash.current, { autoAlpha: 0.14 }, { autoAlpha: 0, duration: 0.9, ease: "power2.out" }, "<");
    };

    async function run() {
      const items = Array.from(log.current?.children ?? []) as HTMLElement[];
      for (let i = 0; i < BOOT.length; i++) {
        if (cancelled) return;
        const line = BOOT[i];
        const el = items[i];
        const stamp = el.querySelector<HTMLElement>("[data-stamp]")!;
        const text = el.querySelector<HTMLElement>("[data-text]")!;
        const status = el.querySelector<HTMLElement>("[data-status]");

        stamp.textContent = `[${((performance.now() - t0) / 1000).toFixed(3).padStart(7, " ")}]`;
        el.style.visibility = "visible";

        for (let c = 0; c <= line.text.length && !skip.on && !cancelled; c += 4) {
          text.textContent = line.text.slice(0, c);
          if (useStory.getState().loaded) skip.on = true;
          await sleep(9);
        }
        text.textContent = line.text;

        if (line.waitForWorld && status) {
          status.style.opacity = "1";
          await waitForWorld(status);
        }
        await sleep((line.pause ?? 90) * 0.4);
        if (status) {
          status.textContent = line.status ?? "";
          status.style.opacity = "1";
        }
        setPct(Math.min(100, ((i + 1) / BOOT.length) * 100));
      }
      await sleep(160);
      if (!cancelled) powerOn();
    }

    const fastForward = () => (skip.on = true);
    window.addEventListener("keydown", fastForward);
    window.addEventListener("pointerdown", fastForward);
    run();

    return () => {
      cancelled = true;
      window.removeEventListener("keydown", fastForward);
      window.removeEventListener("pointerdown", fastForward);
    };
  }, []);

  return (
    <div id="preloader" ref={root} className="fixed inset-0 z-[90]" style={gone ? { visibility: "hidden", pointerEvents: "none" } : undefined} aria-hidden={gone} role="status" aria-live="polite" aria-label="Booting Kestrel edge">
      <div ref={top} className="absolute inset-x-0 top-0 h-1/2 bg-bg" />
      <div ref={bottom} className="absolute inset-x-0 bottom-0 h-1/2 bg-bg" />
      <div ref={flash} className="pointer-events-none invisible absolute inset-0 bg-sky" />

      <div
        ref={scan}
        className="invisible absolute inset-x-0 top-1/2 h-px origin-center bg-ink"
        style={{ boxShadow: "0 0 18px 2px rgba(56,189,248,0.75), 0 0 2px rgba(255,255,255,0.9)" }}
      />

      <div ref={chrome} className="absolute inset-0">
      <div className="t-label absolute inset-x-0 top-0 flex h-[var(--hud-h)] items-center justify-between px-[var(--gutter)] text-muted">
        <span>Kestrel / boot</span>
        <span className="hidden md:inline">tty1 · 115200 baud</span>
      </div>

      <ol
        ref={log}
        className="t-mono absolute bottom-[12vh] left-[var(--gutter)] right-[var(--gutter)] max-w-[680px] space-y-1.5 text-[11px] leading-relaxed text-muted md:bottom-[14vh] md:text-[12.5px]"
      >
        {BOOT.map((line, i) => (
          <li key={i} className="invisible flex min-h-[1.7em] items-baseline whitespace-pre">
            <span data-stamp className="mr-3 text-muted/60" />
            <span data-text className={i === BOOT.length - 1 ? "text-ink" : i === 0 ? "text-ink" : ""} />
            {line.status !== undefined && (
              <>
                <span className="dotted-leader" />
                <span data-status className={`opacity-0 ${toneClass[line.tone ?? "ok"]}`} />
              </>
            )}
            {i === BOOT.length - 1 && <span className="caret ml-1.5" aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="absolute bottom-[12vh] right-[var(--gutter)] hidden items-start gap-2 md:bottom-[14vh] md:flex" aria-hidden>
        <span ref={pct} className="t-display text-[clamp(6rem,15vw,15rem)] font-light tabular-nums leading-[0.78] text-ink/90">
          000
        </span>
        <span className="t-label mt-2 text-muted">%</span>
      </div>

      <p className="t-label absolute bottom-6 right-[var(--gutter)] text-muted/70">press any key to skip</p>
      </div>
    </div>
  );
}
