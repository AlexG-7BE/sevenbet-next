import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  classifyLicenceStatus,
  countRegulators,
  editorScoreBreakdown,
  type EditorScoreInput,
} from "../lib/casino-global-catalog/editor-score";

/**
 * Inputs reconstructed from the checksum-verified EGO bundles for the counts
 * the approved 22 September run used. They pin the method, not the data.
 */
const approvedInputs: Record<string, EditorScoreInput> = {
  "ahti-games": { verifiedRegulators: 2, unverifiedRegulators: 1, gameCategories: 7, paymentMethods: 5, gameProviders: 10, liveCasino: true, supportLanguages: 4, everyMarketDocumentsSupport: false },
  bacanaplay: { verifiedRegulators: 2, unverifiedRegulators: 1, gameCategories: 7, paymentMethods: 8, gameProviders: 9, liveCasino: true, supportLanguages: 5, everyMarketDocumentsSupport: false },
  "casino-redkings": { verifiedRegulators: 1, unverifiedRegulators: 1, gameCategories: 7, paymentMethods: 5, gameProviders: 10, liveCasino: true, supportLanguages: 4, everyMarketDocumentsSupport: false },
  drueckglueck: { verifiedRegulators: 2, unverifiedRegulators: 1, gameCategories: 7, paymentMethods: 8, gameProviders: 12, liveCasino: true, supportLanguages: 4, everyMarketDocumentsSupport: false },
  eucasino: { verifiedRegulators: 2, unverifiedRegulators: 1, gameCategories: 7, paymentMethods: 5, gameProviders: 10, liveCasino: true, supportLanguages: 4, everyMarketDocumentsSupport: false },
  jackpotstar: { verifiedRegulators: 2, unverifiedRegulators: 1, gameCategories: 4, paymentMethods: 5, gameProviders: 10, liveCasino: true, supportLanguages: 5, everyMarketDocumentsSupport: false },
  megawayscasino: { verifiedRegulators: 1, unverifiedRegulators: 0, gameCategories: 4, paymentMethods: 5, gameProviders: 6, liveCasino: true, supportLanguages: 2, everyMarketDocumentsSupport: false },
  playojo: { verifiedRegulators: 4, unverifiedRegulators: 1, gameCategories: 8, paymentMethods: 5, gameProviders: 12, liveCasino: true, supportLanguages: 5, everyMarketDocumentsSupport: false },
  "playojo-bingo": { verifiedRegulators: 1, unverifiedRegulators: 0, gameCategories: 3, paymentMethods: 5, gameProviders: 3, liveCasino: true, supportLanguages: 2, everyMarketDocumentsSupport: false },
  playuzu: { verifiedRegulators: 1, unverifiedRegulators: 1, gameCategories: 7, paymentMethods: 5, gameProviders: 10, liveCasino: true, supportLanguages: 4, everyMarketDocumentsSupport: false },
  regencycasino: { verifiedRegulators: 2, unverifiedRegulators: 1, gameCategories: 7, paymentMethods: 8, gameProviders: 8, liveCasino: true, supportLanguages: 3, everyMarketDocumentsSupport: false },
  slotsmagic: { verifiedRegulators: 1, unverifiedRegulators: 1, gameCategories: 7, paymentMethods: 5, gameProviders: 25, liveCasino: true, supportLanguages: 4, everyMarketDocumentsSupport: false },
  turbonino: { verifiedRegulators: 3, unverifiedRegulators: 1, gameCategories: 7, paymentMethods: 7, gameProviders: 8, liveCasino: true, supportLanguages: 4, everyMarketDocumentsSupport: false },
};

/**
 * The one published component this method does not reproduce. From the same
 * counts, 6.8 + 0.25 x 3 is exactly 7.55, which rounds half-up to 7.6; the
 * 22 September record shows 7.5. The cause is not established in the record.
 * Pinned here so the discrepancy stays visible rather than silently absorbed.
 */
const UNRECONCILED_COMPONENT = { slug: "playojo-bingo", component: "userExperience", published: 7.5, computed: 7.6 } as const;

