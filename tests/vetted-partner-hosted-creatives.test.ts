import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  PartnerHostedCreativeParseError,
  bannerflowScriptUrl,
  isVettedPartnerHostedCreativesEnabled,
  partnerHostedBindingFingerprint,
  parsePartnerDescription,
  parsePartnerHostedCreative,
  splitPartnerCreativeInput,
} from "../lib/media-operations/partner-hosted";
import {
  evidencedOperatorHost,
  superflyCanonicalCampaignMatches,
} from "../lib/media-operations/partner-hosted-repository";
import {
  bannerflowFrameContentSecurityPolicy,
  buildBannerflowFrameDocument,
} from "../lib/media/partner-hosted-frame";
import { ownsPartnerHostedFramePolicy } from "../lib/media/partner-hosted-frame-path";
import {
  resolveMedia,
  type PlacementMediaAssignment,
  type PlacementMediaAsset,
} from "../lib/media/placement-media";
import type { AffiliateRedirectStore } from "../lib/repositories/affiliate-redirect.repository";
import { AffiliateRedirectService } from "../lib/services/affiliate-redirect.service";
import {
  allowGbCommercialReadinessAuthority,
  allowJurisdictionDecision,
  allowJurisdictionResolver,
} from "./market-authority.fixtures";

const SUPERFLY_200 = '<a href="https://go.superflypartners.net/click?o=3&a=16924502&c=46&creative_id=200" target="_blank"><img src="https://go.superflypartners.net/impression?creative_id=200&affiliate_id=16924502" alt="Skol Casino" width="250" height="250"></a>';
const SUPERFLY_205 = '<a href="https://go.superflypartners.net/click?o=3&a=16924502&c=46&creative_id=205" target="_blank"><img src="https://go.superflypartners.net/impression?creative_id=205&affiliate_id=16924502" alt="Skol Casino" width="250" height="250"></a>';
const BANNERFLOW_DESCRIPTION = "Studio_71344 - Betsson Chile - Casino Welcome Offer - CL - 300 x 100";
const BANNERFLOW_SCRIPT = '<script src="https://c.bannerflow.net/a/676000f73c9e68e82c637837?did=657fff592225a91f2b2e2296&deeplink=on&adgroupid=676000f73c9e68e82c637846&redirecturl=https://record.betsn.info/_p1EHTRI5UEPKywmSEnh_eJfp3tiTnr1q/1/&media=209064&campaign=1"></script>';
const CREATIVE_UUID = "41000000-0000-4000-8000-000000000001";

function hostedAsset(id: string, patch: Partial<PlacementMediaAsset> = {}): PlacementMediaAsset {
  return {
    id,
    type: "AFFILIATE_CREATIVE",
    publicUrl: `/partner-creatives/${id}/frame`,
    width: 300,
    height: 100,
    altText: id,
    status: "ACTIVE",
    archivedAt: null,
    sourceMode: "PARTNER_HOSTED_EMBED",
    provider: "BANNERFLOW",
    hostedCreativeId: id,
    ...patch,
  };
}

function hostedAssignment(
  id: string,
  mediaAsset: PlacementMediaAsset,
  patch: Partial<PlacementMediaAssignment> = {},
): PlacementMediaAssignment {
  return {
    id,
    mediaAssetId: mediaAsset.id,
    placement: "BEST_OFFER_FEATURED",
    variant: "DEFAULT",
    countryCode: null,
    languageCode: null,
    languageState: "UNKNOWN",
    renderingMode: "CONTAIN",
    sortOrder: 0,
    active: true,
    mediaAsset,
    ...patch,
  };
}

