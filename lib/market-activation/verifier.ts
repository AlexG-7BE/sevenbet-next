import type { Prisma } from "@prisma/client";

import {
  checkAffiliateRouteHttp,
  type AffiliateRouteHealthExpectation,
  type AffiliateRouteHttpCheck,
} from "@/lib/affiliate-health/checker";
import { checkAffiliateRouteFromMarket, type GlobalpingProbe } from "@/lib/affiliate-health/globalping-fetch";
import { validateRedirectTargetUrl } from "@/lib/affiliate-routing/redirect-validation";
import { prisma } from "@/lib/db/prisma";
import { CASINO_MARKETS } from "@/lib/market-access/register";

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

/** The country-code domains an operator's site for a country is on; a British site is on .uk. */
function countryDomainSuffixes(country: string) {
  const code = country === "GB" ? "uk" : country.toLowerCase();
  return [code, `co.${code}`, `com.${code}`, `bet.${code}`];
}

/**
 * The operator's own sites for a market: the licensed site the register cites
 * for it (RFC-054) and the brand on the market's country-code domain
 * (betsson.dk, playojo.dk, betsson.mx). A partner sends a local player there
 * from a link whose stored destination is its global site, so landing on one
 * is correct; another country's site stays CROSS_GEO.
 */
function operatorMarketHosts(marketCode: string, casino: { slug?: string | null; domain: string }) {
  const hosts = new Set<string>();
  const register = casino.slug ? CASINO_MARKETS[casino.slug.trim().toLowerCase()] : undefined;
  const licensedSite = register?.licensed[marketCode] ?? register?.licensed[marketCode.slice(0, 2)];
  // Register entries are a site (host, optionally with a path) or a regulator's name.
  if (licensedSite && /^[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/\S*)?$/i.test(licensedSite)) {
    hosts.add(licensedSite.split("/")[0].toLowerCase().replace(/^www\./, ""));
  }
  const brand = casino.domain.trim().toLowerCase().replace(/^www\./, "").split(".")[0];
  const country = marketExitCountry(marketCode);
  if (brand && country) {
    for (const suffix of countryDomainSuffixes(country)) hosts.add(`${brand}.${suffix}`);
  }
  return [...hosts];
}

