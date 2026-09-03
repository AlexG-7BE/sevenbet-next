import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  CASINO_REAL_CATALOG_RELEASE,
  assertCasinoRealCatalog,
  casinoCatalogEditorialDocument,
  casinoRealCatalog,
} from "../lib/casino-real-catalog/catalog";
import {
  partnerPreviewAuthorized,
  partnerPreviewConfiguredToken,
  partnerPreviewEnabled,
} from "../lib/partner-preview/authority";
import { parseCasinoDiscoveryQuery } from "../lib/public-casino-discovery/query";
import { isSafePublicSlug } from "../lib/public-casino/public-casino-validation";

const root = process.cwd();
const read = (file: string) => readFileSync(path.join(root, file), "utf8");
const parse = <T>(file: string) => JSON.parse(read(file)) as T;
const expected = [
  ["betsson", 8.8],
  ["skol-casino", 8.4],
  ["hello-casino", 8.3],
  ["gday-casino", 8.1],
  ["diamond7", 7.9],
  ["dragonbet", 7.7],
  ["21-prive", 7.4],
  ["slotnite", 7.2],
] as const;

type IngestionMarket = {
  countryCode: string;
  localDomain: string;
  primaryCurrency: string | null;
  supportedCurrencies: string[];
  payments: Array<{ key: string; name: string }>;
  licenses: Array<{ authority: string; licenseNumber: string; jurisdiction: string }>;
  bonuses: Array<{ slug: string; lifecycleStatus?: string; offerStatus?: string }>;
};

type IngestionBundle = {
  casino: { slug: string; title: string; domain: string };
  markets: IngestionMarket[];
};

type ReleaseManifest = {
  release: string;
  repositoryBase: string;
  sourceFiles: Array<{ path: string; sha256: string }>;
  inventory: Array<{ slug: string; editorScore: number; marketProfiles: string[] }>;
  expectedRows: Record<string, number | Record<string, number>>;
  assets: Array<{ path: string; sha256: string }>;
  commercial: { productionAffiliateWrites: number; productionEligibleRoutes: number; activeRedirects: number };
};

const populationManifest = parse<{ bundles: Array<{ casinoKey: string; path: string }> }>(
  "data/casino-ingestion/casino-data-population-01/manifest.v1.json",
);
const populationBundles = populationManifest.bundles.map(({ path: bundlePath }) => parse<IngestionBundle>(bundlePath));
const betssonBundle = parse<IngestionBundle>("data/casino-ingestion/betsson-pe-se.v1.json");
const releaseManifest = parse<ReleaseManifest>("data/casino-real-catalog-02/manifest.v1.json");

test("1. synthetic, demo and test identities are absent from the approved catalog", () => {
  const serialized = JSON.stringify(casinoRealCatalog.map(({ slug, title }) => ({ slug, title })));
  assert.doesNotMatch(serialized, /demo|fictional|synthetic|test casino/i);
  assert.ok(casinoRealCatalog.every(({ slug }) => !slug.startsWith("demo-") && !slug.endsWith("-test")));
});

test("2. all and only the eight Founder-approved real casino identities are present", () => {
  assert.doesNotThrow(assertCasinoRealCatalog);
  assert.deepEqual(casinoRealCatalog.map(({ slug }) => slug), expected.map(([slug]) => slug));
  assert.equal(new Set(casinoRealCatalog.map(({ slug }) => slug)).size, 8);
});

test("3. every real casino has a finite one-decimal Editor Score", () => {
  assert.ok(casinoRealCatalog.every(({ score }) => Number.isFinite(score) && Number.isInteger(score * 10)));
  assert.deepEqual(casinoRealCatalog.map(({ score }) => score), expected.map(([, score]) => score));
});

test("4. scores have a single canonical presentation across catalog and editorial documents", () => {
  for (const casino of casinoRealCatalog) {
    const document = casinoCatalogEditorialDocument(casino);
    assert.equal(document.trustScore?.overall, casino.score);
    assert.match(document.seo.description, new RegExp(`\\b${casino.score.toFixed(1).replace(".", "\\.")}\\b`));
    assert.equal(document.sections.find(({ id }) => id === "review-faq")?.blocks[0]?.type, "faq");
  }
});