test("the exact Founder Superfly fixtures parse as distinct direct visitor-browser images", () => {
  const first = parsePartnerHostedCreative(SUPERFLY_200);
  const second = parsePartnerHostedCreative(`Description:\nSkol Casino - 250 x 250\nEmbed Code:\n${SUPERFLY_205}`);
  assert.equal(first?.provider, "SUPERFLY");
  assert.equal(first?.sourceMode, "PARTNER_HOSTED_IMAGE");
  assert.equal(first?.externalCreativeId, "200");
  assert.equal(first?.affiliateId, "16924502");
  assert.equal(first?.hostedImageUrl, "https://go.superflypartners.net/impression?creative_id=200&affiliate_id=16924502");
  assert.equal(first?.destinationUrl, "https://go.superflypartners.net/click?o=3&a=16924502&c=46&creative_id=200");
  assert.deepEqual([first?.declaredWidth, first?.declaredHeight], [250, 250]);
  assert.notEqual(first?.providerIdentityKey, second?.providerIdentityKey);
  assert.notEqual(first?.sourceChecksum, second?.sourceChecksum);
  assert.equal(splitPartnerCreativeInput(SUPERFLY_200).description, null);
});

test("Superfly creative identity is subordinate to the exact canonical campaign and terminal operator evidence", () => {
  const parsed = parsePartnerHostedCreative(SUPERFLY_200)!;
  const opaqueCampaign = "https://go.superflypartners.net/c/deadbeef";
  assert.equal(superflyCanonicalCampaignMatches(
    parsed,
    opaqueCampaign,
    { commercialVisibility: { canonicalUrlSha256: createHash("sha256").update(opaqueCampaign).digest("hex") } },
  ), true, "the governed opaque Superfly campaign form relies on terminal operator verification");
  assert.equal(superflyCanonicalCampaignMatches(
    parsed,
    opaqueCampaign,
    { commercialVisibility: { canonicalUrlSha256: "0".repeat(64) } },
  ), false, "an opaque campaign must match its existing evidence-bound checksum");
  assert.equal(superflyCanonicalCampaignMatches(
    parsed,
    "https://go.superflypartners.net/click?o=3&a=16924502&c=46",
  ), true);
  assert.equal(superflyCanonicalCampaignMatches(
    parsed,
    "https://go.superflypartners.net/click?o=3&a=16924502&c=47",
  ), false);
  assert.equal(superflyCanonicalCampaignMatches(
    parsed,
    "https://unrelated.example/click?o=3&a=16924502&c=46",
  ), false);
  assert.equal(superflyCanonicalCampaignMatches(
    parsed,
    "https://go.superflypartners.net/c/deadbeef?creative_id=200",
    { commercialVisibility: { canonicalUrlSha256: "0".repeat(64) } },
  ), false, "opaque canonical campaigns must retain their exact governed shape");

  const metadata = {
    commercialActivationV1: {
      records: {
        DE: { routeHealth: { expectedFinalHost: "www.skolcasino.com" } },
        FI: { routeHealth: { expectedFinalHost: "fi.skolcasino.com" } },
      },
    },
  };
  assert.equal(evidencedOperatorHost(metadata, "DE"), "www.skolcasino.com");
  assert.equal(evidencedOperatorHost(metadata, null), null, "ambiguous market evidence must not be guessed");
  assert.equal(evidencedOperatorHost({
    commercialActivationV1: { records: { DE: { routeHealth: { expectedFinalHost: "www.skolcasino.com" } }, IE: { routeHealth: { expectedFinalHost: "www.skolcasino.com" } } } },
  }, null), "www.skolcasino.com");
});