function storedExpectation(
  metadata: Prisma.JsonValue,
  countryCode: string,
  destination: URL,
  marketProfile: { localDomain: string | null; localWebsiteUrl: string | null } | null,
  casino: { slug?: string | null; domain: string; websiteUrl: string | null },
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
  // Registration stores the host it observed, often from another country's exit (the global
  // site), so the operator's own market sites stay acceptable beside it.
  const withOperatorHosts = (expectation: AffiliateRouteHealthExpectation): AffiliateRouteHealthExpectation => {
    const acceptedFinalHosts = operatorMarketHosts(countryCode, casino)
      .filter((host) => host !== expectation.expectedFinalHost.replace(/^www\./, ""));
    return acceptedFinalHosts.length ? { ...expectation, acceptedFinalHosts } : expectation;
  };
  if (explicitFinalHost) {
    return withOperatorHosts({
      expectedFinalHost: explicitFinalHost,
      expectedPathPrefix,
      requiredAttributionParameters,
      allowWwwEquivalentFinalHost: true,
    });
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
  return withOperatorHosts({
    expectedFinalHost: expectedOperatorHost || destination.hostname.toLowerCase(),
    expectedPathPrefix: expectedOperatorHost
      ? null
      : destination.pathname === "/" ? null : destination.pathname,
    requiredAttributionParameters,
    allowWwwEquivalentFinalHost: true,
  });
}

/**
 * The country a route is checked from: its market's own country, or null when
 * the market has none. Only the historical global fallback (ZZ, "no market")
 * and a code that is not ISO-shaped have none; those keep the direct check.
 * A subdivision market (AR-C, CA-ON) is checked from its country, because
 * Globalping selects probes by country and cannot target a province.
 */
export function marketExitCountry(marketCode: string) {
  const code = marketCode.trim().toUpperCase();
  if (!/^[A-Z]{2}(?:-[A-Z0-9]{1,12})?$/.test(code)) return null;
  const country = code.slice(0, 2);
  return country === MARKET_ACTIVATION_GLOBAL_FALLBACK_COUNTRY_CODE ? null : country;
}

/** Checks a route from a real network exit inside `country`; reports each probe that answered. */
export type MarketExitRouteCheck = (input: {
  url: URL;
  country: string;
  expectation: AffiliateRouteHealthExpectation;
  onProbe: (probe: GlobalpingProbe) => void;
}) => Promise<AffiliateRouteHttpCheck>;

/** Each redirect hop is one Globalping measurement (about 1-3 s); a six-hop chain fits well inside. */
export const MARKET_EXIT_ROUTE_TIMEOUT_MS = 60_000;

const checkRouteFromMarketExit: MarketExitRouteCheck = ({ url, country, expectation, onProbe }) => checkAffiliateRouteFromMarket({
  url,
  country,
  expectation,
  timeoutMs: MARKET_EXIT_ROUTE_TIMEOUT_MS,
  globalping: {
    token: process.env.GLOBALPING_API_TOKEN?.trim() || null,
    preferEyeballNetwork: true,
    onProbe: (probe) => onProbe(probe),
  },
});

function marketExitLabel(country: string, probes: GlobalpingProbe[]) {
  if (!probes.length) return country;
  return `${country} ${probes.every((probe) => probe.eyeballNetwork) ? "eyeball-network" : "any-network"}`;
}

function inconclusiveCheck(checked: AffiliateRouteHttpCheck) {
  // No response was observed: a transport failure, or the market exit itself
  // (Globalping quota, outage, no probe in the country) was unavailable.
  return checked.status === "BROKEN"
    && checked.statusCode === null
    && (checked.reason === "NETWORK_ERROR" || checked.reason === "TIMEOUT" || checked.reason.startsWith("GLOBALPING_"));
}

export interface MarketActivationRouteVerifierPort {
  verify(activationId: string, checkedAt?: Date): Promise<MarketActivationRouteVerificationResult>;
}

export class MarketActivationRouteVerifier implements MarketActivationRouteVerifierPort {
  constructor(
    private readonly database: Pick<typeof prisma, "marketActivation"> = prisma,
    private readonly httpCheck: typeof checkAffiliateRouteHttp = checkAffiliateRouteHttp,
    private readonly marketCheck: MarketExitRouteCheck = checkRouteFromMarketExit,
  ) {}

  async verify(activationId: string, checkedAt = new Date()): Promise<MarketActivationRouteVerificationResult> {
    const activation = await this.database.marketActivation.findUnique({
      where: { id: activationId },
      select: {
        marketCode: true,
        casino: { select: { slug: true, domain: true, websiteUrl: true } },
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
    const expectation = storedExpectation(
      tracking.metadata,
      activation.marketCode,
      destination,
      activation.marketProfile,
      activation.casino,
    );
    // Partners answer by the visitor's address: PlayOJO challenges datacentre
    // IPs, German links send non-German IPs to the .com site. A market route
    // is therefore judged from a real exit in its own market.
    const country = marketExitCountry(activation.marketCode);
    let checked: AffiliateRouteHttpCheck;
    let verificationExit: string;
    if (country) {
      const probes: GlobalpingProbe[] = [];
      checked = await this.marketCheck({ url: target, country, expectation, onProbe: (probe) => probes.push(probe) });
      verificationExit = marketExitLabel(country, probes);
    } else {
      checked = await this.httpCheck({ url: target, expectation, inspectTerminalContent: true });
      verificationExit = "DIRECT";
    }
    if (inconclusiveCheck(checked)) {
      // A transport failure cannot distinguish an upstream outage from the
      // verifier's own egress/DNS path. Let the controller retry and retain a
      // resumable PREPARING state instead of fabricating external evidence.
      throw new Error("MARKET_ACTIVATION_ROUTE_VERIFICATION_INCONCLUSIVE");
    }
    return { ...checked, checkedAt, verificationExit };
  }
}

export const marketActivationRouteVerifier = new MarketActivationRouteVerifier();
