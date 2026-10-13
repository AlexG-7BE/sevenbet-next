import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { besideLocale, besideMessages } from "../lib/i18n/static-pages/beside";
import { innanLocale, innanMessages } from "../lib/i18n/static-pages/innan";
import { pausePlanMessages } from "../lib/i18n/static-pages/pause-plan";
import { publicRoutePolicy } from "../lib/market/routing";
import {
  CLEAN_ROUTE_COOKIE,
  CLEAN_ROUTE_OPEN,
  CLEAN_ROUTE_PATHS,
  PAUSE_UNTIL_COOKIE,
  RESEARCH_ACCESS_COOKIE,
  RESEARCH_ACCESS_OPEN,
  cleanRouteCookieOptions,
  cleanRouteDeclared,
  cleanRouteEntry,
  pauseDeclared,
  referrerHost,
  researchDoorOpen,
} from "../lib/research-access";
import { coreRoutes } from "../lib/site";

const lesson = `${RESEARCH_ACCESS_COOKIE}=${RESEARCH_ACCESS_OPEN}`;
const read = (path: string) => readFileSync(path, "utf8");

test("the clean route: a pause, beside or innan landing, or a link from the communities and institutions we speak to", () => {
  for (const path of CLEAN_ROUTE_PATHS) assert.equal(cleanRouteEntry(path, null), true, path);
  assert.equal(cleanRouteEntry("/pause-plan?via=betsson", null), true);
  assert.equal(cleanRouteEntry("/", null), false);
  assert.equal(cleanRouteEntry("/best-offers", null), false);
  assert.equal(cleanRouteEntry("/learn/responsible-gambling/spelpaus-och-spelsparrar", null), false, "a guide alone is not the clean route");
  assert.equal(cleanRouteEntry("/", "www.reddit.com"), true);
  assert.equal(cleanRouteEntry("/learn", "old.reddit.com"), true);
  assert.equal(cleanRouteEntry("/", "xn--lnforum-exa.se"), true, "Lånforum's punycode host");
  assert.equal(cleanRouteEntry("/", "www.spelinspektionen.se"), true);
  assert.equal(cleanRouteEntry("/", "stopspillet.dk"), true);
  assert.equal(cleanRouteEntry("/", "www.google.com"), false);
  assert.equal(cleanRouteEntry("/", "notreddit.com"), false, "suffix matching is on dot boundaries");
  assert.equal(cleanRouteEntry("/", ""), false);
  assert.equal(referrerHost("https://www.reddit.com/r/sweden/comments/abc"), "www.reddit.com");
  assert.equal(referrerHost("not a url"), null);
  assert.equal(referrerHost(null), null);
});

test("the door stays shut on the clean route and through a declared pause, past its last day, until the person acts", () => {
  assert.equal(researchDoorOpen(lesson), true);
  assert.equal(researchDoorOpen(`${lesson}; ${CLEAN_ROUTE_COOKIE}=${CLEAN_ROUTE_OPEN}`), false, "the clean route closes the door");
  assert.equal(researchDoorOpen(`${lesson}; ${PAUSE_UNTIL_COOKIE}=2020-01-01`), false, "a pause whose day has long passed still closes the door");
  assert.equal(pauseDeclared(`${PAUSE_UNTIL_COOKIE}=2020-01-01`), true);
  assert.equal(pauseDeclared(`${PAUSE_UNTIL_COOKIE}=soon`), false);
  assert.equal(cleanRouteDeclared(`${CLEAN_ROUTE_COOKIE}=${CLEAN_ROUTE_OPEN}`), true);
  assert.equal(cleanRouteDeclared(`${CLEAN_ROUTE_COOKIE}=0`), false);
  const options = cleanRouteCookieOptions(true);
  assert.equal(options.httpOnly, false, "the menu reads it in the browser");
  assert.equal(options.sameSite, "lax");
  assert.equal(options.path, "/");
  assert.equal(cleanRouteCookieOptions(false).maxAge, 0);
  assert.doesNotMatch(read("lib/research-access.ts"), /^import /m, "the contract still imports nothing");
});

test("middleware writes the flag on a document navigation only, and the pages never link to a casino", () => {
  const middleware = read("middleware.ts");
  assert.match(middleware, /sec-fetch-dest"\) !== "document"\) return response;/);
  assert.match(middleware, /cleanRouteEntry\(stripPublicMarketPrefix\(pathname\), referrerHost\(request\.headers\.get\("referer"\)\)\)/);
  assert.match(middleware, /response\.cookies\.set\(CLEAN_ROUTE_COOKIE, CLEAN_ROUTE_OPEN, cleanRouteCookieOptions\(true\)\)/);
  assert.match(middleware, /return markCleanRoute\(response\);/, "every response passes through the mark");

  const pages = [
    "app/(public)/pause-plan/page.tsx",
    "app/(public)/pause-plan/PausePlanTool.tsx",
    "app/(public)/innan/page.tsx",
    "app/(public)/innan/InnanTool.tsx",
    "app/(public)/beside/page.tsx",
    "components/clean-route/CopyText.tsx",
  ];
  for (const page of pages) {
    const source = read(page);
    assert.doesNotMatch(source, /\/best-offers|\/casinos|\/bonuses|\/r\/|\/go\//, `${page} links to no casino route`);
    assert.doesNotMatch(source, /@\/lib\/commercial|@\/lib\/public-offer|@\/lib\/services|@\/lib\/market-access|@\/lib\/public-casino/, `${page} imports nothing commercial`);
  }
  for (const page of ["app/(public)/pause-plan/page.tsx", "app/(public)/innan/page.tsx", "app/(public)/beside/page.tsx"]) {
    assert.match(read(page), /data-clean-route-line/, `${page} states the revenue model`);
  }
});

test("innan and beside speak Swedish, Danish and English, and are registered as localizable public routes", () => {
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const innan = innanMessages(locale);
    assert.ok(innan.revenueLine.length > 20, locale);
    assert.equal(innan.howTo.steps.length, 3, locale);
    const beside = besideMessages(locale);
    assert.ok(beside.message.text.includes("b4gamble.com/"), `${locale}: the message carries the plan link`);
    assert.equal(beside.realNumber.items.length, 3, locale);
    assert.ok(beside.support.length >= 2, locale);
    const pause = pausePlanMessages(locale);
    assert.ok(pause.revenueLine.length > 20, locale);
    assert.equal(pause.notBack.lines.length, 5, `${locale}: five lines for the helpline`);
    assert.ok(pause.door.open.length > 5, locale);
    assert.ok(pause.ics.download.length > 5, locale);
  }
  assert.match(besideMessages("sv-SE").message.text, /Jag ber dig inte sluta/);
  assert.match(besideMessages("da-DK").message.text, /Jeg beder dig ikke om at stoppe/);
  assert.equal(innanLocale("de-DE"), "en-GB");
  assert.equal(besideLocale("fi-FI"), "en-GB");
  assert.equal(publicRoutePolicy("/innan"), "LOCALIZABLE_PUBLIC");
  assert.equal(publicRoutePolicy("/beside"), "LOCALIZABLE_PUBLIC");
  assert.ok(coreRoutes.includes("/beside"), "the relatives' page is in the sitemap");
  assert.ok(!coreRoutes.includes("/innan"), "the rule screen is a tool, not a search landing");
});
