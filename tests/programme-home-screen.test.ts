import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { programmeText, type ProgrammeMessageKey } from "../lib/i18n/programme-catalog";
import type { ProgrammeLocale } from "../lib/programme/presentation";
import { humanValue } from "../lib/programme/program-ai/mission-presentation";
import { WEEK_GOAL_DAYS, programmeWeekGoal } from "../lib/programme/program-ai/week-goal";

// Founder, 13 October 2026: the Programme home is redrawn — a greeting, the weekly goal, the next
// step and the folded path. It looks different and decides nothing: the day of the goal, its
// check-in date, the step, the statuses and the button's action stay the server's.

// Every cell of a catalogue row: the eleven languages on the site and the two that are hidden, not deleted.
const CATALOGUE_LOCALES = ["en-GB", "de-DE", "es-ES", "sv-SE", "da-DK", "el-GR", "it-IT", "pt-PT", "nl-NL", "fi-FI", "nb-NO", "uk-UA", "ru-RU"] as const satisfies readonly ProgrammeLocale[];

const read = (path: string) => readFileSync(path, "utf8");
const home = read("components/programme/ProgramAiHome.tsx");
const stylesheet = read("components/programme/ProgramAiAuthenticated.module.css");
const service = read("lib/programme/application/programme-ai-missions.service.ts");
const route = read("app/api/program/program-ai/home/route.ts");
const types = read("components/programme/ProgramAiAuthenticated.types.ts");
const experience = read("components/programme/ProgramAiExperience.tsx");
const weekGoalSource = read("lib/programme/program-ai/week-goal.ts");

const stockholm = "Europe/Stockholm";
const at = (iso: string) => new Date(iso);

test("the weekly goal's day and check-in date are worked out on the server, on the person's own calendar", () => {
  const completedAt = at("2026-10-13T09:30:00.000Z");
  const goal = (now: string, timezone = stockholm) => programmeWeekGoal({ goalStyle: "pause_first", completedAt, timezone, now: at(now) });

  // Day 1 is the day the goal was set; the check-in falls seven days later.
  assert.deepEqual(goal("2026-10-13T09:31:00.000Z"), { goalStyle: "pause_first", totalDays: 7, day: 1, checkInDate: "2026-10-20" });
  assert.equal(WEEK_GOAL_DAYS, 7);
  // The day changes at the person's midnight, not at UTC midnight: 22:30 UTC is already the 14th in Stockholm.
  assert.equal(goal("2026-10-13T21:59:00.000Z")?.day, 1);
  assert.equal(goal("2026-10-13T22:30:00.000Z")?.day, 2);
  assert.equal(goal("2026-10-13T22:30:00.000Z", "UTC")?.day, 1);
  assert.equal(goal("2026-10-19T12:00:00.000Z")?.day, 7);
  // From the check-in date on no day is running; the date stays.
  assert.deepEqual(goal("2026-10-20T06:00:00.000Z"), { goalStyle: "pause_first", totalDays: 7, day: null, checkInDate: "2026-10-20" });
  assert.equal(goal("2026-11-30T06:00:00.000Z")?.day, null);
  assert.equal(goal("2026-11-30T06:00:00.000Z")?.checkInDate, "2026-10-20");
  // The seven days cross the end of summer time without losing or repeating a day.
  const autumn = (now: string) => programmeWeekGoal({ goalStyle: "pause_first", completedAt: at("2026-10-22T10:00:00.000Z"), timezone: stockholm, now: at(now) });
  assert.equal(autumn("2026-10-25T12:00:00.000Z")?.day, 4);
  assert.equal(autumn("2026-10-28T12:00:00.000Z")?.day, 7);
  assert.equal(autumn("2026-10-28T12:00:00.000Z")?.checkInDate, "2026-10-29");
  // A clock behind the completion never shows a day before the first.
  assert.equal(goal("2026-10-12T12:00:00.000Z")?.day, null);
});

