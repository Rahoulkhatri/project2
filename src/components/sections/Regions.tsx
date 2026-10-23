"use client";

import { useEffect, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import land from "world-atlas/land-110m.json";
import { useReducedMotion } from "@/lib/use-reduced-motion";
import { REGIONS } from "@/lib/regions";

const W = 1000;
const H = 500;

/** Paint Natural Earth land as a dot matrix onto a canvas. */
function paintLand(canvas: HTMLCanvasElement) {
  const mask = document.createElement("canvas");
  mask.width = W;
  mask.height = H;
  const m = mask.getContext("2d", { willReadFrequently: true })!;
  m.fillStyle = "#fff";
  const topo = land as unknown as Topology;
  const fc = feature(topo, topo.objects.land as never) as unknown as GeoJSON.Feature | GeoJSON.FeatureCollection;
  const polys: number[][][][] = [];
  const collect = (g: GeoJSON.Geometry) => {
    if (g.type === "Polygon") polys.push(g.coordinates);
    else if (g.type === "MultiPolygon") polys.push(...g.coordinates);
    else if (g.type === "GeometryCollection") g.geometries.forEach(collect);
  };
  if (fc.type === "FeatureCollection") fc.features.forEach((f) => collect(f.geometry));
  else collect(fc.geometry);
  for (const poly of polys) {
    m.beginPath();
    for (const ring of poly) {
      ring.forEach(([lon, lat], i) => {
        const x = ((lon + 180) / 360) * W;
        const y = ((90 - lat) / 180) * H;
        if (i === 0) m.moveTo(x, y);
        else m.lineTo(x, y);
      });
      m.closePath();
    }
    m.fill("evenodd");
  }
  const data = m.getImageData(0, 0, W, H).data;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "rgba(123,135,152,0.55)";
  const step = 8;
  for (let y = step / 2; y < H; y += step)
    for (let x = step / 2; x < W; x += step) {
      if (data[(Math.floor(y) * W + Math.floor(x)) * 4] > 127) {
        ctx.beginPath();
        ctx.arc(x, y, 1.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
}

export function Regions() {
  const reduced = useReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [lat, setLat] = useState<Record<string, number>>(() => Object.fromEntries(REGIONS.map((r) => [r.code, r.p50])));

  useEffect(() => {
    if (canvas.current) paintLand(canvas.current);
  }, []);

  // Live-looking latency: small, bounded jitter around each region's median.
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => {
      setLat(Object.fromEntries(REGIONS.map((r) => [r.code, Math.max(3, r.p50 + Math.round((Math.random() - 0.5) * 3))])));
    }, 1400);
    return () => window.clearInterval(id);
  }, [reduced]);

  return (
    <section id="regions" aria-labelledby="regions-h" className="relative border-t border-line px-[var(--gutter)] py-[14vh]">
      <div className="grid grid-cols-1 gap-y-12 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-7 lg:row-start-1">
          <p className="t-label flex items-center gap-3 text-muted">
            <span className="text-sky">11</span>
            <span className="h-px w-8 bg-line-strong" />
            <span>Regions</span>
          </p>
          <h2 id="regions-h" className="t-display mt-6 max-w-[14ch] text-[clamp(2.4rem,5.4vw,5.6rem)] text-ink">
            Close enough to feel local.
          </h2>
          <div className="relative mt-10 aspect-[2/1] w-full border border-line bg-panel/40">
            <canvas ref={canvas} width={W} height={H} className="absolute inset-0 h-full w-full" aria-hidden />
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 h-full w-full" role="img" aria-label="Map of twelve featured Kestrel regions">
              {REGIONS.map((r) => {
                const x = ((r.lon + 180) / 360) * W;
                const y = ((90 - r.lat) / 180) * H;
                const on = active === r.code;
                return (
                  <g key={r.code} onPointerEnter={() => setActive(r.code)} onPointerLeave={() => setActive(null)} style={{ opacity: active && !on ? 0.35 : 1, transition: "opacity .3s" }}>
                    {(on || (!active && !reduced)) && (
                      <circle cx={x} cy={y} r="5" fill="none" stroke="var(--sky)" strokeWidth="1.2" className={on ? "region-pulse-fast" : "region-pulse"} style={{ transformOrigin: `${x}px ${y}px`, animationDelay: on ? "0s" : `${(r.lon + 180) % 3}s` }} />
                    )}
                    <circle cx={x} cy={y} r={on ? 6 : 4} fill={on ? "var(--lime)" : "var(--sky)"} />
                    {on && (
                      <text x={x + 10} y={y - 8} fontSize="15" fill="var(--ink)" fontFamily="var(--font-geist-mono)">
                        {r.code} · {lat[r.code]} ms
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <div className="lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:pt-28">
          <p className="t-label mb-3 flex justify-between text-muted">
            <span>Featured regions</span>
            <span>p50 TTFB</span>
          </p>
          <ul>
            {REGIONS.map((r) => (
              <li key={r.code}>
                <button
                  type="button"
                  onPointerEnter={() => setActive(r.code)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(r.code)}
                  onBlur={() => setActive(null)}
                  className={`flex min-h-[44px] w-full items-baseline gap-4 border-t border-line py-2.5 text-left transition-colors duration-300 last:border-b ${
                    active === r.code ? "text-ink" : "text-muted"
                  }`}
                >
                  <span className={`t-mono w-10 text-[12px] ${active === r.code ? "text-lime" : "text-sky"}`}>{r.code}</span>
                  <span className="t-display text-[1.15rem] tracking-[-0.01em]">{r.city}</span>
                  <span className="t-label hidden sm:inline">{r.nodes} nodes</span>
                  <span className="t-mono ml-auto text-[13px] tabular-nums text-ink">{lat[r.code]} ms</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="t-label mt-4 text-muted">+ 272 more locations across 61 countries</p>
        </div>
      </div>
    </section>
  );
}
