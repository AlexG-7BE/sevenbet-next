import { expect, test, type Page, type Route } from "@playwright/test";

import { programmeMissionCopy } from "../lib/i18n/programme-catalog";
import { missionStep, programmeJourney } from "../lib/programme/program-ai/mission-registry";
import { PROGRAMME_RETRY_DELAY_MS } from "../lib/programme/request-retry";

// Founder, 12 October 2026 ("Повтор вместо ошибки"). Production, 11:03:08 UTC that day: a Mission
// action answered 500 once and the person had to press again. The screen now repeats the request
// itself, stays busy meanwhile and says nothing unless the repeat fails too.
// Every API answer here is a page-level mock, so the spec decides which attempt fails.

const now = new Date().toISOString();
const userId = "request-retry-user";
const titles = Array.from({ length: 10 }, (_, index) => programmeMissionCopy("en-GB", index + 1).title);
const home = {
  totalXp: 110, activeDays: 3, currentStreak: 2,
  achievements: [{ slug: "first-plan", title: "First Plan", state: "earned", awardedAt: now }],
  currentMission: 2, primaryAction: "start-mission", engagementDayBucket: "day_2_3", currentAction: null,
  startingPoint: { startingPoint: "I open betting apps after difficult work days.", desiredChange: "Pause before opening an app", broadContext: "WORK", continuationCue: "Continue from the after-work pause", chosenBoundaryAction: "Put the phone in another room" },
  currentStep: missionStep(2),
  missions: programmeJourney.map((missionNumber, index) => ({ missionNumber, step: index + 1, title: titles[missionNumber - 1], status: index + 1 < missionStep(2) ? "completed" : index + 1 === missionStep(2) ? "current" : "locked", actionsCompleted: index + 1 < missionStep(2) ? 3 : 0, actionsTotal: 3, xpEarnedHere: index + 1 < missionStep(2) ? 55 : 0, completionBonus: 25 })),
  reviews: [{ milestone: "first", unlockMission: 3, unlockStep: 4, title: "First review", maxWords: 60, status: "locked" }],
  nextReview: null,
  researchAccess: "locked",
  discoveryLinks: [{ href: "/casinos", label: "Compare casinos" }, { href: "/bonuses", label: "Bonuses" }, { href: "/best-offers", label: "Best offers" }],
};
const missionTwo = {
  missionNumber: 2, step: 2, stepId: "goal", title: titles[1], purpose: "", status: "current",
  actions: [
    { id: "choose_direction", label: "Choose a direction", xp: 20, completed: false },
    { id: "build_7_day_goal", label: "Build the 7-day goal", xp: 20, completed: false },
    { id: "reality_check", label: "Run a reality check", xp: 15, completed: false },
  ],
  currentAction: "choose_direction", currentActionPosition: 1, actionsCompleted: 0, actionsTotal: 3,
  artifact: {}, artifactVersion: "1", xpEarnedHere: 0, completionBonus: 25, completedAt: null, legacyCompletion: false, programmeFacts: null,
};
const missionTwoAfterFirstAction = {
  ...missionTwo,
  actions: missionTwo.actions.map((item, index) => ({ ...item, completed: index === 0 })),
  currentAction: "build_7_day_goal", currentActionPosition: 2, actionsCompleted: 1,
  artifact: { direction: "pause" }, xpEarnedHere: 20,
};

const json = (body: unknown, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(body) });
// What the central Programme error mapper answers for an unexpected failure.
const serverFailure = json({ ok: false, error: "Unable to process programme request", code: "INTERNAL_ERROR" }, 500);
const saved = json({ ok: true, actionPosition: 1, xpAwarded: 20, mission: missionTwoAfterFirstAction, home: { ...home, totalXp: 130 } });

