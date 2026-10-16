import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { besideLocale, besideMessages } from "../lib/i18n/static-pages/beside";
import { trustMessages } from "../lib/i18n/static-pages/can-you-trust-b4gamble";
import { controlSharedMessages } from "../lib/i18n/static-pages/gambling-control";
import { innanLocale, innanMessages } from "../lib/i18n/static-pages/innan";
import { pausePlanMessages } from "../lib/i18n/static-pages/pause-plan";
import { pauseStatisticsMessages } from "../lib/i18n/static-pages/pause-statistics";
import { publicRoutePolicy } from "../lib/market/routing";
import { coreRoutes } from "../lib/site";

const read = (path: string) => readFileSync(path, "utf8");

test("the pause, innan and beside pages never link to a casino and state the revenue model", () => {
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

test("the pages make no promise about the menu: the door rules of 12 and 13 October 2026 are withdrawn", () => {
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const text = JSON.stringify([innanMessages(locale), besideMessages(locale)]);
    assert.doesNotMatch(text, /På den här vägen visas inga|På denne vej vises ingen|None are shown on this route|Dörren|Døren|opens that part of the site/, locale);
  }
});

/**
 * Since 17 October 2026 the menu carries Casinos, Bonuses and Best Offers on every public page
 * (docs/07_Decisions/COMMERCIAL-MENU-FOR-EVERYONE-2026-10-17.md), so no public page may claim
 * that its *route* shows none. A claim about the page's own body, plan, tool or text still holds.
 */
test("no public page claims its route or page links to no casino, which the menu now does", () => {
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    for (const [name, text] of [
      ["pause-statistics", JSON.stringify(pauseStatisticsMessages(locale))],
      ["gambling-control", JSON.stringify(controlSharedMessages(locale))],
      ["can-you-trust-b4gamble", JSON.stringify(trustMessages(locale))],
    ] as const) {
      assert.doesNotMatch(
        text,
        /på den (?:här )?väg(?:en)? visas inga|på denne vej vises ingen|are shown on (?:this|that) route|[Dd]en här sidan länkar inte till|[Dd]enne side linker ikke til|[Tt]his page links to none/,
        `${locale}: ${name}`,
      );
    }
  }
});

test("the helplines are not described as open around the clock: Stödlinjen and StopSpillet keep weekday hours", () => {
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    assert.doesNotMatch(JSON.stringify(besideMessages(locale)), /dygnet runt|hele døgnet|døgnet rundt|around the clock|24\/7/i, locale);
  }
});
