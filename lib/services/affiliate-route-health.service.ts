import { validateRedirectTargetUrl } from "@/lib/affiliate-routing/redirect-validation";
import type { PartnerRouteProjection } from "@/lib/affiliate-routing/partner-route-projection";
import { checkAffiliateRouteHttp, type AffiliateRouteHealthExpectation, type AffiliateRouteHealthStatus } from "@/lib/affiliate-health/checker";
import { affiliateRouteHealthRepository, type AffiliateRouteHealthClaim, type AffiliateRouteHealthClaimStore } from "@/lib/repositories/affiliate-route-health.repository";
import { partnerRouteService, type PartnerRouteService } from "@/lib/services/partner-route.service";

import { ValidationError } from "./service-error";

export interface AffiliateRouteHealthResult {
  routeKey: string;
  casinoId: string;
  casinoSlug: string;
  countryCode: string;
  redirectId: string | null;
  redirectSlug: string | null;
  offerId: string;
  trackingLinkId: string;
  status: AffiliateRouteHealthStatus;
  reason: string;
  method: "HEAD" | "GET" | null;
  statusCode: number | null;
  durationMs: number | null;
  redirectCount: number | null;
  finalHost: string | null;
}

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function healthExpectation(route: PartnerRouteProjection): AffiliateRouteHealthExpectation | null {
  const activation = record(record(route.tracking.metadata)?.commercialActivationV1);
  const evidence = record(record(activation?.records)?.[route.countryCode]);
  const health = record(evidence?.routeHealth);
  const expectedFinalHost = typeof health?.expectedFinalHost === "string" ? health.expectedFinalHost.trim().toLowerCase() : "";
  const expectedPathPrefix = health?.expectedPathPrefix === null || health?.expectedPathPrefix === undefined
    ? null : typeof health.expectedPathPrefix === "string" ? health.expectedPathPrefix : "";
  const requiredAttributionParameters = Array.isArray(health?.requiredAttributionParameters)
    && health.requiredAttributionParameters.every((value) => typeof value === "string")
    ? health.requiredAttributionParameters as string[] : null;
  if (expectedFinalHost && requiredAttributionParameters && (expectedPathPrefix === null || expectedPathPrefix.startsWith("/"))) {
    return { expectedFinalHost, expectedPathPrefix, requiredAttributionParameters };
  }
  const destination = validateRedirectTargetUrl(route.tracking.destinationUrl, { production: true });
  if (!destination) return null;
  return {
    expectedFinalHost: destination.hostname.toLowerCase(),
    expectedPathPrefix: destination.pathname === "/" ? null : destination.pathname,
    requiredAttributionParameters: [],
  };
}

function routeKey(claim: AffiliateRouteHealthClaim) {
  return `${claim.casinoSlug}:${claim.countryCode}:${claim.redirectSlug ?? "missing-redirect"}:${claim.trackingLinkId}`;
}

function unavailableResult(claim: AffiliateRouteHealthClaim, status: AffiliateRouteHealthStatus, reason: string): AffiliateRouteHealthResult {
  return {
    routeKey: routeKey(claim),
    casinoId: claim.casinoId,
    casinoSlug: claim.casinoSlug,
    countryCode: claim.countryCode,
    redirectId: claim.redirectId,
    redirectSlug: claim.redirectSlug,
    offerId: claim.offerId,
    trackingLinkId: claim.trackingLinkId,
    status,
    reason,
    method: null,
    statusCode: null,
    durationMs: null,
    redirectCount: null,
    finalHost: null,
  };
}

async function mapConcurrent<T, R>(values: T[], concurrency: number, callback: (value: T) => Promise<R>) {
  const results = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await callback(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, () => worker()));
  return results;
}

