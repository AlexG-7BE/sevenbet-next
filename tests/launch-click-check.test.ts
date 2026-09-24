import assert from "node:assert/strict";
import test from "node:test";

import { clickVerdict, launchCasinos, publicRouteSlug } from "../lib/market-access/launch-click-check";

const evening = new Date("2026-09-28T20:00:00Z");
const noon = new Date("2026-09-28T10:00:00Z");
const toPartner = { statusCode: 302, location: "https://site.partner.example/index.php?aname=b4gamble" };
const refused = { statusCode: 303, location: "https://b4gamble.com/outbound/unavailable" };

test("a real click is judged against the licence register at the moment it was made", () => {
  assert.equal(clickVerdict("playojo", "DK", evening, toPartner), "PASS");
  assert.equal(clickVerdict("casino-redkings", "DK", evening, refused), "PASS_CLOSED");
  assert.equal(clickVerdict("casino-redkings", "DK", evening, toPartner), "VIOLATION");
  assert.equal(clickVerdict("dragonbet", "GB", evening, refused), "NO_ROUTE");
  assert.equal(clickVerdict("turbonino", "DE", evening, toPartner), "PASS");
  assert.equal(clickVerdict("turbonino", "DE", noon, toPartner), "VIOLATION", "Germany closes outside 21:00–06:00");
  assert.equal(clickVerdict("turbonino", "DE", noon, refused), "PASS_CLOSED");
  assert.equal(clickVerdict("playojo", "GB", evening, { statusCode: 500, location: null }), "UNEXPECTED");
  assert.equal(clickVerdict("playojo", "GB", evening, { statusCode: 302, location: "https://b4gamble.com/en" }), "UNEXPECTED");
});

test("every catalogue casino is clicked on its public route", () => {
  assert.equal(launchCasinos().length, 28);
  assert.equal(publicRouteSlug("playojo"), "playojo-casino");
  assert.equal(publicRouteSlug("hello-casino"), "hello-casino-welcome");
});
