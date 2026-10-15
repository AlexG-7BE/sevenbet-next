import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { PublicArticle } from "../lib/articles/article-types";
import { PAUSE_HUB_CATEGORY, pauseHubSelection } from "../lib/articles/pause-hub-selection";
import { pausePlanLocale, pausePlanMessages } from "../lib/i18n/static-pages/pause-plan";
import { publicRoutePolicy } from "../lib/market/routing";
import { coreRoutes } from "../lib/site";
import { PAUSE_REGISTERS, parseCarriedPauseDate } from "../lib/tools/pause-date-carry";
import { LETTER_REGISTERS, PAUSE_PERIODS, PLAN_DAYS, addMonths, dayAfter, letterRegister, parseIsoDate, pauseEndDate, pausePeriod, planDates, toIsoDate, type PauseRegister } from "../lib/tools/pause-plan";

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

test("GAMSTOP minimum periods keep to the calendar, and a GAMSTOP date carries no letter", () => {
  // Founder, 15 October 2026: the English page speaks first to Great Britain.
  const start = parseIsoDate("2026-10-15")!;
  assert.deepEqual(PAUSE_PERIODS.gamstop.map((period) => period.id), ["6m", "1y", "5y", "5y-renew"]);
  const sixMonths = pauseEndDate(start, pausePeriod("gamstop", "6m")!);
  assert.equal(toIsoDate(sixMonths), "2027-04-14");
  assert.equal(toIsoDate(dayAfter(sixMonths)), "2027-04-15");
  assert.equal(toIsoDate(pauseEndDate(start, pausePeriod("gamstop", "1y")!)), "2027-10-14");
  assert.equal(toIsoDate(pauseEndDate(start, pausePeriod("gamstop", "5y")!)), "2031-10-14");
  assert.ok(PAUSE_PERIODS.gamstop.every((period) => !period.openEnded), "every GAMSTOP period has a date");
  // The letters know Spelpaus and ROFUS only (their register is a database value).
  assert.deepEqual([...LETTER_REGISTERS], [...PAUSE_REGISTERS], "the tool and the cookie know the same registers");
  assert.equal(letterRegister("gamstop"), null);
  assert.equal(letterRegister("spelpaus"), "spelpaus");
  assert.equal(letterRegister("rofus"), "rofus");
  assert.equal(parseCarriedPauseDate("gamstop.2026-10-20", new Date("2026-10-15T12:00:00Z")), null);
});

