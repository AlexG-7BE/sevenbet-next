import assert from "node:assert/strict";
import test from "node:test";

import { outboundRecoveryUrl, recoveryLinkSlug } from "../lib/commercial-handoff/recovery";
import { outboundRecoveryMessages, withCasinoName } from "../lib/i18n/outbound-recovery-catalog";
import type { SupportedLocale } from "../lib/market/registry";

const LOCALES: readonly SupportedLocale[] = ["en-GB", "en-CA", "de-DE", "it-IT", "es-ES", "es-PE", "pt-PT", "el-GR", "nl-NL", "sv-SE", "da-DK", "fi-FI", "nb-NO", "fr-CA"];

test("the recovery URL carries only a well-formed managed slug", () => {
  const base = new URL("https://b4gamble.com/r/playojo-casino?placement=best_offers_card#x");
  assert.equal(outboundRecoveryUrl(base, "playojo-casino").toString(), "https://b4gamble.com/outbound/unavailable?link=playojo-casino");
  assert.equal(outboundRecoveryUrl(base, "PlayOJO-Casino").toString(), "https://b4gamble.com/outbound/unavailable?link=playojo-casino");
  for (const hostile of ["<script>", "a", "x".repeat(81), "../casino", "session-token", "https://evil.example", "", null]) {
    assert.equal(outboundRecoveryUrl(base, hostile).toString(), "https://b4gamble.com/outbound/unavailable", String(hostile));
  }
});

test("the page accepts the first query value only when it is a managed slug", () => {
  assert.equal(recoveryLinkSlug("hello-casino-welcome"), "hello-casino-welcome");
  assert.equal(recoveryLinkSlug(["hello-casino-welcome", "other"]), "hello-casino-welcome");
  assert.equal(recoveryLinkSlug("hello casino"), null);
  assert.equal(recoveryLinkSlug(undefined), null);
  assert.equal(recoveryLinkSlug(42), null);
});

test("every locale names the casino in the body and the review action", () => {
  for (const locale of LOCALES) {
    const text = outboundRecoveryMessages(locale);
    for (const key of ["bodyCasino", "backToReview"] as const) assert.match(text[key], /\{casino\}/, `${locale}.${key}`);
    for (const key of ["eyebrow", "title", "bodyGeneric", "bestOffers"] as const) assert.doesNotMatch(text[key], /\{casino\}/, `${locale}.${key}`);
    assert.doesNotMatch(Object.values(text).join(" "), /fail closed|substitute/i, locale);
  }
  assert.equal(withCasinoName(outboundRecoveryMessages("en-GB").backToReview, "PlayOJO"), "Back to the PlayOJO review");
});
