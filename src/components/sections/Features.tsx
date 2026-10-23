"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useReducedMotion } from "@/lib/use-reduced-motion";

type Spec = { value: string; label: string };
type Feature = {
  id: string;
  name: string;
  blurb: string;
  specs: [Spec, Spec, Spec];
  art: (still: boolean) => ReactNode;
};

const S = "var(--sky)";
const L = "var(--lime)";
const H = "var(--hot)";
const LINE = "rgba(255,255,255,0.14)";

/** Looping SVG figures. Each is a small diagram of the mechanism, not decoration. */
const art = {
  runtime: (still: boolean) => (
    <svg viewBox="0 0 320 120" className="h-full w-full" role="img" aria-label="A function boots from a snapshot in 38 milliseconds">
      <rect x="10" y="20" width="300" height="1" fill={LINE} />
      <rect x="10" y="100" width="300" height="1" fill={LINE} />
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={20 + i * 42} y={36} width="34" height="48" fill="none" stroke={LINE} />
      ))}
      <rect x="20" y="36" width="34" height="48" fill={S} opacity="0.9">
        {!still && <animate attributeName="x" values="20;62;104;146;188;230;20" keyTimes="0;.12;.24;.36;.48;.6;1" dur="4s" repeatCount="indefinite" />}
      </rect>
      <rect x="236" y="36" width="64" height="48" fill="none" stroke={L} />
      <text x="268" y="64" textAnchor="middle" fontSize="11" fill={L} fontFamily="var(--font-geist-mono)">
        38 ms
      </text>
      <rect x="10" y="108" width="0" height="2" fill={L}>
        {!still && <animate attributeName="width" values="0;300;300;0" keyTimes="0;.6;.9;1" dur="4s" repeatCount="indefinite" />}
      </rect>
    </svg>
  ),
  cache: (still: boolean) => (
    <svg viewBox="0 0 320 120" className="h-full w-full" role="img" aria-label="A scan line sweeps a grid of cache shards and finds a hit">
      {Array.from({ length: 6 }, (_, r) =>
        Array.from({ length: 16 }, (_, c) => (
          <rect key={`${r}${c}`} x={14 + c * 18.5} y={12 + r * 17} width="14" height="12" fill={r === 3 && c === 10 ? L : "rgba(56,189,248,0.16)"} />
        )),
      )}
      <rect x="14" y="6" width="3" height="108" fill={S}>
        {!still && <animate attributeName="x" values="14;300;14" dur="3.6s" repeatCount="indefinite" />}
      </rect>
      <rect x={14 + 10 * 18.5 - 2} y={12 + 3 * 17 - 2} width="18" height="16" fill="none" stroke={L}>
        {!still && <animate attributeName="opacity" values="0;0;1;1;0" keyTimes="0;.55;.62;.9;1" dur="3.6s" repeatCount="indefinite" />}
      </rect>
    </svg>
  ),
  routing: (still: boolean) => (
    <svg viewBox="0 0 320 120" className="h-full w-full" role="img" aria-label="A request takes the shortest of several paths to the nearest node">
      <path d="M30 90 C 90 20, 150 20, 210 60 S 280 80 296 30" fill="none" stroke={LINE} />
      <path d="M30 90 C 100 100, 200 110, 296 30" fill="none" stroke={LINE} strokeDasharray="3 4" />
      {[[30, 90], [210, 60], [296, 30]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5" fill="var(--bg)" stroke={i === 2 ? L : S} strokeWidth="1.5" />
      ))}
      <circle r="4" fill={S}>
        {!still && <animateMotion dur="3s" repeatCount="indefinite" path="M30 90 C 90 20, 150 20, 210 60 S 280 80 296 30" />}
      </circle>
      <text x="30" y="110" fontSize="10" fill="var(--muted)" fontFamily="var(--font-geist-mono)">
        user
      </text>
      <text x="268" y="18" fontSize="10" fill={L} fontFamily="var(--font-geist-mono)">
        KHI-1 · 9 ms
      </text>
    </svg>
  ),
  postgres: (still: boolean) => (
    <svg viewBox="0 0 320 120" className="h-full w-full" role="img" aria-label="A query scans down a stack of database tables">
      {Array.from({ length: 6 }, (_, i) => (
        <ellipse key={i} cx="160" cy={100 - i * 14} rx="70" ry="9" fill="rgba(56,189,248,0.08)" stroke={S} strokeOpacity="0.5" />
      ))}
      <ellipse cx="160" cy="16" rx="70" ry="9" fill="none" stroke={L} strokeWidth="2">
        {!still && <animate attributeName="cy" values="16;100;16" dur="3.2s" repeatCount="indefinite" />}
      </ellipse>
      <text x="250" y="22" fontSize="10" fill="var(--muted)" fontFamily="var(--font-geist-mono)">
        replica
      </text>
      <text x="14" y="104" fontSize="10" fill={L} fontFamily="var(--font-geist-mono)">
        6 ms
      </text>
    </svg>
  ),
  observability: (still: boolean) => (
    <svg viewBox="0 0 320 120" className="h-full w-full" role="img" aria-label="A latency chart with a moving cursor and one slow outlier">
      <polyline fill="none" stroke={S} strokeWidth="1.5" points="10,80 40,72 70,76 100,60 130,66 160,50 190,58 220,30 250,56 280,48 310,52" />
      <circle cx="220" cy="30" r="4" fill="none" stroke={H} />
      <text x="228" y="26" fontSize="10" fill={H} fontFamily="var(--font-geist-mono)">
        p99 spike
      </text>
      <line x1="10" y1="100" x2="310" y2="100" stroke={LINE} />
      <line x1="10" y1="10" x2="10" y2="100" stroke={L} strokeWidth="1.5">
        {!still && <animate attributeName="x1" values="10;310;10" dur="4s" repeatCount="indefinite" />}
        {!still && <animate attributeName="x2" values="10;310;10" dur="4s" repeatCount="indefinite" />}
      </line>
    </svg>
  ),
  rollbacks: (still: boolean) => (
    <svg viewBox="0 0 320 120" className="h-full w-full" role="img" aria-label="Deployment history with the live pointer stepping back to the previous build">
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x={22 + i * 58} y="50" width="46" height="26" fill={i === 4 ? "rgba(251,146,60,0.2)" : "rgba(56,189,248,0.12)"} stroke={i === 4 ? H : S} strokeOpacity="0.7" />
          <text x={45 + i * 58} y="67" textAnchor="middle" fontSize="10" fill="var(--ink)" fontFamily="var(--font-geist-mono)">
            {`#${204 + i}`}
          </text>
        </g>
      ))}
      <path d="M0 0 L8 0 L4 8 Z" fill={L} transform="translate(241 30)">
        {!still && <animateTransform attributeName="transform" type="translate" values="241 30;241 30;183 30;183 30;241 30" keyTimes="0;.3;.45;.85;1" dur="4s" repeatCount="indefinite" />}
      </path>
      <text x="22" y="104" fontSize="10" fill="var(--muted)" fontFamily="var(--font-geist-mono)">
        live pointer · switch in 0.8 s
      </text>
    </svg>
  ),
};