/** A signed-in person on Mission 02 with its first choice picked; `onAction` answers each save. */
async function openMissionTwo(page: Page, onAction: (route: Route, attempt: number) => Promise<void>) {
  const bodies: string[] = [];
  await page.route("**/api/auth/get-session**", (route) => route.fulfill(json({ session: { id: "request-retry-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now }, user: { id: userId, name: "Request retry", email: "request-retry@example.invalid", emailVerified: true, createdAt: now, updatedAt: now } })));
  await page.route("**/api/programme-access/authority", (route) => route.fulfill(json({ ok: true, accepted: true })));
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill(json({ ok: true, home })));
  await page.route("**/api/program/program-ai/missions/2", (route) => route.fulfill(json({ ok: true, mission: missionTwo })));
  await page.route("**/api/program/program-ai/missions/2/actions", async (route) => {
    bodies.push(route.request().postData() ?? "");
    await onAction(route, bodies.length);
  });
  await page.goto("/program");
  await expect(page.locator('[data-programme-phase="home"]')).toBeVisible();
  await page.getByRole("button", { name: "Start mission", exact: true }).click();
  await expect(page.locator('[data-programme-phase="mission"]')).toBeVisible();
  await page.getByRole("radio", { name: "Practise a pause" }).check();
  return bodies;
}

test("a Mission action that fails once is sent again: the screen stays busy and shows no error", async ({ page }) => {
  let releaseSecond: () => void = () => undefined;
  const secondHeld = new Promise<void>((resolve) => { releaseSecond = resolve; });
  let secondArrivedAt = 0;
  let firstFailedAt = 0;
  const bodies = await openMissionTwo(page, async (route, attempt) => {
    if (attempt === 1) {
      firstFailedAt = Date.now();
      await route.fulfill(serverFailure);
      return;
    }
    secondArrivedAt = Date.now();
    await secondHeld;
    await route.fulfill(saved);
  });

  await page.getByRole("button", { name: "Continue", exact: true }).click();
  // The repeat is on its way: the button is still busy and nothing has been said about a failure.
  await expect.poll(() => bodies.length, { message: "the action is sent a second time" }).toBe(2);
  // Busy keeps the button's word: it is disabled and shows the three dots, not "Saving…".
  const saving = page.getByRole("button", { name: "Continue", exact: true });
  await expect(saving).toBeDisabled();
  await expect(saving).toHaveAttribute("aria-busy", "true");
  await expect(saving.locator("[data-programme-saving-dots]")).toBeVisible();
  await expect(page.getByText("Saving…")).toHaveCount(0);
  await expect(page.getByText("The action could not be saved")).toHaveCount(0);
  expect(secondArrivedAt - firstFailedAt, "the repeat follows the short pause").toBeGreaterThanOrEqual(PROGRAMME_RETRY_DELAY_MS - 50);
  expect(bodies[1], "the same action, unchanged").toBe(bodies[0]);
  expect(JSON.parse(bodies[0])).toEqual({ action: "choose_direction", artifact: { direction: "pause" } });

  releaseSecond();
  await expect(page.getByText("+20 XP", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create personal drafts" }), "the next action is on screen").toBeVisible();
  await expect(page.getByText("The action could not be saved")).toHaveCount(0);
  expect(bodies.length, "one press, two requests, no third").toBe(2);
});

test("when the repeat fails too, the usual error shows and the person can press again", async ({ page }) => {
  const bodies = await openMissionTwo(page, async (route, attempt) => {
    await route.fulfill(attempt <= 2 ? serverFailure : saved);
  });

  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The action could not be saved" })).toBeVisible();
  expect(bodies.length, "the first attempt and one repeat").toBe(2);
  const confirm = page.getByRole("button", { name: "Continue", exact: true });
  await expect(confirm).toBeEnabled();

  await confirm.click();
  await expect(page.getByText("+20 XP", { exact: true })).toBeVisible();
  await expect(page.getByText("The action could not be saved")).toHaveCount(0);
  expect(bodies.length).toBe(3);
});

test("an action the server refuses is not sent again", async ({ page }) => {
  const bodies = await openMissionTwo(page, async (route) => {
    await route.fulfill(json({ ok: false, error: "Complete the current Mission action first", code: "PROGRAMME_STATE_CONFLICT" }, 409));
  });

  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "The action could not be saved" })).toBeVisible();
  // Longer than the pause before a repeat: none follows a refusal.
  await page.waitForTimeout(PROGRAMME_RETRY_DELAY_MS + 400);
  expect(bodies.length).toBe(1);
});