test("no goal card without a completed goal Mission and its saved approach", () => {
  const now = at("2026-10-13T12:00:00.000Z");
  assert.equal(programmeWeekGoal({ goalStyle: "pause_first", completedAt: null, timezone: stockholm, now }), null);
  assert.equal(programmeWeekGoal({ goalStyle: null, completedAt: now, timezone: stockholm, now }), null);
  assert.equal(programmeWeekGoal({ goalStyle: "", completedAt: now, timezone: stockholm, now }), null);
  assert.equal(programmeWeekGoal({ goalStyle: ["pause_first"], completedAt: now, timezone: stockholm, now }), null);

  // The home read sends it only for a COMPLETED goal Mission, from what is already stored.
  assert.ok(service.includes("const WEEK_GOAL_MISSION = 2;"));
  assert.match(service, /const weekGoal = goalProgress\?\.status === "COMPLETED"\n\s+\? programmeWeekGoal\(\{/);
  assert.ok(service.includes('goalStyle: storedArtifactValue(goalProgress.draft, programAiMissionDefinition(WEEK_GOAL_MISSION), "goalStyle"),'));
  assert.ok(service.includes("completedAt: goalProgress.completedAt,") && service.includes("timezone: enrollment.timezone,"));
  assert.equal(service.match(/\n\s+weekGoal: null,\n/g)?.length, 1, "a visitor without an enrolment has no goal card");
  assert.match(service, /\n\s+weekGoal,\n\s+missions: programmeJourney\.map/);
  // The route stays a thin handler over the application service: no Prisma, no new read.
  assert.doesNotMatch(route + home, /@prisma\/client|lib\/db|prisma\./);
  assert.ok(route.includes("const home = await programmeAiMissionsService.home(user.id);"));
  assert.ok(types.includes("weekGoal?: null | { goalStyle: string; totalDays: number; day: number | null; checkInDate: string };"));
});

test("the home renders the goal the server sends and works nothing out about it", () => {
  assert.ok(home.includes("const weekGoal = home.weekGoal ?? null;"));
  // The goal is the saved approach in the catalogue's own words, in every language.
  assert.ok(home.includes('<blockquote data-goal-sentence={ownGoal ? "own" : "approach"}>{ownGoal || humanValue(weekGoal.goalStyle, locale, "goalStyle")}</blockquote>'));
  for (const style of ["notice_and_note", "pause_first", "use_one_boundary", "research_after_pause", "ask_for_support"]) {
    for (const locale of CATALOGUE_LOCALES) assert.notEqual(humanValue(style, locale, "goalStyle"), programmeText(locale, "Unavailable"), `${style} in ${locale}`);
  }
  assert.equal(humanValue("pause_first", "sv-SE", "goalStyle"), "Pausa före ett beslut");
  // Day and date are the server's; the page only formats the date and marks the circles.
  assert.ok(home.includes('t("Day {day} of {total} · check-in {date}", { day: weekGoal.day, total: weekGoal.totalDays, date: formatProgrammeDate(weekGoal.checkInDate, locale) })'));
  assert.ok(home.includes('t("Check-in {date}", { date: formatProgrammeDate(weekGoal.checkInDate, locale) })'));
  assert.ok(home.includes("Array.from({ length: weekGoal.totalDays }"));
  assert.doesNotMatch(home, /Date\.now\(\)|new Date\(\)|getDate\(\)|completedAt|86_?400|24 \* 60/, "no clock and no day arithmetic in the page");
  assert.doesNotMatch(home, /% complete|progressPercent|home\.currentMission \+ 1|actionsCompleted \+ 1|\.filter\(\(mission\) => mission\.status === "completed"\)/);
  // Before the goal exists the Starting Point stands in its place; after, it moves under the path.
  assert.ok(home.includes(") : startingPoint}"));
  assert.ok(home.includes("{weekGoal ? startingPoint : null}"));
  assert.ok(home.indexOf('data-programme-home="path"') < home.indexOf("{weekGoal ? startingPoint : null}"));
  assert.ok(home.includes('<p>{home.startingPoint.startingPoint}</p><small>{t("Saved Starting Point")}</small>'), "the server's text, not reworded");
});

test("the goal's sentence is the person's own wording only while the tab holds it, and it never leaves the tab", () => {
  // The parent hands the home the wording it already keeps in the tab for the goal Mission: the
  // same tab storage the Mission's result card reads, in the account's own namespace.
  assert.ok(home.includes("export const GOAL_WORDING_MISSION = 2;"));
  assert.ok(experience.includes('goalWording={missionWording[GOAL_WORDING_MISSION] ?? ""}'));
  assert.ok(experience.includes("const localContent = loadProgrammeSubjectContent<ProgramAiAuthenticatedLocalContent>(window.sessionStorage, userSubject);"));
  assert.ok(experience.includes("setMissionWording(localContent.programAiMissionWording ?? {});"));
  // With wording: it is the sentence and the saved approach is the quiet line under it. Without:
  // the approach is the sentence and there is no second line.
  assert.ok(home.includes("const ownGoal = goalWording.trim();"));
  assert.ok(home.includes('{ownGoal ? <small data-goal-approach>{humanValue(weekGoal.goalStyle, locale, "goalStyle")}</small> : null}'));
  assert.equal(home.match(/goalWording|ownGoal/g)?.length, 7, "the wording is read for the goal card and nowhere else");
  // The home sends nothing and stores nothing; the server's goal knows no wording.
  assert.doesNotMatch(home, /fetch\(|sessionStorage|localStorage|document\.cookie/);
  assert.doesNotMatch(service + weekGoalSource + route + types, /goalWording|missionWording|localWording|programAiMissionWording/);
  assert.match(stylesheet, /\.homeGoal small \{[^}]*font-size: 13px;/);
});

test("the next step card keeps the button, its label and what it does", () => {
  assert.ok(home.includes('<button onClick={() => home.primaryAction === "start-mission-one" || home.primaryAction === "finish-mission-one" ? onMissionOneEntry() : onMission(home.currentMission)} type="button">{programmePrimaryActionLabel(home.primaryAction, locale)}'));
  const labels: ReadonlyArray<readonly [string, ProgrammeMessageKey]> = [["start-mission-one", "Start Mission 01"], ["finish-mission-one", "Finish Mission 01"], ["start-mission", "Start mission"], ["review-mission", "Review mission"]];
  for (const [action, label] of labels) assert.ok(home.includes(`if (action === "${action}") return programmeText(locale, "${label}");`));
  assert.ok(home.includes('return programmeText(locale, "Resume mission");'));
  assert.equal(home.match(/<button /g)?.length, 4, "start, the path's unfold, a Review and the email link: no new action");
  // The step a person sees, the Mission's title and a length taken from the server's action count.
  assert.ok(home.includes('<em>{String(home.currentStep).padStart(2, "0")} / {home.missions.length}</em>'));
  assert.ok(home.includes('t("About {minutes} minutes · {questions} questions", { minutes: current.actionsTotal, questions: current.actionsTotal })'));
  assert.doesNotMatch(home, /you get|du får/i, "the mockup's promise line is not shown");
  assert.equal(programmeText("sv-SE", "About {minutes} minutes · {questions} questions", { minutes: 3, questions: 3 }), "Ca 3 minuter · 3 frågor");
  assert.match(stylesheet, /\.homeNext \{[^}]*border: 1px solid rgba\(228, 226, 78, \.55\);[^}]*border-radius: 20px;/);
  assert.match(stylesheet, /\.homeNext button \{ width: 100%; min-height: 54px;[^}]*font-size: 17px;/);
});

test("the path folds and removes nothing; the home carries no research card (Founder, 16 October 2026)", () => {
  // All rows are rendered; the ones outside the window are hidden until the press.
  assert.ok(home.includes("<ol id=\"programme-path-steps\">{home.missions.map((mission, index) => <li "));
  assert.ok(home.includes("hidden={!allSteps && (index < pathStart || index >= pathStart + PATH_ROWS)}"));
  assert.ok(home.includes('aria-controls="programme-path-steps" aria-expanded={allSteps} onClick={() => setAllSteps((shown) => !shown)}'));
  assert.ok(home.includes('t("Show all {count} steps", { count: home.missions.length })'));
  assert.ok(home.includes("const PATH_ROWS = 5;") && home.includes("const PATH_ROWS_BEFORE = 2;"));
  assert.ok(stylesheet.includes(".homePath li[hidden] { display: none; }"));
  assert.match(stylesheet, /\.homePath > div button \{ min-height: 44px;[^}]*font-size: 14px;/);

  // No research card, no discovery link and no lesson state: the dashboard ends in help.
  assert.doesNotMatch(home, /researchLinksShown|researchFeatured|discoveryLinks|researchAccess|data-programme-research|programmePublicHref|from "@\/lib\/(?:research-access|commercial-section)"/);
  assert.doesNotMatch(home, /href=\{?["'`]?\/(?:casinos|bonuses|best-offers|compare|bonus-guide)/);
  // The privacy footer keeps its two lines.
  assert.ok(home.includes('<footer className={styles.dashboardFooter}><span>{t("Your data is private. We never use it for offers or rankings.")}</span><span>{t("18+ · Protected Help remains available.")}</span></footer>'));
});

test("every new line of the home exists in every language and keeps its placeholders", () => {
  const added: readonly ProgrammeMessageKey[] = [
    "Hello.",
    "One step at a time.",
    "Your goal this week",
    "Day {day} of {total} · check-in {date}",
    "Check-in {date}",
    "Next step",
    "About {minutes} minutes · {questions} questions",
    "Your path",
    "Show all {count} steps",
    "Show fewer steps",
    "Now",
  ];
  for (const key of added) {
    const placeholders = key.match(/\{[a-z]+\}/g) ?? [];
    for (const locale of CATALOGUE_LOCALES) {
      const value = programmeText(locale, key);
      assert.ok(value.trim().length > 0, `${key} in ${locale}`);
      for (const placeholder of placeholders) assert.ok(value.includes(placeholder), `${key} keeps ${placeholder} in ${locale}`);
      if (locale !== "en-GB" && key.length > 6) assert.notEqual(value, key, `${key} is translated in ${locale}`);
    }
    assert.ok(home.includes(`"${key}"`), `${key} is used by the home`);
  }
  assert.equal(programmeText("sv-SE", "Hello."), "Hej.");
  assert.equal(programmeText("sv-SE", "Day {day} of {total} · check-in {date}", { day: 1, total: 7, date: "20 oktober" }), "Dag 1 av 7 · avstämning 20 oktober");

  // Type floors: text from 12px, the buttons from 14px.
  const homeRules = stylesheet.slice(stylesheet.indexOf("/* Programme home"), stylesheet.indexOf("/* Mission and Review workspace */"));
  const sizes = Array.from(homeRules.matchAll(/font-size: ([\d.]+)px/g), (match) => Number(match[1]));
  assert.ok(sizes.length > 20 && Math.min(...sizes) >= 12, "no text under 12px on the home");
  assert.ok(stylesheet.includes(".home { width: min(560px, var(--site-content-width)); margin: 0 auto;"), "the step screen's column on every width");
});
