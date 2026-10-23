import type { SceneId } from "./story";

/** Story copy: one beat per scene. Shared by the pinned overlay and the no-JS fallback. */
export type Beat = {
  scene: SceneId;
  side: "left" | "right";
  v: "top" | "middle" | "bottom";
  title: string;
  body: string;
  specs: [string, string][];
  from?: number;
  to?: number;
};

export const BEATS: Beat[] = [
  {
    scene: "request",
    side: "left",
    v: "bottom",
    from: 0.14,
    title: "Enter. 42 bytes leave the building.",
    body: "GET /products over HTTP/3. The browser resumes a QUIC session with a 0-RTT ticket, so the request is already on the wire while the address bar is still repainting.",
    specs: [
      ["method", "GET /products"],
      ["headers", "42 B, QPACK"],
      ["transport", "h3 · 0-RTT"],
    ],
  },
  {
    scene: "internet",
    side: "right",
    v: "top",
    title: "Anycast finds the shortest way out.",
    body: "One IP, announced from every Kestrel location. BGP hands the packet to KHI-1, 9 ms away, instead of an origin in Virginia at 212 ms. 1.2 million other requests are making the same choice this second.",
    specs: [
      ["nearest", "KHI-1 · Karachi"],
      ["rtt", "9 ms vs 212 ms"],
      ["global", "1.2M req/s"],
    ],
  },
  {
    scene: "handshake",
    side: "left",
    v: "middle",
    title: "Resolved in 4. Encrypted in 11.",
    body: "Authoritative DNS answers from the same machine that terminates TLS. TLS 1.3 with X25519 keeps the handshake to a single round trip — 15 ms before your code is involved at all.",
    specs: [
      ["dns", "4 ms · authoritative"],
      ["tls", "1.3 · X25519 · 1-RTT"],
      ["cert", "ECDSA P-256, auto-renew"],
    ],
  },
  {
    scene: "edge",
    side: "right",
    v: "bottom",
    title: "96 shards. One lookup. 2 ms.",
    body: "Every location keeps a tiered cache. A hit leaves immediately. This one misses — /products changed 40 seconds ago — so identical requests are collapsed into a single origin fetch that refills the cache on the way back.",
    specs: [
      ["hit", "2 ms p50 · served"],
      ["miss", "→ origin, coalesced"],
      ["hit ratio", "94.1% last 24h"],
    ],
  },
  {
    scene: "balancer",
    side: "left",
    v: "top",
    title: "Sent to the least busy machine, not the next one.",
    body: "Routing weighs live queue depth and p99 latency, sampled every 250 ms. Rack C is at 31% and gets the request. Rack A is at 88% and gets a break.",
    specs: [
      ["rack a", "88% · draining"],
      ["rack b", "54%"],
      ["rack c", "31% · selected"],
    ],
  },
  {
    scene: "runtime",
    side: "right",
    v: "middle",
    from: 0.12,
    title: "Cold start in 38 ms. Then it's just your code.",
    body: "Your function boots in a Firecracker microVM from a pre-warmed Node 22 snapshot. No container pull, no region picker, no YAML.",
    specs: [
      ["runtime", "Node 22 · V8 12.4"],
      ["cold start", "38 ms"],
      ["instance", "2 vCPU · 512 MB · NVMe"],
    ],
  },
  {
    scene: "database",
    side: "left",
    v: "bottom",
    title: "A read replica in the same city.",
    body: "The query lands on a Postgres 16 replica in the Karachi metro, at most 120 ms behind the primary. Index scan on products_pkey, 48 rows, 6 ms.",
    specs: [
      ["query", "SELECT * FROM products"],
      ["plan", "Index Scan · 48 rows"],
      ["time", "6 ms"],
    ],
  },
  {
    scene: "response",
    side: "right",
    v: "top",
    from: 0.5,
    to: 1,
    title: "200 OK. Home in 87 ms.",
    body: "14.2 KB, Brotli, streamed as it renders. On the way back the response caches itself at KHI-1, so the next visitor from Karachi gets it in 11.",
    specs: [
      ["status", "200 OK"],
      ["payload", "14.2 KB · br"],
      ["total", "87 ms"],
    ],
  },
];