test("the English page is the GAMSTOP plan: it never says the block lifts by itself", () => {
  const messages = pausePlanMessages("en-GB");
  assert.equal(messages.register, "both");
  assert.deepEqual(Object.keys(messages.registers), ["gamstop", "spelpaus", "rofus"], "GAMSTOP is the first choice");
  assert.equal(messages.hubTag, "GAMSTOP");
  const gamstop = messages.registers.gamstop!;
  assert.equal(gamstop.name, "GAMSTOP");
  assert.match(gamstop.whatHappens, /does not contact you/);
  assert.match(gamstop.whatHappens, /seven years/);
  assert.match(gamstop.whatHappens, /0800 138 6518/);
  assert.match(gamstop.dayAfterLabel ?? "", /ask GAMSTOP to lift it/);
  assert.doesNotMatch(`${gamstop.whatHappens} ${gamstop.dayAfterLabel} ${gamstop.icsTitle}`, /work again|reopen|reactivated/, "GAMSTOP never lifts by itself");
  assert.match(gamstop.periodNotes?.["5y-renew"]?.note ?? "", /last six months/);
  assert.match(messages.titleLead, /GAMSTOP/);
  assert.match(messages.dayEleven.body, /You don't have to quit\. You have to be in control\./);
  assert.ok(messages.support.some((line) => line.href === "https://www.gamcare.org.uk/" && line.label.includes("0808 8020 133")));
  assert.match(JSON.stringify(messages.faq), /not on GAMSTOP/);
  const tool = readFileSync("app/(public)/pause-plan/PausePlanTool.tsx", "utf8");
  assert.match(tool, /registerMessages\?\.icsTitle \?\? ics\.title/);
  assert.match(tool, /periodNote\?\.dayAfterLabel \?\? registerMessages\?\.dayAfterLabel \?\? messages\.dayAfterLabel/);
});

test("Swedish, Danish and English copy cover every period and all ten days", () => {
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const messages = pausePlanMessages(locale);
    assert.equal(messages.days.length, PLAN_DAYS, locale);
    assert.ok(messages.faq.length >= 5, locale);
    assert.ok(messages.support.length >= 2, locale);
    const registers = messages.register === "both" ? (Object.keys(messages.registers) as PauseRegister[]) : [messages.register];
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
  assert.match(page, /data-clean-route-line/);
});

test("the pause plan is an ordinary landing page: it changes nothing in the menu and keeps only what the pause letters need, behind their switch", () => {
  // Founder, 13 October 2026: the declared-pause and clean-route door rules are withdrawn.
  const tool = readFileSync("app/(public)/pause-plan/PausePlanTool.tsx", "utf8");
  assert.doesNotMatch(tool, /document\.cookie|localStorage|sessionStorage|fetch\(|research-access/);
  assert.equal(tool.match(/<button /g)?.length, 1, "one button: the calendar file");
  // Founder, 13 October 2026 (docs/07_Decisions/PAUSE-LETTERS-2026-10-14.md): while the pause
  // letters are switched on, the page keeps exactly two things, both for the timing of letters:
  // the register and last pause day in a one-hour cookie when the Programme button is pressed,
  // and an address the person leaves in the email field. Both live in one component that the
  // tool renders only under the switch; tests/pause-letters.test.ts pins the rest.
  const letters = readFileSync("app/(public)/pause-plan/PausePlanLetters.tsx", "utf8");
  assert.match(tool, /\{letters && lettersRegister \? <PausePlanLetters /);
  assert.match(tool, /letters = false/);
  assert.equal(letters.match(/document\.cookie = /g)?.length, 1);
  assert.equal(letters.match(/fetch\(/g)?.length, 1);
  assert.doesNotMatch(letters, /localStorage|sessionStorage|research-access/);
  assert.match(readFileSync("app/(public)/pause-plan/page.tsx", "utf8"), /letters=\{pauseLettersEnabled\(\)\}/);
  const contract = readFileSync("lib/research-access.ts", "utf8");
  assert.doesNotMatch(contract, /pause|clean.?route|researchDoorOpen/i);
  assert.doesNotMatch(readFileSync("middleware.ts", "utf8"), /research-access|cleanRoute|b4g_clean_route|b4g_pause_until/);
  for (const reader of ["app/(public)/layout.tsx", "app/program/layout.tsx"]) {
    assert.match(readFileSync(reader, "utf8"), /researchAccessOpen\(requestHeaders\.get\("cookie"\)\)/, reader);
  }
  assert.match(readFileSync("components/public-shell/PublicNavigationClient.tsx", "utf8"), /researchAccessOpen\(document\.cookie\)/);
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const text = JSON.stringify(pausePlanMessages(locale));
    assert.doesNotMatch(text, /Dörren|casinoavsnittet|Døren|casinodelen|The door|casino section|så länge du är i pausen|så længe du er i pausen|while you are paused/, `${locale}: no promise about the menu`);
  }
});

test("the pause plan is the hub of the guides for a person on a pause", () => {
  // Founder, 13 October 2026: many guides for Sweden and Denmark, all linked together.
  const guide = (slug: string, category: string, tags: string[]) => ({ id: slug, slug, category, tags, title: slug }) as unknown as PublicArticle;
  const published = [
    guide("hava-spelpaus", "responsible-gambling", ["Häva Spelpaus", "Spelpaus"]),
    guide("spela-under-spelpaus", "responsible-gambling", ["Spelpaus", "Självavstängning"]),
    guide("spelsug", "responsible-gambling", ["Spelsug"]),
    guide("casino-med-svensk-licens", "casino-safety", ["Spelpaus"]),
  ];
  assert.deepEqual(pauseHubSelection(published, "Spelpaus").map((article) => article.slug), ["hava-spelpaus", "spela-under-spelpaus"], "the register's name as a tag, protected guides only, newest first");
  assert.deepEqual(pauseHubSelection(published, " spelpaus ").map((article) => article.slug), ["hava-spelpaus", "spela-under-spelpaus"], "case and spaces do not matter");
  assert.deepEqual(pauseHubSelection(published, "ROFUS"), []);
  assert.deepEqual(pauseHubSelection(published, ""), [], "no tag, no list");
  const english = [guide("cancel-gamstop-early", "responsible-gambling", ["GAMSTOP", "Self-exclusion"]), guide("self-exclusion-and-gambling-blocks", "responsible-gambling", ["Self-exclusion"])];
  assert.deepEqual(pauseHubSelection(english, pausePlanMessages("en-GB").hubTag ?? "").map((article) => article.slug), ["cancel-gamstop-early"], "the English page lists the GAMSTOP guides");
  assert.equal(pauseHubSelection(published, "Spelpaus", 1).length, 1);
  assert.equal(PAUSE_HUB_CATEGORY, "responsible-gambling");

  const read = readFileSync("lib/articles/pause-hub.server.ts", "utf8");
  assert.match(read, /articleService\.listPublished\(locale, \{ category: PAUSE_HUB_CATEGORY, take: 100 \}\)\.catch\(\(\) => \[\]\)/, "a failed read leaves the page standing");
  assert.match(read, /from "@\/lib\/services\/article\.service"/, "the editorial article service alone");
  assert.doesNotMatch(read, /from "@\/lib\/services"|@\/lib\/commercial|@\/lib\/public-offer|@\/lib\/market-access|@\/lib\/public-casino/);
  const page = readFileSync("app/(public)/pause-plan/page.tsx", "utf8");
  assert.match(page, /await pauseHubGuides\(contentLocale, registerName\)/);
  assert.match(page, /guides\.length > 0 \?/, "no guides, no section");
  assert.match(page, /productHref\(presentation, articlePath\(guide\)\)/, "links keep the page's language");
  assert.doesNotMatch(page, /@prisma\/client|lib\/db\/prisma/);
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const messages = pausePlanMessages(locale);
    assert.ok(messages.questionsHeading && messages.questionsIntro, locale);
  }
  const css = readFileSync("app/(public)/pause-plan/PausePlan.module.css", "utf8");
  assert.match(css, /\.tool > \.plan \{ display:block;/, "the ten steps span the page width on a desktop instead of half of the form grid");
  assert.equal(pausePlanMessages("sv-SE").registers.spelpaus?.name, "Spelpaus");
  assert.equal(pausePlanMessages("da-DK").registers.rofus?.name, "ROFUS");
});
