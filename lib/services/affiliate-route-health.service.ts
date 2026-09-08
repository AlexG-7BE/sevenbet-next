import type { AffiliateRouteHealthStatus } from "@/lib/affiliate-health/checker";
import { marketActivationRouteVerifier, type MarketActivationRouteVerifierPort } from "@/lib/market-activation/verifier";
import { affiliateRouteHealthRepository, type AffiliateRouteHealthClaim, type AffiliateRouteHealthClaimStore } from "@/lib/repositories/affiliate-route-health.repository";

import { ValidationError } from "./service-error";

export interface AffiliateRouteHealthResult {
  routeKey: string;
  casinoId: string;
  casinoSlug: string;
  countryCode: string;
  redirectId: string | null;
  redirectSlug: string | null;
  offerId: string | null;
  trackingLinkId: string | null;
  status: AffiliateRouteHealthStatus;
  reason: string;
  method: "HEAD" | "GET" | null;
  statusCode: number | null;
  durationMs: number | null;
  redirectCount: number | null;
  finalHost: string | null;
}

function routeKey(claim: AffiliateRouteHealthClaim) {
  return `${claim.casinoSlug}:${claim.countryCode}:${claim.redirectSlug ?? "missing-redirect"}:${claim.activationId}`;
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
    private readonly verifier: MarketActivationRouteVerifierPort = marketActivationRouteVerifier,
  ) {}

  private async checkClaim(claim: AffiliateRouteHealthClaim, now: Date): Promise<AffiliateRouteHealthResult> {
    if (!claim.offerId || !claim.trackingLinkId || !claim.redirectId || !claim.redirectSlug) {
      return unavailableResult(claim, "BROKEN", "ACTIVE_ACTIVATION_RELATIONSHIP_MISSING");
    }
    try {
      const checked = await this.verifier.verify(claim.activationId, now);
      return {
        routeKey: routeKey(claim),
        casinoId: claim.casinoId,
        casinoSlug: claim.casinoSlug,
        countryCode: claim.countryCode,
        redirectId: claim.redirectId,
        redirectSlug: claim.redirectSlug,
        offerId: claim.offerId,
        trackingLinkId: claim.trackingLinkId,
        status: checked.status,
        reason: checked.reason,
        method: checked.method,
        statusCode: checked.statusCode,
        durationMs: checked.durationMs,
        redirectCount: checked.redirectCount,
        finalHost: checked.finalHost,
      };
    } catch {
      return unavailableResult(claim, "DEGRADED", "ROUTE_VERIFICATION_INCONCLUSIVE");
    }
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
