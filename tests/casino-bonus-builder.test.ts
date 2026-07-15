import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { getAdminAccessStatus } from "../lib/auth/policy";
import {
  casinoBonusPublicationIssues,
  casinoBonusTypes,
  casinoBonusToDraft,
  createCasinoBonus,
  duplicateCasinoBonus,
  normalizeCasinoBonusDrafts,
  parseCasinoBonusDrafts,
  reorderCasinoBonuses,
  setCasinoBonusArchived,
  validateCasinoBonusDrafts,
} from "../lib/casino-builder/bonus-validation";
import {
  emptyCasinoEditorMetadata,
  readCasinoEditorMetadata,
  writeCasinoEditorMetadata,
} from "../lib/casino-builder/editor-metadata";
import { readCasinoSaveBody } from "../lib/casino-builder/http";
import type { CasinoBuilderBonus, CasinoBuilderCountry, CasinoCoreDraft } from "../lib/casino-builder/types";

const ids = {
  first: "11111111-1111-4111-8111-111111111111",
  second: "22222222-2222-4222-8222-222222222222",
  third: "33333333-3333-4333-8333-333333333333",
};

const countries: CasinoBuilderCountry[] = [{
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  countryCode: "GB",
  availability: "AVAILABLE",
  minimumAge: 18,
  notes: null,
  currency: "GBP",
  language: "en",
  priority: 1,
  archived: false,
}];

function bonus(id = ids.first): CasinoBuilderBonus {
  return {
    ...createCasinoBonus(id, 1000),
    slug: "welcome-offer",
    internalName: "Welcome offer",
    title: "Welcome offer",
    summary: "Offer description",
    shortTerms: "Terms apply.",
    type: "WELCOME",
    percentage: "100",
    minimumDeposit: "10",
    maximumBonus: "100",
    currency: "GBP",
    wageringMultiplier: "30",
    geoMode: "ALLOW",
    allowedCountries: ["GB"],
    offerStatus: "ACTIVE",
  };
}

function codes(records: CasinoBuilderBonus[]) {
  const normalized = normalizeCasinoBonusDrafts(records.map(casinoBonusToDraft));
  return validateCasinoBonusDrafts(normalized, countries).map((entry) => entry.code);
}

test("builder exposes only CasinoBonusType values that exist in migration 0006", () => {
  const migration = readFileSync("prisma/migrations/0006_casino_foundation/migration.sql", "utf8");
  assert.deepEqual(casinoBonusTypes, ["WELCOME", "NO_DEPOSIT", "FREE_SPINS", "RELOAD", "CASHBACK", "VIP", "OTHER"]);
  for (const type of casinoBonusTypes) assert.match(migration, new RegExp(`'${type}'`));
  assert.equal(casinoBonusTypes.includes("DEPOSIT" as never), false);
  assert.equal(casinoBonusTypes.includes("LOYALTY" as never), false);
  assert.equal(casinoBonusTypes.includes("TOURNAMENT" as never), false);
});

test("create, update, duplicate, archive, restore, and deterministic reorder keep stable IDs", () => {
  const created = bonus();
  const updated = { ...created, title: "Updated welcome offer" };
  const duplicate = duplicateCasinoBonus(updated, ids.second);
  assert.equal(updated.id, created.id);
  assert.equal(duplicate.id, ids.second);
  assert.notEqual(duplicate.slug, created.slug);
  assert.equal(duplicate.offerStatus, "DRAFT");

  const archived = setCasinoBonusArchived(created, true);
  assert.equal(archived.offerStatus, "ARCHIVED");
  assert.equal(setCasinoBonusArchived(archived, false).offerStatus, "DRAFT");

  const third = { ...bonus(ids.third), slug: "cashback", sortOrder: 3000 };
  const reordered = reorderCasinoBonuses([created, duplicate, third], 2, 0);
  assert.deepEqual(reordered.map((record) => record.id), [ids.third, ids.first, ids.second]);
  assert.deepEqual(reordered.map((record) => record.sortOrder), [1000, 2000, 3000]);
});

test("negative values, percentages, date ranges, and evergreen conflicts are rejected", () => {
  const invalid = bonus();
  invalid.amount = "-1";
  invalid.percentage = "1001";
  invalid.freeSpins = -2;
  invalid.wageringMultiplier = "-10";
  invalid.startsAt = "2030-02-01";
  invalid.expiresAt = "2030-01-01";
  invalid.evergreen = true;
  const result = codes([invalid]);
  for (const code of ["INVALID_BONUS_AMOUNT", "INVALID_BONUS_PERCENTAGE", "INVALID_FREE_SPINS", "INVALID_BONUS_DATE_RANGE", "EVERGREEN_EXPIRY_CONFLICT"]) {
    assert.equal(result.includes(code), true, code);
  }
});

test("duplicate slugs, GEO conflicts, inactive countries, and invalid URLs are rejected without dropping data", () => {
  const first = bonus();
  first.allowedCountries = ["GB", "US"];
  first.blockedCountries = ["GB"];
  first.termsUrl = "javascript:alert(1)";
  const second = { ...bonus(ids.second), allowedCountries: ["GB"], slug: first.slug };
  const result = codes([first, second]);
  for (const code of ["DUPLICATE_BONUS_SLUG", "BONUS_COUNTRY_CONFLICT", "BONUS_COUNTRY_NOT_ACTIVE", "BONUS_GEO_MODE_CONFLICT", "INVALID_BONUS_TERMS_URL"]) {
    assert.equal(result.includes(code), true, code);
  }
  assert.deepEqual(first.allowedCountries, ["GB", "US"]);
  assert.deepEqual(first.blockedCountries, ["GB"]);
});

