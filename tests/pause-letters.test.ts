import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

import { marketingEmailPurposes } from "@/lib/email/eligibility";
import { PAUSE_LETTER_SEEDS, pauseLetterSeedBodies, pauseLetterSeedSql } from "@/lib/email/pause-letters/seed-templates";
import {
  PAUSE_LETTERS_DAILY_CAP,
  PAUSE_LETTER_SCHEDULE,
  PROGRAMME_DAY_LETTERS,
  pauseLetterDateText,
  pauseLetterLanguage,
  pauseLetterLocalTime,
  pauseLetterPlanUrl,
  pauseLetterWindow,
  pauseLettersEnabled,
  shiftIsoDay,
} from "@/lib/email/pause-letters/schedule";
import { renderEmailTemplate, sanitizeEmailTemplate } from "@/lib/email/templates.server";
import { pausePlanMessages } from "@/lib/i18n/static-pages/pause-plan";
import {
  PAUSE_DATE_COOKIE,
  PAUSE_DATE_COOKIE_MAX_AGE_SECONDS,
  carriedPauseDateCookie,
  carriedPauseDateFromCookieHeader,
  encodeCarriedPauseDate,
  parseCarriedPauseDate,
} from "@/lib/tools/pause-date-carry";

const read = (path: string) => readFileSync(path, "utf8");
const sourceFiles = (roots: readonly string[]) => roots.flatMap((root) => (readdirSync(root, { recursive: true }) as string[])
  .filter((file) => /\.(?:ts|tsx|mjs)$/.test(file))
  .map((file) => `${root}/${file}`));

test("one switch, off unless it is exactly true, and read in one place", () => {
  assert.equal(pauseLettersEnabled({}), false);
  for (const value of ["", "1", "TRUE", "yes", " true", "false"]) assert.equal(pauseLettersEnabled({ PAUSE_LETTERS_ENABLED: value }), false, value);
  assert.equal(pauseLettersEnabled({ PAUSE_LETTERS_ENABLED: "true" }), true);
  const readers = sourceFiles(["app", "components", "lib"]).filter((file) => /PAUSE_LETTERS_ENABLED|PAUSE_LETTERS_FLAG/.test(read(file)));
  assert.deepEqual(readers, ["lib/email/pause-letters/schedule.ts"]);
  assert.match(read(".env.example"), /^PAUSE_LETTERS_ENABLED="false"$/m);
});

