import assert from "node:assert/strict";
import test from "node:test";

import { formatCompactPayout, formatCompactWagering } from "../lib/presentation/commercial-terms";
import { commercialUiLabels } from "../lib/i18n/commercial-ui-labels";
import { MARKET_PROFILES } from "../lib/market/registry";

const missing = { notListed: "Not listed", notStated: "Not stated" };

test("payout timing compresses units and keeps review and payment qualifiers", () => {
  assert.equal(formatCompactPayout([
    { name: "Visa", supportsWithdrawals: true, withdrawalTime: "Pending review 24–48 hours; bank/card processing 3–5 days" },
    { name: "Skrill", supportsWithdrawals: true, withdrawalTime: "Pending review 24–48 hours; e-wallet processing 24–72 hours" },
  ], missing.notListed), "24–48h review · 24–72h e-wallet · 3–5d bank/card");
});

test("payout timing preserves reported qualifiers and does not invent missing evidence", () => {
  assert.equal(formatCompactPayout([
    { name: "Bank transfer", supportsWithdrawals: true, withdrawalTime: "Pending review reported as 48–96 hours; bank processing up to 7 days" },
  ], missing.notListed), "reported 48–96h review · up to 7d bank");
  assert.equal(formatCompactPayout([], missing.notListed), missing.notListed);
});

test("wagering distinguishes explicit non-statement from absent evidence", () => {
  assert.equal(formatCompactWagering(null, "Wagering requirement not separately stated in the current offer evidence.", missing), missing.notStated);
  assert.equal(formatCompactWagering(null, null, missing), missing.notListed);
  assert.equal(formatCompactWagering(35, null, missing), "35x");
  assert.equal(formatCompactWagering(null, "Up to 30x on the bonus", missing), "Up to 30x");
});

test("every supported locale has the clean commercial CTA and no-offer labels", () => {
  for (const locale of new Set(MARKET_PROFILES.flatMap((profile) => profile.supportedLocales))) {
    const labels = commercialUiLabels(locale);
    assert.ok(labels.visitCasino.trim());
    assert.ok(labels.notStated.trim());
    assert.ok(labels.noCurrentOffer.trim());
  }
  assert.equal(commercialUiLabels("en-GB").visitCasino, "Visit Casino");
  assert.equal(commercialUiLabels("es-ES").visitCasino, "Visitar casino");
});
