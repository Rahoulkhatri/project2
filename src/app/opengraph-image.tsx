import { ImageResponse } from "next/og";

export const alt = "Kestrel Cloud: every request has a journey. We make it short.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated social card in the site's own look: near-black, hairlines, one sky-blue packet. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, background: "#04060A", color: "#E8EDF5", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 22, letterSpacing: 3, color: "#7B8798" }}>
          <span>KESTREL / CLOUD</span>
          <span>GET /products · 87 MS</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 0.98, letterSpacing: -4 }}>Every request has a journey.</div>
          <div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 0.98, letterSpacing: -4, color: "#7B8798" }}>We make it short.</div>
        </div>

        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
          {["USER", "EDGE", "RUNTIME", "DB"].map((label, i) => (
            <div key={label} style={{ display: "flex", alignItems: "center", flex: i === 3 ? 0 : 1 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 18, height: 18, borderRadius: 9, background: i === 1 ? "#38BDF8" : "#04060A", border: "2px solid #38BDF8", boxShadow: i === 1 ? "0 0 30px #38BDF8" : "none" }} />
                <div style={{ marginTop: 12, fontSize: 18, letterSpacing: 2, color: "#7B8798" }}>{label}</div>
              </div>
              {i < 3 && <div style={{ flex: 1, height: 2, margin: "0 12px 30px", background: "linear-gradient(90deg, #38BDF8, rgba(56,189,248,0.15))" }} />}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
