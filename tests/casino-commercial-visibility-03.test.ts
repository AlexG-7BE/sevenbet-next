import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CASINO_COMMERCIAL_VISIBILITY_AUTHORITY,
  projectPartnerRoute,
  type PartnerRouteCandidate,
} from "../lib/affiliate-routing/partner-route-projection";
import {
  superflyBlockedCountries,
  superflyCommercialCatalog,
} from "../lib/casino-commercial-visibility/catalog";
import type { CommercialJurisdictionAuthority } from "../lib/jurisdiction/commercial-authority";
import { mapPublishedCasino, projectPublicCasinoMarket } from "../lib/public-casino/public-casino.mapper";
import type {
  PublishedCasinoSnapshotRecord,
  PublicAffiliateRoute,
} from "../lib/public-casino/public-casino.types";
import type { PublicCasinoDiscoveryStore } from "../lib/public-casino-discovery/public-casino-discovery.types";
import { selectOverallShortlist } from "../lib/public-offer/best-offer-ranking";
import { publicCasinoToOffers } from "../lib/public-offer/public-offer.mapper";
import type { PublicCasinoStore } from "../lib/repositories/public-casino.repository";
import { PublicCasinoDiscoveryService } from "../lib/services/public-casino-discovery.service";
import { PublicCasinoService } from "../lib/services/public-casino.service";

const now = new Date("2026-09-03T12:00:00.000Z");
const expectedRealSlugs = [
  "betsson",
  "skol-casino",
  "hello-casino",
  "gday-casino",
  "diamond7",
  "dragonbet",
  "21-prive",
  "slotnite",
] as const;
const scores: Record<(typeof expectedRealSlugs)[number], number> = {
  betsson: 8.8,
  "skol-casino": 8.4,
  "hello-casino": 8.3,
  "gday-casino": 8.1,
  diamond7: 7.9,
  dragonbet: 7.7,
  "21-prive": 7.4,
  slotnite: 7.2,
};

function commercialDefinition(slug: string) {
  return superflyCommercialCatalog.find((entry) => entry.slug === slug) ?? null;
}

function publishedRecord(slug: (typeof expectedRealSlugs)[number]): PublishedCasinoSnapshotRecord {
  const definition = commercialDefinition(slug);
  const id = `real-${slug}`;
  const title = definition?.title ?? (slug === "betsson" ? "Betsson" : "DragonBet");
  const payments = definition?.payments ?? [{
    key: "visa", name: "Visa", supportsDeposits: true, supportsWithdrawals: true,
    currencies: ["EUR"], withdrawalTime: "Observed withdrawal processing", maximumWithdrawal: null,
  }];
  const providers = definition?.providers ?? [{ key: "evolution", name: "Evolution", liveCasino: true }];
  const categories = definition?.categories ?? [{ key: "slots", name: "Slots", gameCount: null }];
  const bonus = definition ? {
    id: `${id}-bonus`,
    ...definition.bonus,
    type: "WELCOME",
    status: "PUBLISHED",
    offerStatus: "ACTIVE",
  } : null;
  return {
    casinoId: id,
    version: 3,
    status: "PUBLISHED",
    publishedAt: new Date("2026-09-03T10:00:00.000Z"),
    archivedAt: null,
    snapshot: {
      id,
      slug,
      title,
      domain: `${slug}.test.invalid`,
      summary: `${title} researched casino profile.`,
      description: `${title} full editorial review.`,
      status: "PUBLISHED",
      editorScore: scores[slug],
      foundedYear: definition?.foundedYear ?? 2001,
      languages: definition?.languages ?? ["EN"],
      currencies: definition?.currencies ?? ["EUR"],
      licenses: [{ id: `${id}-licence`, authority: "Test regulator evidence", licenseNumber: `${id}-001`, status: "ACTIVE" }],
      paymentMethods: payments.map((payment) => ({
        id: `${id}-payment-${payment.key}`,
        methodKey: payment.key,
        name: payment.name,
        supportsDeposits: payment.supportsDeposits,
        supportsWithdrawals: payment.supportsWithdrawals,
        currencies: payment.currencies,
        withdrawalTime: payment.withdrawalTime,
        maximumWithdrawal: payment.maximumWithdrawal,
        crypto: false,
      })),
      gameProviders: providers.map((provider) => ({
        id: `${id}-provider-${provider.key}`,
        providerKey: provider.key,
        name: provider.name,
        liveCasino: provider.liveCasino,
      })),
      gameCategories: categories.map((category) => ({
        id: `${id}-category-${category.key}`,
        categoryKey: category.key,
        name: category.name,
        gameCount: category.gameCount,
        featured: true,
      })),
      casinoBonuses: bonus ? [bonus] : [],
      countries: [],
      pros: ["Researched editorial strength"],
      cons: ["Exact local terms can vary"],
      responsibleGamblingTools: definition?.responsibleGamblingTools ?? ["Deposit limits"],
      mediaAssets: [{
        id: `${id}-logo`, type: "LOGO", status: "ACTIVE", publicUrl: `/casino-brands/${slug}/logo.svg`,
        altText: `${title} controlled logo`, width: 160, height: 80,
      }],
      reviewBlocks: {
        reviewContent: `${title} complete editorial review.`,
        __sevenbetCasinoEditor: {
          general: { featured: true, recommended: true, supportsMobile: true },
          licenses: {}, countries: {}, payments: {}, providers: {}, categories: {},
          bonuses: bonus ? { [bonus.id]: { maximumBet: definition?.bonus.maximumBet ?? null } } : {},
        },
      },
    },
  };
}

