import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  normalizeCasinoCoreDraft,
  publicationWarnings,
  validateCasinoCoreDraft,
} from "../lib/casino-builder/core-validation";
import type { CasinoCoreDraft } from "../lib/casino-builder/types";

const ids = {
  license: "11111111-1111-4111-8111-111111111111",
  country: "22222222-2222-4222-8222-222222222222",
  payment: "33333333-3333-4333-8333-333333333333",
  provider: "44444444-4444-4444-8444-444444444444",
  category: "55555555-5555-4555-8555-555555555555",
};

function draft(): CasinoCoreDraft {
  return {
    slug: "Example Casino",
    internalName: "Example Casino",
    title: "Example Casino",
    domain: "https://www.Example.com/offer",
    websiteUrl: "https://example.com",
    operator: "Example Group",
    tagline: null,
    summary: "Editorial summary",
    description: "Editorial description",
    foundedYear: 2020,
    language: "EN",
    languages: ["EN", "de"],
    currencies: ["usd", "EUR"],
    editorScore: 8.2,
    generalMetadata: {
      trustScore: 8,
      userExperienceScore: 8,
      paymentsScore: 7.5,
      gamesScore: 8.4,
      supportScore: 7,
      responsibleGamblingScore: 8,
      featured: false,
      recommended: false,
      internalNotes: null,
    },
    seo: {
      id: "",
      title: "Example Casino Review",
      description: "A factual editorial review.",
      canonicalUrl: "https://example.com/casino/example",
      robots: "index,follow",
      socialTitle: null,
      socialDescription: null,
      socialImage: null,
      structuredData: "{\"@type\":\"Review\"}",
      robotsIndex: true,
      robotsFollow: true,
    },
    licenses: [{
      id: ids.license,
      authority: "MGA",
      licenseNumber: "MGA/001",
      jurisdiction: "MT",
      status: "ACTIVE",
      verificationUrl: "https://example.com/license",
      issuedAt: "2020-01-01",
      expiresAt: "2030-01-01",
      lastVerifiedAt: null,
      notes: null,
      verified: true,
      archived: false,
    }],
    countries: [{
      id: ids.country,
      countryCode: "GB",
      availability: "AVAILABLE",
      minimumAge: 18,
      notes: null,
      currency: "GBP",
      language: "en",
      priority: 1,
      archived: false,
    }],
    paymentMethods: [{
      id: ids.payment,
      methodKey: "visa",
      name: "Visa",
      supportsDeposits: true,
      supportsWithdrawals: true,
      currencies: ["gbp", "EUR", "gbp"],
      minimumDeposit: "10",
      maximumDeposit: "1000",
      minimumWithdrawal: "20",
      maximumWithdrawal: "2000",
      depositProcessingTime: "Instant",
      withdrawalTime: "1-3 days",
      fees: null,
      depositFee: "0",
      withdrawalFee: "0",
      type: "card",
      countries: ["gb"],
      verified: true,
      notes: null,
      archived: false,
      crypto: false,
      sortOrder: 1,
    }],
    gameProviders: [{
      id: ids.provider,
      providerKey: "example-games",
      name: "Example Games",
      websiteUrl: "https://example.com",
      gameCount: 40,
      liveCasino: false,
      featured: true,
      verified: true,
      archived: false,
      verifiedAt: null,
      sortOrder: 1,
    }],
    gameCategories: [{
      id: ids.category,
      categoryKey: "slots",
      name: "Slots",
      gameCount: 30,
      featured: true,
      icon: "slots",
      archived: false,
      sortOrder: 1,
    }],
    casinoBonuses: [],
  };
}

function errorCodes(value: CasinoCoreDraft) {
  return validateCasinoCoreDraft(normalizeCasinoCoreDraft(value)).map((entry) => entry.code);
}

test("general editor normalizes domains and rejects invalid score ranges", () => {
  const valid = normalizeCasinoCoreDraft(draft());
  assert.equal(valid.domain, "example.com");
  assert.equal(valid.slug, "example-casino");
  assert.deepEqual(valid.currencies, ["USD", "EUR"]);

  const invalid = draft();
  invalid.domain = "not-a-domain";
  invalid.generalMetadata.trustScore = 11;
  assert.deepEqual(new Set(errorCodes(invalid)), new Set(["INVALID_DOMAIN", "INVALID_SCORE"]));
});
test("SEO validates canonical URLs and structured data without executing it", () => {
  const malformed = draft();
  malformed.seo!.canonicalUrl = "javascript:alert(1)";
  malformed.seo!.structuredData = "{broken";
  assert.deepEqual(new Set(errorCodes(malformed)), new Set(["INVALID_CANONICAL_URL", "INVALID_STRUCTURED_DATA"]));

  assert.equal(errorCodes(draft()).includes("INVALID_STRUCTURED_DATA"), false);
});