test("the method reproduces every Founder-approved Editor Score", async () => {
  const editorial = JSON.parse(await readFile(
    path.join(process.cwd(), "data/casino-ingestion/ego-skillonnet-2026-09-22/editorial.json"),
    "utf8",
  )) as { casinos: Array<{ slug: string; score: number; scoreComponents: Record<string, number> }> };

  assert.equal(editorial.casinos.length, 13);
  for (const casino of editorial.casinos) {
    const input = approvedInputs[casino.slug];
    assert.ok(input, `missing reconstructed input for ${casino.slug}`);
    const { components, score } = editorScoreBreakdown(input);
    assert.equal(score, casino.score, `${casino.slug} score`);
    for (const [key, published] of Object.entries(casino.scoreComponents)) {
      const computed = components[key as keyof typeof components];
      if (casino.slug === UNRECONCILED_COMPONENT.slug && key === UNRECONCILED_COMPONENT.component) {
        assert.equal(published, UNRECONCILED_COMPONENT.published);
        assert.equal(computed, UNRECONCILED_COMPONENT.computed);
        continue;
      }
      assert.equal(computed, published, `${casino.slug}.${key}`);
    }
  }
});

test("a component landing exactly on a half rounds up", () => {
  // 6.8 + 0.25 * 3 is exactly 7.55, the boundary the published record and this
  // method disagree on.
  const { components } = editorScoreBreakdown({
    verifiedRegulators: 0,
    unverifiedRegulators: 0,
    gameCategories: 3,
    paymentMethods: 0,
    gameProviders: 0,
    liveCasino: false,
    supportLanguages: 0,
    everyMarketDocumentsSupport: false,
  });
  assert.equal(components.userExperience, 7.6);
});

test("the mean rounds half-up over the rounded components", () => {
  // Components 6.7 / 8.6 / 8.0 / 8.2 / 7.8 / 6.6 sum to 45.9, a mean of exactly
  // 7.65. Computing this in binary floating point yields 7.649999999999999.
  const { score } = editorScoreBreakdown({
    verifiedRegulators: 1,
    unverifiedRegulators: 1,
    gameCategories: 7,
    paymentMethods: 5,
    gameProviders: 10,
    liveCasino: true,
    supportLanguages: 4,
    everyMarketDocumentsSupport: false,
  });
  assert.equal(score, 7.7);
});

test("components clamp to their approved ceilings", () => {
  const { components } = editorScoreBreakdown({
    verifiedRegulators: 20,
    unverifiedRegulators: 20,
    gameCategories: 100,
    paymentMethods: 100,
    gameProviders: 100,
    liveCasino: true,
    supportLanguages: 100,
    everyMarketDocumentsSupport: true,
  });
  assert.equal(components.trust, 9);
  assert.equal(components.userExperience, 9);
  assert.equal(components.payments, 9);
  assert.equal(components.games, 9);
  assert.equal(components.support, 8.6, "support is capped below the general ceiling");
  assert.equal(components.responsibleGambling, 8.2, "responsible gambling is capped below the general ceiling");
});

test("an empty record floors at 6.0 rather than dropping toward zero", () => {
  const { components, score } = editorScoreBreakdown({
    verifiedRegulators: 0,
    unverifiedRegulators: 0,
    gameCategories: 0,
    paymentMethods: 0,
    gameProviders: 0,
    liveCasino: false,
    supportLanguages: 0,
    everyMarketDocumentsSupport: false,
  });
  assert.equal(components.trust, 6);
  // 6.0 + 6.8 + 6.2 + 6.2 + 6.6 + 6.2 = 38.0, a mean of 6.33.
  assert.equal(score, 6.3);
});

test("a reported-only registration never counts as a verified regulator", () => {
  // AGCO / iGaming Ontario is recorded for PlayOJO and SlotsMagic as "Reported"
  // because the registration was never read against the regulator's register.
  assert.equal(classifyLicenceStatus("Reported"), "IGNORED");
  assert.equal(classifyLicenceStatus("Active"), "VERIFIED");
  assert.equal(classifyLicenceStatus("Active (number not primary-verified)"), "UNVERIFIED");
  assert.equal(classifyLicenceStatus(null), "IGNORED");
});

test("repeated licence rows for one regulator count once, and verified wins", () => {
  const counted = countRegulators([
    { authority: "Malta Gaming Authority", status: "Active (number not primary-verified)" },
    { authority: "Malta Gaming Authority", status: "Active (number not primary-verified)" },
    { authority: "Malta Gaming Authority", status: "Active (number not primary-verified)" },
    { authority: "Gambling Commission", status: "Active" },
    { authority: "AGCO / iGaming Ontario", status: "Reported" },
  ]);
  assert.deepEqual(counted, { verifiedRegulators: 1, unverifiedRegulators: 1 });
});