const records = expectedRealSlugs.map(publishedRecord);
const routes: PublicAffiliateRoute[] = superflyCommercialCatalog.flatMap((definition) => {
  const casinoId = `real-${definition.slug}`;
  const bonusId = `${casinoId}-bonus`;
  return [
    { casinoId, casinoBonusId: null, slug: `${definition.slug}-welcome` },
    { casinoId, casinoBonusId: bonusId, slug: `${definition.slug}-welcome` },
  ];
});

function publicStore(): PublicCasinoStore {
  return {
    listPublished: async () => records,
    listManagedSlugs: async () => [...expectedRealSlugs],
    findPublishedBySlug: async (slug) => records.find((record) => record.snapshot && (record.snapshot as { slug?: string }).slug === slug) ?? null,
    hasManagedSlug: async (slug) => expectedRealSlugs.includes(slug as (typeof expectedRealSlugs)[number]),
    listActiveAffiliateRoutes: async () => routes,
  };
}

function discoveryStore(): PublicCasinoDiscoveryStore {
  return {
    listPublished: async () => records,
    loadContext: async () => ({ aliases: [], offers: [], redirects: [] }),
  };
}

function authority(countryCode: string): CommercialJurisdictionAuthority {
  return { countryCode, commercialAllowed: true, referralAllowed: true, reasonCode: "FOUNDER_GLOBAL_DEFAULT", policyVersion: CASINO_COMMERCIAL_VISIBILITY_AUTHORITY };
}

function publicService() {
  return new PublicCasinoService(publicStore(), [], { cmsEnabled: true, redirectEnabled: true, now });
}

function globalRoute(countryCode: string): PartnerRouteCandidate {
  const blocked = superflyBlockedCountries.includes(countryCode as (typeof superflyBlockedCountries)[number]);
  const countryAuthority = blocked ? { countryCode, mode: "BLOCK" } : null;
  const commercialVisibility = {
    authority: CASINO_COMMERCIAL_VISIBILITY_AUTHORITY,
    productionEligibleByDefault: true,
    blockedCountries: superflyBlockedCountries,
    evidenceId: "fixture-current-detected-route",
    canonicalUrlSha256: "a".repeat(64),
  };
  return {
    casino: { id: "real-diamond7", slug: "diamond7", name: "Diamond7" },
    marketProfile: null,
    network: { id: "superfly", name: "Superfly", active: true, archivedAt: null },
    program: {
      id: "program", casinoId: "real-diamond7", name: "Superfly programme", operator: "White Hat",
      accountReference: "fixture", status: "ACTIVE", workflowStatus: "PUBLISHED", domainLifecycleStatus: "ACTIVE",
      supportedCountries: [], supportedCurrencies: [], metadata: { commercialVisibility }, archivedAt: null,
    },
    offer: {
      id: "offer", casinoId: "real-diamond7", casinoBonusId: "real-diamond7-bonus", status: "ACTIVE",
      domainLifecycleStatus: "ACTIVE", payoutModel: "CPA", payoutAmount: null, payoutCurrency: null,
      revenueSharePercentage: null, hybridTerms: null, geoMode: "BLOCK", languages: [], currencies: [],
      landingPageUrl: null, startAt: null, expiresAt: null, archivedAt: null, countryAuthority,
    },
    tracking: {
      id: "tracking", offerId: "offer", label: "Canonical fixture", destinationUrl: "https://route.test.invalid/click",
      trackingUrl: "https://route.test.invalid/click", landingPage: null, campaign: null, externalLinkId: null,
      currencyCode: null, language: null, geoMode: "BLOCK", active: true, verifiedAt: now, lastCheckedAt: now,
      validFrom: null, expiresAt: null, archivedAt: null, metadata: { commercialVisibility },
      countryAuthority: blocked ? {
        ...countryAuthority!, productionEligible: false, productionEligibilityVerifiedAt: now,
        productionEligibilityExpiresAt: null, productionEligibilityEvidence: "Detected fixture block", productionEligibilityNotes: null,
      } : null,
    },
    redirect: {
      id: "redirect", slug: "diamond7-welcome", casinoId: "real-diamond7", casinoBonusId: "real-diamond7-bonus",
      affiliateOfferId: "offer", defaultCurrency: null, defaultLanguage: null, active: true, archivedAt: null,
    },
  };
}

