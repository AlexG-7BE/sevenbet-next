import { expect, test, type Page, type Route } from "@playwright/test";

import { programmeMissionCopy } from "../lib/i18n/programme-catalog";
import { missionStep, programmeJourney } from "../lib/programme/program-ai/mission-registry";
import { programmeHelpPath } from "../lib/programme/presentation";

// Founder, 13 October 2026: the question screen of a step. Top bar (back, step number, protected
// Help), progress inside the step, the question in two voices, option cards with a line under each,
// and one pinned button without XP. Every API answer here is a page-level mock: rewards, order and
// completion stay the server's, and the spec only decides what that server says.

const now = new Date().toISOString();
const userId = "question-screen-user";
const titles = Array.from({ length: 10 }, (_, index) => programmeMissionCopy("en-GB", index + 1).title);
const ACID = "rgb(228, 226, 78)";

function homeAt(missionNumber: number) {
  const current = missionStep(missionNumber);
  return {
    totalXp: 110, activeDays: 3, currentStreak: 2,
    achievements: [{ slug: "first-plan", title: "First Plan", state: "earned", awardedAt: now }],
    currentMission: missionNumber, primaryAction: "start-mission", engagementDayBucket: "day_2_3", currentAction: null,
    startingPoint: { startingPoint: "I open betting apps after difficult work days.", desiredChange: "Pause before opening an app", broadContext: "WORK", continuationCue: "Continue from the after-work pause", chosenBoundaryAction: "Put the phone in another room" },
    currentStep: current,
    missions: programmeJourney.map((number, index) => ({ missionNumber: number, step: index + 1, title: titles[number - 1], status: index + 1 < current ? "completed" : index + 1 === current ? "current" : "locked", actionsCompleted: index + 1 < current ? 3 : 0, actionsTotal: 3, xpEarnedHere: index + 1 < current ? 75 : 0, completionBonus: 25 })),
    reviews: [{ milestone: "first", unlockMission: 3, unlockStep: 4, title: "First review", maxWords: 60, status: "locked" }],
    nextReview: null,
  };
}