test("the exact Bannerflow fixture becomes structured safe config and retains UNKNOWN facts", () => {
  const parsed = parsePartnerHostedCreative(`Description:\n${BANNERFLOW_DESCRIPTION}\nEmbed Code:\n${BANNERFLOW_SCRIPT}`);
  assert.equal(parsed?.provider, "BANNERFLOW");
  assert.equal(parsed?.sourceMode, "PARTNER_HOSTED_EMBED");
  assert.equal(parsed?.externalCreativeId, "676000f73c9e68e82c637837");
  assert.deepEqual(parsed?.providerEmbedParameters, {
    did: "657fff592225a91f2b2e2296",
    deeplink: "on",
    adgroupid: "676000f73c9e68e82c637846",
    media: "209064",
    campaign: "1",
  });
  assert.deepEqual({
    externalLabel: parsed?.description.externalLabel,
    brand: parsed?.description.brandLabel,
    country: parsed?.description.countryCode,
    purpose: parsed?.description.purpose,
    dimensions: [parsed?.description.width, parsed?.description.height],
    language: parsed?.description.languageCode,
    languageState: parsed?.description.languageState,
    currency: parsed?.description.currencyCode,
  }, {
    externalLabel: "Studio_71344",
    brand: "Betsson",
    country: "CL",
    purpose: "Casino Welcome Offer",
    dimensions: [300, 100],
    language: null,
    languageState: "UNKNOWN",
    currency: null,
  });
  assert.equal(parsed?.destinationUrl, "https://record.betsn.info/_p1EHTRI5UEPKywmSEnh_eJfp3tiTnr1q/1/");
  assert.doesNotMatch(JSON.stringify(parsed?.providerEmbedParameters), /record\.betsn\.info|redirecturl/i);
});

test("description contradictions hold for review and UNKNOWN remains distinct from NEUTRAL", () => {
  const contradiction = parsePartnerDescription("Studio_1 - Betsson Chile - Welcome - PE - 300 x 100");
  assert.equal(contradiction.countryCode, null);
  assert.equal(contradiction.contradiction, "DESCRIPTION_COUNTRY_CONTRADICTION:CL:PE");
  assert.equal(contradiction.languageState, "UNKNOWN");
  const explicit = parsePartnerDescription("Betsson Chile - Welcome - CL - 300 x 100 - language: es - currency: CLP");
  assert.equal(explicit.languageState, "EXPLICIT");
  assert.equal(explicit.languageCode, "es");
  assert.equal(explicit.currencyCode, "CLP");
  const languageOnly = parsePartnerDescription("Skol Casino - Welcome - EN - 300 x 100 - language: en");
  assert.equal(languageOnly.countryCode, null, "a language code must not become country authority");
  assert.equal(languageOnly.languageCode, "en");
  assert.equal(parsePartnerDescription(null).languageState, "UNKNOWN");
});

test("published binding fingerprints change with every server-owned authority component", () => {
  const baseline = { affiliateOfferId: "offer", redirectSlugId: "route", trackingLinkId: "tracking", destinationUrlHash: "a".repeat(64) };
  const fingerprint = partnerHostedBindingFingerprint(baseline);
  assert.match(fingerprint, /^[a-f0-9]{64}$/);
  for (const [field, value] of [["affiliateOfferId", "other-offer"], ["redirectSlugId", "other-route"], ["trackingLinkId", "other-tracking"], ["destinationUrlHash", "b".repeat(64)]] as const) {
    assert.notEqual(partnerHostedBindingFingerprint({ ...baseline, [field]: value }), fingerprint);
  }
});

test("provider parsers reject arbitrary executable HTML, extra attributes, identity conflicts, and unvetted hosts", () => {
  const rejected = [
    '<script src="https://evil.example/a/676000f73c9e68e82c637837?did=657fff592225a91f2b2e2296&deeplink=on&adgroupid=676000f73c9e68e82c637846&redirecturl=https://record.betsn.info/a&media=209064&campaign=1"></script>',
    BANNERFLOW_SCRIPT.replace("</script>", "alert(1)</script>"),
    BANNERFLOW_SCRIPT.replace("<script ", '<script onload="alert(1)" '),
    SUPERFLY_200.replace("width=\"250\"", 'onerror="alert(1)" width="250"'),
    SUPERFLY_200.replace("creative_id=200&affiliate_id", "creative_id=205&affiliate_id"),
    `${SUPERFLY_200}<img src="https://go.superflypartners.net/impression?creative_id=200&affiliate_id=16924502">`,
    ...["127.0.0.1", "10.0.0.1", "169.254.169.254", "[::1]", "metadata.internal"].map((host) =>
      BANNERFLOW_SCRIPT.replace("https://record.betsn.info/", `https://${host}/`)),
  ];
  for (const input of rejected) {
    assert.throws(() => parsePartnerHostedCreative(input), PartnerHostedCreativeParseError);
  }
});