test("letters leave by the clock in Sweden and Denmark, in summer and in winter time, and never at night", () => {
  assert.deepEqual(PAUSE_LETTER_SCHEDULE, { timeZone: "Europe/Stockholm", eveningHour: 18, morningHour: 7, quietFromHour: 21 });
  // Summer time, UTC+2.
  assert.deepEqual(pauseLetterLocalTime(new Date("2026-10-20T16:30:00.000Z")), { day: "2026-10-20", hour: 18 });
  // Winter time from 25 October 2026, UTC+1: the same UTC hour is 17:30 there.
  assert.deepEqual(pauseLetterLocalTime(new Date("2026-10-26T16:30:00.000Z")), { day: "2026-10-26", hour: 17 });
  assert.deepEqual(pauseLetterLocalTime(new Date("2026-10-26T23:30:00.000Z")), { day: "2026-10-27", hour: 0 });
  const window = (utc: string) => {
    const { morning, evening } = pauseLetterWindow(new Date(utc));
    return [morning, evening];
  };
  // Winter: 06:xx nothing, 07:xx the morning letter, 17:xx still no evening letters, 18:xx-20:xx evening, 21:xx nothing.
  assert.deepEqual(window("2026-11-03T05:23:00.000Z"), [false, false]);
  assert.deepEqual(window("2026-11-03T06:23:00.000Z"), [true, false]);
  assert.deepEqual(window("2026-11-03T16:23:00.000Z"), [true, false]);
  assert.deepEqual(window("2026-11-03T17:23:00.000Z"), [true, true]);
  assert.deepEqual(window("2026-11-03T19:23:00.000Z"), [true, true]);
  assert.deepEqual(window("2026-11-03T20:23:00.000Z"), [false, false]);
  assert.deepEqual(window("2026-11-03T02:47:00.000Z"), [false, false], "the hour of the nightly lifecycle run");
  // Summer: the same local hours are one UTC hour earlier.
  assert.deepEqual(window("2026-07-03T04:23:00.000Z"), [false, false]);
  assert.deepEqual(window("2026-07-03T05:23:00.000Z"), [true, false]);
  assert.deepEqual(window("2026-07-03T16:23:00.000Z"), [true, true]);
  assert.deepEqual(window("2026-07-03T19:23:00.000Z"), [false, false]);
  assert.deepEqual(PROGRAMME_DAY_LETTERS.map((letter) => [letter.day, letter.key]), [[3, "PROGRAMME_DAY_3"], [7, "PROGRAMME_DAY_7"], [10, "PROGRAMME_DAY_10"]]);
  assert.equal(shiftIsoDay("2026-10-31", 1), "2026-11-01");
  assert.equal(shiftIsoDay("2026-03-01", -1), "2026-02-28");
  // The provider's free plan is 100 a day; the pause letters leave room for the others.
  assert.ok(PAUSE_LETTERS_DAILY_CAP > 0 && PAUSE_LETTERS_DAILY_CAP < 100);
  const vercel = JSON.parse(read("vercel.json")) as { crons: { path: string; schedule: string }[] };
  assert.deepEqual(vercel.crons.find((cron) => cron.path === "/api/internal/cron/pause-letters"), { path: "/api/internal/cron/pause-letters", schedule: "23 * * * *" });
  assert.deepEqual(vercel.crons.find((cron) => cron.path === "/api/internal/cron/customer-lifecycle"), { path: "/api/internal/cron/customer-lifecycle", schedule: "47 3 * * *" }, "the nightly run is unchanged");
});

test("a letter is written in Swedish, Danish or English and links to the plan in that language", () => {
  assert.deepEqual(["sv", "sv-SE", "da", "da-DK", "en-GB", "de", "", null, undefined].map(pauseLetterLanguage), ["sv", "sv", "da", "da", "en", "en", "en", "en", "en"]);
  assert.equal(pauseLetterPlanUrl("https://b4gamble.com", "sv-SE"), "https://b4gamble.com/sv/pause-plan?utm_source=email&utm_medium=email&utm_campaign=pause-sv");
  assert.equal(pauseLetterPlanUrl("https://b4gamble.com", "da"), "https://b4gamble.com/da/pause-plan?utm_source=email&utm_medium=email&utm_campaign=pause-da");
  assert.equal(pauseLetterPlanUrl("https://b4gamble.com", "fi"), "https://b4gamble.com/en/pause-plan?utm_source=email&utm_medium=email&utm_campaign=pause-en");
  assert.equal(pauseLetterDateText("2026-10-21", "sv"), "21 oktober");
  assert.equal(pauseLetterDateText("2026-10-21", "da"), "21. oktober");
  assert.equal(pauseLetterDateText("2026-10-21", "en"), "21 October");
});

