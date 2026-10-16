import { readFileSync } from "node:fs";

import { expect, test, type Page } from "@playwright/test";

import { programmeMissionCopy } from "../lib/i18n/programme-catalog";
import { missionStep, programmeJourney } from "../lib/programme/program-ai/mission-registry";

// Founder, 13 October 2026: the two screens at the end of a step. The result is a keepsake card with
// the finish press pinned under it; the completion screen says the reward once and keeps the card.
// The flow is unchanged: result → "Complete Mission" → completion → back to the Programme home.
// Every API answer is a page-level mock, so rewards and order are whatever the server says.

const now = new Date().toISOString();
const userId = "result-screen-user";
const titles = Array.from({ length: 10 }, (_, index) => programmeMissionCopy("en-GB", index + 1).title);

type Artifact = Record<string, string | number | boolean | string[]>;
const results: Record<number, { actions: [string, string, string]; artifact: Artifact; title: string; rows: number }> = {
  2: { actions: ["choose_direction", "build_7_day_goal", "reality_check"], artifact: { direction: "pause", goalStyle: "pause_first", reviewWindowDays: 7, realityCheck: "restart_next_day" }, title: "MY 7-DAY GOAL", rows: 4 },
  8: { actions: ["learn_comparison_signals", "decode_offer_terms", "build_research_checklist"], artifact: { comparisonSignals: ["operator_identity", "withdrawal_conditions"], offerTermSignal: "wagering_requirement", researchCriteria: ["licensing_status", "terms", "withdrawals"] }, title: "MY RESEARCH CHECKLIST", rows: 3 },
  4: { actions: ["choose_boundary", "build_boundary_rule", "choose_execution"], artifact: { boundaryCategory: "money", triggerType: "before_access", executionMethod: "bank_block", pressureCheck: "easy_to_use" }, title: "MY BOUNDARY", rows: 4 },
};

function homeAt(missionNumber: number, completed: boolean) {
  const current = missionStep(missionNumber);
  const done = completed ? current : current - 1;
  return {
    totalXp: completed ? 185 : 160, activeDays: 3, currentStreak: 2,
    achievements: [{ slug: "first-plan", title: "First Plan", state: "earned", awardedAt: now }],
    currentMission: missionNumber, primaryAction: "resume-mission", engagementDayBucket: "day_2_3", currentAction: null,
    startingPoint: { startingPoint: "I open betting apps after difficult work days.", desiredChange: "Pause before opening an app", broadContext: "WORK", continuationCue: "Continue from the after-work pause", chosenBoundaryAction: "Put the phone in another room" },
    currentStep: current,
    missions: programmeJourney.map((number, index) => ({ missionNumber: number, step: index + 1, title: titles[number - 1], status: index + 1 <= done ? "completed" : index + 1 === done + 1 ? "current" : "locked", actionsCompleted: index + 1 <= current ? 3 : 0, actionsTotal: 3, xpEarnedHere: index + 1 <= done ? 75 : 0, completionBonus: 25 })),
    reviews: [{ milestone: "first", unlockMission: 3, unlockStep: 4, title: "First review", maxWords: 60, status: "locked" }],
    nextReview: null,
  };
}

function missionReady(missionNumber: number, completed = false) {
  const result = results[missionNumber];
  return {
    missionNumber, step: missionStep(missionNumber), stepId: `step-${missionNumber}`, title: titles[missionNumber - 1], purpose: "", status: completed ? "completed" : "current",
    actions: result.actions.map((id, index) => ({ id, label: id, xp: index === 1 ? 20 : 15, completed: true })),
    currentAction: null, currentActionPosition: null, actionsCompleted: 3, actionsTotal: 3,
    artifact: result.artifact, artifactVersion: "1", xpEarnedHere: completed ? 75 : 50, completionBonus: 25, completedAt: completed ? now : null, legacyCompletion: false, programmeFacts: null,
  };
}

const json = (body: unknown, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(body) });

