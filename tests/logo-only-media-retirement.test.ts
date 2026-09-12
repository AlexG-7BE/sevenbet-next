import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PUBLISHED_LANGUAGE_ROUTE_PROFILES } from "../lib/market/registry";
import { retiredMediaResponse } from "../lib/media-retirement/http";
import { PROGRAMME_LOCALES, PROGRAMME_ROUTES } from "../lib/programme/presentation";

const expectedLocales = [
  "en-GB",
  "de-DE",
  "es-ES",
  "el-GR",
  "sv-SE",
  "da-DK",
  "it-IT",
  "pt-PT",
  "nl-NL",
  "fi-FI",
  "nb-NO",
] as const;

test("one canonical published-language registry drives the eleven Home and Programme locales", () => {
  assert.deepEqual(PUBLISHED_LANGUAGE_ROUTE_PROFILES.map((profile) => profile.defaultLocale), expectedLocales);
  assert.deepEqual(PROGRAMME_LOCALES, expectedLocales);
  assert.deepEqual(PROGRAMME_ROUTES.map((route) => route.language), PUBLISHED_LANGUAGE_ROUTE_PROFILES.map((profile) => profile.language));
  assert.match(readFileSync("components/public-shell/PublicHeader.tsx", "utf8"), /selectableLanguages=\{PUBLISHED_LANGUAGE_ROUTE_PROFILES\}/);
  assert.match(readFileSync("lib/programme/presentation.ts", "utf8"), /PUBLISHED_LANGUAGE_ROUTE_PROFILES\.map/);
});

test("migration 0034 retires active creative authority without deleting history or touching direct assets", () => {
  const sql = readFileSync("prisma/migrations/0034_logo_only_media_retirement/migration.sql", "utf8");
  for (const table of [
    "CasinoMediaAssignment",
    "CasinoBonusMediaAssignment",
    "AffiliateOfferMediaAssignment",
    "CasinoPartnerHostedCreativeAssignment",
    "CasinoBonusPartnerHostedCreativeAssignment",
    "AffiliateOfferPartnerHostedCreativeAssignment",
  ]) {
    assert.match(sql, new RegExp(`UPDATE \\\"${table}\\\"`));
    assert.match(sql, new RegExp(`${table}_retired_inactive_check`));
  }
  assert.match(sql, /MediaCreativeSet_retired_archived_check/);
  assert.match(sql, /MediaCreativeVariant_retired_inactive_check/);
  assert.match(sql, /MediaRevision_retired_inactive_check/);
  assert.doesNotMatch(sql, /\bDELETE\s+FROM\b|\bDROP\s+TABLE\b|UPDATE\s+"MediaAsset"/i);
});

test("public Casino repositories and active commercial authority have no assignment or GEO3 dependency", () => {
  const publicRepository = readFileSync("lib/repositories/public-casino.repository.ts", "utf8");
  const publicMapper = readFileSync("lib/public-casino/public-casino.mapper.ts", "utf8");
  const activationRuntime = readFileSync("lib/market-activation/runtime.ts", "utf8");
  const activationRepository = readFileSync("lib/market-activation/repository.ts", "utf8");
  for (const source of [publicRepository, activationRuntime, activationRepository]) {
    assert.doesNotMatch(source, /MediaCreative|mediaOfferAuthority|PartnerHostedCreative|MediaPreflight/);
  }
  assert.doesNotMatch(publicRepository, /MediaAssignment|mediaAssignment/);
  assert.doesNotMatch(publicMapper, /resolveCasinoMedia|MediaAssignment|MediaCreative|MediaRevision|PartnerHostedCreative/);
  assert.doesNotMatch(activationRepository, /mediaCount|mediaFresh|mediaFingerprint|creativeCount/i);
});

