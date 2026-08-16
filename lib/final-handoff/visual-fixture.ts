/**
 * Enables the final-handoff sample data only for an explicitly configured local
 * parity server. The query parameter alone is intentionally inert, and Vercel
 * (Preview or Production) can never activate this renderer.
 */
export function isLocalHandoffVisualFixture(value: string | string[] | undefined) {
  return value === "true"
    && process.env.B4GAMBLE_HANDOFF_VISUAL_FIXTURE === "true"
    && process.env.VERCEL !== "1"
    && process.env.VERCEL_ENV !== "production";
}
