import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { withHandoffComparisonData } from "../lib/final-handoff/visual-data-fixture";
import { demoProfileCopy } from "../lib/i18n/demo-profile-catalog";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import type { SupportedLocale } from "../lib/market/registry";
import type { PublicComparisonResult } from "../lib/public-comparison/public-comparison.types";

const selectedSlugs = ["demo-northstar", "demo-summit"];

function comparisonSeed(country: string): PublicComparisonResult {
  return {
    status: "projection-unavailable",
    query: { casinos: selectedSlugs, country, differences: false, selectionMode: "explicit", issues: [] },
    selectedSlugs,
    candidates: selectedSlugs.map((slug, index) => ({
      dataClassification: "DEMO_FIXTURE",
      slug,
      name: `Seed ${index}`,
      logo: null,
      editorScore: 0,
      marketState: "UNKNOWN",
      marketLabel: "Seed market label",
    })),
    casinos: [],
    reasons: [{ slug: selectedSlugs[0], code: "PROJECTION_UNAVAILABLE", message: "Seed reason" }],
    groups: [],
    hiddenEqualRows: 0,
    defaulted: false,
    inventoryMode: "UNAVAILABLE",
  };
}

function visibleFixtureCopy(result: PublicComparisonResult) {
  return [
    ...result.casinos.flatMap((casino) => [casino.summary, casino.action.label, casino.action.reason]),
    ...result.candidates.map((candidate) => candidate.marketLabel),
    ...result.groups.flatMap((group) => [
      group.label,
      ...group.rows.flatMap((row) => [
        row.label,
        row.description,
        ...Object.values(row.values).flatMap((value) => [value.text, value.statusLabel ?? ""]),
      ]),
    ]),
  ].join("\n");
}

for (const { locale, country } of [
  { locale: "de-DE", country: "DE" },
  { locale: "fi-FI", country: "FI" },
] as const satisfies readonly { locale: SupportedLocale; country: string }[]) {
  test(`comparison fixture projects existing ${locale} catalog copy and stays action-free`, () => {
    const messages = productPageMessages(locale);
    const copy = demoProfileCopy(locale);
    const seed = comparisonSeed(country);
    const fixture = withHandoffComparisonData(seed, true, locale);

    assert.equal(fixture.status, "available");
    assert.equal(fixture.inventoryMode, "DEMO_ONLY");
    assert.equal(fixture.casinos.length, 2);
    assert.deepEqual(fixture.reasons, []);
    assert.ok(fixture.casinos.every((casino) => (
      casino.dataClassification === "DEMO_FIXTURE"
      && casino.summary === copy.summary
      && casino.reviewHref === "/casino/demo-plume?visualFixture=true"
      && !casino.action.available
      && casino.action.href === null
      && casino.action.label === messages.common.commercialUnavailable
      && casino.action.reason === messages.profile.demoDisclosure
    )));
    assert.ok(fixture.candidates.every((candidate) => candidate.marketLabel === messages.common.demoData));

    const groups = new Map(fixture.groups.map((group) => [group.id, group]));
    assert.equal(groups.get("offer")?.label, messages.profile.offerTerms);
    assert.equal(groups.get("payments")?.label, messages.common.paymentMethods);
    assert.equal(groups.get("safety-commercial")?.label, messages.profile.controlTools);
    const rows = new Map(fixture.groups.flatMap((group) => group.rows).map((row) => [row.id, row]));
    assert.equal(rows.get("offer-title")?.label, messages.profile.offerEvidence);
    assert.equal(rows.get("wagering")?.label, messages.common.wagering);
    assert.equal(rows.get("minimum-deposit")?.label, messages.common.minimumDeposit);
    assert.equal(rows.get("withdrawal-time")?.label, messages.common.payout);
    assert.equal(rows.get("methods")?.label, messages.common.paymentMethods);
    assert.equal(rows.get("control-tools")?.label, messages.profile.controlTools);
    assert.equal(rows.get("offer-title")?.values[selectedSlugs[0]]?.text, copy.bonus.title);
    assert.match(rows.get("offer-title")?.values[selectedSlugs[1]]?.text ?? "", /400/);
    assert.match(rows.get("offer-title")?.values[selectedSlugs[1]]?.text ?? "", /150/);
    assert.match(rows.get("methods")?.values[selectedSlugs[0]]?.text ?? "", new RegExp(copy.bankTransfer));
    assert.equal(rows.get("control-tools")?.values[selectedSlugs[0]]?.text, copy.responsibleGamblingTools.join(" · "));
    assert.ok(fixture.groups.flatMap((group) => group.rows).flatMap((row) => Object.values(row.values)).every((value) => (
      value.status === "Demonstration" && value.statusLabel === messages.common.demoData
    )));

    const visible = visibleFixtureCopy(fixture);
    for (const genericEnglish of [
      "Fictional review fields for interface testing",
      "Fictional demonstration records never expose a commercial action",
      "Deterministic local visual data",
      "Offer terms",
      "Minimum deposit",
      "Bank transfer",
      "Control tools",
      "Live casino",
      "VIP programme",
      "Visit Solvane",
    ]) assert.doesNotMatch(visible, new RegExp(genericEnglish, "i"), `${locale}: ${genericEnglish}`);
  });
}

test("comparison locale transport is explicit and local preview actions require the GB presentation", () => {
  const client = readFileSync("components/comparison-context/ContextualComparison.tsx", "utf8");
  const route = readFileSync("app/api/public/comparison/route.ts", "utf8");
  const casinosPage = readFileSync("app/(public)/casinos/page.tsx", "utf8");
  assert.match(client, /params\.set\("presentationLocale", presentation\.locale\)/);
  assert.match(route, /comparisonFixtureLocale\(request\.nextUrl\.searchParams\.get\("presentationLocale"\)\)/);
  assert.match(route, /MARKET_PROFILES\.some/);
  assert.match(casinosPage, /withHandoffCasinoDiscoveryData[\s\S]*presentation\.market\.countryCode === "GB"/);

  const seed = comparisonSeed("DE");
  assert.equal(withHandoffComparisonData(seed, false, "de-DE"), seed);
});