test("5. launch order is deterministic and score-descending", () => {
  assert.deepEqual(
    casinoRealCatalog.map(({ slug }) => slug),
    [...casinoRealCatalog].sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).map(({ slug }) => slug),
  );
});

test("6. affiliate compensation and offer size do not determine Editor Score", () => {
  const source = read("lib/casino-real-catalog/catalog.ts");
  assert.doesNotMatch(source, /commissionRate|revenueShare|payoutModel|affiliateCompensation/);
  assert.ok(casinoRealCatalog.find(({ slug }) => slug === "dragonbet")!.score > casinoRealCatalog.find(({ slug }) => slug === "21-prive")!.score);
  assert.equal(casinoRealCatalog.find(({ slug }) => slug === "dragonbet")!.previewOffers.length, 0);
  assert.match(casinoRealCatalog.find(({ slug }) => slug === "21-prive")!.previewOffers[0]!.amount, /€300/);
});

test("7. Editor Score cannot grant commercial eligibility", () => {
  const service = read("lib/services/public-casino-discovery.service.ts");
  assert.match(service, /decidePublicCasinoDisposition/);
  assert.match(service, /eligibleDiscoveryOffers/);
  assert.doesNotMatch(service, /rating\s*[><=].*(?:PROMOTABLE|available)/);
});

test("8. exact-market facts are projected from one exact market profile", () => {
  const discovery = read("lib/services/public-casino-discovery.service.ts");
  assert.match(discovery, /marketProfiles\.find\(\(profile\) => profile\.countryCode === requestCountryContext\)/);
  assert.match(discovery, /projectPublicCasinoMarket\(casino, requestCountryContext \?\? ""\)/);
});

test("9. discovery filters operate on the single projected exact market", () => {
  const discovery = read("lib/services/public-casino-discovery.service.ts");
  const controls = read("components/casino-discovery/CasinoDiscovery.tsx");
  const projection = discovery.indexOf("const scoped = projectPublicCasinoMarket");
  const filters = discovery.indexOf("const matchingProfiles");
  assert.ok(projection > -1 && filters > projection);
  assert.match(discovery.slice(projection, filters), /scoped\.(payments|providers|categories|currencies)/);
  for (const facet of ["currency", "license", "payment", "gameProvider", "category", "bonusType"]) {
    assert.match(controls, new RegExp(`name=["']${facet}["']`));
  }
});

test("10. unknown evidence stays explicitly unknown without making the overall review incomplete", () => {
  assert.ok(casinoRealCatalog.some(({ facts }) => facts.some(({ classification }) => classification === "UNKNOWN")));
  assert.ok(casinoRealCatalog.every(({ summary, description, bestFor, whyWeLikeIt, thingsToKnow }) =>
    summary.length > 80 && description.length > 150 && bestFor.length >= 3 && whyWeLikeIt.length >= 3 && thingsToKnow.length >= 3));
});

test("11. Betsson Peru facts cannot leak into Sweden", () => {
  const pe = betssonBundle.markets.find(({ countryCode }) => countryCode === "PE")!;
  const se = betssonBundle.markets.find(({ countryCode }) => countryCode === "SE")!;
  assert.equal(pe.primaryCurrency, "PEN");
  assert.ok(pe.payments.some(({ key }) => key === "yape"));
  assert.equal(se.primaryCurrency, "SEK");
  assert.ok(!se.payments.some(({ key }) => key === "yape"));
  assert.ok(!se.licenses.some(({ authority }) => authority === "MINCETUR"));
});