/** A signed-in person whose current step has every action saved: its result screen. */
async function openResult(page: Page, missionNumber: number, options: { wording?: string } = {}) {
  const posts: string[] = [];
  page.on("request", (request) => { if (request.method() !== "GET") posts.push(new URL(request.url()).pathname); });
  if (options.wording) await page.addInitScript(([key, value]) => { window.sessionStorage.setItem(key, value); }, [`sevenbet.programme.local-content.v2:user:${encodeURIComponent(userId)}`, JSON.stringify({ programAiMissionWording: { [String(missionNumber)]: options.wording }, programAiReviewWording: {} })] as const);
  await page.route("**/api/auth/get-session**", (route) => route.fulfill(json({ session: { id: "result-screen-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now }, user: { id: userId, name: "Result screen", email: "result-screen@example.invalid", emailVerified: true, createdAt: now, updatedAt: now } })));
  await page.route("**/api/programme-access/authority", (route) => route.fulfill(json({ ok: true, accepted: true })));
  let completed = false;
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill(json({ ok: true, home: homeAt(missionNumber, completed) })));
  await page.route(`**/api/program/program-ai/missions/${missionNumber}`, (route) => route.fulfill(json({ ok: true, mission: missionReady(missionNumber, completed) })));
  await page.route(`**/api/program/program-ai/missions/${missionNumber}/complete`, async (route) => {
    completed = true;
    await route.fulfill(json({ ok: true, xpAwarded: 25, mission: missionReady(missionNumber, true), home: homeAt(missionNumber, true) }));
  });
  await page.goto("/program");
  await expect(page.locator('[data-programme-phase="home"]')).toBeVisible();
  await page.getByRole("button", { name: "Resume mission", exact: true }).click();
  await expect(page.locator("[data-programme-result]")).toBeVisible();
  return posts;
}

const finish = (page: Page) => page.getByRole("button", { name: "Complete Mission", exact: true });

test("the result screen: the keepsake card for three Missions, the finish press on screen at any height, no XP on it", async ({ page }) => {
  for (const missionNumber of [2, 8, 4]) {
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await page.setViewportSize({ width: 412, height: 800 });
    await openResult(page, missionNumber);
    const context = `Mission ${missionNumber}`;
    // The step's frame: back, step number, protected Help, every segment lit, the completion reward as the quiet label.
    await expect(page.getByRole("button", { name: "← Programme Home", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Protected Help / pause", exact: true })).toBeVisible();
    await expect(page.getByText(`Step ${missionStep(missionNumber)} of 10`, { exact: true })).toBeVisible();
    await expect(page.locator("[data-programme-step-count]")).toHaveText("+25 XP");
    expect(await page.locator("[data-programme-result] [aria-hidden] > i[data-on='true']").count(), `${context}: every segment lit`).toBe(3);
    await expect(page.getByRole("heading", { level: 1, name: titles[missionNumber - 1], exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { level: 2, name: "Review what you built, then finish the Mission." }).locator("em")).toHaveText("finish the Mission.");
    await expect(page.locator("main")).not.toContainText("The final step adds");
    // The card: the result's name, the brand mark and every row the result has.
    const card = page.locator("[data-programme-keepsake]");
    await expect(card).toContainText(results[missionNumber].title);
    await expect(card).toContainText("B4GAMBLE");
    await expect(card.locator("dl > div")).toHaveCount(results[missionNumber].rows);
    await expect(card).toHaveCSS("background-color", "rgb(250, 250, 247)");
    await expect(card).toHaveCSS("color", "rgb(16, 15, 15)");
    await expect(card).not.toContainText("Unavailable");
    // The finish press: pinned, without XP, on screen at every height.
    await expect(finish(page)).toBeEnabled();
    await expect(finish(page)).not.toContainText("XP");
    for (const viewport of [{ width: 412, height: 640 }, { width: 412, height: 800 }, { width: 320, height: 640 }]) {
      await page.setViewportSize(viewport);
      const box = await finish(page).boundingBox();
      expect(box!.y, `${context}: the finish press is on screen at ${viewport.width}×${viewport.height}`).toBeGreaterThanOrEqual(0);
      expect(box!.y + box!.height, `${context}: the finish press is on screen at ${viewport.width}×${viewport.height}`).toBeLessThanOrEqual(viewport.height);
      const geometry = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth, smallest: Math.min(...Array.from(document.querySelectorAll<HTMLElement>("main *")).filter((element) => element.checkVisibility() && Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim())).map((element) => Number.parseFloat(getComputedStyle(element).fontSize))) }));
      expect(geometry.document, `${context}: no sideways scroll at ${viewport.width}px`).toBeLessThanOrEqual(geometry.viewport + 1);
      expect(geometry.smallest, `${context}: text at ${viewport.width}px`).toBeGreaterThanOrEqual(12);
    }
  }
});

test("a long value takes the whole width of the card and the person's own sentence leads it", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await openResult(page, 2, { wording: "For seven days I pause for ten minutes before one decision." });
  const card = page.locator("[data-programme-keepsake]");
  await expect(card.locator("blockquote")).toHaveText("For seven days I pause for ten minutes before one decision.");
  expect(await card.locator("blockquote").evaluate((element) => getComputedStyle(element).fontStyle)).toBe("italic");
  // The research checklist has lists for values: those rows take both columns, the short one keeps one.
  await page.unrouteAll({ behavior: "ignoreErrors" });
  await openResult(page, 8);
  await expect(card.locator("blockquote")).toHaveCount(0);
  const widths = await card.locator("dl > div").evaluateAll((rows) => rows.map((row) => ({ wide: row.hasAttribute("data-wide"), width: row.getBoundingClientRect().width, long: (row.querySelector("dd")?.textContent ?? "").length > 26 || (row.querySelector("dt")?.textContent ?? "").split(/\s+/).some((word) => word.length > 14) })));
  for (const row of widths) expect(row.wide).toBe(row.long);
  expect(widths.filter((row) => row.wide).length).toBeGreaterThanOrEqual(1);
  expect(widths.filter((row) => !row.wide).length).toBeGreaterThanOrEqual(1);
  const narrow = Math.min(...widths.map((row) => row.width));
  for (const row of widths.filter((item) => item.wide)) expect(row.width).toBeGreaterThan(narrow * 1.8);
});

test("the flow is unchanged: Complete Mission, the completion screen with the reward once, then the Programme home", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 800 });
  const posts = await openResult(page, 2);
  posts.length = 0;
  await finish(page).click();

  const completion = page.locator('[data-programme-completion="fresh"]');
  await expect(completion).toBeVisible();
  await expect(completion.getByText("Step 2 done", { exact: true })).toBeVisible();
  await expect(completion.getByRole("heading", { level: 1, name: "MY 7-DAY GOAL" })).toBeVisible();
  await expect(completion.getByText("You built it yourself. It is yours, not ours.", { exact: true })).toBeVisible();
  await expect(completion.locator("[data-programme-keepsake] dl > div")).toHaveCount(4);
  // The reward, once, with the server's numbers; ten dots, two lit, the new one marked.
  await expect(completion.locator("[data-programme-step-reward]")).toHaveText("+25 XP · 2 of 10 steps");
  await expect(completion.locator("[data-programme-step-cta] [aria-hidden] > i")).toHaveCount(10);
  await expect(completion.locator("[data-programme-step-cta] [aria-hidden] > i[data-on='true']")).toHaveCount(2);
  await expect(completion.locator("[data-programme-step-cta] [aria-hidden] > i[data-new]")).toHaveCount(1);
  expect((await completion.innerText()).match(/25/g)?.length, "the reward is said once").toBe(1);
  // The three lines that repeated it are gone, and the mockup's two buttons that change the flow are not here.
  for (const gone of ["Your result is ready and the completion reward has been added.", "Mission complete. 25 XP earned.", "The final step adds", "MISSION COMPLETE", "Next step"]) await expect(page.locator("main")).not.toContainText(gone);
  await expect(page.getByRole("button", { name: /Change/ })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  expect(posts, "one press, one request").toEqual(["/api/program/program-ai/missions/2/complete"]);

  // The way on is the same press to the same place.
  const home = page.getByRole("button", { name: "Continue from Programme Home", exact: true });
  const box = await home.boundingBox();
  expect(box!.y + box!.height, "the way on is on screen").toBeLessThanOrEqual(800);
  await home.click();
  await expect(page.locator('[data-programme-phase="home"]')).toBeVisible();
  await expect(page.locator("[data-programme-step-frame]")).toHaveCount(0);
});

test("Save as image gives a PNG of the card, made on the device", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  const posts = await openResult(page, 2, { wording: "For seven days I pause for ten minutes before one decision." });
  await finish(page).click();
  await expect(page.locator('[data-programme-completion="fresh"]')).toBeVisible();
  posts.length = 0;
  const requests: string[] = [];
  page.on("request", (request) => { if (!request.url().startsWith("blob:")) requests.push(request.url()); });
  const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Save as image", exact: true }).click()]);
  expect(download.suggestedFilename()).toBe("b4gamble-step-2.png");
  const bytes = readFileSync(await download.path());
  expect(bytes.subarray(0, 8).toString("hex"), "a PNG").toBe("89504e470d0a1a0a");
  // Width and height from the PNG header: three device pixels per CSS pixel of a 412px card page.
  expect(bytes.readUInt32BE(16)).toBe(1236);
  expect(bytes.readUInt32BE(20)).toBeGreaterThan(900);
  expect(bytes.length).toBeGreaterThan(20_000);
  // Nothing left the device for it.
  expect(posts).toEqual([]);
  expect(requests.filter((url) => !/\/_next\/static\//.test(url))).toEqual([]);
  await expect(page.getByText("The image could not be saved.")).toHaveCount(0);
});

test("the research Mission's completion ends with the step itself: no research block and no casino link (Founder, 16 October 2026)", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await openResult(page, 8);
  await finish(page).click();
  const completion = page.locator('[data-programme-completion="fresh"]');
  await expect(completion.getByText("Step 3 done", { exact: true })).toBeVisible();
  await expect(completion.locator("[data-programme-keepsake]")).toBeVisible();
  await expect(page.locator("[data-programme-research-opened], [data-programme-research]")).toHaveCount(0);
  for (const text of ["NEW IN YOUR MENU", "PUT IT TO USE", "Casinos, bonuses and offers are now open to you", "Research with your checklist"]) {
    await expect(page.getByText(text, { exact: true })).toHaveCount(0);
  }
  await expect(completion.locator('a[href*="/casinos"], a[href*="/casino/"], a[href*="/bonuses"], a[href*="/best-offers"], a[href*="/compare"], a[href*="/bonus-guide"], a[href*="/wagering-calculator"], a[href^="/r/"], a[href^="/go/"]')).toHaveCount(0);
  // The menu on the same page keeps its guide links: finishing the step opens nothing.
  await expect.poll(() => page.locator('nav[aria-label="Primary navigation"] [data-navigation-href]').evaluateAll((links) => links.map((link) => link.getAttribute("data-navigation-href"))), { timeout: 15_000 }).toEqual(["/10-steps", "/learn", "/help"]);
  expect((await page.context().cookies()).find((cookie) => cookie.name === "b4g_research_access")).toBeUndefined();
  const geometry = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(geometry.document).toBeLessThanOrEqual(geometry.viewport + 1);
});