const FEATURES: Feature[] = [
  {
    id: "runtime",
    name: "Edge Runtime",
    blurb: "Functions boot from a pre-warmed V8 snapshot inside a Firecracker microVM, in the same building as the cache.",
    specs: [
      { value: "38 ms", label: "cold start, p50" },
      { value: "4 GB", label: "max memory per instance" },
      { value: "30 s", label: "max request duration" },
    ],
    art: art.runtime,
  },
  {
    id: "cache",
    name: "Smart Cache",
    blurb: "A tiered cache that collapses identical misses into a single origin fetch and refills on the way back.",
    specs: [
      { value: "94.1%", label: "hit ratio, last 24 h" },
      { value: "2 ms", label: "hit latency, p50" },
      { value: "96", label: "shards per location" },
    ],
    art: art.cache,
  },
  {
    id: "routing",
    name: "Global Routing",
    blurb: "One anycast IP announced from every location. BGP does the first hop, queue depth does the second.",
    specs: [
      { value: "284", label: "locations online" },
      { value: "9 ms", label: "median first-hop RTT" },
      { value: "61", label: "countries with a node" },
    ],
    art: art.routing,
  },
  {
    id: "postgres",
    name: "Managed Postgres",
    blurb: "Postgres 16 with read replicas in the same metro as your users. Writes go home; reads stay local.",
    specs: [
      { value: "6 ms", label: "indexed read, replica" },
      { value: "120 ms", label: "max replica lag" },
      { value: "30 d", label: "point-in-time recovery" },
    ],
    art: art.postgres,
  },
  {
    id: "observability",
    name: "Observability",
    blurb: "Every request is traced from the first byte to the last, with the cache, runtime and database spans attached.",
    specs: [
      { value: "100%", label: "requests traced" },
      { value: "250 ms", label: "metric resolution" },
      { value: "30 d", label: "log retention" },
    ],
    art: art.observability,
  },
  {
    id: "rollbacks",
    name: "Instant Rollbacks",
    blurb: "Every deploy is immutable. Rolling back moves a pointer, so it takes effect everywhere at once.",
    specs: [
      { value: "0.8 s", label: "global propagation" },
      { value: "50", label: "builds retained" },
      { value: "0", label: "dropped requests" },
    ],
    art: art.rollbacks,
  },
];