test("composite Markdown and HTML entities normalize to the exact provider contracts", () => {
  const markdown = `\`\`\`text\nDescription:\n${BANNERFLOW_DESCRIPTION}\nEmbed Code:\n${BANNERFLOW_SCRIPT.replaceAll("&", "&amp;")}\n\`\`\``;
  const parsed = parsePartnerHostedCreative(markdown);
  assert.equal(parsed?.provider, "BANNERFLOW");
  assert.equal(parsed?.description.countryCode, "CL");
  assert.equal(parsed?.destinationUrl, "https://record.betsn.info/_p1EHTRI5UEPKywmSEnh_eJfp3tiTnr1q/1/");
});

test("Bannerflow reconstruction substitutes only a governed B4 creative route", () => {
  const parsed = parsePartnerHostedCreative(`Description:\n${BANNERFLOW_DESCRIPTION}\nEmbed Code:\n${BANNERFLOW_SCRIPT}`)!;
  const providerUrl = bannerflowScriptUrl(parsed, `https://b4gamble.com/r/betsson?creative=${CREATIVE_UUID}`);
  const rebuilt = new URL(providerUrl);
  assert.equal(rebuilt.origin, "https://c.bannerflow.net");
  assert.equal(rebuilt.searchParams.get("redirecturl"), `https://b4gamble.com/r/betsson?creative=${CREATIVE_UUID}`);
  assert.doesNotMatch(providerUrl, /record\.betsn\.info/);
  assert.throws(() => bannerflowScriptUrl(parsed, "https://evil.example/r/betsson?creative=41000000-0000-4000-8000-000000000001"), /governed B4GAMBLE/);
  assert.throws(() => bannerflowScriptUrl(parsed, "https://b4gamble.com/r/betsson?url=https://evil.example"), /governed B4GAMBLE/);
});

test("the isolated frame confines provider runtime and never embeds a raw partner destination", () => {
  const parsed = parsePartnerHostedCreative(`Description:\n${BANNERFLOW_DESCRIPTION}\nEmbed Code:\n${BANNERFLOW_SCRIPT}`)!;
  const document = buildBannerflowFrameDocument({
    providerEmbedPath: parsed.providerEmbedPath!,
    providerEmbedParameters: parsed.providerEmbedParameters!,
    governedRedirectUrl: `https://b4gamble.com/r/betsson?creative=${CREATIVE_UUID}`,
    publicOrigin: "https://b4gamble.com",
    width: 300,
    height: 100,
    creativeId: CREATIVE_UUID,
  });
  assert.match(document.contentSecurityPolicy, /default-src 'none'/);
  assert.match(document.contentSecurityPolicy, /script-src 'nonce-[^']+' https:\/\/c\.bannerflow\.net blob: 'unsafe-eval'/);
  assert.match(document.contentSecurityPolicy, /form-action 'none'/);
  assert.match(document.contentSecurityPolicy, /object-src 'none'/);
  assert.doesNotMatch(document.html, /record\.betsn\.info/);
  assert.match(document.html, /redirecturl=https%3A%2F%2Fb4gamble\.com%2Fr%2Fbetsson%3Fcreative%3D/);
  assert.match(document.html, /b4-partner-creative-frame/);
  assert.doesNotMatch(bannerflowFrameContentSecurityPolicy(), /unsafe-inline[^;]*script/);

  const publicComponent = readFileSync("components/commercial-media/PartnerHostedCommercialFigure.tsx", "utf8");
  assert.match(publicComponent, /sandbox="allow-scripts"/);
  assert.match(publicComponent, /tabIndex=\{-1\}/);
  assert.doesNotMatch(publicComponent, /allow-same-origin|allow-top-navigation|allow-popups/);
  assert.doesNotMatch(publicComponent, /superflypartners|bannerflow\.net|record\.betsn/i);
  assert.match(readFileSync("components/commercial-media/CommercialOfferMedia.module.css", "utf8"), /pointer-events:none/);
  assert.doesNotMatch(readFileSync("next.config.mjs", "utf8"), /unsafe-eval|c\.bannerflow\.net/);
});

