import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { FORUM_STUDY_CSV, forumStudyLocale, forumStudyMessages } from "../lib/i18n/static-pages/forum-study";
import { pauseStatisticsMessages } from "../lib/i18n/static-pages/pause-statistics";
import { pausePlanMessages } from "../lib/i18n/static-pages/pause-plan";
import { publicRoutePolicy } from "../lib/market/routing";
import { coreRoutes } from "../lib/site";

const LOCALES = ["sv-SE", "da-DK", "en-GB"] as const;
const read = (path: string) => readFileSync(path, "utf8");
const csv = read(`public${FORUM_STUDY_CSV}`);

/** One row of the published CSV, by section, key and scope. */
function csvRow(section: string, key: string, scope: string) {
  const line = csv.split("\n").find((row) => row.startsWith(`${section},${key},${scope},`));
  assert.ok(line, `the CSV has a row for ${section}/${key}/${scope}`);
  const [, , , count, denominator, share] = line.split(",");
  return { count, denominator, share };
}

test("every figure on the page prints its own denominator", () => {
  for (const locale of LOCALES) {
    const messages = forumStudyMessages(locale);
    const blocks = [messages.material, messages.whoWrites, messages.register, messages.money, messages.helped, messages.counters];
    for (const block of blocks) {
      assert.ok(block.rows.length > 0, `${locale}: ${block.heading} has rows`);
      for (const row of block.rows) {
        assert.match(row.value, /\d/, `${locale}: ${row.label} is a number`);
        assert.match(row.of, /\d/, `${locale}: ${row.label} names its denominator`);
        assert.ok(row.of.length > 8, `${locale}: ${row.label} says what the denominator is`);
      }
    }
  }
});

/**
 * The numbers were recomputed from the coded files on 18 October 2026 (research/study/stats.json
 * in the content repo reproduces byte-identically). This test pins the five the page leads with
 * against the published CSV, so a copy edit cannot quietly move a figure away from its source.
 */
test("the headline figures match the published aggregates", () => {
  for (const [section, key, scope, count, denominator] of [
    ["material", "coded", "all", "3299", ""],
    ["who_writes", "player", "all", "925", "3299"],
    ["figure", "registerMentioned", "all", "174", "3299"],
    ["figure", "amongRegisterPosts", "anyWayRound", "65", "174"],
    ["stage", "after_pause", "all", "8", "3299"],
    ["stage", "before_trouble", "all", "49", "3299"],
    ["figure", "paydayOrNight", "all", "25", "925"],
    ["figure", "quickLoans", "all", "161", "925"],
    ["figure", "overHundredThousand", "players_or_stated", "209", "322"],
    ["clean_day_counter", "posts_with_a_counter", "all", "102", "3299"],
  ] as const) {
    const row = csvRow(section, key, scope);
    assert.equal(row.count, count, `${section}/${key}/${scope} count`);
    assert.equal(row.denominator, denominator, `${section}/${key}/${scope} denominator`);
  }

  for (const locale of LOCALES) {
    const text = JSON.stringify(forumStudyMessages(locale));
    for (const figure of ["174", "65", "925", "3 299|3.299|3,299", "37,4 %|37,4 %|37.4 %"]) {
      assert.match(text, new RegExp(figure.replace(/[.]/g, "\\.")), `${locale} prints ${figure}`);
    }
  }
});

/**
 * The three claims the material cannot carry (FINDINGS.md, part 1): the payday week, a trend
 * over the years, and any Danish figure. Each is named on the page as something NOT published,
 * and none of them may appear as a claim.
 */
