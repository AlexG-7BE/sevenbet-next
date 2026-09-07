import type { Prisma } from "@prisma/client";

import {
  checkAffiliateRouteHttp,
  type AffiliateRouteHealthExpectation,
} from "@/lib/affiliate-health/checker";
import { validateRedirectTargetUrl } from "@/lib/affiliate-routing/redirect-validation";
import { prisma } from "@/lib/db/prisma";

import {
  MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE,
  type MarketActivationRouteVerificationResult,
} from "./contract";

function object(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function normalizedMarketHost(profile: { localDomain: string | null; localWebsiteUrl: string | null } | null) {
  if (profile?.localWebsiteUrl) {
    try {
      return new URL(profile.localWebsiteUrl).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    } catch {
      // Fall through to the separately stored domain. Invalid historical URL
      // state must not broaden an external route expectation.
    }
  }
  return profile?.localDomain?.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "") || null;
}

function normalizedCasinoHost(casino: { domain: string; websiteUrl: string | null }) {
  if (casino.websiteUrl) {
    try {
      return new URL(casino.websiteUrl).hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    } catch {
      // Fall through to the required canonical Casino domain. Invalid
      // editorial URL state must not broaden the route expectation.
    }
  }
  return casino.domain.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "") || null;
}

function belongsToMarketHost(host: string, marketHost: string | null) {
  const normalized = host.trim().toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
  return Boolean(marketHost && (normalized === marketHost || normalized.endsWith(`.${marketHost}`)));
}

function storedExpectation(
  metadata: Prisma.JsonValue,
  countryCode: string,
  destination: URL,
  marketProfile: { localDomain: string | null; localWebsiteUrl: string | null } | null,
  casino: { domain: string; websiteUrl: string | null },
): AffiliateRouteHealthExpectation {
  const activation = object(object(metadata).commercialActivationV1 as Prisma.JsonValue);
  const record = object(object(activation.records as Prisma.JsonValue)[countryCode] as Prisma.JsonValue);
  const health = object(record.routeHealth as Prisma.JsonValue);
  const explicitFinalHost = typeof health.expectedFinalHost === "string"
    ? health.expectedFinalHost.trim().toLowerCase()
    : "";
  const expectedPathPrefix = health.expectedPathPrefix === null || health.expectedPathPrefix === undefined
    ? null
    : typeof health.expectedPathPrefix === "string" && health.expectedPathPrefix.startsWith("/")
      ? health.expectedPathPrefix
      : null;
  const requiredAttributionParameters = Array.isArray(health.requiredAttributionParameters)
    && health.requiredAttributionParameters.every((value) => typeof value === "string")
    ? health.requiredAttributionParameters as string[]
    : [];
  if (explicitFinalHost) {
    return {
      expectedFinalHost: explicitFinalHost,
      expectedPathPrefix,
      requiredAttributionParameters,
      allowWwwEquivalentFinalHost: true,
    };
  }
  const marketHost = normalizedMarketHost(marketProfile);
  const imported = object(object(metadata).betssonCommercialRoutesV1 as Prisma.JsonValue);
  const importedCountry = typeof imported.exactCountryCode === "string" ? imported.exactCountryCode.trim().toUpperCase() : null;
  const importedFinalHost = typeof imported.healthFinalHost === "string" ? imported.healthFinalHost.trim().toLowerCase() : "";
  const evidencedMarketFinalHost = importedCountry === countryCode
    && belongsToMarketHost(importedFinalHost, marketHost)
    ? importedFinalHost
    : "";
  const globalCasinoHost = countryCode === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE
    ? normalizedCasinoHost(casino)
    : null;
  const expectedOperatorHost = evidencedMarketFinalHost || marketHost || globalCasinoHost;
  return {
    expectedFinalHost: expectedOperatorHost || destination.hostname.toLowerCase(),
    expectedPathPrefix: expectedOperatorHost
      ? null
      : destination.pathname === "/" ? null : destination.pathname,
    requiredAttributionParameters,
    allowWwwEquivalentFinalHost: true,
  };
}

export interface MarketActivationRouteVerifierPort {
  verify(activationId: string, checkedAt?: Date): Promise<MarketActivationRouteVerificationResult>;
}

export class MarketActivationRouteVerifier implements MarketActivationRouteVerifierPort {
  constructor(
    private readonly database: Pick<typeof prisma, "marketActivation"> = prisma,
    private readonly httpCheck: typeof checkAffiliateRouteHttp = checkAffiliateRouteHttp,
  ) {}

  async verify(activationId: string, checkedAt = new Date()): Promise<MarketActivationRouteVerificationResult> {
    const activation = await this.database.marketActivation.findUnique({
      where: { id: activationId },
      select: {
        countryCode: true,
        casino: { select: { domain: true, websiteUrl: true } },
        marketProfile: { select: { localDomain: true, localWebsiteUrl: true } },
        primaryTrackingLink: {
          select: { trackingUrl: true, destinationUrl: true, metadata: true },
        },
      },
    });
    const tracking = activation?.primaryTrackingLink;
    const target = tracking ? validateRedirectTargetUrl(tracking.trackingUrl, { production: true }) : null;
    const destination = tracking ? validateRedirectTargetUrl(tracking.destinationUrl, { production: true }) : null;
    if (!activation || !tracking || !target || !destination) {
      return {
        status: "BROKEN",
        reason: "VERIFICATION_TARGET_UNAVAILABLE",
        checkedAt,
        method: null,
        statusCode: null,
        durationMs: null,
        redirectCount: null,
        finalHost: null,
      };
    }
    const checked = await this.httpCheck({
      url: target,
      expectation: storedExpectation(
        tracking.metadata,
        activation.countryCode,
        destination,
        activation.marketProfile,
        activation.casino,
      ),
      inspectTerminalContent: true,
    });
    if (checked.status === "BROKEN"
      && checked.statusCode === null
      && (checked.reason === "NETWORK_ERROR" || checked.reason === "TIMEOUT")) {
      // A transport failure cannot distinguish an upstream outage from the
      // verifier's own egress/DNS path. Let the controller retry and retain a
      // resumable PREPARING state instead of fabricating external evidence.
      throw new Error("MARKET_ACTIVATION_ROUTE_VERIFICATION_INCONCLUSIVE");
    }
    return { ...checked, checkedAt };
  }
}

export const marketActivationRouteVerifier = new MarketActivationRouteVerifier();
