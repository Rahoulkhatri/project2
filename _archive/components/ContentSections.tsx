"use client";

interface ContentSectionsProps {
  activeSection: number;
}

/**
 * ContentSections
 * ───────────────
 * The right-side scrollable content panels.
 *
 * Each section maps to a stage in the data journey:
 *   0 → Client Request  (Laptop / User Terminal)
 *   1 → Edge Network    (Load Balancer)
 *   2 → Server Processing (Server Rack)
 *
 * Design System:
 * - `.section-label`:     Mono uppercase eyebrow (cyan)
 * - `.section-title`:     Large display heading (white)
 * - `.section-description`: Body copy (muted)
 * - `.metric-row`:        KPI cards with mono values
 * - `.status-badge`:      Live status pill
 *
 * Every text element has `.reveal-up` for GSAP staggered entrance.
 */
export function ContentSections({ activeSection }: ContentSectionsProps) {
  return (
    <>
      {/* ════════════════════════════════════════════
          SECTION 1 — CLIENT REQUEST
          ════════════════════════════════════════════ */}
      <section className="section-panel" data-section="0">
        <div className="reveal-up">
          <span className="section-label">Phase 01 — Initiate</span>
        </div>

        <h2 className="section-title reveal-up">
          Client
          <br />
          <span style={{ color: "var(--accent-cyan)" }}>Request</span>
        </h2>

        <p className="section-description reveal-up">
          A user initiates a request from their device. The data packet
          is encrypted, compressed, and prepared for transit across the
          global network infrastructure.
        </p>

        <div className="metric-row reveal-up">
          <div className="metric-card">
            <div className="metric-value">TLS 1.3</div>
            <div className="metric-label">Encryption</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">{"<"}2ms</div>
            <div className="metric-label">Serialization</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">Brotli</div>
            <div className="metric-label">Compression</div>
          </div>
        </div>

        <div className="reveal-up">
          <div className="status-badge">
            <span className="status-dot" />
            Packet Initialized
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 2 — EDGE NETWORK
          ════════════════════════════════════════════ */}
      <section className="section-panel" data-section="1">
        <div className="reveal-up">
          <span className="section-label">Phase 02 — Route</span>
        </div>

        <h2 className="section-title reveal-up">
          Global Edge
          <br />
          <span style={{ color: "var(--accent-cyan)" }}>Network</span>
        </h2>

        <p className="section-description reveal-up">
          The packet hits the nearest edge node. Intelligent load balancing
          distributes traffic across redundant paths, splitting the payload
          into parallel streams for maximum throughput.
        </p>

        <div className="metric-row reveal-up">
          <div className="metric-card">
            <div className="metric-value">42</div>
            <div className="metric-label">Edge Nodes</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">99.99%</div>
            <div className="metric-label">Uptime SLA</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">L7</div>
            <div className="metric-label">Load Balancing</div>
          </div>
        </div>

        <div className="reveal-up">
          <div className="status-badge">
            <span className="status-dot" />
            Routing Active
          </div>
        </div>

        {/* Code snippet for authenticity */}
        <div
          className="reveal-up mt-6 rounded-lg border p-4 font-mono text-xs leading-relaxed"
          style={{
            borderColor: "rgba(102, 252, 241, 0.08)",
            background: "rgba(15, 17, 35, 0.8)",
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ color: "var(--accent-cyan)", opacity: 0.5 }}>
            {"// "}edge-router.config
          </span>
          <br />
          <span style={{ color: "var(--accent-purple)" }}>upstream</span>{" "}
          backend_pool {"{"}
          <br />
          {"  "}
          <span style={{ color: "var(--accent-cyan)" }}>strategy</span>:
          least_connections
          <br />
          {"  "}
          <span style={{ color: "var(--accent-cyan)" }}>health_check</span>:
          /healthz @ 5s
          <br />
          {"  "}
          <span style={{ color: "var(--accent-cyan)" }}>circuit_breaker</span>:
          5xx {">"} 50% → open
          <br />
          {"}"}
        </div>
      </section>

      {/* ════════════════════════════════════════════
          SECTION 3 — SERVER PROCESSING
          ════════════════════════════════════════════ */}
      <section className="section-panel" data-section="2">
        <div className="reveal-up">
          <span className="section-label">Phase 03 — Execute</span>
        </div>

        <h2 className="section-title reveal-up">
          Server
          <br />
          <span style={{ color: "var(--accent-cyan)" }}>Processing</span>
        </h2>

        <p className="section-description reveal-up">
          The data arrives at the origin server cluster. Containers spin up
          on demand, the query executes against the distributed database,
          and a response is assembled in microseconds.
        </p>

        <div className="metric-row reveal-up">
          <div className="metric-card">
            <div className="metric-value">12μs</div>
            <div className="metric-label">Avg Latency</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">50K</div>
            <div className="metric-label">RPS Capacity</div>
          </div>
          <div className="metric-card">
            <div className="metric-value">K8s</div>
            <div className="metric-label">Orchestration</div>
          </div>
        </div>

        <div className="reveal-up">
          <div className="status-badge">
            <span className="status-dot" />
            Processing Complete
          </div>
        </div>

        {/* Terminal-style output block */}
        <div
          className="reveal-up mt-6 rounded-lg border p-4 font-mono text-xs leading-relaxed"
          style={{
            borderColor: "rgba(102, 252, 241, 0.08)",
            background: "rgba(15, 17, 35, 0.8)",
            color: "var(--text-secondary)",
          }}
        >
          <span style={{ color: "var(--accent-cyan)" }}>$</span> kubectl
          get pods -n production
          <br />
          <span style={{ color: "#4ade80" }}>●</span> api-server-7d4f8b
          {"  "}Running{"  "}2/2{"  "}14d
          <br />
          <span style={{ color: "#4ade80" }}>●</span> worker-pool-a3c1
          {"   "}Running{"  "}4/4{"  "}14d
          <br />
          <span style={{ color: "#4ade80" }}>●</span> cache-redis-0
          {"     "}Running{"  "}1/1{"  "}14d
          <br />
          <br />
          <span style={{ color: "var(--accent-cyan)" }}>
            Response: 200 OK (12.4μs)
          </span>
        </div>
      </section>
    </>
  );
}