test("only exact UUID hosted-frame routes own the provider CSP and CSP-only framing exception", () => {
  const creativeId = "41000000-0000-4000-8000-000000000001";
  assert.equal(ownsPartnerHostedFramePolicy(`/partner-creatives/${creativeId}/frame`), true);
  assert.equal(ownsPartnerHostedFramePolicy(`/api/admin/media-operations/hosted-creatives/${creativeId}/preview`), true);
  for (const pathname of [
    "/partner-creatives/not-a-uuid/frame",
    `/partner-creatives/${creativeId}/frame/extra`,
    `/api/admin/media-operations/hosted-creatives/${creativeId}`,
    "/api/admin/media-operations/hosted-creatives/preview",
    "/casino/skol-casino",
  ]) assert.equal(ownsPartnerHostedFramePolicy(pathname), false, pathname);

  const middlewareSource = readFileSync("middleware.ts", "utf8");
  assert.match(middlewareSource, /if \(!partnerHostedFramePolicy\) \{[\s\S]*response\.headers\.set\(CONTENT_SECURITY_POLICY_HEADER/);
  assert.match(middlewareSource, /if \(!partnerHostedFramePolicy\) \{[\s\S]*response\.headers\.set\("X-Frame-Options", "DENY"\)/);
  const nextConfig = readFileSync("next.config.mjs", "utf8");
  assert.doesNotMatch(nextConfig, /X-Frame-Options/);
});

test("selection implements the complete eight-tier order without country leakage", () => {
  const candidates = [
    hostedAssignment("rank-0", hostedAsset("rank-0"), { countryCode: "FI", languageCode: "fi", languageState: "EXPLICIT" }),
    hostedAssignment("rank-1", hostedAsset("rank-1"), { countryCode: "FI", languageState: "UNKNOWN" }),
    hostedAssignment("rank-2", hostedAsset("rank-2"), { languageCode: "fi", languageState: "EXPLICIT" }),
    hostedAssignment("rank-3", hostedAsset("rank-3", { currencyCode: "EUR" }), { languageCode: "en", languageState: "EXPLICIT" }),
    hostedAssignment("rank-4", hostedAsset("rank-4", { currencyCode: "USD" }), { languageCode: "en", languageState: "EXPLICIT" }),
    hostedAssignment("rank-5", hostedAsset("rank-5"), { languageState: "NEUTRAL" }),
    hostedAssignment("rank-6", hostedAsset("rank-6"), { languageState: "UNKNOWN" }),
    hostedAssignment("rank-7", hostedAsset("rank-7"), { languageCode: "de", languageState: "EXPLICIT" }),
  ];
  for (let index = 0; index < candidates.length; index += 1) {
    const resolved = resolveMedia({
      placement: "BEST_OFFER_FEATURED",
      trustedCountryCode: "FI",
      presentationLanguage: "fi",
      context: { casinoName: "Example", casinoAssignments: [], casinoBonusAssignments: candidates.slice(index), legacyMediaAssets: [] },
      now: new Date("2030-01-01T00:00:00Z"),
    });
    assert.equal(resolved.asset?.id, `rank-${index}`, `rank ${index}`);
  }
  const leaked = resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    trustedCountryCode: "PE",
    presentationLanguage: "es",
    context: { casinoName: "Example", casinoAssignments: [], casinoBonusAssignments: [hostedAssignment("cl-only", hostedAsset("cl-only"), { countryCode: "CL", languageState: "UNKNOWN" })], legacyMediaAssets: [] },
  });
  assert.equal(leaked.asset, null);
  assert.equal(leaked.targetingResolution, "CONTROLLED_FALLBACK");
});

test("only one same-tier global creative wins deterministically", () => {
  const first = hostedAssignment("global-one", hostedAsset("global-one"), { languageState: "UNKNOWN", sortOrder: 0 });
  const second = hostedAssignment("global-two", hostedAsset("global-two"), { languageState: "UNKNOWN", sortOrder: 1 });
  const resolved = resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    presentationLanguage: "es",
    context: { casinoName: "Example", casinoAssignments: [], casinoBonusAssignments: [second, first], legacyMediaAssets: [] },
  });
  assert.equal(resolved.asset?.id, "global-one");
});

