import { ImageResponse } from "next/og";

/**
 * The default social image for every page without its own (there was none: `/opengraph-image`
 * answered 404 and every share rendered as a small text card). Brand colours: night, acid and
 * paper. The wording names no country and no "casino", so it suits every market, German included.
 */
// Mirrored in lib/seo/social-image.ts for pages that name their image explicitly.
export const alt = "B4GAMBLE: know the terms before you play";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NIGHT = "#100f0f";
const ACID = "#e4e24e";
const PAPER = "#fafaf7";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: NIGHT,
          color: PAPER,
          padding: "72px 80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="112" height="112" viewBox="0 0 64 64">
            {/* The mark exactly as app/icon.svg draws it. */}
            <rect width="64" height="64" rx="12" fill="#ccff00" />
            <path fill={NIGHT} d="M12 12h21c10 0 16 4 16 12 0 5-3 8-7 10 6 1 10 5 10 11 0 9-7 13-18 13H12V12Zm12 10v8h8c3 0 5-1 5-4s-2-4-5-4h-8Zm0 17v9h9c4 0 6-1 6-4s-2-5-6-5h-9Z" />
            <path fill="#0b6f6f" d="M47 10h7v17h-7z" />
          </svg>
          <div style={{ display: "flex", fontSize: 84, letterSpacing: 4 }}>B4GAMBLE</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 64, lineHeight: 1.1, maxWidth: 980 }}>Know the terms before you play.</div>
          <div style={{ display: "flex", fontSize: 32, color: "rgba(250, 250, 247, 0.72)" }}>
            Reviews, bonus terms side by side and a 10-step control plan.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28 }}>
          {["Reviews", "Bonus terms", "10-Step Programme"].map((label) => (
            <div key={label} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, border: `2px solid ${ACID}`, color: ACID }}>{label}</div>
          ))}
          <div style={{ display: "flex", marginLeft: "auto", padding: "10px 22px", borderRadius: 999, background: ACID, color: NIGHT }}>18+</div>
        </div>
      </div>
    ),
    size,
  );
}
