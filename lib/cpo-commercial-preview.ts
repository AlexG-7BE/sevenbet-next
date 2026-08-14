export const CPO_COMMERCIAL_PREVIEW_BRANCH = "codex/cpo-commercial-decision-layer-preview-02";

export function isCpoCommercialPreviewEnabled(env: Record<string, string | undefined> = process.env) {
  if (env.VERCEL_ENV === "production") {
    return false;
  }
  if (env.VERCEL_ENV === "preview") {
    return env.VERCEL_GIT_COMMIT_REF === CPO_COMMERCIAL_PREVIEW_BRANCH;
  }
  return env.CPO_COMMERCIAL_PREVIEW === "true";
}

export const cpoPreviewSourceRoutes = [
  "best_casinos",
  "bonuses",
  "casinos",
  "casino_review",
  "compare",
  "learn",
  "bonus_guide",
  "mission_08",
  "mission_10",
] as const;

export type CpoPreviewSourceRoute = (typeof cpoPreviewSourceRoutes)[number];

export function previewOutboundHref({
  slug,
  sourceRoute,
  rank,
  placement,
}: {
  slug: string;
  sourceRoute: CpoPreviewSourceRoute;
  rank?: number;
  placement: "shortlist" | "top_offers" | "all_results" | "review";
}) {
  const params = new URLSearchParams({ source: sourceRoute, placement });
  if (Number.isInteger(rank) && rank && rank >= 1 && rank <= 5) params.set("rank", String(rank));
  return `/preview/outbound/${encodeURIComponent(slug)}?${params.toString()}`;
}
