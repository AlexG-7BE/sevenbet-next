import { hasFounderGlobalProductionAuthority, PARTNER_ROUTE_VERIFICATION_MAX_AGE_MS } from "@/lib/affiliate-routing/partner-route-projection";
import type { DiscoveryContext } from "@/lib/public-casino-discovery/public-casino-discovery.types";

function time(value: Date | null) {
  return value?.getTime() ?? null;
}

function safeHttps(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function eligibleDiscoveryOffers(context: DiscoveryContext, casinoId: string, casinoBonusId: string | null, countryCode: string | undefined, now: Date) {
  return context.offers.filter((offer) => {
    if (!countryCode) return false;
    const country = countryCode.toUpperCase();
    if (offer.casinoId !== casinoId || (casinoBonusId && offer.casinoBonusId !== casinoBonusId && offer.casinoBonusId !== null) || offer.status !== "ACTIVE" || offer.archivedAt) return false;
    if (offer.program.casinoId !== casinoId || offer.program.status !== "ACTIVE" || offer.program.workflowStatus !== "PUBLISHED"
      || (offer.program.supportedCountries.length > 0 && !offer.program.supportedCountries.includes(country))
      || offer.program.archivedAt || !offer.program.network.active || offer.program.network.archivedAt) return false;
    if ((time(offer.startAt) ?? -Infinity) > now.getTime() || (time(offer.expiresAt) ?? Infinity) <= now.getTime()) return false;
    const offerRule = offer.countries.find((rule) => rule.countryCode.toUpperCase() === country);
    if (offer.geoMode === "ALLOW" && offerRule?.mode !== "ALLOW") return false;
    if (offer.geoMode === "BLOCK" && offerRule?.mode === "BLOCK") return false;
    return offer.trackingLinks.some((link) => {
      const authority = link.countries.find((rule) => rule.countryCode.toUpperCase() === country && rule.mode === "ALLOW");
      const blockingRule = link.countries.find((rule) => rule.countryCode.toUpperCase() === country && rule.mode === "BLOCK");
      if (link.geoMode === "ALLOW" && !authority) return false;
      if (link.geoMode === "BLOCK" && blockingRule) return false;
      const verifiedAt = time(link.verifiedAt);
      const checkedAt = time(link.lastCheckedAt);
      const eligibilityVerifiedAt = time(authority?.productionEligibilityVerifiedAt ?? null);
      const globalAuthority = hasFounderGlobalProductionAuthority(offer.program.metadata, link.metadata, country);
      return link.active && !link.archivedAt && safeHttps(link.destinationUrl) && safeHttps(link.trackingUrl)
        && (time(link.validFrom) ?? -Infinity) <= now.getTime()
        && (time(link.expiresAt) ?? Infinity) > now.getTime()
        && verifiedAt !== null && checkedAt !== null && verifiedAt <= now.getTime() && checkedAt <= now.getTime()
        && now.getTime() - verifiedAt < PARTNER_ROUTE_VERIFICATION_MAX_AGE_MS
        && now.getTime() - checkedAt < PARTNER_ROUTE_VERIFICATION_MAX_AGE_MS
        && (globalAuthority || (
          authority?.productionEligible === true && eligibilityVerifiedAt !== null && eligibilityVerifiedAt <= now.getTime()
          && Boolean(authority.productionEligibilityEvidence?.trim())
          && (time(authority.productionEligibilityExpiresAt ?? null) ?? Infinity) > now.getTime()
        ));
    });
  }).sort((a, b) => Number(b.featured) - Number(a.featured) || b.priority - a.priority || a.id.localeCompare(b.id));
}