const missionTwo = {
  missionNumber: 2, step: missionStep(2), stepId: "goal", title: titles[1], purpose: "", status: "current",
  actions: [
    { id: "choose_direction", label: "Choose a direction", xp: 15, completed: false },
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
  artifact: { direction: "pause" }, xpEarnedHere: 15,
};
// Step 3, "Know who to turn to", at its last question: two or three moves for the first 10 minutes.
const missionEight = {
  missionNumber: 8, step: missionStep(8), stepId: "help", title: titles[7], purpose: "", status: "current",
  actions: [
    { id: "learn_comparison_signals", label: "Choose one person", xp: 15, completed: true },
    { id: "decode_offer_terms", label: "Choose one help service", xp: 20, completed: true },
    { id: "build_research_checklist", label: "Plan the first 10 minutes", xp: 15, completed: false },
  ],
  currentAction: "build_research_checklist", currentActionPosition: 3, actionsCompleted: 2, actionsTotal: 3,
  artifact: { trustedPerson: "friend", openingLine: "call_me", helpService: "phone" }, artifactVersion: "programme-ai-v1:mission-08", xpEarnedHere: 35, completionBonus: 25, completedAt: null, legacyCompletion: false, programmeFacts: null,
};
const drafts = {
  kind: "candidates", operation: "goal", title: "Three ways to word it", summary: "Pick the wording closest to what you would do.",
  options: [
    { id: "draft-1", text: "For seven days I pause for ten minutes before one decision." },
    { id: "draft-2", text: "For seven days I wait until the evening before I decide." },
    { id: "draft-3", text: "For seven days I step away from the screen before one decision." },
  ],
  generation: "deterministic_fallback",
};

const json = (body: unknown, status = 200) => ({ status, contentType: "application/json", body: JSON.stringify(body) });

/** A signed-in person opens the current step; `onAction` answers each save. */
async function openStep(page: Page, mission: typeof missionTwo, onAction?: (route: Route) => Promise<void>) {
  const home = homeAt(mission.missionNumber);
  await page.route("**/api/auth/get-session**", (route) => route.fulfill(json({ session: { id: "question-screen-session", token: "visual", userId, expiresAt: new Date(Date.now() + 60_000).toISOString(), createdAt: now, updatedAt: now }, user: { id: userId, name: "Question screen", email: "question-screen@example.invalid", emailVerified: true, createdAt: now, updatedAt: now } })));
  await page.route("**/api/programme-access/authority", (route) => route.fulfill(json({ ok: true, accepted: true })));
  await page.route("**/api/program/program-ai/home", (route) => route.fulfill(json({ ok: true, home })));
  await page.route(`**/api/program/program-ai/missions/${mission.missionNumber}`, (route) => route.fulfill(json({ ok: true, mission })));
  await page.route(`**/api/program/program-ai/missions/${mission.missionNumber}/guidance`, (route) => route.fulfill(json({ ok: true, guidance: drafts })));
  await page.route(`**/api/program/program-ai/missions/${mission.missionNumber}/actions`, async (route) => {
    if (onAction) await onAction(route);
    else await route.fulfill(json({ ok: true, actionPosition: 1, xpAwarded: 15, mission: missionTwoAfterFirstAction, home: { ...home, totalXp: 125 } }));
  });
  await page.goto("/program");
  await expect(page.locator('[data-programme-phase="home"]')).toBeVisible();
  await page.getByRole("button", { name: "Start mission", exact: true }).click();
  await expect(page.locator('[data-programme-phase="mission"]')).toBeVisible();
  await expect(page.locator("[data-programme-step-frame]")).toBeVisible();
}

const continueButton = (page: Page) => page.getByRole("button", { name: "Continue", exact: true });

async function noHorizontalOverflow(page: Page, context: string) {
  const geometry = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: window.innerWidth }));
  expect(geometry.document, `${context}: no horizontal scroll`).toBeLessThanOrEqual(geometry.viewport + 1);
}