test("1. missing CasinoCountry does not hide a real casino", async () => {
  const casino = await publicService().getCasino("diamond7", null, "KZ");
  assert.equal(casino?.slug, "diamond7");
  assert.equal(casino?.presentationDisposition, "INFORMATIONAL_ONLY");
});

test("2. missing exact market preserves global payments, providers and categories", () => {
  const mapped = mapPublishedCasino(publishedRecord("diamond7"), [], { redirectEnabled: false, now });
  assert.ok(mapped);
  const kz = projectPublicCasinoMarket(mapped, "KZ");
  assert.ok(kz.payments.length >= 10);
  assert.ok(kz.providers.length >= 10);
  assert.ok(kz.categories.length >= 3);
});

test("3. missing exact market preserves researched bonus content", () => {
  const mapped = mapPublishedCasino(publishedRecord("hello-casino"), [], { redirectEnabled: false, now });
  assert.ok(mapped);
  const kz = projectPublicCasinoMarket(mapped, "KZ");
  assert.equal(kz.bonuses[0]?.maximumBonus, 300);
  assert.equal(kz.bonuses[0]?.freeSpins, 100);
  assert.doesNotMatch(JSON.stringify(kz.bonuses), /(?:€|EUR\s*)100.*25|25.*(?:€|EUR\s*)100/i);
});

for (const [position, countryCode] of [[4, "KZ"], [5, "US"], [6, "DE"]] as const) {
  test(`${position}. ${countryCode} shows all eight real casinos`, async () => {
    const casinos = await publicService().listCasinos(null, countryCode);
    assert.deepEqual(casinos.map((casino) => casino.slug), [...expectedRealSlugs]);
  });
}

test("7. PE and SE do not automatically hide the global catalog", async () => {
  for (const countryCode of ["PE", "SE"]) {
    assert.equal((await publicService().listCasinos(null, countryCode)).length, 8);
  }
});

test("8. every detected Superfly blocked GEO keeps its CTA off", () => {
  assert.deepEqual(superflyBlockedCountries, ["DK", "ES", "FI", "NO", "CL", "SE", "GB"]);
  for (const countryCode of superflyBlockedCountries) {
    const projected = projectPartnerRoute(globalRoute(countryCode), { countryCode, now });
    assert.equal(projected.productionEligible, false, countryCode);
  }
  for (const availability of ["NOT_AVAILABLE", "RESTRICTED"]) {
    const candidate = globalRoute("KZ");
    candidate.marketProfile = {
      id: `market-kz-${availability.toLowerCase()}`,
      casinoId: candidate.casino.id,
      countryCode: "KZ",
      availability,
      primaryLanguage: null,
      supportedLanguages: [],
      primaryCurrency: null,
      supportedCurrencies: [],
    };
    const projected = projectPartnerRoute(candidate, { countryCode: "KZ", now });
    assert.equal(projected.productionEligible, false, availability);
    assert.ok(projected.reasonCodes.includes("MARKET_PROFILE_MISSING_OR_UNAVAILABLE"));
  }
});

test("9. a non-blocked GEO with a real Superfly route has an available CTA", () => {
  for (const countryCode of ["KZ", "US", "DE", "IE", "MX"]) {
    const projected = projectPartnerRoute(globalRoute(countryCode), { countryCode, now });
    assert.equal(projected.productionEligible, true, `${countryCode}: ${projected.reasonCodes.join(", ")}`);
  }
});

test("10. DragonBet stays visible with no CTA", async () => {
  const casino = await publicService().getCasino("dragonbet", authority("KZ"), "KZ");
  assert.equal(casino?.slug, "dragonbet");
  assert.deepEqual(casino?.affiliate, { href: null, available: false });
});

test("11. no synthetic or demo casino enters the public catalog", async () => {
  const casinos = await publicService().listCasinos(null, "KZ");
  assert.ok(casinos.every((casino) => casino.source === "cms" && casino.id.startsWith("real-") && !casino.id.startsWith("demo-")));
  assert.ok(!casinos.some((casino) => casino.slug === "gentleman-jim"));
});

test("12. the bonuses catalog contains all six real current Superfly records", async () => {
  const bonuses = await publicService().listBonuses(null, "KZ");
  assert.deepEqual(new Set(bonuses.map(({ casino }) => casino.slug)), new Set(superflyCommercialCatalog.map(({ slug }) => slug)));
  assert.equal(bonuses.length, 6);
});