test("public compositions use direct logos and cannot render promotional card or hero media", () => {
  const discovery = readFileSync("lib/services/public-casino-discovery.service.ts", "utf8");
  const comparison = readFileSync("lib/services/public-comparison.service.ts", "utf8");
  const profile = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  const shortlist = readFileSync("components/casino-discovery/CuratedCasinoShortlist.tsx", "utf8");
  const bestOffers = readFileSync("components/best-offers/BestOffersExperience.tsx", "utf8");
  const bonuses = readFileSync("components/bonus-directory/BonusOfferDirectory.tsx", "utf8");
  assert.match(discovery, /hero:\s*null/);
  assert.match(discovery, /scoped\.media\.logo/);
  assert.match(comparison, /casino\.media\.logo/);
  assert.doesNotMatch(profile, /CasinoProfileMediaStrip|offerPlacement/);
  assert.deepEqual([...new Set([...profile.matchAll(/casino\.media\.(\w+)/g)].map((match) => match[1]))], ["logo"]);
  assert.match(shortlist, /casino\.hero\?\.ownership === "B4GAMBLE_EDITORIAL"/);
  assert.doesNotMatch(shortlist, /creativePresentationFamily|mayPresentPromotionalMedia|source === "EXPLICIT"/);
  assert.match(shortlist, /data-presentation-family="LOGO_ONLY"/);
  assert.match(bestOffers, /ResponsivePlacementImage/);
  assert.match(bonuses, /offerCardPresentation/);
  assert.doesNotMatch(`${bestOffers}\n${bonuses}`, /CommercialOfferMedia|OperatorIdentityPanel/);
});

test("Production logo preflight uses exact demo authority while requiring every operator logo", () => {
  const preflight = readFileSync("scripts/logo-only-media-build-preflight.ts", "utf8");
  assert.match(preflight, /import \{ isTemporaryDemoCasinoId \} from "@\/lib\/demo-data\/temporary-demo-authority"/);
  assert.match(preflight, /publishedOperators = publishedCasinos\.filter\(\(casino\) => !isTemporaryDemoCasinoId\(casino\.id\)\)/);
  assert.match(preflight, /published operator Casinos missing a direct active LOGO asset/);
  assert.match(preflight, /publishedDemonstrations: publishedDemonstrations\.length/);
});

test("retired media HTTP surfaces return a cache-proof 410", async () => {
  const response = await retiredMediaResponse();
  assert.equal(response.status, 410);
  assert.deepEqual(await response.json(), { error: "MEDIA_OPERATIONS_RETIRED" });
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  for (const route of [
    "app/api/mcp/media/route.ts",
    "app/api/mcp/oauth/register/media/route.ts",
    "app/api/admin/media/assignments/route.ts",
    "app/api/admin/media-operations/ingestions/route.ts",
    "app/partner-creatives/[creativeId]/frame/route.ts",
  ]) {
    const source = readFileSync(route, "utf8");
    assert.match(source, /retiredMediaResponse/);
    assert.doesNotMatch(source, /mediaOperationsService|mediaAssignmentService|mediaMcpServer/);
  }

  const authConfig = readFileSync("lib/auth/config.ts", "utf8");
  const consentPage = readFileSync("app/admin/integrations/chatgpt-work/consent/page.tsx", "utf8");
  assert.match(authConfig, /clientRegistrationAllowedResources: \[commercialMcpResource\]/);
  assert.doesNotMatch(authConfig, /mediaMcpResource|media:(?:read|safe_write|production_write)/);
  assert.doesNotMatch(consentPage, /isMediaMcpConfig|media:(?:read|safe_write|production_write)/);
});

test("redirect destinations cannot be overridden by retired creative query state", () => {
  const route = readFileSync("app/r/[slug]/route.ts", "utf8");
  const service = readFileSync("lib/services/affiliate-redirect.service.ts", "utf8");
  assert.doesNotMatch(route, /creativeId|searchParams.*creative/);
  assert.doesNotMatch(service, /creativeId|PartnerHostedCreative|CREATIVE_DESTINATION/);
  assert.match(service, /canonicalActivations\.resolveRedirect/);
});