test("a step's question screen: back, step number, protected Help, question count and option cards", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await openStep(page, missionTwo);

  // The top bar of a step stands where the site header was on a phone.
  await expect(page.locator('[data-public-shell="header"]')).toBeHidden();
  await expect(page.locator("[data-programme-context-header]")).toBeHidden();
  const back = page.getByRole("button", { name: "← Programme Home", exact: true });
  const help = page.getByRole("link", { name: "Protected Help / pause", exact: true });
  await expect(back).toBeVisible();
  await expect(help).toBeVisible();
  await expect(help).toHaveAttribute("href", programmeHelpPath("en-GB"));
  for (const [name, control] of [["back", back], ["Help", help]] as const) {
    const box = await control.boundingBox();
    expect(box!.height, `${name} is a 44px target`).toBeGreaterThanOrEqual(44);
    expect(box!.width, `${name} is a 44px target`).toBeGreaterThanOrEqual(44);
  }
  // The step number a person sees, not the Mission's identity number; then the question inside it.
  await expect(page.getByText(`Step ${missionStep(2)} of 10`, { exact: true })).toBeVisible();
  await expect(page.locator("[data-programme-step-count]")).toHaveText("Question 1 of 3");
  await expect(page.locator("[data-programme-step-count]")).toHaveAttribute("data-programme-step-count", "question");

  // The Mission title is the eyebrow; the question is the headline, its tail in the serif voice.
  await expect(page.getByRole("heading", { level: 1, name: titles[1], exact: true })).toBeVisible();
  const headline = page.getByRole("heading", { level: 2, name: "What would be useful to practise for seven days?" });
  await expect(headline).toBeVisible();
  await expect(headline.locator("em")).toHaveText("for seven days?");
  await expect(page.getByText("Choose a direction, not a promise of a perfect week.")).toBeVisible();
  await expect(page.locator("[data-programme-why]")).toHaveText("Why we ask: a small goal lasts longer than a big promise.");

  // Six cards, each with its line; nothing chosen, so the button waits and says what is missing.
  const cards = page.locator("[data-programme-choice]");
  await expect(cards).toHaveCount(6);
  for (const card of await cards.all()) {
    const box = await card.boundingBox();
    expect(box!.height, "a card is at least 66px tall").toBeGreaterThanOrEqual(66);
    await expect(card.locator("small")).toBeVisible();
    await expect(card).toHaveCSS("border-radius", "16px");
  }
  await expect(cards.nth(1)).toContainText("Practise a pause");
  await expect(cards.nth(1)).toContainText("Wait a moment before you decide.");
  const button = continueButton(page);
  await expect(button).toBeDisabled();
  await expect(button).not.toContainText("XP");
  await expect(button).toHaveCSS("border-radius", "16px");
  await expect(page.locator("[data-programme-step-hint]")).toHaveText("Choose an answer to continue.");
  await expect(page.locator("[data-programme-action]")).not.toContainText("XP");

  // Text never under 12px, the button never under 14px, at every phone width without a sideways scroll.
  for (const width of [320, 360, 375, 390, 412, 430]) {
    await page.setViewportSize({ width, height: 800 });
    await noHorizontalOverflow(page, `${width}px`);
    const sizes = await page.evaluate(() => {
      const text = Array.from(document.querySelectorAll<HTMLElement>("main *")).filter((element) => element.checkVisibility() && Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()));
      return {
        smallest: Math.min(...text.map((element) => Number.parseFloat(getComputedStyle(element).fontSize))),
        buttons: Math.min(...Array.from(document.querySelectorAll<HTMLElement>("main button, main a")).filter((element) => element.textContent?.trim()).map((element) => Number.parseFloat(getComputedStyle(element).fontSize))),
        clipped: Array.from(document.querySelectorAll<HTMLElement>("main button, main a, main input")).filter((element) => { const rect = element.getBoundingClientRect(); return rect.width > 0 && (rect.left < -1 || rect.right > window.innerWidth + 1); }).length,
      };
    });
    expect(sizes.smallest, `text at ${width}px`).toBeGreaterThanOrEqual(12);
    expect(sizes.buttons, `controls at ${width}px`).toBeGreaterThanOrEqual(14);
    expect(sizes.clipped, `no clipped control at ${width}px`).toBe(0);
  }
});