test("the page publishes no payday claim, no trend and no Danish figure", () => {
  for (const locale of LOCALES) {
    const messages = forumStudyMessages(locale);
    const limits = messages.cannot.items.join(" ");
    assert.ok(messages.cannot.items.length >= 8, `${locale}: every known limit is listed`);
    assert.match(limits, /2,7 %|2\.7 %/, `${locale}: the payday figure is given as a limit`);
    assert.match(limits, /82/, `${locale}: the Danish count is given as a limit`);
    assert.match(limits, /1 000|1\.000|1,000/, `${locale}: the Reddit selection is named as a fixed draw`);
    const body = JSON.stringify(messages);
    assert.doesNotMatch(body, /lönevecka[n]? visar|payday week shows|per år:|by year/i, `${locale}: no trend is published`);
  }
});

test("the published file carries aggregates only — no post text, no users, no threads", () => {
  assert.match(csv, /^section,key,scope,count,denominator,share,note\n/);
  assert.doesNotMatch(csv, /https?:\/\//, "no addresses in the file");
  assert.doesNotMatch(csv, /\b(ln|fl|rd)-\d{4}\b/, "no unit identifiers in the file");
  assert.doesNotMatch(csv, /[a-f0-9]{16,}/, "no hashes in the file");
  const rows = csv.trim().split("\n").slice(1);
  assert.ok(rows.length > 120, "the file holds the whole aggregate set");
  for (const row of rows) assert.equal(row.split(",").length >= 7, true, `a complete row: ${row.slice(0, 60)}`);
  for (const locale of LOCALES) {
    const messages = forumStudyMessages(locale);
    assert.equal(messages.data.csvHref, FORUM_STUDY_CSV, locale);
    assert.ok(messages.data.licence.includes("CC BY 4.0"), locale);
  }
});

test("the page is a localizable public route in the sitemap and links to no casino or offer", () => {
  assert.equal(publicRoutePolicy("/forum-study"), "LOCALIZABLE_PUBLIC");
  assert.ok(coreRoutes.includes("/forum-study"));
  const page = read("app/(public)/forum-study/page.tsx");
  assert.match(page, /data-clean-route-line/);
  assert.match(page, /"@type": "Dataset"/);
  assert.match(page, /"\/pause-plan"/, "the page links to the pause plan");
  assert.match(page, /entry=start/, "the page links to the Programme start");
  assert.doesNotMatch(page, /\/best-offers|\/casinos|\/bonuses|\/r\/|\/go\//);
  assert.doesNotMatch(page, /@\/lib\/commercial|@\/lib\/public-offer|@\/lib\/services|@\/lib\/market-access|@\/lib\/public-casino|@\/lib\/db\/prisma/);
  assert.equal(forumStudyLocale("de-DE"), "en-GB");
});

test("the two pages that own this subject link to it", () => {
  for (const locale of LOCALES) {
    assert.ok(pauseStatisticsMessages(locale).corpus.studyLabel.length > 10, `${locale}: /pause-statistics names the study`);
    assert.ok((pausePlanMessages(locale).studyLabel ?? "").length > 10, `${locale}: /pause-plan names the study`);
  }
  assert.match(read("app/(public)/pause-statistics/page.tsx"), /data-forum-study-link[\s\S]*?\/forum-study/);
  assert.match(read("app/(public)/pause-plan/page.tsx"), /data-pause-plan-study-link[\s\S]*?\/forum-study/);
});

/**
 * The old corpus table on /pause-statistics counted keyword hits over all 4,211 collected posts,
 * 2,505 of which are a quoted earlier post, so every theme was counted about 2.5 times. The coded
 * study replaced it on 18 October 2026; the inflated figures must not come back.
 */
test("the superseded keyword counts are gone from /pause-statistics", () => {
  for (const locale of LOCALES) {
    const corpus = JSON.stringify(pauseStatisticsMessages(locale).corpus);
    assert.doesNotMatch(corpus, /4 211|4\.211|4,211/, `${locale}: the inflated denominator is gone`);
    for (const stale of ["502", "307", "253", "192", "187"]) {
      assert.doesNotMatch(corpus, new RegExp(`"${stale}"`), `${locale}: the stale keyword count ${stale} is gone`);
    }
    assert.match(corpus, /3 299|3\.299|3,299/, `${locale}: the coded denominator is there`);
  }
});
