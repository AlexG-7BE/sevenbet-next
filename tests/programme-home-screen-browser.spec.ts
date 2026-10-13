import { expect, test, type Page } from "@playwright/test";

import { programmeMissionCopy } from "../lib/i18n/programme-catalog";
import { missionStep, programmeJourney } from "../lib/programme/program-ai/mission-registry";

// Founder, 13 October 2026: the Programme home. A greeting, the three numbers as one quiet row, the
// weekly goal once the goal Mission is complete (its day and check-in date are the server's), the
// next step with the one button, the folded path, and the research links after their lesson.
// Every API answer here is a page-level mock: the spec only decides what the server says.

const now = new Date().toISOString();
const userId = "home-screen-user";
const titles = Array.from({ length: 10 }, (_, index) => programmeMissionCopy("en-GB", index + 1).title);
const ACID = "rgb(228, 226, 78)";
const startingPointText = "I open betting apps after difficult work days.";

type WeekGoal = null | { goalStyle: string; totalDays: number; day: number | null; checkInDate: string };

function homeAt(missionNumber: number, extra: { weekGoal?: WeekGoal; primaryAction?: string; researchAccess?: "open" | "locked" } = {}) {
  const current = missionStep(missionNumber);
  return {
    totalXp: 110, activeDays: 3, currentStreak: 2,
    achievements: [{ slug: "first-plan", title: "First Plan", state: "earned", awardedAt: now }],
    currentMission: missionNumber, primaryAction: extra.primaryAction ?? "start-mission", engagementDayBucket: "day_2_3", currentAction: null,
    startingPoint: { startingPoint: startingPointText, desiredChange: "Pause before opening an app", broadContext: "WORK", continuationCue: "Continue from the after-work pause", chosenBoundaryAction: "Put the phone in another room" },
    weekGoal: extra.weekGoal ?? null,
    currentStep: current,
    missions: programmeJourney.map((number, index) => ({ missionNumber: number, step: index + 1, title: titles[number - 1], status: index + 1 < current ? "completed" : index + 1 === current ? "current" : "locked", actionsCompleted: index + 1 < current ? 3 : 0, actionsTotal: number === 1 ? 2 : 3, xpEarnedHere: index + 1 < current ? 75 : 0, completionBonus: 25 })),
    reviews: [{ milestone: "first", unlockMission: 3, unlockStep: 4, title: "First review", maxWords: 60, status: "locked" }],
    nextReview: null,
    researchAccess: extra.researchAccess ?? "locked",
    discoveryLinks: [{ href: "/casinos", label: "Compare casinos" }, { href: "/bonuses", label: "Bonuses" }, { href: "/best-offers", label: "Best offers" }],
  };
}

const json = (body: unknown, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(body) });