test("local currency breaks only same-language ties and never outranks language", () => {
  const exactLanguageUsd = hostedAssignment("fi-usd", hostedAsset("fi-usd", { currencyCode: "USD" }), { languageCode: "fi", languageState: "EXPLICIT", sortOrder: 0 });
  const exactLanguageEur = hostedAssignment("fi-eur", hostedAsset("fi-eur", { currencyCode: "EUR" }), { languageCode: "fi", languageState: "EXPLICIT", sortOrder: 10 });
  const englishEur = hostedAssignment("en-eur", hostedAsset("en-eur", { currencyCode: "EUR" }), { languageCode: "en", languageState: "EXPLICIT", sortOrder: -1 });
  const resolved = resolveMedia({
    placement: "BEST_OFFER_FEATURED",
    trustedCountryCode: "FI",
    presentationLanguage: "fi",
    context: { casinoName: "Example", casinoAssignments: [], casinoBonusAssignments: [exactLanguageUsd, englishEur, exactLanguageEur], legacyMediaAssets: [] },
  });
  assert.equal(resolved.asset?.id, "fi-eur");
});

test("feature flag is independent and disabled unless explicitly true", () => {
  assert.equal(isVettedPartnerHostedCreativesEnabled({}), false);
  assert.equal(isVettedPartnerHostedCreativesEnabled({ VETTED_PARTNER_HOSTED_CREATIVES_ENABLED: "false" }), false);
  assert.equal(isVettedPartnerHostedCreativesEnabled({ VETTED_PARTNER_HOSTED_CREATIVES_ENABLED: "true" }), true);
});

function redirectStore(): AffiliateRedirectStore {
  const now = new Date("2030-01-01T00:00:00Z");
  const mapping = {
    id: "redirect-id", slug: "betsson", casinoId: "casino-id", casinoBonusId: null, affiliateOfferId: "offer-id",
    defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null, createdAt: now, updatedAt: now,
    createdBy: "actor", updatedBy: "actor", casino: { id: "casino-id", title: "Betsson", slug: "betsson" }, casinoBonus: null, affiliateOffer: null, revisions: [],
  };
  return {
    list: async () => [], findById: async () => mapping, findBySlug: async () => mapping,
    existsBySlug: async () => true, resolveTargets: async () => ({ casinoExists: true, bonusCasinoId: null, offer: null }),
    create: async () => { throw new Error("unused"); }, update: async () => { throw new Error("unused"); },
  } as AffiliateRedirectStore;
}