test("12. Betsson Sweden facts cannot leak into Peru", () => {
  const pe = betssonBundle.markets.find(({ countryCode }) => countryCode === "PE")!;
  const se = betssonBundle.markets.find(({ countryCode }) => countryCode === "SE")!;
  assert.ok(se.payments.some(({ key }) => key === "swish"));
  assert.ok(!pe.payments.some(({ key }) => key === "swish"));
  assert.deepEqual(pe.licenses.map(({ licenseNumber }) => licenseNumber), ["11002586010000", "21002586010000"]);
  assert.deepEqual(se.licenses.map(({ licenseNumber }) => licenseNumber), ["23Si2176"]);
});

test("13. legacy GB profiles do not erase the newer bounded global commercial authority", () => {
  assert.ok(populationBundles.every(({ markets }) => markets.length === 1 && markets[0]?.countryCode === "GB"));
  for (const casino of casinoRealCatalog.filter(({ slug }) => !["betsson", "dragonbet"].includes(slug))) {
    assert.ok(casino.previewOffers.every(({ availabilityNote }) => /independent of the governed CTA/.test(availabilityNote)));
  }
  const projection = read("lib/affiliate-routing/partner-route-projection.ts");
  assert.match(projection, /CASINO_COMMERCIAL_VISIBILITY_AUTHORITY/);
  assert.match(projection, /requiredBlocks/);
  assert.match(projection, /!requiredBlocks\.has\(normalizedCountry\)/);
});

test("14. route language cannot replace trusted GEO authority", () => {
  const middleware = read("middleware.ts");
  assert.match(middleware, /requestCountrySignalFromHeaders/);
  assert.match(middleware, /PRESENTATION_LANGUAGE_HEADER/);
  assert.doesNotMatch(read("lib/services/public-casino-discovery.service.ts"), /locale.*visitAction|language.*eligibleDiscoveryOffers/i);
});

test("15. a country query cannot replace trusted GEO authority", () => {
  assert.deepEqual(parseCasinoDiscoveryQuery(new URLSearchParams("country=GB&country=SE")).country, []);
  assert.doesNotMatch(new URLSearchParams("country=GB").toString().replace(/.*/, JSON.stringify(parseCasinoDiscoveryQuery(new URLSearchParams("country=GB")))), /"GB"/);
});

test("16. a presentation cookie cannot create commercial authority", () => {
  const discovery = read("lib/services/public-casino-discovery.service.ts");
  assert.doesNotMatch(discovery, /cookie|PRESENTATION_PREFERENCE_COOKIE/);
  assert.match(discovery, /jurisdictionAllowsReferral\(authority\)/);
});

test("17. information-only casinos keep editorial substance but have no governed action", () => {
  const publicService = read("lib/services/public-casino.service.ts");
  const discovery = read("lib/services/public-casino-discovery.service.ts");
  assert.match(publicService, /bonuses: casino\.bonuses\.map\(\(bonus\) => \(\{ \.\.\.bonus, affiliate: \{ href: null, available: false \} \}\)\)/);
  assert.match(publicService, /affiliate: \{ href: null, available: false \}/);
  assert.match(discovery, /rating: scoped\.editorScore \?\? null/);
  assert.match(discovery, /highlights: scoped\.pros\.slice\(0, 3\)/);
});

test("18. hidden identities do not render through list or detail services", () => {
  const publicService = read("lib/services/public-casino.service.ts");
  const discovery = read("lib/services/public-casino-discovery.service.ts");
  assert.match(publicService, /decision\.disposition === "HIDDEN" \? null/);
  assert.match(publicService, /decision\.disposition === "HIDDEN" \? \[\] :/);
  assert.match(discovery, /if \(decision\.disposition === "HIDDEN"\) return \[\]/);
});

test("19. promotable presentation requires cumulative governed route authority", () => {
  const discovery = read("lib/services/public-casino-discovery.service.ts");
  const projection = read("lib/affiliate-routing/partner-route-projection.ts");
  assert.match(discovery, /commercialCountryContext/);
  assert.match(discovery, /jurisdictionAllowsReferral\(authority\)/);
  assert.match(discovery, /operatorEligibility\?\.referralEligible/);
  assert.match(discovery, /eligibleDiscoveryOffers/);
  assert.match(discovery, /isSafePublicSlug\(redirect\.slug\)/);
  assert.match(projection, /hasFounderGlobalProductionAuthority/);
  assert.match(projection, /SUPERFLY_DETECTED_BLOCKED_COUNTRIES/);
  assert.match(projection, /TRACKING_VERIFICATION_MISSING_OR_STALE/);
});