async function openHome(page: Page, home: ReturnType<typeof homeAt>) {
  await page.route("**/api/auth/get-session**", (route) => route.fulfill(json({ session: { id: "home-screen-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now }, user: { id: userId, name: "Home screen", email: "home-screen@example.invalid", emailVerified: true, createdAt: now, updatedAt: now } })));
  await page.route("**/api/programme-access/authority", (route) => route.fulfill(json({ ok: true, accepted: true })));
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill(json({ ok: true, home })));
  await page.goto("/program");
  await expect(page.locator('[data-programme-phase="home"]')).toBeVisible();
  await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
}

/** Top edges of the home's blocks, in the order they are named. */
async function tops(page: Page, selectors: readonly string[]) {
  const boxes = await Promise.all(selectors.map((selector) => page.locator(selector).boundingBox()));
  return boxes.map((box, index) => { expect(box, `${selectors[index]} is on the page`).not.toBeNull(); return box!.y; });
}

async function noHorizontalOverflow(page: Page, context: string) {
  const geometry = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(geometry.document, `${context}: no horizontal scroll`).toBeLessThanOrEqual(geometry.viewport + 1);
}

const homeMain = '[data-programme-presentation="dashboard"] main';
const goal = '[data-programme-home="goal"]';
const next = '[data-programme-home="next"]';
const path = '[data-programme-home="path"]';
const startingPoint = '[data-programme-home="starting-point"]';
const research = '[data-programme-research="featured"]';

test("before the goal Mission is complete the home shows no goal card: the Starting Point stands in its place", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await openHome(page, homeAt(2));

  // The site header stays on the home; the greeting and the three numbers lead the page.
  await expect(page.locator('[data-public-shell="header"]')).toBeVisible();
  await expect(page.getByText("Hello.", { exact: true })).toBeVisible();
  const numbers = page.getByRole("region", { name: "Programme progress" });
  await expect(numbers).toContainText("110 XP");
  await expect(numbers).toContainText("2 streak", { useInnerText: true });
  await expect(numbers).toContainText("3 active days");

  await expect(page.locator(goal)).toHaveCount(0);
  await expect(page.locator(startingPoint)).toHaveAttribute("data-place", "lead");
  await expect(page.locator(startingPoint)).toContainText(startingPointText);
  await expect(page.locator(startingPoint)).toContainText("Saved Starting Point");
  const [pointTop, nextTop, pathTop] = await tops(page, [startingPoint, next, path]);
  expect(pointTop).toBeLessThan(nextTop);
  expect(nextTop).toBeLessThan(pathTop);
  await expect(page.locator(research)).toHaveCount(0);
});

test("the next step card: step number, title, an honest length and the existing start button", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  const home = homeAt(2);
  await page.route("**/api/program/program-ai/missions/2", (route) => route.fulfill(json({ ok: true, mission: {
    missionNumber: 2, step: missionStep(2), stepId: "goal", title: titles[1], purpose: "", status: "current",
    actions: [{ id: "choose_direction", label: "Choose a direction", xp: 15, completed: false }, { id: "build_7_day_goal", label: "Build the 7-day goal", xp: 20, completed: false }, { id: "reality_check", label: "Run a reality check", xp: 15, completed: false }],
    currentAction: "choose_direction", currentActionPosition: 1, actionsCompleted: 0, actionsTotal: 3,
    artifact: {}, artifactVersion: "1", xpEarnedHere: 0, completionBonus: 25, completedAt: null, legacyCompletion: false, programmeFacts: null,
  } })));
  await openHome(page, home);

  const card = page.locator(next);
  await expect(card.getByText("Next step", { exact: true })).toBeVisible();
  await expect(card.getByText("02 / 10", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: `Mission 02 — ${titles[1]}` })).toHaveText(titles[1]);
  // The length is the Mission's own number of actions, as the server gives it.
  await expect(card.locator('[data-programme-home="next-length"]')).toHaveText("About 3 minutes · 3 questions");
  expect(await card.evaluate((element) => getComputedStyle(element).borderTopColor)).toBe("rgba(228, 226, 78, 0.55)");

  // The button keeps its label and what it does: it opens the current Mission.
  const start = card.getByRole("button", { name: "Start mission", exact: true });
  await expect(start).toBeVisible();
  expect(await start.evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(ACID);
  const box = await start.boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(await start.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(14);
  await start.click();
  await expect(page.locator('[data-programme-phase="mission"]')).toBeVisible();
  await expect(page.locator("[data-programme-step-frame]")).toBeVisible();
});

test("the button's label follows the server's action in every state", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  // The home of Mission 01 needs more of the server than this spec answers: tests/auth-comms-browser.spec.ts
  // opens it and presses "Finish Mission 01"; tests/programme-home-screen.test.ts holds all five labels.
  for (const [missionNumber, primaryAction, label] of [[2, "start-mission", "Start mission"], [8, "resume-mission", "Resume mission"], [10, "review-mission", "Review mission"]] as const) {
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await openHome(page, homeAt(missionNumber, { primaryAction }));
    const card = page.locator(next);
    await expect(card.getByRole("button")).toHaveCount(1);
    await expect(card.getByRole("button", { name: label, exact: true })).toBeVisible();
    // A completed Programme keeps its own eyebrow and shows no length for a step that is done.
    await expect(card.getByText(primaryAction === "review-mission" ? "Mission complete" : "Next step", { exact: true })).toBeVisible();
    await expect(card.locator('[data-programme-home="next-length"]')).toHaveCount(primaryAction === "review-mission" ? 0 : 1);
  }
});

test("the goal card appears only after the goal Mission, with the server's day and check-in date", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await openHome(page, homeAt(8, { weekGoal: { goalStyle: "pause_first", totalDays: 7, day: 3, checkInDate: "2026-10-20" } }));

  const card = page.locator(goal);
  await expect(card.getByText("Your goal this week", { exact: true })).toBeVisible();
  await expect(card.locator("blockquote")).toHaveText("Pause before one decision");
  // Seven circles; the server's day is the lit one, the days before it are passed.
  const circles = card.locator("ol > li");
  await expect(circles).toHaveCount(7);
  expect(await circles.evaluateAll((items) => items.map((item) => item.getAttribute("data-day")))).toEqual(["past", "past", "now", "ahead", "ahead", "ahead", "ahead"]);
  expect(await circles.nth(2).evaluate((element) => getComputedStyle(element).backgroundColor)).toBe(ACID);
  await expect(card.locator("p")).toHaveText("Day 3 of 7 · check-in 20 October");
  await expect(card).toHaveAttribute("data-goal-day", "3");

  // The goal leads; the Starting Point keeps its text and moves under the path.
  const [goalTop, nextTop, pathTop, pointTop] = await tops(page, [goal, next, path, startingPoint]);
  expect(goalTop).toBeLessThan(nextTop);
  expect(nextTop).toBeLessThan(pathTop);
  expect(pathTop).toBeLessThan(pointTop);
  await expect(page.locator(startingPoint)).toHaveAttribute("data-place", "below");
  await expect(page.locator(startingPoint)).toContainText(startingPointText);
});

test("from the check-in date on the goal card shows the date and lights no day", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await openHome(page, homeAt(3, { weekGoal: { goalStyle: "use_one_boundary", totalDays: 7, day: null, checkInDate: "2026-10-20" } }));
  const card = page.locator(goal);
  await expect(card.locator("blockquote")).toHaveText("Use one boundary");
  await expect(card.locator("p")).toHaveText("Check-in 20 October");
  await expect(card).toHaveAttribute("data-goal-day", "check-in");
  expect(await card.locator("ol > li").evaluateAll((items) => items.map((item) => item.getAttribute("data-day")))).toEqual(Array(7).fill("past"));
});