test("a chosen card reacts at once; saving keeps the button's word with three dots; the server's XP shows briefly", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 800 });
  let release: () => void = () => undefined;
  const held = new Promise<void>((resolve) => { release = resolve; });
  const home = homeAt(2);
  await openStep(page, missionTwo, async (route) => {
    await held;
    await route.fulfill(json({ ok: true, actionPosition: 1, xpAwarded: 15, mission: missionTwoAfterFirstAction, home: { ...home, totalXp: 125 } }));
  });

  const pause = page.getByRole("radio", { name: "Practise a pause" });
  await pause.check();
  const chosen = page.locator('[data-programme-choice="selected"]');
  await expect(chosen).toHaveCount(1);
  await expect(chosen).toContainText("Practise a pause");
  await expect(chosen).toHaveCSS("border-top-color", ACID);
  await expect(chosen.locator("svg")).toHaveCSS("opacity", "1");
  expect(await chosen.evaluate((card) => getComputedStyle(card.querySelector("span")!).backgroundColor), "the tick is filled").toBe(ACID);
  expect(await page.locator('[data-programme-choice="idle"]').first().evaluate((card) => getComputedStyle(card).borderTopColor), "the others rest").not.toBe(ACID);
  const button = continueButton(page);
  await expect(button).toBeEnabled();
  await expect(page.locator("[data-programme-step-hint]")).toHaveCount(0);
  // Wording the Programme home already carries; nothing new is promised here.
  await expect(page.locator("[data-programme-privacy-cue]")).toHaveText("Your data is private. We never use it for offers or rankings.");

  await button.click();
  await expect(button).toBeDisabled();
  await expect(button).toHaveAttribute("aria-busy", "true");
  await expect(button).toHaveText("Continue");
  await expect(button.locator("[data-programme-saving-dots] i")).toHaveCount(3);
  await expect(page.getByText("Saving…")).toHaveCount(0);

  release();
  const count = page.locator("[data-programme-step-count]");
  await expect(count).toHaveAttribute("data-programme-step-count", "reward");
  await expect(count).toHaveText("+15 XP");
  await expect(page.locator('[data-programme-action="build_7_day_goal"]')).toBeVisible();
  // About two seconds later the label is the question count again, and no reward line is left under the new question.
  await expect(count).toHaveText("Question 2 of 3", { timeout: 4_000 });
  await expect(page.getByText("+15 XP")).toHaveCount(0);
  await expect(page.locator("main")).not.toContainText("Action complete");
  await expect(page.locator("main")).not.toContainText("XP earned");
  await expect.poll(() => page.evaluate(() => window.scrollY), { message: "the next question opens at its top" }).toBe(0);

  // Question 2: every press is still there, and the button says what is missing at each point.
  const hint = page.locator("[data-programme-step-hint]");
  await expect(continueButton(page)).toBeDisabled();
  await expect(hint).toHaveText("Choose an answer to continue.");
  await page.getByRole("radio", { name: "Pause before one decision" }).check();
  await expect(hint).toHaveText("Press “Create personal drafts” first.");
  await page.getByRole("button", { name: "Create personal drafts" }).click();
  const picker = page.getByRole("heading", { name: "Choose or edit the wording that fits" });
  await expect(picker).toBeVisible();
  await expect(hint).toHaveText("Choose one of the suggestions above.");
  // What opened after the press is brought on screen, clear of the pinned bar.
  await expect.poll(async () => {
    const [headingBox, barBox] = await Promise.all([picker.boundingBox(), page.locator("[data-programme-step-cta]").boundingBox()]);
    return headingBox!.y >= 0 && headingBox!.y + headingBox!.height <= barBox!.y;
  }, { message: "the drafts are in view above the bar" }).toBe(true);
  await page.locator("[aria-pressed]").nth(1).click();
  await expect(continueButton(page)).toBeEnabled();
});

test("multiple choice uses the same card and keeps its pick 2–3 rule", async ({ page }) => {
  await page.setViewportSize({ width: 412, height: 915 });
  await openStep(page, missionEight);

  await expect(page.getByText(`Step ${missionStep(8)} of 10`, { exact: true })).toBeVisible();
  await expect(page.getByRole("group", { name: "Your first 10 minutes · choose 2–3" })).toBeVisible();
  const cards = page.locator("[data-programme-choice]");
  await expect(cards).toHaveCount(6);
  await expect(page.getByRole("checkbox")).toHaveCount(6);
  const hint = page.locator("[data-programme-step-hint]");
  await expect(hint).toHaveText("choose 2–3");
  await page.getByRole("checkbox", { name: "Put the phone away" }).check();
  await expect(continueButton(page)).toBeDisabled();
  await page.getByRole("checkbox", { name: "Send my line to my person" }).check();
  await expect(page.locator('[data-programme-choice="selected"]')).toHaveCount(2);
  await expect(continueButton(page)).toBeEnabled();
  for (const card of await page.locator('[data-programme-choice="selected"]').all()) {
    await expect(card).toHaveCSS("border-top-color", ACID);
    expect((await card.boundingBox())!.height).toBeGreaterThanOrEqual(66);
  }
  // A fourth pick is not taken: the rule is the Mission's, unchanged.
  await page.getByRole("checkbox", { name: "Go outside or move" }).check();
  await page.getByRole("checkbox", { name: "Read my support card" }).click();
  await expect(page.locator('[data-programme-choice="selected"]')).toHaveCount(3);
});

