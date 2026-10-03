import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";

import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { wageringCalculatorDefaults, wageringCalculatorLocale, wageringCalculatorMessages } from "../lib/i18n/static-pages/wagering-calculator";
import { parsePublicMarketRoute, publicRoutePolicy } from "../lib/market/routing";
import { coreRoutes } from "../lib/site";
import { calculateWagering } from "../lib/tools/wagering-calculator";

// The standalone wagering calculator (Founder, 3 October 2026): its own indexable page in
// en/de/sv/da so it can rank by itself, reached from Bonuses and the sitemap.

const read = (path: string) => readFileSync(path, "utf8");
const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => { module.exports = {}; };
(globalThis as typeof globalThis & { React: typeof React }).React = React;

test("the calculator converts the wagering base, multiplier and game contribution into turnover and cost", () => {
  const bonusOnly = calculateWagering({ deposit: 100, bonus: 100, multiplier: 35, base: "bonus", contribution: 1, rtp: 96 });
  assert.equal(bonusOnly.requiredTurnover, 3500);
  assert.equal(bonusOnly.actualTurnover, 3500);
  assert.equal(Math.round(bonusOnly.expectedLoss), 140);
  assert.equal(Math.round(bonusOnly.netValue), -40);

  const depositAndBonus = calculateWagering({ deposit: 100, bonus: 100, multiplier: 35, base: "deposit-bonus", contribution: 1, rtp: 96 });
  assert.equal(depositAndBonus.requiredTurnover, 7000);
  assert.equal(Math.round(depositAndBonus.expectedLoss), 280);

  const blackjack = calculateWagering({ deposit: 100, bonus: 100, multiplier: 35, base: "bonus", contribution: 0.1, rtp: 96 });
  assert.equal(Math.round(blackjack.actualTurnover), 35000);

  const lowWagering = calculateWagering({ deposit: 100, bonus: 100, multiplier: 10, base: "bonus", contribution: 1, rtp: 96 });
  assert.equal(lowWagering.requiredTurnover, 1000);
  assert.equal(Math.round(lowWagering.expectedLoss), 40);
  assert.ok(lowWagering.netValue > 0);

  const nonsense = calculateWagering({ deposit: -5, bonus: Number.NaN, multiplier: -1, base: "deposit-bonus", contribution: 0, rtp: 400 });
  assert.deepEqual(nonsense, { baseAmount: 0, requiredTurnover: 0, actualTurnover: 0, expectedLoss: 0, netValue: 0 });
});

test("the article's worked examples match what the calculator computes", () => {
  const en = wageringCalculatorMessages("en-GB");
  const text = en.sections.flatMap((section) => section.paragraphs).join(" ");
  for (const figure of ["£3,500", "£7,000", "£280", "£1,000", "£40"]) assert.ok(text.includes(figure), figure);
  const sv = wageringCalculatorMessages("sv-SE").sections.flatMap((section) => section.paragraphs).join(" ");
  for (const figure of ["35 000 kr", "70 000 kr", "2 800 kr", "10 000 kr", "400 kr"]) assert.ok(sv.includes(figure), figure);
  const da = wageringCalculatorMessages("da-DK").sections.flatMap((section) => section.paragraphs).join(" ");
  for (const figure of ["35.000 kr.", "70.000 kr.", "2.800 kr.", "10.000 kr.", "400 kr."]) assert.ok(da.includes(figure), figure);
  const de = wageringCalculatorMessages("de-DE").sections.flatMap((section) => section.paragraphs).join(" ");
  for (const figure of ["3.500 €", "7.000 €", "280 €", "1.000 €", "40 €"]) assert.ok(de.includes(figure), figure);
});

test("the page is written for the four indexable languages and falls back to English elsewhere", () => {
  const collect = (value: unknown): string[] => typeof value === "string" ? [value] : value && typeof value === "object" ? Object.values(value).flatMap(collect) : [];
  const english = wageringCalculatorMessages("en-GB");
  for (const locale of ["de-DE", "sv-SE", "da-DK"] as const) {
    const messages = wageringCalculatorMessages(locale);
    assert.equal(wageringCalculatorLocale(locale), locale);
    assert.notEqual(messages.metadataTitle, english.metadataTitle, locale);
    assert.equal(messages.faq.length, english.faq.length, locale);
    assert.equal(messages.checklist.length, english.checklist.length, locale);
    assert.ok(collect(messages).every((value) => value.trim().length > 0), `${locale} has empty copy`);
  }
  assert.equal(wageringCalculatorLocale("it-IT"), "en-GB");
  assert.equal(wageringCalculatorMessages("it-IT"), english);
  assert.equal(wageringCalculatorDefaults("sv-SE").currency, "SEK");
  assert.equal(wageringCalculatorDefaults("da-DK").currency, "DKK");
  assert.equal(wageringCalculatorDefaults("en-GB").currency, "GBP");
  assert.deepEqual([wageringCalculatorDefaults("en-GB").multiplier, wageringCalculatorDefaults("en-GB").base], [10, "bonus"]);
  assert.deepEqual([wageringCalculatorDefaults("da-DK").multiplier, wageringCalculatorDefaults("da-DK").base], [10, "deposit-bonus"]);
});

test("the route is localizable, listed in the sitemap and linked from Bonuses", () => {
  assert.equal(publicRoutePolicy("/wagering-calculator"), "LOCALIZABLE_PUBLIC");
  for (const prefix of ["en", "de", "sv", "da"]) assert.equal(parsePublicMarketRoute(`/${prefix}/wagering-calculator`).kind, "CANONICAL_LOCALE", prefix);
  assert.ok((coreRoutes as readonly string[]).includes("/wagering-calculator"));

  const page = read("app/(public)/wagering-calculator/page.tsx");
  assert.match(page, /productMetadata\(\{ presentation, pathname: "\/wagering-calculator"/);
  assert.doesNotMatch(page, /index:\s*false/);
  assert.match(page, /"@type": "WebApplication"/);
  assert.match(page, /"@type": "FAQPage"/);
  assert.match(page, /offersMayBePresented\(presentation\.marketCountryCode\) \? <section/);

  const bonuses = read("app/(public)/bonuses/page.tsx");
  assert.match(bonuses, /productHref\(presentation, "\/wagering-calculator"\)/);
});

test("the calculator renders its default result on the server", () => {
  const { WageringCalculator } = require("../app/(public)/wagering-calculator/WageringCalculator.tsx") as typeof import("../app/(public)/wagering-calculator/WageringCalculator");
  const messages = wageringCalculatorMessages("en-GB");
  const html = renderToStaticMarkup(React.createElement(WageringCalculator, { defaults: wageringCalculatorDefaults("en-GB"), label: "Wagering requirement calculator", locale: "en-GB", messages: messages.widget }));
  // GB starts from its legal maximum: 10x the bonus.
  assert.match(html, /£1,000/);
  assert.match(html, /£100 × 10/);
  assert.match(html, new RegExp(messages.widget.positive));
  assert.match(html, /name="wagering-base"/);
  assert.equal((html.match(/name="game-contribution"/g) ?? []).length, 4);
});
