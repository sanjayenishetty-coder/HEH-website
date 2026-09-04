import { ImageResponse } from "next/og";
import { site } from "@/data/site";

export const alt = `${site.name} – ${site.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{ width: 18, height: 56, background: "#0f172a", border: "3px solid #f59e0b", borderRadius: 3 }} />
            <div style={{ width: 18, height: 56, background: "#f59e0b", borderRadius: 3 }} />
            <div style={{ width: 18, height: 56, background: "#0f172a", border: "3px solid #f59e0b", borderRadius: 3 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1 }}>
            <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1 }}>HYDERABAD</span>
            <span style={{ fontSize: 30, fontWeight: 700, color: "#f59e0b" }}>entrepreneurHub</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -2, lineHeight: 1.05, display: "flex", flexWrap: "wrap" }}>
            Where entrepreneurs&nbsp;<span style={{ color: "#f59e0b" }}>grow</span>&nbsp;— together.
          </div>
          <div style={{ fontSize: 28, color: "rgba(255,255,255,0.7)" }}>A working forum for Hyderabad&apos;s business owners · entrepreneurhub.in</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
