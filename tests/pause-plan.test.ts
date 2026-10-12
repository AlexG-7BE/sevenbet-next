import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { pausePlanLocale, pausePlanMessages } from "../lib/i18n/static-pages/pause-plan";
import { publicRoutePolicy } from "../lib/market/routing";
import { PAUSE_UNTIL_COOKIE, RESEARCH_ACCESS_COOKIE, RESEARCH_ACCESS_OPEN, pauseActive, pauseUntil, researchAccessOpen, researchDoorOpen } from "../lib/research-access";
import { coreRoutes } from "../lib/site";
import { PAUSE_PERIODS, PLAN_DAYS, addMonths, dayAfter, parseIsoDate, pauseEndDate, pausePeriod, planDates, toIsoDate } from "../lib/tools/pause-plan";

const lessonOpen = `${RESEARCH_ACCESS_COOKIE}=${RESEARCH_ACCESS_OPEN}`;

test("a ten-day Spelpaus registered on the 12th covers the 12th to the 21st; the plan is for the 22nd", () => {
  const start = parseIsoDate("2026-10-12");
  assert.ok(start);
  const end = pauseEndDate(start, pausePeriod("spelpaus", "10d")!);
  assert.equal(toIsoDate(end), "2026-10-21");
  assert.equal(toIsoDate(dayAfter(end)), "2026-10-22");
  const plan = planDates(start);
  assert.equal(plan.length, PLAN_DAYS);
  assert.equal(toIsoDate(plan[0]), "2026-10-12");
  assert.equal(toIsoDate(plan[9]), "2026-10-21");
});

test("a 24-hour ROFUS pause is one day, and month-long pauses keep to the calendar", () => {
  const start = parseIsoDate("2026-10-12")!;
  assert.equal(toIsoDate(pauseEndDate(start, pausePeriod("rofus", "24h")!)), "2026-10-12");
  assert.equal(toIsoDate(pauseEndDate(start, pausePeriod("rofus", "1m")!)), "2026-11-11");
  assert.equal(toIsoDate(pauseEndDate(start, pausePeriod("spelpaus", "6m")!)), "2027-04-11");
  assert.equal(toIsoDate(addMonths(parseIsoDate("2026-01-31")!, 1)), "2026-02-28");
  assert.equal(toIsoDate(pauseEndDate(start, pausePeriod("spelpaus", "open")!)), "2027-10-11");
  assert.equal(pausePeriod("spelpaus", "open")?.openEnded, true);
  assert.equal(pausePeriod("rofus", "final")?.openEnded, true);
  assert.equal(parseIsoDate("2026-02-30"), null);
  assert.equal(parseIsoDate("12.10.2026"), null);
});

test("a declared pause keeps the research door shut through its last day and opens it the day after", () => {
  const paused = `${lessonOpen}; ${PAUSE_UNTIL_COOKIE}=2026-10-21`;
  assert.equal(pauseUntil(paused), "2026-10-21");
  assert.equal(researchAccessOpen(paused), true, "the lesson flag itself is untouched");
  assert.equal(pauseActive(paused, "2026-10-12"), true);
  assert.equal(pauseActive(paused, "2026-10-21"), true);
  assert.equal(pauseActive(paused, "2026-10-22"), false);
  assert.equal(researchDoorOpen(paused, "2026-10-21"), false);
  assert.equal(researchDoorOpen(paused, "2026-10-22"), true);
  assert.equal(researchDoorOpen(`${PAUSE_UNTIL_COOKIE}=2026-10-21`, "2026-10-22"), false, "no lesson, no door");
  assert.equal(pauseUntil(`${PAUSE_UNTIL_COOKIE}=next week`), null, "a malformed value is no pause");
  assert.equal(pauseActive(`${PAUSE_UNTIL_COOKIE}=next week`, "2026-10-12"), false);
  assert.equal(researchDoorOpen(lessonOpen, "2026-10-12"), true);
});

test("Swedish, Danish and English copy cover every period and all ten days", () => {
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const messages = pausePlanMessages(locale);
    assert.equal(messages.days.length, PLAN_DAYS, locale);
    assert.ok(messages.faq.length >= 5, locale);
    assert.ok(messages.support.length >= 2, locale);
    const registers = messages.register === "both" ? (["spelpaus", "rofus"] as const) : [messages.register];
    for (const register of registers) {
      const copy = messages.registers[register];
      assert.ok(copy, `${locale} ${register}`);
      for (const period of PAUSE_PERIODS[register]) assert.ok(copy.periods[period.id], `${locale} ${register} ${period.id}`);
    }
  }
  assert.equal(pausePlanMessages("sv-SE").register, "spelpaus");
  assert.equal(pausePlanMessages("da-DK").register, "rofus");
  assert.equal(pausePlanLocale("de-DE"), "en-GB", "other languages read the English page");
  assert.match(pausePlanMessages("sv-SE").dayEleven.body, /Du behöver inte sluta\. Du behöver ha kontrollen\./);
  assert.match(pausePlanMessages("da-DK").dayEleven.body, /Du behøver ikke stoppe\. Du skal bevare kontrollen\./);
});

test("the page is a localizable public route in the sitemap and links to no casino", () => {
  assert.ok(coreRoutes.includes("/pause-plan"));
  assert.equal(publicRoutePolicy("/pause-plan"), "LOCALIZABLE_PUBLIC");
  const page = readFileSync("app/(public)/pause-plan/page.tsx", "utf8");
  assert.doesNotMatch(page, /\/best-offers|\/casinos|\/bonuses|\/r\//);
  assert.match(page, /entry=start/);
  assert.match(readFileSync("app/(public)/layout.tsx", "utf8"), /researchDoorOpen\(/);
  assert.match(readFileSync("app/program/layout.tsx", "utf8"), /researchDoorOpen\(/);
  assert.match(readFileSync("components/public-shell/PublicNavigationClient.tsx", "utf8"), /researchDoorOpen\(document\.cookie\)/);
});