test("licenses reject duplicates and reversed dates, and report expiry warnings", () => {
  const invalid = draft();
  invalid.licenses[0].issuedAt = "2030-01-01";
  invalid.licenses[0].expiresAt = "2020-01-01";
  invalid.licenses.push({ ...invalid.licenses[0], id: "66666666-6666-4666-8666-666666666666" });
  const codes = errorCodes(invalid);
  assert.equal(codes.includes("DUPLICATE_LICENSE"), true);
  assert.equal(codes.includes("INVALID_LICENSE_DATES"), true);

  const expired = normalizeCasinoCoreDraft(draft());
  expired.licenses[0].expiresAt = "2000-01-01";
  assert.equal(publicationWarnings(expired).some((entry) => entry.code === "LICENSE_EXPIRED"), true);
});

test("country editor enforces ISO codes, unique rules, and a single availability state", () => {
  const invalid = draft();
  invalid.countries[0].countryCode = "ZZ";
  invalid.countries[0].availability = "ALLOWED_AND_BLOCKED";
  invalid.countries.push({ ...invalid.countries[0], id: "77777777-7777-4777-8777-777777777777" });
  const codes = errorCodes(invalid);
  assert.equal(codes.includes("INVALID_COUNTRY_CODE"), true);
  assert.equal(codes.includes("INVALID_AVAILABILITY"), true);
  assert.equal(codes.includes("DUPLICATE_COUNTRY"), true);
});

test("payments reject negatives and duplicates while normalizing currencies", () => {
  const valid = normalizeCasinoCoreDraft(draft());
  assert.deepEqual(valid.paymentMethods[0].currencies, ["GBP", "EUR"]);
  assert.deepEqual(valid.paymentMethods[0].countries, ["GB"]);

  const invalid = draft();
  invalid.paymentMethods[0].minimumDeposit = "-1";
  invalid.paymentMethods.push({ ...invalid.paymentMethods[0], id: "88888888-8888-4888-8888-888888888888" });
  const codes = errorCodes(invalid);
  assert.equal(codes.includes("INVALID_AMOUNT"), true);
  assert.equal(codes.includes("DUPLICATE_PAYMENT_METHOD"), true);
});

test("providers and categories reject duplicate keys, negative counts, and invalid ordering", () => {
  const invalid = draft();
  invalid.gameProviders[0].gameCount = -1;
  invalid.gameProviders.push({ ...invalid.gameProviders[0], id: "99999999-9999-4999-8999-999999999999" });
  invalid.gameCategories[0].sortOrder = -1;
  invalid.gameCategories.push({ ...invalid.gameCategories[0], id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" });
  const codes = errorCodes(invalid);
  assert.equal(codes.includes("DUPLICATE_GAME_PROVIDER"), true);
  assert.equal(codes.includes("DUPLICATE_GAME_CATEGORY"), true);
  assert.equal(codes.includes("INVALID_GAME_COUNT"), true);
  assert.equal(codes.includes("INVALID_PRIORITY"), true);
});

test("service and API enforce uniqueness, concurrency, revisioning, and authorization", () => {
  const service = readFileSync("lib/services/casino.service.ts", "utf8");
  const repository = readFileSync("lib/repositories/casino.repository.ts", "utf8");
  const route = readFileSync("app/api/admin/casinos/[casinoId]/route.ts", "utf8");
  const builder = readFileSync("components/admin/CasinoBuilder.tsx", "utf8");

  assert.match(service, /existsBySlug\(draft\.slug, id\)/);
  assert.match(service, /existsByDomain\(draft\.domain, id\)/);
  assert.match(repository, /CASINO_EDIT_CONFLICT/);
  assert.match(repository, /createRevision\(tx, current, actorId, summary\)/);
  assert.match(route, /requireAdminPermission\(request, "casino\.edit"\)/);
  assert.match(route, /saveCoreDraft/);
  assert.match(builder, /expectedUpdatedAt: casino\.updatedAt/);
  assert.doesNotMatch(builder, /@prisma\/client|prisma\./);
});