test("the path shows the rows around the current step; one press unfolds all ten in place", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await openHome(page, homeAt(8));

  const card = page.locator(path);
  await expect(card.getByText("Your path", { exact: true })).toBeVisible();
  const rows = card.locator("ol > li");
  // Nothing is removed: the ten rows are in the page, five of them shown.
  await expect(rows).toHaveCount(10);
  await expect(card.locator("ol > li:visible")).toHaveCount(5);
  await expect(card.locator("ol > li:visible").first()).toContainText(titles[0]);
  const current = card.locator('li[aria-current="step"]');
  await expect(current).toContainText(titles[7]);
  await expect(current).toContainText("Now");
  await expect(card.locator("li[data-state='completed']:visible")).toHaveCount(2);
  await expect(card.locator("li[data-state='locked']:visible")).toHaveCount(2);

  const toggle = card.getByRole("button", { name: "Show all 10 steps", exact: true });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  expect((await toggle.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  await toggle.click();
  await expect(card.locator("ol > li:visible")).toHaveCount(10);
  expect(await rows.evaluateAll((items) => items.map((item) => item.querySelector("strong")?.textContent))).toEqual(programmeJourney.map((number) => titles[number - 1]));
  await expect(card).toHaveAttribute("data-programme-path", "all");
  const fold = card.getByRole("button", { name: "Show fewer steps", exact: true });
  await expect(fold).toHaveAttribute("aria-expanded", "true");
  await fold.click();
  await expect(card.locator("ol > li:visible")).toHaveCount(5);
});

test("the research card after its lesson: the same heading, links, order and place", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await openHome(page, homeAt(3, { researchAccess: "open", weekGoal: { goalStyle: "pause_first", totalDays: 7, day: 1, checkInDate: "2026-10-20" } }));

  const card = page.locator(research);
  await expect(card.locator("> span")).toHaveText("Research");
  expect(await card.getByRole("link").evaluateAll((links) => links.map((link) => [link.getAttribute("href"), link.textContent]))).toEqual([
    ["/en/casinos", "Compare casinos"],
    ["/en/bonuses", "Bonuses"],
    ["/en/best-offers", "Best offers"],
  ]);
  for (const link of await card.getByRole("link").all()) {
    expect((await link.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect(await link.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  }
  const [nextTop, researchTop, pathTop] = await tops(page, [next, research, path]);
  expect(researchTop).toBeGreaterThan(nextTop);
  expect(researchTop).toBeLessThan(pathTop);
  // The privacy footer keeps its two lines.
  await expect(page.getByText("Your data is private. We never use it for offers or rankings.", { exact: true })).toBeVisible();
  await expect(page.getByText("18+ · Protected Help remains available.", { exact: true })).toBeVisible();
});

test("the home fits phones from 320px to 430px and keeps one column on a wide screen", async ({ page }) => {
  const home = homeAt(3, { researchAccess: "open", weekGoal: { goalStyle: "research_after_pause", totalDays: 7, day: 7, checkInDate: "2026-10-20" } });
  for (const width of [320, 360, 412, 430]) {
    await page.setViewportSize({ width, height: 800 });
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await openHome(page, home);
    await noHorizontalOverflow(page, `home at ${width}px`);
    // Text is never under 12px; a button's text never under 14px; every control is a 44px target.
    const type = await page.locator(homeMain).evaluate((main) => {
      const shown = (element: Element) => (element as HTMLElement).offsetParent !== null && !element.closest(".srOnly");
      const texts = Array.from(main.querySelectorAll("*")).filter((element) => shown(element) && Array.from(element.childNodes).some((node) => node.nodeType === 3 && node.textContent?.trim()));
      const controls = Array.from(main.querySelectorAll("button, a")).filter(shown);
      return {
        smallestText: Math.min(...texts.map((element) => Number.parseFloat(getComputedStyle(element).fontSize))),
        smallestButtonText: Math.min(...controls.map((element) => Number.parseFloat(getComputedStyle(element).fontSize))),
        smallestTarget: Math.min(...controls.map((element) => element.getBoundingClientRect().height)),
      };
    });
    expect(type.smallestText, `text at ${width}px`).toBeGreaterThanOrEqual(12);
    expect(type.smallestButtonText, `button text at ${width}px`).toBeGreaterThanOrEqual(14);
    expect(type.smallestTarget, `targets at ${width}px`).toBeGreaterThanOrEqual(44);
    // The step's title wraps between words, never inside one.
    const brokenWords = await page.locator(`${next} h1`).evaluate((heading) => {
      const node = heading.firstChild as Text;
      return Array.from((node.textContent ?? "").matchAll(/\S+/g)).filter((word) => {
        const range = document.createRange();
        range.setStart(node, word.index);
        range.setEnd(node, word.index + word[0].length);
        return range.getClientRects().length > 1;
      }).map((word) => word[0]);
    });
    expect(brokenWords, `the title keeps whole words at ${width}px`).toEqual([]);
    // The seven day circles stay on one line inside the card.
    const circleTops = await page.locator(`${goal} ol > li`).evaluateAll((items) => items.map((item) => Math.round(item.getBoundingClientRect().top)));
    expect(new Set(circleTops).size, `day circles share a line at ${width}px`).toBe(1);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await openHome(page, home);
  await noHorizontalOverflow(page, "home at 1280px");
  const column = await page.locator(homeMain).boundingBox();
  expect(column!.width).toBeLessThanOrEqual(560);
  for (const selector of [goal, next, research, path, startingPoint]) {
    const box = await page.locator(selector).boundingBox();
    expect(Math.round(box!.x), `${selector} starts at the column's edge`).toBe(Math.round(column!.x));
    expect(Math.round(box!.width), `${selector} fills the column`).toBe(Math.round(column!.width));
  }
});