test("publication separates missing terms blockers from expiry and affiliate warnings", () => {
  const missingTerms = bonus();
  missingTerms.shortTerms = null;
  missingTerms.termsUrl = null;
  missingTerms.expiresAt = "2000-01-01";
  missingTerms.featured = false;
  missingTerms.affiliateLinks = [];
  const issues = casinoBonusPublicationIssues([missingTerms]);
  assert.equal(issues.find((entry) => entry.code === "BONUS_TERMS_REQUIRED")?.severity, "error");
  assert.equal(issues.find((entry) => entry.code === "BONUS_EXPIRED")?.severity, "warning");
  assert.equal(issues.find((entry) => entry.code === "BONUS_AFFILIATE_LINK_MISSING")?.severity, "warning");

  missingTerms.featured = true;
  assert.equal(casinoBonusPublicationIssues([missingTerms]).find((entry) => entry.code === "BONUS_EXPIRED")?.severity, "error");
});

test("duplicate active type, GEO, and promo signature produces a warning", () => {
  const first = bonus();
  first.promoCode = "WELCOME";
  const second = { ...bonus(ids.second), slug: "welcome-offer-two", promoCode: "WELCOME" };
  const issues = casinoBonusPublicationIssues([first, second]);
  assert.equal(issues.find((entry) => entry.code === "DUPLICATE_ACTIVE_BONUS")?.severity, "warning");
});

test("strict parser rejects unknown bonus fields and oversized arrays", () => {
  const record = casinoBonusToDraft(bonus());
  assert.throws(() => parseCasinoBonusDrafts([{ ...record, casinoId: "untrusted" }]), /unknown fields/);
  assert.throws(() => parseCasinoBonusDrafts([{ ...record, eligibleGames: Array.from({ length: 101 }, () => "Slots") }]), /invalid or oversized list/);
});

test("HTTP parser rejects unknown top-level fields and oversized payloads", async () => {
  await assert.rejects(
    readCasinoSaveBody(new Request("http://localhost/api", {
      method: "PATCH",
      body: JSON.stringify({ draft: {}, auditActor: "untrusted" }),
    })),
    /unknown fields/,
  );
  await assert.rejects(
    readCasinoSaveBody(new Request("http://localhost/api", {
      method: "PATCH",
      headers: { "content-length": String(600 * 1024) },
      body: "{}",
    })),
    (error: unknown) => Boolean(error && typeof error === "object" && "statusCode" in error && error.statusCode === 413),
  );
});

test("casino admin authorization resolves anonymous, forbidden, and editor access correctly", () => {
  assert.equal(getAdminAccessStatus({ hasSession: false, hasStaffProfile: false, permission: "casino.edit" }), 401);
  assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role: "AUTHOR", permission: "casino.edit" }), 403);
  assert.equal(getAdminAccessStatus({ hasSession: true, hasStaffProfile: true, role: "EDITOR", permission: "casino.edit" }), 200);
});

test("service enforces route ownership, revision, concurrency, and real audit actor", () => {
  const service = readFileSync("lib/services/casino.service.ts", "utf8");
  const repository = readFileSync("lib/repositories/casino.repository.ts", "utf8");
  const route = readFileSync("app/api/admin/casinos/[casinoId]/route.ts", "utf8");
  const editor = readFileSync("components/admin/casino-editors/BonusEditor.tsx", "utf8");
  assert.match(service, /findBonusIdentities/);
  assert.match(service, /A bonus cannot be moved between casinos/);
  assert.doesNotMatch(service, /casinoId:\s*record\.casinoId/);
  assert.match(repository, /CASINO_EDIT_CONFLICT/);
  assert.match(repository, /createRevision\(tx, current, actorId, summary\)/);
  assert.match(repository, /actorId,/);
  assert.match(route, /requireAdminPermission\(request, "casino\.edit"\)/);
  assert.match(route, /expectedUpdatedAt/);
  assert.doesNotMatch(editor, /@prisma\/client|prisma\./);
});

test("versioned editor metadata preserves pre-existing review content", () => {
  const metadata = emptyCasinoEditorMetadata();
  metadata.bonuses[ids.first] = {
    internalName: "Welcome offer",
    shortTerms: "Terms apply",
    amount: null,
    wageringBase: "BONUS",
    minimumOdds: null,
    maximumBet: null,
    eligibleGames: [],
    excludedGames: [],
    eligiblePaymentMethods: [],
    excludedPaymentMethods: [],
    newPlayersOnly: true,
    existingPlayersAllowed: false,
    promoCode: null,
    evergreen: false,
    featured: true,
    exclusive: false,
    notes: null,
    geoMode: "GLOBAL",
    allowedCountries: [],
    blockedCountries: [],
  };
  const existing = { content: [{ type: "paragraph", text: "Keep me" }] };
  const stored = writeCasinoEditorMetadata(existing, metadata);
  assert.deepEqual((stored as Record<string, unknown>).content, existing.content);
  assert.equal(readCasinoEditorMetadata(stored as never).bonuses[ids.first].featured, true);
});

test("legacy Bonus model and static public pages remain intact", () => {
  const schema = readFileSync("prisma/schema.prisma", "utf8");
  const bonusesPage = readFileSync("app/bonuses/page.tsx", "utf8");
  const casinoPage = readFileSync("app/casino/[slug]/page.tsx", "utf8");
  assert.match(schema, /model Bonus \{/);
  assert.match(bonusesPage, /from "@\/lib\/data"/);
  assert.match(casinoPage, /from "@\/lib\/data"/);
});