test("13. Best Offers receives a real complete published shortlist", () => {
  const offers = records.flatMap((record) => {
    const mapped = mapPublishedCasino(record, [], { redirectEnabled: false, now, countryCode: "KZ" });
    return mapped ? publicCasinoToOffers(mapped) : [];
  });
  const shortlist = selectOverallShortlist(offers, { country: "KZ" });
  assert.equal(shortlist.length, 6);
  assert.ok(shortlist.every((offer) => offer.dataClassification === "PUBLISHED_RECORD"));
  assert.deepEqual(shortlist.slice(0, 2).map((offer) => offer.casino.slug), ["21-prive", "skol-casino"]);
});

test("14. discovery filters contain meaningful global catalog values", async () => {
  const discovery = new PublicCasinoDiscoveryService(discoveryStore(), () => now, undefined, () => false);
  const result = await discovery.discover({ pageSize: 12 }, null, { defaultEditorialCountry: "KZ" });
  assert.equal(result.total, 8);
  assert.ok(result.facets.currencies.some(({ key }) => key === "EUR"));
  assert.ok(result.facets.licenses.length > 0);
  assert.ok(result.facets.payments.some(({ label }) => label === "Visa"));
  assert.ok(result.facets.gameProviders.some(({ label }) => label === "Evolution"));
  assert.ok(result.facets.categories.some(({ label }) => /slots/i.test(label)));
  assert.ok(result.facets.bonusTypes.some(({ key }) => key === "WELCOME"));
  assert.equal((await discovery.discover({ supportsMobile: true }, null, { defaultEditorialCountry: "KZ" })).total, 8);
  assert.equal((await discovery.discover({ hasResponsibleGambling: true }, null, { defaultEditorialCountry: "KZ" })).total, 8);
});

test("15. complete detail data uses global evidence instead of false Not listed states", () => {
  const mapped = mapPublishedCasino(publishedRecord("hello-casino"), [], { redirectEnabled: false, now, countryCode: "KZ" });
  assert.ok(mapped);
  assert.ok(mapped.licenses.length && mapped.payments.length && mapped.providers.length && mapped.categories.length);
  assert.ok(mapped.languages.length && mapped.currencies.length && mapped.supportsMobile && mapped.bonuses.length);
  assert.ok(mapped.bonuses[0]?.importantConditions.includes("Bonus expires after 30 days; spins expire after 10 days."));
  const profile = readFileSync("components/casino-profile/CasinoProfile.tsx", "utf8");
  assert.match(profile, /messages\.profile\.marketUnavailable/);
  assert.match(profile, /messages\.profile\.marketUnavailableCopy/);
  assert.match(profile, /bonus\.importantConditions\.map/);
});

test("16. governed public records expose only internal redirects, never raw tracking destinations", async () => {
  const casino = await publicService().getCasino("diamond7", authority("KZ"), "KZ");
  assert.equal(casino?.affiliate.href, "/r/diamond7-welcome");
  assert.doesNotMatch(JSON.stringify(casino), /route\.test\.invalid|go\.superflypartners\.net|trackingUrl|destinationUrl/);
  for (const source of ["app/(public)/casino/[slug]/page.tsx", "components/casino-profile/CasinoProfile.tsx"]) {
    assert.doesNotMatch(readFileSync(source, "utf8"), /go\.superflypartners\.net/);
  }
});

test("17. Programme, auth and legal regression gates remain in the required quality suite", () => {
  const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as { scripts: Record<string, string> };
  assert.match(packageJson.scripts["ci:quality"], /mvp-runtime:test/);
  assert.ok(packageJson.scripts["auth-comms:test"]);
  assert.ok(packageJson.scripts["legal-impl:test"]);
  assert.ok(packageJson.scripts["responsible-gambling:test"]);
});

test("the Production reconciler is checksum-bound, confirmation-gated and non-destructive", () => {
  const executor = readFileSync("scripts/casino-commercial-visibility-03.ts", "utf8");
  const manifest = readFileSync("data/casino-commercial-visibility-03/manifest.v1.json");
  assert.match(executor, new RegExp(createHash("sha256").update(manifest).digest("hex")));
  assert.match(executor, /ALLOW_CASINO_COMMERCIAL_VISIBILITY_WRITE/);
  assert.match(executor, /CASINO_COMMERCIAL_VISIBILITY_DATABASE_FINGERPRINT/);
  assert.match(executor, /targetChecksumMatches/);
  assert.match(executor, /allowReleaseRecovery/);
  assert.match(executor, /amount: String\(definition\.bonus\.maximumBonus\)/);
  assert.match(executor, /JSON\.stringify\(stable\(left\)\).*JSON\.stringify\(stable\(right\)\)/s);
  assert.doesNotMatch(executor, /\.(?:delete|deleteMany)\s*\(|\b(?:DROP|TRUNCATE)\b|migrate\s+reset|\$executeRawUnsafe/i);
});