export function Features() {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const f = FEATURES[active];

  const onKey = (e: KeyboardEvent) => {
    const next =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? (active + 1) % FEATURES.length
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? (active - 1 + FEATURES.length) % FEATURES.length
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? FEATURES.length - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    setActive(next);
    tabs.current[next]?.focus();
  };

  return (
    <section id="features" aria-labelledby="features-h" className="relative border-t border-line px-[var(--gutter)] py-[14vh]">
      <p className="t-label flex items-center gap-3 text-muted">
        <span className="text-sky">10</span>
        <span className="h-px w-8 bg-line-strong" />
        <span>Spec sheet</span>
      </p>
      <h2 id="features-h" className="t-display mt-6 max-w-[16ch] text-[clamp(2.4rem,5.4vw,5.6rem)] text-ink">
        What happens in the 87 ms, itemised.
      </h2>

      <div className="mt-14 grid grid-cols-1 gap-y-10 md:grid-cols-12 md:gap-x-10">
        <div role="tablist" aria-orientation="vertical" aria-label="Platform capabilities" onKeyDown={onKey} className="md:col-span-5 xl:col-span-4">
          {FEATURES.map((ft, i) => (
            <button
              key={ft.id}
              ref={(el) => {
                tabs.current[i] = el;
              }}
              role="tab"
              id={`tab-${ft.id}`}
              aria-selected={i === active}
              aria-controls="feature-panel"
              tabIndex={i === active ? 0 : -1}
              onClick={() => setActive(i)}
              onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
              data-cursor="view"
              className={`group relative flex min-h-[56px] w-full items-baseline gap-4 border-t border-line py-4 text-left transition-colors duration-300 last:border-b ${
                i === active ? "text-ink" : "text-muted hover:text-ink"
              }`}
            >
              <span className="t-mono w-8 text-[12px] text-sky">{String(i + 1).padStart(2, "0")}</span>
              <span className="t-display text-[clamp(1.4rem,2.4vw,2.2rem)] tracking-[-0.02em]">{ft.name}</span>
              <span aria-hidden className={`ml-auto h-px bg-sky transition-all duration-500 ${i === active ? "w-10" : "w-0"}`} />
            </button>
          ))}
        </div>

        <div
          id="feature-panel"
          role="tabpanel"
          aria-labelledby={`tab-${f.id}`}
          tabIndex={0}
          className="relative border border-line bg-panel/60 p-5 md:col-span-7 md:col-start-6 md:p-8 xl:col-span-7 xl:col-start-6"
        >
          <p className="t-label flex items-center justify-between text-muted">
            <span>
              <span className="text-sky">{String(active + 1).padStart(2, "0")}</span> / {f.name}
            </span>
            <span>spec</span>
          </p>
          <p className="t-body mt-5 max-w-[46ch]">{f.blurb}</p>
          <div key={f.id} className="mt-6 h-[clamp(110px,16vw,170px)] border-y border-line py-3">
            {f.art(reduced)}
          </div>
          <dl className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {f.specs.map((s) => (
              <div key={s.label} className="border-l border-line pl-4">
                <dd className="t-display text-[clamp(2rem,3.4vw,3.4rem)] text-ink">{s.value}</dd>
                <dt className="t-label mt-2 text-muted">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
