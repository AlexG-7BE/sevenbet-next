import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8");
}

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

test("public copy excludes bounded high-risk positive claims while preserving disclaimers", () => {
  const publicCopy = [
    ...filesBelow("app/(public)"),
    ...filesBelow("components/home"),
    ...filesBelow("components/programme"),
    ...filesBelow("components/casino-discovery"),
    ...filesBelow("components/casino-profile"),
  ].filter((path) => /\.(ts|tsx)$/.test(path)).map(source).join("\n");

  const prohibited = [
    /\b(?:a|the|this) safe casino\b/i,
    /\bready to gamble\b/i,
    /\bcontrol (?:is )?verified\b/i,
    /\b(?:b4gamble|sevenbet|the programme|the program) (?:can |will )?treats? gambling addiction\b/i,
    /\brecover from gambling addiction (?:so you can|and) (?:gamble|play)\b/i,
    /\brisk-free gambling (?:experience|product|offer)\b/i,
  ];
  for (const phrase of prohibited) assert.doesNotMatch(publicCopy, phrase);
  assert.match(publicCopy, /does not diagnose or treat gambling addiction/);
  assert.match(publicCopy, /Completion does not mean gambling is safe or suitable/);
});

test("commercial surfaces state the enforced compensation boundary without aspirational wording", () => {
  const directCopyFiles = [
    "app/(public)/affiliate-disclosure/AffiliateDisclosureDocument.tsx",
    "app/(public)/methodology/MethodologyDocument.tsx",
  ];
  for (const file of directCopyFiles) {
    const text = source(file);
    assert.match(text, /Affiliate compensation does not determine (?:B4GAMBLE(?:&apos;|')s )?Editor Score or natural editorial\s+ranking/);
    assert.doesNotMatch(text, /should not automatically determine|independent casino discovery/i);
  }

  const productCatalog = source("lib/i18n/product-pages-catalog.ts");
  const methodologyCatalog = source("lib/i18n/static-pages/methodology.ts");
  assert.match(productCatalog, /Affiliate compensation does not determine Editor Score or natural editorial ranking/);
  assert.match(methodologyCatalog, /Affiliate compensation does not determine Editor Score or natural editorial ranking/);
  // The casino directory lists casinos the visitor can open first (CASINOS-VISITOR-FIT-ORDER-2026-09-27),
  // so its answer says that instead of claiming the order ignores partner links.
  assert.match(productCatalog, /faqCommissionAnswer: "Commission never changes the Editor Score\. Casinos we can link to from your country are listed first; within each group, the Editor Score sets the order\."/);
  assert.doesNotMatch(productCatalog, /faqCommissionAnswer: "No\. Affiliate compensation does not determine Editor Score or natural editorial ranking\."/);

  const boundSurfaces = [
    ["app/(public)/methodology/page.tsx", /methodologyMessages\(presentation\.locale\)/],
    // The casino directory lost its card-level note with CasinoDiscoveryCard; the live route
    // states how commission relates to its order through messages.casinos.faqCommissionAnswer.
    ["app/(public)/casinos/page.tsx", /messages\.casinos\.faqCommissionAnswer/],
    ["components/best-offers/BestOffersExperience.tsx", /messages\.bestOffers\.commissionNote/],
    ["components/public-shell/PublicFooter.tsx", /footer\.commissionDisclosure/],
  ] as const;
  for (const [file, contract] of boundSurfaces) assert.match(source(file), contract);
  assert.doesNotMatch(`${productCatalog}\n${methodologyCatalog}`, /should not automatically determine|independent casino discovery/i);
});

test("local control tools remain client-local, non-commercial and free of tracking SDKs", () => {
  const selfCheck = source("app/(public)/self-check/SelfCheckFlow.tsx");
  const limitTracker = source("app/(public)/tools/budget-calculator/PersonalLimitTracker.tsx");
  for (const text of [selfCheck, limitTracker]) {
    assert.doesNotMatch(text, /fetch\(|axios|localStorage|\/api\/|href=["'{]\/(?:casinos|bonuses|best-offers|compare|r|go)(?:\/|["'}])/i);
    assert.doesNotMatch(text, /@vercel\/analytics|@\/lib\/analytics|@\/components\/analytics|google-analytics|googletagmanager|\bgtag\(|\bfbq\(|clarity\.ms|segment\.com/i);
  }
});