test("the carried pause date is a register and a day, kept for an hour, and a stale or edited value is refused", () => {
  const today = new Date("2026-10-14T09:00:00.000Z");
  assert.equal(PAUSE_DATE_COOKIE, "b4g_pause_end");
  assert.equal(PAUSE_DATE_COOKIE_MAX_AGE_SECONDS, 3600);
  assert.equal(encodeCarriedPauseDate({ register: "spelpaus", endsOn: "2026-10-23" }), "spelpaus.2026-10-23");
  assert.deepEqual(parseCarriedPauseDate("spelpaus.2026-10-23", today), { register: "spelpaus", endsOn: "2026-10-23" });
  assert.deepEqual(parseCarriedPauseDate("rofus.2026-10-14", today), { register: "rofus", endsOn: "2026-10-14" });
  assert.deepEqual(parseCarriedPauseDate("rofus.2026-10-12", today), { register: "rofus", endsOn: "2026-10-12" }, "two days of slack for time zones");
  for (const value of [null, "", "spelpaus", "spelpaus.2026-10-11", "spelpaus.2027-06-01", "spelpaus.2026-02-31", "casino.2026-10-23", "spelpaus.2026-10-23.extra", "SPELPAUS.2026-10-23", "spelpaus.23-10-2026", "<script>"]) {
    assert.equal(parseCarriedPauseDate(value, today), null, String(value));
  }
  assert.deepEqual(carriedPauseDateFromCookieHeader("a=1; b4g_pause_end=rofus.2026-10-20; c=2", today), { register: "rofus", endsOn: "2026-10-20" });
  assert.equal(carriedPauseDateFromCookieHeader("b4g_pause_end_other=rofus.2026-10-20", today), null);
  assert.equal(carriedPauseDateFromCookieHeader("b4g_pause_end=%E0%A4%A", today), null);
  assert.equal(carriedPauseDateFromCookieHeader(null, today), null);
  assert.equal(carriedPauseDateCookie({ register: "spelpaus", endsOn: "2026-10-23" }, true), "b4g_pause_end=spelpaus.2026-10-23; Max-Age=3600; Path=/; SameSite=Lax; Secure");
  assert.equal(carriedPauseDateCookie(null, false), "b4g_pause_end=; Max-Age=0; Path=/; SameSite=Lax");
});

const NEVER = /\/r\/|\/go\/|bonus|casino|kasino|odds|jackpot|free ?spins|erbjudande|tilbud|\boffers?\b|insättning|indbetal|deposit|behandling|terapi|\bbota\b|\bkur\b|garanti|guarantee|therapy|treatment|spelberoende|spelmissbruk|ludoman|utan spelpaus|uden rofus|uden om rofus|vpn/i;