// Step 3 at its second question: the kind of help, then the service that answers for it.
const missionEightHelpService = {
  ...missionEight,
  actions: missionEight.actions.map((action, index) => ({ ...action, completed: index < 1 })),
  currentAction: "decode_offer_terms", currentActionPosition: 2, actionsCompleted: 1,
  artifact: { trustedPerson: "friend", openingLine: "call_me" }, xpEarnedHere: 15,
};

test("step 3's help service card fits a phone: no sideways scroll, 44px call buttons, the urge line for a group", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStep(page, missionEightHelpService);
  await expect(page.getByRole("heading", { name: "Which kind of help would you try first?" })).toBeVisible();
  for (const [choice, service, urge] of [["Talk on the phone", "National Gambling Helpline", false], ["Join a group or see a counsellor", "NHS gambling clinics", true], ["Get help with money and debt", "StepChange", true]] as const) {
    await page.getByRole("radio", { name: new RegExp(choice) }).check();
    const card = page.locator("[data-programme-help-service]");
    await expect(card.getByRole("heading", { name: service, exact: true })).toBeVisible();
    await expect(card.getByText("When the urge comes", { exact: true })).toHaveCount(urge ? 1 : 0);
    await expect(card.locator("[data-programme-crisis-line]")).toContainText("Samaritans · 116 123");
    await expect(card.locator("a[data-programme-emergency-call]")).toHaveAttribute("href", "tel:999");
    for (const call of await card.locator("a[data-programme-help-call]").all()) {
      expect((await call.boundingBox())!.height, `${choice}: a call button is a 44px target`).toBeGreaterThanOrEqual(44);
    }
    await noHorizontalOverflow(page, choice);
  }
});

test("at the end of the list the last card is never under the pinned bar", async ({ page }) => {
  for (const viewport of [{ width: 412, height: 640 }, { width: 412, height: 800 }, { width: 390, height: 700 }, { width: 412, height: 915 }, { width: 320, height: 640 }]) {
    await page.setViewportSize(viewport);
    await page.unrouteAll({ behavior: "ignoreErrors" });
    await openStep(page, missionTwo);
    const context = `${viewport.width}×${viewport.height}`;
    const bar = page.locator("[data-programme-step-cta]");
    const button = continueButton(page);
    // While the list scrolls, the button stays on screen.
    const first = await button.boundingBox();
    expect(first!.y + first!.height, `${context}: the button is on the first screen`).toBeLessThanOrEqual(viewport.height);
    await page.evaluate(() => {
      const frame = document.querySelector("[data-programme-action]")!.getBoundingClientRect();
      window.scrollTo({ top: window.scrollY + frame.bottom - window.innerHeight, behavior: "instant" });
    });
    await expect.poll(async () => {
      const [cardBox, barBox, buttonBox] = await Promise.all([page.locator("[data-programme-choice]").last().boundingBox(), bar.boundingBox(), button.boundingBox()]);
      return cardBox!.y + cardBox!.height <= barBox!.y + 1 && buttonBox!.y + buttonBox!.height <= viewport.height + 1;
    }, { message: `${context}: the last card ends above the bar` }).toBe(true);
    await noHorizontalOverflow(page, context);
  }
});

test("on a wide screen the step keeps one centred column and the site header", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openStep(page, missionTwo);
  await expect(page.locator('[data-public-shell="header"]')).toBeVisible();
  await expect(page.locator("[data-programme-context-header]")).toBeVisible();
  const box = await page.locator("[data-programme-action]").boundingBox();
  expect(box!.width).toBeLessThanOrEqual(560);
  expect(Math.abs(box!.x + box!.width / 2 - 720), "the column is centred").toBeLessThanOrEqual(2);
  await expect(page.locator("[data-programme-choice]")).toHaveCount(6);
});
