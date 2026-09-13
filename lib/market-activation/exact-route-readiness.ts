export type ExactRouteReadinessBlockerCode =
  | "LEGACY_ZZ_ROUTE_REQUIRES_MATERIALIZATION"
  | "NON_CANONICAL_ROUTE_SCOPE"
  | "DUPLICATE_CANONICAL_ROUTE"
  | "EXACT_ROUTE_BINDING_AMBIGUOUS";

export type ExactRouteReadinessBlocker = Readonly<{
  code: ExactRouteReadinessBlockerCode;
  count: number;
  routeIds: string[];
}>;

export type ExactRouteReadinessReport = Readonly<{
  ready: boolean;
  classification: "DETECTED";
  blockers: ExactRouteReadinessBlocker[];
  checkedRouteCount: number;
}>;

export interface ExactRouteReadinessQueryClient {
  $queryRawUnsafe<T = unknown>(query: string): Promise<T>;
}

type RouteRow = { id: string };
type ActiveRouteRow = RouteRow & {
  casinoId: string;
  countryCode: string;
  marketCode: string;
  product: string;
};

function blocker(
  code: ExactRouteReadinessBlockerCode,
  rows: RouteRow[],
): ExactRouteReadinessBlocker | null {
  return rows.length ? { code, count: rows.length, routeIds: rows.map((row) => row.id).sort() } : null;
}

/**
 * Read-only PR3 deployment gate. It reports legacy or ambiguous authority and
 * never attempts to repair business data.
 */
export async function inspectExactRouteReadiness(
  database: ExactRouteReadinessQueryClient,
): Promise<ExactRouteReadinessReport> {
  const [activeRoutes, bindingRows] = await Promise.all([
    database.$queryRawUnsafe<ActiveRouteRow[]>(`
      SELECT
        route."id"::text AS id,
        route."casinoId"::text AS "casinoId",
        route."countryCode",
        route."marketCode",
        route."product"::text AS product
      FROM "MarketActivation" route
      WHERE route."desiredState" = 'ACTIVE'
      ORDER BY route."id"
    `),
    database.$queryRawUnsafe<RouteRow[]>(`
      SELECT route."id"::text AS id
      FROM "MarketActivation" route
      LEFT JOIN "AffiliateOffer" offer ON offer."id" = route."affiliateOfferId"
      LEFT JOIN "AffiliateTrackingLink" tracking ON tracking."id" = route."primaryTrackingLinkId"
      LEFT JOIN "AffiliateRedirectSlug" redirect ON redirect."id" = route."redirectSlugId"
      WHERE route."desiredState" = 'ACTIVE'
        AND (
          route."affiliateOfferId" IS NULL
          OR route."primaryTrackingLinkId" IS NULL
          OR route."redirectSlugId" IS NULL
          OR offer."id" IS NULL
          OR tracking."id" IS NULL
          OR redirect."id" IS NULL
          OR offer."casinoId" <> route."casinoId"
          OR tracking."offerId" <> route."affiliateOfferId"
          OR redirect."casinoId" <> route."casinoId"
          OR redirect."affiliateOfferId" <> route."affiliateOfferId"
          OR redirect."casinoBonusId" IS DISTINCT FROM route."casinoBonusId"
        )
      ORDER BY route."id"
    `),
  ]);
  const legacyZz = activeRoutes.filter((route) => route.marketCode === "ZZ");
  const normalizedRoutes = activeRoutes.flatMap((route) => {
    const canonical = canonicalCommercialMarketKey({
      countryCode: route.countryCode,
      marketCode: route.marketCode,
      trust: "TRUSTED",
    });
    return canonical ? [{ route, canonical }] : [];
  });
  const canonicalRoutes = normalizedRoutes
    .filter(({ route, canonical }) => canonical === route.marketCode)
    .map(({ route }) => route);
  const canonicalIds = new Set(canonicalRoutes.map((route) => route.id));
  const nonCanonical = activeRoutes.filter((route) => route.marketCode !== "ZZ" && !canonicalIds.has(route.id));
  const grouped = new Map<string, ActiveRouteRow[]>();
  for (const { route, canonical } of normalizedRoutes) {
    const key = [route.casinoId, route.product, canonical].join(":");
    grouped.set(key, [...(grouped.get(key) ?? []), route]);
  }
  const duplicateRows = [...grouped.values()].filter((routes) => routes.length > 1).flat();
  const blockers = [
    blocker("LEGACY_ZZ_ROUTE_REQUIRES_MATERIALIZATION", legacyZz),
    blocker("NON_CANONICAL_ROUTE_SCOPE", nonCanonical),
    blocker("DUPLICATE_CANONICAL_ROUTE", duplicateRows),
    blocker("EXACT_ROUTE_BINDING_AMBIGUOUS", bindingRows),
  ].filter((entry): entry is ExactRouteReadinessBlocker => Boolean(entry));
  return {
    ready: blockers.length === 0,
    classification: "DETECTED",
    blockers,
    checkedRouteCount: activeRoutes.length,
  };
}

export async function assertExactRouteReadiness(database: ExactRouteReadinessQueryClient) {
  const report = await inspectExactRouteReadiness(database);
  if (!report.ready) {
    throw new Error("EXACT_ROUTE_READINESS_FAILED:" + report.blockers
      .map((entry) => entry.code + "=" + entry.count)
      .join(","));
  }
  return report;
}
import { canonicalCommercialMarketKey } from "@/lib/jurisdiction/canonical-commercial-market";