test("the seeded letters: 22 of them, every one accepted by the template rules, linking only to the Programme, the plan and its unsubscribe address", () => {
  assert.equal(PAUSE_LETTER_SEEDS.length, 22);
  assert.equal(new Set(PAUSE_LETTER_SEEDS.map((letter) => letter.id)).size, 22);
  const byKey = new Map<string, string[]>();
  for (const letter of PAUSE_LETTER_SEEDS) byKey.set(letter.key, [...(byKey.get(letter.key) ?? []), letter.locale]);
  assert.deepEqual(Object.fromEntries(byKey), {
    WELCOME: ["sv", "da"],
    PROGRAMME_REMINDER: ["sv", "da"],
    PROGRAMME_DAY_3: ["sv", "da", "en"],
    PROGRAMME_DAY_7: ["sv", "da", "en"],
    PROGRAMME_DAY_10: ["sv", "da", "en"],
    PAUSE_ENDS_TOMORROW: ["sv", "da", "en"],
    PAUSE_OVER: ["sv", "da", "en"],
    PAUSE_TOOL_CONFIRMATION: ["sv", "da", "en"],
  });
  for (const letter of PAUSE_LETTER_SEEDS) {
    const name = `${letter.key}:${letter.locale}`;
    const { htmlBody, textBody } = pauseLetterSeedBodies(letter);
    // The admin editor's own rules accept the letter and leave it as it is.
    const sanitized = sanitizeEmailTemplate({ key: letter.key, type: "LIFECYCLE", locale: letter.locale, subject: letter.subject, htmlBody, textBody });
    assert.deepEqual([sanitized.subject, sanitized.htmlBody, sanitized.textBody], [letter.subject, htmlBody, textBody], name);
    // Links: placeholders only, and only these three.
    const links = [...htmlBody.matchAll(/href="([^"]*)"/g)].map((match) => match[1]);
    assert.ok(links.length >= 1, name);
    for (const link of links) assert.match(link, /^\{\{(?:programme_url|plan_url|unsubscribe_url)\}\}$/, name);
    assert.doesNotMatch(`${htmlBody} ${textBody}`, /https?:\/\//, name);
    if (letter.key !== "WELCOME") assert.match(htmlBody, /href="\{\{unsubscribe_url\}\}"/, `${name} carries an unsubscribe link`);
    if (/^PAUSE_/.test(letter.key)) assert.match(htmlBody, /href="\{\{plan_url\}\}"/, name);
    assert.doesNotMatch(`${letter.subject} ${htmlBody} ${textBody}`, NEVER, name);
    // A dated letter and the letter from the email field go to people we cannot name.
    if (/^PAUSE_/.test(letter.key)) assert.doesNotMatch(`${htmlBody} ${textBody}`, /\{\{name\}\}/, name);
    const rendered = renderEmailTemplate({ subject: letter.subject, htmlBody, textBody }, {
      name: "Test",
      programme_url: "https://b4gamble.com/program",
      plan_url: pauseLetterPlanUrl("https://b4gamble.com", letter.locale),
      unsubscribe_url: "https://b4gamble.com/unsubscribe?token=test",
      pause_date: pauseLetterDateText("2026-10-21", letter.locale),
    });
    assert.doesNotMatch(`${rendered.subject} ${rendered.html} ${rendered.text}`, /\{\{|\}\}/, name);
  }
  const text = (key: string, locale: string) => pauseLetterSeedBodies(PAUSE_LETTER_SEEDS.find((letter) => letter.key === key && letter.locale === locale)!).textBody;
  // The Founder's lines.
  assert.match(text("PAUSE_ENDS_TOMORROW", "sv"), /I morgon tar din paus slut\. Summan och tiden bestämmer du i dag\./);
  assert.match(text("PAUSE_OVER", "sv"), /Dina regler gäller/);
  assert.match(text("PAUSE_OVER", "da"), /Dine regler gælder/);
  assert.match(text("PAUSE_TOOL_CONFIRMATION", "sv"), /Vi hörs den \{\{pause_date\}\}\. Här är planen under tiden\./);
  assert.match(text("PROGRAMME_DAY_3", "sv"), /vågor[\s\S]*Skriv ner kedjan/);
  assert.match(text("PROGRAMME_DAY_7", "sv"), /en människa som får veta den riktiga siffran/);
  assert.match(text("PROGRAMME_DAY_10", "sv"), /summan och tiden/);
  for (const key of ["PROGRAMME_DAY_3", "PROGRAMME_DAY_7", "PROGRAMME_DAY_10", "PAUSE_ENDS_TOMORROW", "PAUSE_OVER"]) {
    assert.match(text(key, "sv"), /Ditt spel\. Dina regler\./, key);
    assert.match(text(key, "da"), /Dit spil\. Dine regler\./, key);
  }
});

test("migration 0045 seeds exactly these letters, and 0044 only adds enum values", () => {
  const migration = read("prisma/migrations/0045_pause_letters/migration.sql");
  assert.ok(migration.endsWith(`${pauseLetterSeedSql()}\n`), "the INSERT is generated from lib/email/pause-letters/seed-templates.ts");
  assert.equal((migration.match(/'migration-0045', 'migration-0045'/g) ?? []).length, 22);
  assert.match(migration, /ADD COLUMN "pauseEndsOn" DATE,\s+ADD COLUMN "pauseRegister" "PauseRegister";/);
  assert.match(migration, /CREATE TABLE "PauseReminder"/);
  assert.doesNotMatch(migration, /DROP TABLE|DROP COLUMN|DELETE FROM|TRUNCATE|ALTER COLUMN|UPDATE "/i);
  assert.deepEqual(migration.match(/^(?:CREATE|ALTER|INSERT|COMMENT|DROP)[^\n]*/gm)?.map((line) => line.split(" ").slice(0, 3).join(" ")), [
    "CREATE TYPE \"PauseRegister\"",
    "ALTER TABLE \"User\"",
    "CREATE TABLE \"PauseReminder\"",
    "CREATE UNIQUE INDEX",
    "CREATE UNIQUE INDEX",
    "CREATE INDEX \"PauseReminder_environment_pauseEndsOn_idx\"",
    "COMMENT ON COLUMN",
    "COMMENT ON TABLE",
    "ALTER TABLE \"EmailTemplate\"",
    "ALTER TABLE \"EmailTemplate\"",
    "INSERT INTO \"EmailTemplate\"",
  ]);
  const enums = read("prisma/migrations/0044_pause_letters_enum_values/migration.sql").split("\n").filter((line) => line && !line.startsWith("--"));
  assert.equal(enums.length, 12);
  for (const line of enums) assert.match(line, /^ALTER TYPE "(?:EmailTemplateKey|EmailPurpose)" ADD VALUE IF NOT EXISTS '[A-Z0-9_]+';$/);
});

test("the pause date is read only where a letter is timed; no offer, ranking, route or page reads it", () => {
  const allowed = new Set([
    "lib/customers/auth-observer.server.ts",
    "lib/email/pause-letters/account-letters.server.ts",
    "lib/email/pause-letters/reminders.server.ts",
  ]);
  const readers = sourceFiles(["app", "components", "lib"]).filter((file) => /pauseEndsOn|pauseRegister|pauseReminder\b/.test(read(file)));
  assert.deepEqual(readers.filter((file) => !allowed.has(file)), []);
  // The cookie is written by the page's letters component and read by the sign-up observer only.
  const cookieUsers = sourceFiles(["app", "components", "lib"]).filter((file) => /pause-date-carry/.test(read(file)));
  assert.deepEqual(cookieUsers.sort(), ["app/(public)/pause-plan/PausePlanLetters.tsx", "lib/customers/auth-observer.server.ts", "lib/email/pause-letters/reminders.server.ts"]);
  // Nothing commercial imports the pause-letter modules.
  const importers = sourceFiles(["app", "components", "lib"]).filter((file) => /email\/pause-letters\//.test(read(file)) && !file.startsWith("lib/email/"));
  assert.deepEqual(importers.sort(), [
    "app/(public)/pause-plan/page.tsx",
    "app/api/internal/cron/pause-letters/route.ts",
    "app/api/public/pause-reminder/route.ts",
    "lib/customers/auth-observer.server.ts",
  ]);
  // Route handlers and components stay free of Prisma.
  for (const file of ["app/api/internal/cron/pause-letters/route.ts", "app/api/public/pause-reminder/route.ts", "app/(public)/pause-plan/PausePlanLetters.tsx", "app/(public)/pause-plan/PausePlanTool.tsx", "app/(public)/pause-plan/page.tsx"]) {
    assert.doesNotMatch(read(file), /@prisma\/client|lib\/db\/prisma/, file);
  }
  // No Programme file is touched: the hook is the existing sign-up observer.
  assert.doesNotMatch(read("lib/customers/auth-observer.server.ts"), /lib\/programme\//);
});

test("the new letters need the same authority as the Programme reminder, and the nightly worker never sends them", () => {
  for (const purpose of ["PROGRAMME_DAY_3", "PROGRAMME_DAY_7", "PROGRAMME_DAY_10", "PAUSE_ENDS_TOMORROW", "PAUSE_OVER"]) {
    assert.ok((marketingEmailPurposes as readonly string[]).includes(purpose), purpose);
  }
  const service = read("lib/email/service.server.ts");
  assert.match(service, /const WORKER_EMAIL_PURPOSES = \["WELCOME", "PROGRAMME_REMINDER", "MARKETING_BROADCAST", "TEST"\] as const/);
  assert.match(service, /purpose: \{ in: \[\.\.\.\(overrides\.purposes \?\? WORKER_EMAIL_PURPOSES\)\] \}/);
  const nightly = read("lib/email/lifecycle-queue-cron.server.ts");
  assert.doesNotMatch(nightly, /pause-letters|PAUSE_LETTER/);
  assert.match(nightly, /processMessages\(50\)/);
  // While the switch is off, the welcome and reminder letters stay English.
  assert.match(service, /activeEmailTemplate\(key, pauseLettersEnabled\(\) \? pauseLetterLanguage\(preferredLocale\) : "en"\)/);
  assert.match(service, /where: \{ key: "PROGRAMME_REMINDER", active: true, \.\.\.\(pauseLettersEnabled\(\) \? \{\} : \{ locale: "en" \}\) \}/);
  // Every queue and send path of the new letters starts with the switch.
  for (const [file, guards] of [["lib/email/pause-letters/account-letters.server.ts", 3], ["lib/email/pause-letters/reminders.server.ts", 4], ["lib/email/pause-letters/cron.server.ts", 1]] as const) {
    assert.equal((read(file).match(/pauseLettersEnabled\(/g) ?? []).length, guards, file);
  }
});

test("the page shows the email field and carries the date only while the switch is on, with one consent line", () => {
  const tool = read("app/(public)/pause-plan/PausePlanTool.tsx");
  const letters = read("app/(public)/pause-plan/PausePlanLetters.tsx");
  const page = read("app/(public)/pause-plan/page.tsx");
  assert.match(page, /letters=\{pauseLettersEnabled\(\)\}/);
  assert.match(page, /data-pause-plan-start href=\{startHref\}/);
  assert.equal((tool.match(/<PausePlanLetters /g) ?? []).length, 1);
  assert.match(tool, /\{letters && lettersRegister \? <PausePlanLetters endsOn=\{result && !period\?\.openEnded \? toIsoDate\(result\.end\) : null\}/, "an open-ended pause carries nothing and shows no field");
  assert.match(tool, /const lettersRegister = letterRegister\(chosenRegister\);/, "a GAMSTOP date carries nothing and shows no field");
  assert.match(tool, /register=\{lettersRegister\}/);
  // The cookie is set on the press of the Programme button, and only for dates the person chose.
  assert.match(letters, /closest\("a\[data-pause-plan-start\]"\)/);
  assert.match(letters, /if \(!target \|\| !touched\) return;/);
  assert.match(letters, /fetch\("\/api\/public\/pause-reminder"/);
  assert.equal((letters.match(/messages\.consent/g) ?? []).length, 1, "one consent line");
  assert.doesNotMatch(letters, /localStorage|sessionStorage/);
  for (const locale of ["sv-SE", "da-DK", "en-GB"] as const) {
    const { reminder } = pausePlanMessages(locale).tool;
    for (const line of Object.values(reminder)) assert.ok(line.length > 3);
    assert.doesNotMatch(Object.values(reminder).join(" "), NEVER);
  }
  // The line says what is sent and when, and that it can be stopped.
  assert.equal(pausePlanMessages("sv-SE").tool.reminder.consent, "Vi skriver nu, dagen innan din paus tar slut och dagen då den är slut. Du kan avsluta när som helst.");
  assert.equal(pausePlanMessages("da-DK").tool.reminder.consent, "Vi skriver nu, dagen før, din pause udløber, og dagen, hvor den er slut. Du kan stoppe når som helst.");
});

test("the suites run in CI", () => {
  const scripts = (JSON.parse(read("package.json")) as { scripts: Record<string, string> }).scripts;
  assert.match(scripts["pause-letters:test"] ?? "", /tests\/pause-letters\.test\.ts/);
  assert.match(scripts["ci:quality"] ?? "", /npm run pause-letters:test/);
  assert.match(scripts["email-reliability:postgres-test"] ?? "", /tests\/pause-letters-postgres\.test\.ts/);
  assert.match(read(".github/workflows/ci.yml"), /npm run email-reliability:postgres-test/);
});