function activeOffer() {
  return {
    id: "offer-id", casinoId: "casino-id", casinoBonusId: null, casinoBonus: null, status: "ACTIVE", archivedAt: null,
    startAt: null, expiresAt: null, priority: 1, geoMode: "GLOBAL", countries: [], currencies: [],
    program: { name: "Betsson", status: "ACTIVE", archivedAt: null, network: { name: "Network", active: true, archivedAt: null } },
    trackingLinks: [{
      id: "tracking-id", label: "primary", destinationUrl: "https://www.betsson.com/", trackingUrl: "https://canonical.example/click",
      geoMode: "GLOBAL", countries: [], currencyCode: null, language: null, active: true, priority: 1,
      verifiedAt: "2030-01-01T00:00:00Z", expiresAt: null, archivedAt: null, updatedAt: "2030-01-01T00:00:00Z",
    }],
  };
}

test("creative attribution is resolved only after canonical GEO and Production route checks", async () => {
  const events: string[] = [];
  const service = new AffiliateRedirectService(
    redirectStore(),
    { activeCandidates: async () => [activeOffer()] as never },
    { async resolve() { events.push("geo"); return allowJurisdictionResolver.resolve(); } },
    allowGbCommercialReadinessAuthority,
    { async isProductionEligible() { events.push("production"); return true; } },
    async (input) => {
      events.push("creative");
      assert.deepEqual(input, { creativeId: CREATIVE_UUID, redirectSlugId: "redirect-id", casinoId: "casino-id", affiliateOfferId: "offer-id", trackingLinkId: "tracking-id" });
      return new URL("https://record.betsn.info/creative-specific");
    },
    () => true,
  );
  const result = await service.resolve("betsson", { creativeId: CREATIVE_UUID, now: new Date("2030-01-01T00:00:00Z") });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.destination.href, "https://record.betsn.info/creative-specific");
  assert.deepEqual(events, ["geo", "production", "creative"]);

  const disabled = new AffiliateRedirectService(
    redirectStore(),
    { activeCandidates: async () => [activeOffer()] as never },
    allowJurisdictionResolver,
    allowGbCommercialReadinessAuthority,
    { async isProductionEligible() { return true; } },
    async () => { throw new Error("disabled capability must not resolve a creative"); },
    () => false,
  );
  const denied = await disabled.resolve("betsson", { creativeId: CREATIVE_UUID, now: new Date("2030-01-01T00:00:00Z") });
  assert.equal(denied.ok, false);
  if (!denied.ok) assert.equal(denied.reason, "CREATIVE_DESTINATION_DENIED");

  let deniedCreativeReads = 0;
  const geoDenied = new AffiliateRedirectService(
    redirectStore(),
    { activeCandidates: async () => { throw new Error("GEO denial must precede offer resolution"); } },
    { async resolve() { return { ...allowJurisdictionDecision, commercialAllowed: false, referralAllowed: false, reasonCode: "MARKET_RESTRICTED" }; } },
    allowGbCommercialReadinessAuthority,
    { async isProductionEligible() { throw new Error("GEO denial must precede Production route checks"); } },
    async () => { deniedCreativeReads += 1; return new URL("https://should-never-resolve.example"); },
    () => true,
  );
  const geoDeniedResult = await geoDenied.resolve("betsson", { creativeId: CREATIVE_UUID, now: new Date("2030-01-01T00:00:00Z") });
  assert.equal(geoDeniedResult.ok, false);
  if (!geoDeniedResult.ok) assert.equal(geoDeniedResult.reason, "JURISDICTION_DENIED");
  assert.equal(deniedCreativeReads, 0);
});

test("MCP surface remains exactly five Media tools and four Commercial tools with no publish action", async () => {
  const { mediaMcpTools } = await import("../lib/mcp/media/server");
  const { commercialMcpTools } = await import("../lib/mcp/commercial/server");
  assert.equal(mediaMcpTools.length, 5);
  assert.equal(commercialMcpTools.length, 4);
  assert.equal([...mediaMcpTools, ...commercialMcpTools].some((tool) => /publish/i.test(tool.name)), false);
  assert.match(mediaMcpTools[0].description, /partner-hosted/);
});
