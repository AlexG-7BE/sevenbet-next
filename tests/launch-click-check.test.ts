import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  LAUNCH_MARKETS,
  ROUTES_NOT_YET_LIVE,
  clickCheckFails,
  clickVerdict,
  expectedPartnerRoutes,
  launchCasinos,
  publicRouteSlug,
  retriesClick,
} from "../lib/market-access/launch-click-check";
import { marketAccess } from "../lib/market-access/access";

const evening = new Date("2026-09-28T20:00:00Z");
const noon = new Date("2026-09-28T10:00:00Z");
const toPartner = { statusCode: 302, location: "https://site.partner.example/index.php?aname=b4gamble" };
const refused = { statusCode: 303, location: "https://b4gamble.com/outbound/unavailable" };

test("a real click is judged against the licence register at the moment it was made", () => {
  assert.equal(clickVerdict("playojo", "DK", evening, toPartner), "PASS");
  assert.equal(clickVerdict("casino-redkings", "DK", evening, refused), "PASS_CLOSED");
  assert.equal(clickVerdict("casino-redkings", "DK", evening, toPartner), "VIOLATION");
  assert.equal(clickVerdict("dragonbet", "GB", evening, refused), "NO_ROUTE", "DragonBet GB is a known gap");
  assert.equal(clickVerdict("turbonino", "DE", evening, toPartner), "PASS");
  assert.equal(clickVerdict("turbonino", "DE", noon, toPartner), "VIOLATION", "Germany closes outside 21:00–06:00");
  assert.equal(clickVerdict("turbonino", "DE", noon, refused), "PASS_CLOSED");
  assert.equal(clickVerdict("playojo", "GB", evening, { statusCode: 500, location: null }), "UNEXPECTED");
  assert.equal(clickVerdict("playojo", "GB", evening, { statusCode: 302, location: "https://b4gamble.com/en" }), "UNEXPECTED");
  assert.equal(clickVerdict("playojo", "GB", evening, { statusCode: 302, location: "https://partner-route.invalid/6017be37" }), "UNEXPECTED", "a placeholder link never counts as reaching the partner");
});

test("a refused click on a route that must reach its partner is ROUTE_DOWN and fails the run", () => {
  assert.equal(clickVerdict("playojo", "GB", evening, refused), "ROUTE_DOWN");
  assert.equal(clickVerdict("betsson", "SE", evening, refused), "ROUTE_DOWN");
  assert.equal(clickVerdict("playojo", "IE", evening, refused), "ROUTE_DOWN");
  assert.equal(clickVerdict("goldenplay", "IE", evening, refused), "NO_ROUTE", "GoldenPlay IE is disabled on purpose");
  assert.equal(clickVerdict("turbonino", "DE", evening, refused), "ROUTE_DOWN", "Germany's routes must work inside the window");

  assert.equal(clickCheckFails(["PASS", "PASS_CLOSED", "NO_ROUTE"]), false);
  for (const failing of ["ROUTE_DOWN", "VIOLATION", "UNEXPECTED"] as const) {
    assert.equal(clickCheckFails(["PASS", failing]), true, failing);
  }
  // Both refusals in an open market are retried from fresh probes before they count.
  assert.equal(retriesClick("ROUTE_DOWN"), true);
  assert.equal(retriesClick("NO_ROUTE"), true);
  assert.equal(retriesClick("PASS_CLOSED"), false);
});

test("the expected partner routes per launch market are pinned", () => {
  const counts = (at: Date) => Object.fromEntries(LAUNCH_MARKETS.map((market) => [market, expectedPartnerRoutes(market, at).length]));
  assert.deepEqual(counts(evening), { GB: 18, SE: 12, DK: 10, DE: 2, IE: 17 });
  assert.deepEqual(counts(noon), { GB: 18, SE: 12, DK: 10, DE: 0, IE: 17 });
  assert.deepEqual(expectedPartnerRoutes("DE", evening), ["drueckglueck", "turbonino"]);
  assert.deepEqual(expectedPartnerRoutes("IE", evening), [
    "21-prive", "ahti-games", "bacanaplay", "casino-redkings", "diamond7", "drueckglueck",
    "eucasino", "gday-casino", "hello-casino", "jackpotstar", "megawayscasino", "playojo",
    "playojo-bingo", "skol-casino", "slotnite", "slotsmagic", "turbonino",
  ]);
  assert.deepEqual(expectedPartnerRoutes("FI", evening), [], "nothing is pinned outside the launch markets");
});

test("every known gap is a catalogue casino the register opens in that market", () => {
  const catalogue = new Set(launchCasinos());
  for (const market of LAUNCH_MARKETS) {
    for (const casino of ROUTES_NOT_YET_LIVE[market]) {
      assert.ok(catalogue.has(casino), `${casino} is not in the catalogue`);
      assert.equal(marketAccess(casino, market, evening).open, true, `${casino} ${market} is closed by licence: drop it from the list`);
    }
  }
});

test("every catalogue casino is clicked on its public route", () => {
  assert.equal(launchCasinos().length, 28);
  assert.equal(publicRouteSlug("playojo"), "playojo-casino");
  assert.equal(publicRouteSlug("hello-casino"), "hello-casino-welcome");
});

test("the workflow keeps its schedule, alerts on a lost route and keeps the JSON report", () => {
  const workflow = readFileSync(".github/workflows/launch-click-check.yml", "utf8");
  assert.match(workflow, /cron: "15 8 \* \* \*"/);
  assert.match(workflow, /cron: "15 20 \* \* \*"/);
  assert.match(workflow, /launch:click-check -- --json click-check\.json/);
  assert.match(workflow, /grep -E '[^']*ROUTE_DOWN[^']*' click-check\.md/);
  assert.match(workflow, /uses: actions\/upload-artifact@[0-9a-f]{40} # v\d/);
  assert.match(workflow, /continue-on-error: true/);
  assert.ok(workflow.indexOf("Open or update the alert") < workflow.indexOf("Keep the click report"), "the upload runs after the alert");
  const script = readFileSync("scripts/launch-click-check.ts", "utf8");
  assert.match(script, /if \(clickCheckFails\(rows\.map\(\(row\) => row\.verdict\)\)\) process\.exitCode = 1/);
});