test("20. stale Hello creative is never paired with the newer offer", () => {
  const hello = casinoRealCatalog.find(({ slug }) => slug === "hello-casino")!;
  assert.equal(hello.previewCreative, null);
  assert.match(hello.previewOffers[0]!.label, /7 August/);
  assert.match(hello.previewOffers[0]!.availabilityNote, /Older Hello offer creative must not be displayed/);
});

test("21. no raw tracking or destination URL is serialized by the catalog or Partner Preview", () => {
  const publicSurface = `${read("lib/casino-real-catalog/catalog.ts")}\n${read("app/partner-preview/page.tsx")}`;
  assert.doesNotMatch(publicSurface, /trackingUrl|destinationUrl|\/r\//);
  assert.doesNotMatch(publicSurface, /https:\/\/(?:go|click|track|tracking)\./i);
});

test("22. no affiliate account identifier is present in public release DTO content", () => {
  const publicSurface = `${JSON.stringify(casinoRealCatalog)}\n${read("app/partner-preview/page.tsx")}`;
  assert.doesNotMatch(publicSurface, /affiliate(?:Id|_id| account)|affid|btag|clickid/i);
});

test("23. Programme state is not read for ranking or commercial disposition", () => {
  for (const file of ["lib/services/public-casino.service.ts", "lib/services/public-casino-discovery.service.ts", "lib/services/public-comparison.service.ts"]) {
    assert.doesNotMatch(read(file), /programme|programEnrollment|progressEvent|mission/i);
  }
});

test("24. Help, self-check and private-user data are not read for ranking", () => {
  for (const file of ["lib/services/public-casino-discovery.service.ts", "lib/services/public-comparison.service.ts"]) {
    assert.doesNotMatch(read(file), /selfCheck|helpData|userProgress|privateUser|sessionStorage|localStorage/i);
  }
});

test("25. this release has no dependency on or mutation of Programme implementation", () => {
  const catalogSource = read("lib/casino-real-catalog/catalog.ts");
  const reconciler = read("scripts/casino-real-catalog-02.ts");
  assert.doesNotMatch(`${catalogSource}\n${reconciler}`, /from ["'][^"']*lib\/programme|program(?:me)?Service\.|missionService\.|xpEvent\./i);
});

test("26. Partner Preview is unavailable in Production and cannot mutate commercial authority", () => {
  const token = "preview-token-with-at-least-24-characters";
  assert.equal(partnerPreviewEnabled({ VERCEL_ENV: "production", NODE_ENV: "production" }), false);
  assert.equal(partnerPreviewAuthorized(token, { VERCEL_ENV: "production", SEVENBET_PARTNER_PREVIEW_TOKEN: token }), false);
  const previewSource = `${read("app/partner-preview/page.tsx")}\n${read("lib/partner-preview/authority.ts")}`;
  assert.doesNotMatch(previewSource, /@prisma\/client|prisma\.|update\(|upsert\(|create\(|delete\(|affiliate.*service/i);
});

test("27. Partner Preview cannot create a route for any GEO", () => {
  const preview = read("app/partner-preview/page.tsx");
  assert.doesNotMatch(preview, /href=|router\.push|redirectSlug|CasinoOutboundAction/);
  assert.match(preview, /<button disabled type="button">Outbound disabled<\/button>/);
  assert.match(preview, /No query, cookie, language selection or simulated market/);
});

test("28. casino cards and Partner Preview have explicit mobile layout guards", () => {
  const css = read("app/partner-preview/partner-preview.module.css");
  const card = read("components/casino-discovery/CasinoDiscoveryCard.tsx");
  assert.match(css, /@media \(max-width:800px\)/);
  assert.match(css, /grid-template-columns:1fr/);
  assert.match(card, /width=\{casino\.logo\.width \?\? 144\}/);
  assert.match(card, /height=\{casino\.logo\.height \?\? 72\}/);
});

test("29. every current real identity is comparison-safe", () => {
  assert.ok(casinoRealCatalog.every(({ slug }) => isSafePublicSlug(slug)));
  const comparison = read("lib/services/public-comparison.service.ts");
  assert.match(comparison, /PUBLISHED_ONLY/);
  assert.doesNotMatch(comparison, /demo-(?:northstar|harbour|atlas)/);
});

test("30. public bonus filtering preserves researched content while bounding the CTA", () => {
  const discovery = read("lib/services/public-casino-discovery.service.ts");
  assert.match(discovery, /const candidateBonus = scoped\.bonuses\[0\] \?\? null/);
  assert.match(discovery, /const bonus = candidateBonus/);
  assert.match(discovery, /const boundedVisit = promotional/);
  assert.match(discovery, /bonusTypes: scoped\.bonuses/);
  assert.match(discovery, /matchesAny\(query\.bonusType, item\.bonusTypes\)/);
});

test("controlled logo and Preview creative binaries match their recorded provenance checksums", () => {
  const checksums = new Set<string>();
  for (const casino of casinoRealCatalog) {
    const bytes = readFileSync(path.join(root, "public", casino.brandMark.path));
    const checksum = createHash("sha256").update(bytes).digest("hex");
    assert.equal(checksum, casino.brandMark.checksum, casino.slug);
    assert.match(casino.brandMark.sourceDomain, /\./);
    assert.ok(bytes.length > 100);
    checksums.add(checksum);
    if (casino.previewCreative) {
      const creative = readFileSync(path.join(root, "public", casino.previewCreative.path));
      assert.equal(createHash("sha256").update(creative).digest("hex"), casino.previewCreative.checksum);
      assert.equal(casino.previewCreative.usage, "PARTNER_PREVIEW_ONLY");
    }
  }
  assert.equal(checksums.size, 8);
});

test("the current release corpus is checksum-bound to its factual sources and assets", () => {
  assert.equal(releaseManifest.release, CASINO_REAL_CATALOG_RELEASE);
  assert.equal(releaseManifest.repositoryBase, "49126a932eb630248d58846b00400f95f079dcb9");
  for (const source of releaseManifest.sourceFiles) {
    assert.equal(createHash("sha256").update(readFileSync(path.join(root, source.path))).digest("hex"), source.sha256, source.path);
  }
  for (const asset of releaseManifest.assets) {
    assert.equal(createHash("sha256").update(readFileSync(path.join(root, asset.path))).digest("hex"), asset.sha256, asset.path);
  }
  assert.deepEqual(releaseManifest.inventory.map(({ slug, editorScore }) => [slug, editorScore]), expected.map((entry) => [...entry]));
  assert.equal(releaseManifest.expectedRows.casinos, 8);
  assert.equal(releaseManifest.expectedRows.marketProfiles, 9);
  assert.equal(releaseManifest.expectedRows.evidence, 95);
  assert.equal(releaseManifest.commercial.productionAffiliateWrites, 0);
  assert.equal(releaseManifest.commercial.productionEligibleRoutes, 0);
  assert.equal(releaseManifest.commercial.activeRedirects, 0);
});

test("serious enforcement and complaint signals remain prominent in the real reviews", () => {
  const betsson = casinoRealCatalog.find(({ slug }) => slug === "betsson")!;
  assert.match(`${betsson.description} ${betsson.thingsToKnow.join(" ")}`, /SEK 6\.5 million sanction/);
  assert.match(`${betsson.description} ${betsson.thingsToKnow.join(" ")}`, /appeal was dismissed|appeal dismissed/i);
  for (const slug of ["21-prive", "slotnite"] as const) {
    const casino = casinoRealCatalog.find((entry) => entry.slug === slug)!;
    assert.match(`${casino.summary} ${casino.description} ${casino.thingsToKnow.join(" ")}`, /complaint|payout-delay/i);
  }
  assert.doesNotMatch(`${casinoRealCatalog.find(({ slug }) => slug === "21-prive")!.bestFor.join(" ")} ${casinoRealCatalog.find(({ slug }) => slug === "slotnite")!.bestFor.join(" ")}`, /best (?:for )?(?:payout|trust)|fastest withdrawal/i);
});

test("the Preview token is strict, scoped and requires an adequately strong configured value", () => {
  const token = "preview-token-with-at-least-24-characters";
  assert.equal(partnerPreviewConfiguredToken({ VERCEL_ENV: "preview", SEVENBET_PARTNER_PREVIEW_TOKEN: "short" }), null);
  assert.equal(partnerPreviewAuthorized(token, { VERCEL_ENV: "preview", SEVENBET_PARTNER_PREVIEW_TOKEN: token }), true);
  assert.equal(partnerPreviewAuthorized(`${token}-wrong`, { VERCEL_ENV: "preview", SEVENBET_PARTNER_PREVIEW_TOKEN: token }), false);
  const middleware = read("middleware.ts");
  assert.match(middleware, /httpOnly: true/);
  assert.match(middleware, /sameSite: "strict"/);
  assert.match(middleware, /path: "\/partner-preview"/);
  assert.match(middleware, /noindex, nofollow, noarchive/);
  assert.match(middleware, /destination\.searchParams\.delete\("token"\)/);
});

test("the bounded reconciler is guarded, idempotent, auditable and never writes affiliate routes", () => {
  const source = read("scripts/casino-real-catalog-02.ts");
  assert.match(source, /process\.env\.CASINO_REAL_CATALOG_CONFIRM !== CASINO_REAL_CATALOG_RELEASE/);
  assert.equal(CASINO_REAL_CATALOG_RELEASE, "CASINO-REAL-CATALOG-02");
  assert.match(source, /ALLOW_PRODUCTION_CASINO_REAL_CATALOG_WRITE/);
  assert.match(source, /CASINO_REAL_CATALOG_TARGET !== "production"/);
  assert.match(source, /CASINO_REAL_CATALOG_DATABASE_FINGERPRINT/);
  assert.match(source, /target\.username, target\.pathname, target\.port/);
  assert.match(source, /ALLOW_PREVIEW_CASINO_REAL_CATALOG_WRITE/);
  assert.match(source, /CASINO_REAL_CATALOG_PRODUCTION_DATABASE_FINGERPRINT/);
  assert.match(source, /productionFingerprint === actualFingerprint/);
  assert.match(source, /ingestCasinoBundlesInTransaction\(transaction, bundles\)/);
  assert.match(source, /verifyCasinoBundlesIdempotencyInTransaction\(transaction, bundles\)/);
  assert.match(source, /timeout: 180_000/);
  assert.match(source, /alreadyApplied/);
  assert.match(source, /catalogRowCounts/);
  assert.match(source, /migrationState/);
  assert.match(source, /auditLog\.create/);
  assert.match(source, /transitionWorkflow/);
  assert.match(source, /publishCasino/);
  assert.doesNotMatch(source, /deleteMany|delete\(|affiliateOffer\.|affiliateRedirect\.|trackingLink\./);
});

test("Gentleman Jim remains outside the release and explicitly blocked by the preflight audit", () => {
  assert.ok(!casinoRealCatalog.map(({ slug }) => String(slug)).includes("gentleman-jim"));
  const source = read("scripts/casino-real-catalog-02.ts");
  assert.match(source, /gentleman-jim/);
  assert.doesNotMatch(read("app/partner-preview/page.tsx"), /Gentleman Jim/i);
});

test("the dynamic casino directory deduplicates metadata and page data loading", () => {
  const page = readFileSync("app/(public)/casinos/page.tsx", "utf8");
  assert.match(page, /import \{ cache \} from "react"/);
  assert.match(page, /const loadCasinoDirectoryPage = cache/);
  assert.equal((page.match(/publicCasinoDiscoveryService\.discover\(/g) ?? []).length, 1);
});