export class AffiliateRouteHealthService {
  constructor(
    private readonly claims: AffiliateRouteHealthClaimStore = affiliateRouteHealthRepository,
    private readonly routes: Pick<PartnerRouteService, "resolve"> = partnerRouteService,
    private readonly httpCheck: typeof checkAffiliateRouteHttp = checkAffiliateRouteHttp,
  ) {}

  private async checkClaim(claim: AffiliateRouteHealthClaim, now: Date): Promise<AffiliateRouteHealthResult> {
    if (!claim.redirectId || !claim.redirectSlug) return unavailableResult(claim, "BROKEN", "ACTIVE_REDIRECT_MISSING");
    let projections: PartnerRouteProjection[];
    try {
      projections = await this.routes.resolve([claim.casinoId], claim.countryCode, {
        now,
        commercialAllowed: true,
        referralAllowed: true,
        redirectEnabled: true,
      });
    } catch {
      return unavailableResult(claim, "BROKEN", "ROUTE_PROJECTION_UNAVAILABLE");
    }
    const route = projections.find((candidate) => candidate.redirect.id === claim.redirectId
      && candidate.offer.id === claim.offerId && candidate.tracking.id === claim.trackingLinkId);
    if (!route) return unavailableResult(claim, "BROKEN", "ROUTE_PROJECTION_MISSING");
    if (!route.productionEligible) {
      const expired = route.reasonCodes.includes("PRODUCTION_AUTHORITY_EXPIRED")
        || route.reasonCodes.includes("OFFER_INACTIVE_OR_EXPIRED")
        || route.reasonCodes.includes("TRACKING_INACTIVE_OR_EXPIRED");
      return unavailableResult(claim, expired ? "EXPIRED" : "BROKEN", `PREFLIGHT_${route.reasonCodes.join("+") || "INELIGIBLE"}`);
    }
    const expectation = healthExpectation(route);
    if (!expectation) return unavailableResult(claim, "ATTRIBUTION_FAILURE", "HEALTH_EXPECTATION_MISSING");
    const target = validateRedirectTargetUrl(route.tracking.trackingUrl, { production: true });
    if (!target) return unavailableResult(claim, "BROKEN", "UNSAFE_TRACKING_URL");
    const checked = await this.httpCheck({ url: target, expectation });
    return {
      routeKey: routeKey(claim),
      casinoId: claim.casinoId,
      casinoSlug: claim.casinoSlug,
      countryCode: claim.countryCode,
      redirectId: claim.redirectId,
      redirectSlug: claim.redirectSlug,
      offerId: claim.offerId,
      trackingLinkId: claim.trackingLinkId,
      ...checked,
    };
  }

  async run(filters: { casino?: string; countryCode?: string; now?: Date } = {}) {
    const countryCode = filters.countryCode?.trim().toUpperCase();
    if (countryCode && !/^[A-Z]{2}$/.test(countryCode)) throw new ValidationError("countryCode must be an ISO alpha-2 code");
    const now = filters.now ?? new Date();
    const claims = await this.claims.listClaims({ casino: filters.casino?.trim() || undefined, countryCode, now });
    const results = await mapConcurrent(claims, 5, (claim) => this.checkClaim(claim, now));
    const statuses = ["HEALTHY", "DEGRADED", "EXTERNAL_CHALLENGE", "BROKEN", "EXPIRED", "CROSS_GEO", "ATTRIBUTION_FAILURE"] as const;
    const summary = Object.fromEntries(statuses.map((status) => [status, results.filter((result) => result.status === status).length])) as Record<AffiliateRouteHealthStatus, number>;
    const healthy = results.every((result) => result.status === "HEALTHY");
    return {
      authorityVersion: "affiliate-route-health-report.v1",
      checkedAt: now.toISOString(),
      healthy,
      noActiveRoutes: results.length === 0,
      filters: { casino: filters.casino?.trim() || null, countryCode: countryCode ?? null },
      summary: { routes: results.length, ...summary },
      results,
    } as const;
  }
}

export const affiliateRouteHealthService = new AffiliateRouteHealthService();
