import { ImageResponse } from "next/og";

import { helpShellCopy } from "@/lib/site/help-copy";
import { HELP_SITE_NAME } from "@/lib/site/host-gate";

/**
 * RFC-057 §8: the help site's own social image. `/opengraph-image` reads "Reviews, bonus terms
 * side by side…" and carries the B4GAMBLE wordmark, so it is COMMERCIAL and answers 404 here.
 * This one carries the help site's name and not one review, bonus or casino word, and no
 * B4GAMBLE mark of any kind (Founder, Q2).
 *
 * It is a route handler rather than a file-convention image because the file convention binds
 * an image to a segment, and this one belongs to a host, not to a page.
 */
export const dynamic = "force-static";

const NIGHT = "#100f0f";
const CALM = "#7fd1c1";
const PAPER = "#fafaf7";

export function GET() {
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
          <svg width="96" height="96" viewBox="0 0 64 64">
            {/* A pause mark, drawn here: the help site has no logo file and no B4GAMBLE mark. */}
            <rect width="64" height="64" rx="14" fill={CALM} />
            <rect x="22" y="18" width="7" height="28" rx="3" fill={NIGHT} />
            <rect x="35" y="18" width="7" height="28" rx="3" fill={NIGHT} />
          </svg>
          <div style={{ display: "flex", fontSize: 72, letterSpacing: 1 }}>{HELP_SITE_NAME}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 60, lineHeight: 1.1, maxWidth: 980 }}>
            Take a pause. Take back control.
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(250, 250, 247, 0.72)" }}>
            {helpShellCopy("en-GB").footer.description}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 26 }}>
          {["Free", "No adverts", "No tracking"].map((label) => (
            <div key={label} style={{ display: "flex", padding: "10px 22px", borderRadius: 999, border: `2px solid ${CALM}`, color: CALM }}>{label}</div>
          ))}
          <div style={{ display: "flex", marginLeft: "auto", padding: "10px 22px", borderRadius: 999, background: CALM, color: NIGHT }}>18+</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
