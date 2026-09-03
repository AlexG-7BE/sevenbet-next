import { expect, test, type Page } from "@playwright/test";

import type {
  ProgramAiHome,
  ProgramAiMission,
} from "../components/programme/ProgramAiAuthenticated.types";
import {
  programmeMissionCopy,
  programmeText,
  type ProgrammeMessageKey,
} from "../lib/i18n/programme-catalog";
import { publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { marketProfileByCountry, publicMarketPath } from "../lib/market/registry";
import {
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
} from "../lib/programme/access-contract";
import {
  programAiMissionRegistry,
  programAiMissionSourcePresentation,
  type ProgramAiMissionNumber,
} from "../lib/programme/program-ai/mission-registry";
import {
  PROGRAMME_LOCALES,
  PROGRAMME_ROUTES,
  programmeHelpPath,
  programmePath,
  type ProgrammeLocale,
} from "../lib/programme/presentation";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const unresolvedToken = /\{[a-z][a-z0-9_-]*(?:,[^{}]+)?\}/i;
const userId = "programme-internationalisation-browser-user";
const userStartingPoint = "USER-OWNED STARTING POINT — keep this exact wording in every language.";

function t(locale: ProgrammeLocale, key: ProgrammeMessageKey, values: Readonly<Record<string, string | number>> = {}) {
  return programmeText(locale, key, values);
}

async function assertRenderedQuality(page: Page, context: string) {
  const visibleText = await page.locator("main").innerText();
  expect(visibleText, `${context}: unresolved interpolation token`).not.toMatch(unresolvedToken);
  const geometry = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    clippedControls: Array.from(document.querySelectorAll<HTMLElement>("main button, main [role='button'], main input, main textarea"))
      .filter((element) => {
        const style = getComputedStyle(element);
        if (style.display === "none" || style.visibility === "hidden") return false;
        const rect = element.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        return rect.left < -1 || rect.right > window.innerWidth + 1;
      })
      .slice(0, 8)
      .map((element) => element.outerHTML.slice(0, 160)),
  }));
  expect(geometry.documentWidth, `${context}: horizontal overflow`).toBeLessThanOrEqual(geometry.viewportWidth + 1);
  expect(geometry.clippedControls, `${context}: clipped interactive control`).toEqual([]);
}

async function assertNoRepresentativeEnglishLeakage(
  page: Page,
  locale: ProgrammeLocale,
  keys: readonly ProgrammeMessageKey[],
) {
  if (locale === "en-GB") return;
  const visibleText = await page.locator("main").innerText();
  for (const key of keys) {
    if (t(locale, key) !== key) expect(visibleText, `${locale}: leaked source copy ${key}`).not.toContain(key);
  }
}

async function installAnonymousProgramme(
  page: Page,
  locale: ProgrammeLocale,
  turnLocales: ProgrammeLocale[],
) {
  const createdAt = Date.now();
  let sessionRequests = 0;
  await page.route("**/api/auth/get-session", async (route) => {
    sessionRequests += 1;
    if (sessionRequests === 1) await new Promise((resolve) => setTimeout(resolve, 120));
    await route.fulfill({ status: 200, contentType: "application/json", body: "null" });
  });
  await page.route("**/api/programme-access/authority", async (route) => {
    const body = route.request().postDataJSON() as { journeyId: string };
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        authority: {
          version: 1,
          intent: "PROGRAMME_ACCESS",
          purpose: "PROGRAMME_AUTH_ACCESS",
          journeyId: body.journeyId,
          createdAt,
          expiresAt: createdAt + 3_600_000,
          termsVersion: PROGRAMME_TERMS_VERSION,
          privacyVersion: PROGRAMME_PRIVACY_VERSION,
          adultConfirmedAt: createdAt,
          termsAcceptedAt: createdAt,
          privacyAcknowledgedAt: createdAt,
          proof: "pa1.programme.browser",
        },
      }),
    });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({
    status: 201,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }),
  }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, authority: { active: true } }),
  }));
  await page.route("**/api/program/program-ai/turn", async (route) => {
    const body = route.request().postDataJSON() as { locale: ProgrammeLocale; situation: string };
    turnLocales.push(body.locale);
    expect(body.locale).toBe(locale);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        result: {
          kind: "STARTING_POINT_CANDIDATE",
          candidate: {
            startingPoint: `${t(locale, "Starting Point")}: ${body.situation}`,
            desiredChange: t(locale, "Build more control around the situation described here."),
            broadContext: "NOT_SPECIFIED",
            continuationCue: t(locale, "Continue from the situation described in Mission 01."),
          },
          disposition: locale === "el-GR" ? "SUPPORT_FIRST" : "CONTINUE",
        },
        progress: { taskStates: ["situation_described"], xpPreview: 20 },
      }),
    });
  });
  await page.route("**/api/program/program-ai/support/continue", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true }),
  }));
}

function homeFixture(missionNumber: ProgramAiMissionNumber): ProgramAiHome {
  const now = "2026-08-31T10:00:00.000Z";
  return {
    totalXp: 215,
    activeDays: 4,
    currentStreak: 2,
    achievements: [
      { slug: "first-plan", title: "First Plan", state: "earned", awardedAt: now },
      { slug: "boundary-built", title: "Boundary Built", state: "locked", awardedAt: null },
    ],
    currentMission: missionNumber,
    primaryAction: "resume-mission",
    engagementDayBucket: "day_8_plus",
    currentAction: programAiMissionRegistry[missionNumber - 2].actions[0].id,
    startingPoint: {
      startingPoint: userStartingPoint,
      desiredChange: "USER-OWNED DESIRED CHANGE",
      broadContext: "NOT_SPECIFIED",
      continuationCue: "USER-OWNED CONTINUATION CUE",
    },
    missions: Array.from({ length: 10 }, (_, index) => {
      const number = index + 1;
      return {
        missionNumber: number,
        title: number === 1 ? "Map the moment" : programAiMissionSourcePresentation(number as ProgramAiMissionNumber).title,
        status: number < missionNumber ? "completed" as const : number === missionNumber ? "current" as const : "locked" as const,
        actionsCompleted: number < missionNumber ? (number === 1 ? 2 : 3) : number === missionNumber ? 1 : 0,
        actionsTotal: number === 1 ? 2 : 3,
        xpEarnedHere: number < missionNumber ? (number === 1 ? 40 : 75) : number === missionNumber ? 15 : 0,
        completionBonus: number === 1 ? 0 : 25,
      };
    }),
    reviews: [
      { milestone: "first", unlockMission: 3, title: "First Personal Review", maxWords: 250, status: missionNumber > 3 ? "available" : "locked" },
      { milestone: "mid", unlockMission: 6, title: "Mid-Programme Personal Review", maxWords: 300, status: missionNumber > 6 ? "available" : "locked" },
      { milestone: "full", unlockMission: 10, title: "Full Programme Personal Review", maxWords: 450, status: "locked" },
    ],
    nextReview: { milestone: "full", unlockMission: 10, title: "Full Programme Personal Review", xpRemaining: 500, missionsRemaining: 10 - missionNumber },
    discoveryLinks: [
      { href: "/casinos", label: "Compare casinos" },
      { href: "/bonuses", label: "Bonuses" },
      { href: "/best-offers", label: "Best offers" },
    ],
  };
}

function missionFixture(missionNumber: ProgramAiMissionNumber, actionIndex: number | null): ProgramAiMission {
  const definition = programAiMissionRegistry[missionNumber - 2];
  const source = programAiMissionSourcePresentation(missionNumber);
  const current = actionIndex === null ? null : definition.actions[actionIndex];
  const artifact: ProgramAiMission["artifact"] = {};
  if (current?.id === "commit_pause_rule") artifact.decisionChecks = ["purpose", "terms", "exit"];
  if (["rehearse_response", "build_fallback_response"].includes(current?.id ?? "")) artifact.scenarioType = "unclear_terms";
  if (["build_friction_stack", "rehearse_bypass"].includes(current?.id ?? "")) artifact.frictionMethods = ["bank_block"];
  return {
    missionNumber,
    stepId: `programme-mission-${missionNumber}`,
    title: source.title,
    purpose: source.purpose,
    status: "in_progress",
    actions: definition.actions.map((action, index) => ({
      id: action.id,
      label: source.actionLabel(action.id),
      xp: action.xp,
      completed: actionIndex === null || index < actionIndex,
    })),
    currentAction: current?.id ?? null,
    currentActionPosition: actionIndex === null ? null : actionIndex + 1,
    actionsCompleted: actionIndex === null ? 3 : actionIndex,
    actionsTotal: 3,
    artifact,
    artifactVersion: definition.artifactVersion,
    xpEarnedHere: actionIndex === null ? 50 : actionIndex === 0 ? 0 : actionIndex === 1 ? 15 : 35,
    completionBonus: 25,
    completedAt: null,
    legacyCompletion: false,
    ...(missionNumber === 10 ? {
      programmeFacts: {
        startingPoint: {
          startingPoint: userStartingPoint,
          desiredChange: "USER-OWNED DESIRED CHANGE",
          broadContext: "NOT_SPECIFIED",
          continuationCue: "USER-OWNED CONTINUATION CUE",
        },
        facts: [{ missionNumber: 4, artifact: { boundaryCategory: "pause", executionMethod: "bank_block" } }],
      },
    } : {}),
  };
}

type AuthenticatedFixtureControl = {
  missionNumber: ProgramAiMissionNumber;
  actionIndex: number | null;
  homeError?: boolean;
  signedIn?: boolean;
};

async function installAuthenticatedProgramme(
  page: Page,
  control: AuthenticatedFixtureControl,
  guidanceLocales: ProgrammeLocale[],
) {
  const now = "2026-08-31T10:00:00.000Z";
  control.signedIn = true;
  await page.route("**/api/auth/get-session", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: control.signedIn ? JSON.stringify({
      session: { id: "programme-i18n-session", token: "fixture", userId, expiresAt: "2026-09-01T10:00:00.000Z", createdAt: now, updatedAt: now },
      user: { id: userId, name: "Programme QA", email: "programme-i18n@example.invalid", emailVerified: true, createdAt: now, updatedAt: now },
    }) : "null",
  }));
  await page.route("**/api/programme-access/authority", (route) => {
    if (route.request().method() === "GET") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, accepted: true }),
      });
    }
    const body = route.request().postDataJSON() as { journeyId?: string } | null;
    const createdAt = Date.parse(now);
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        accepted: true,
        ...(body?.journeyId ? {
          authority: {
            version: 1,
            intent: "PROGRAMME_ACCESS",
            purpose: "PROGRAMME_AUTH_ACCESS",
            journeyId: body.journeyId,
            createdAt,
            expiresAt: createdAt + 3_600_000,
            termsVersion: PROGRAMME_TERMS_VERSION,
            privacyVersion: PROGRAMME_PRIVACY_VERSION,
            adultConfirmedAt: createdAt,
            termsAcceptedAt: createdAt,
            privacyAcknowledgedAt: createdAt,
            proof: "pa1.programme.authenticated-browser",
          },
        } : {}),
      }),
    });
  });
  await page.route("**/api/program/program-ai/home", (route) => control.homeError
    ? route.fulfill({ status: 503, contentType: "application/json", body: JSON.stringify({ ok: false, code: "UNAVAILABLE", error: "INTERNAL ENGLISH MUST NOT RENDER" }) })
    : route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, home: homeFixture(control.missionNumber) }) }));
  await page.route("**/api/program/program-ai/reviews/*", (route) => {
    const locale = new URL(route.request().url()).searchParams.get("locale") as ProgrammeLocale;
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, review: {
        kind: "review",
        operation: "REVIEW_M3",
        title: t(locale, "First Personal Review"),
        sections: [{ id: "progress", title: t(locale, "HERE’S WHAT YOU’VE BUILT"), body: t(locale, "Review only the confirmed parts of your Programme; add nothing that is missing.") }],
        generation: "deterministic_fallback",
      } }),
    });
  });
  await page.route("**/api/program/program-ai/missions/**", async (route) => {
    const url = new URL(route.request().url());
    const locale = (route.request().postDataJSON() as { locale?: ProgrammeLocale } | null)?.locale;
    if (url.pathname.endsWith("/guidance")) {
      if (locale) guidanceLocales.push(locale);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ok: true, guidance: {
          kind: "guidance",
          operation: "PROGRAMME_GUIDANCE",
          title: t(locale ?? "en-GB", "A small seven-day experiment"),
          summary: t(locale ?? "en-GB", "Choose a direction, not a promise of a perfect week."),
          options: [
            { id: "pause_and_check", text: t(locale ?? "en-GB", "Pause before one decision") },
            { id: "leave_and_return", text: t(locale ?? "en-GB", "Leave and return later") },
          ],
          generation: "deterministic_fallback",
        } }),
      });
      return;
    }
    if (url.pathname.endsWith("/complete")) {
      const mission = { ...missionFixture(control.missionNumber, null), status: "completed", completedAt: now };
      const home = homeFixture(control.missionNumber);
      const unlockedReview = home.reviews.find((review) => review.unlockMission === control.missionNumber);
      if (unlockedReview) unlockedReview.status = "available";
      await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, mission, home, xpAwarded: 25 }) });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, mission: missionFixture(control.missionNumber, control.actionIndex) }),
    });
  });
  await page.route("**/api/program/session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.route("**/api/auth/sign-out", (route) => {
    control.signedIn = false;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true }) });
  });
}

test("all 11 Programme routes render localized anonymous, access, voice, text, support and registration states", async ({ browser }) => {
  test.setTimeout(180_000);
  const turnLocales: ProgrammeLocale[] = [];
  for (const [index, route] of PROGRAMME_ROUTES.entries()) {
    const mobile = index % 2 === 1;
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile });
    const page = await context.newPage();
    await installAnonymousProgramme(page, route.locale, turnLocales);
    const response = await page.goto(`${baseUrl}${route.path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), route.path).toBe(200);
    expect(response?.headers()["permissions-policy"], route.path).toBe("camera=(), microphone=(self), geolocation=(), payment=(), usb=()");
    await expect(page.locator("html")).toHaveAttribute("lang", route.locale);
    await expect(page.locator('[data-programme-presentation="loading"]')).toBeVisible();
    await expect(page.locator('[data-programme-presentation="access"]')).toBeVisible();
    await expect(page.getByRole("heading", { name: t(route.locale, "Two checks before you begin.") })).toBeVisible();
    await expect(page.locator(`[data-programme-presentation="access"] a[href="${programmeHelpPath(route.locale)}"]`).first()).toBeVisible();
    await assertNoRepresentativeEnglishLeakage(page, route.locale, ["Two checks before you begin.", "I confirm I am 18 or over", "Enter Mission 01"]);
    await assertRenderedQuality(page, `${route.locale}:access:${mobile ? "mobile" : "desktop"}`);

    const adult = page.getByRole("checkbox", { name: new RegExp(t(route.locale, "I confirm I am 18 or over")) });
    await adult.focus();
    await expect(adult).toBeFocused();
    await adult.check();
    await page.getByRole("checkbox", { name: new RegExp(t(route.locale, "I agree to the Terms and confirm I have read the Privacy Notice")) }).check();
    await page.getByRole("button", { name: t(route.locale, "Enter Mission 01") }).click();
    await expect(page.locator('[data-programme-presentation="mission-01-intake"]')).toBeVisible();
    await page.getByRole("checkbox", { name: t(route.locale, "I explicitly consent to B4GAMBLE processing what I type or say, including information that may reveal my health, and sending it to its AI and transcription provider to personalise my Programme.") }).check();
    await expect(page.getByRole("button", { name: t(route.locale, "Tap to speak") })).toBeEnabled();
    await page.getByRole("button", { name: t(route.locale, "I'd rather type") }).click();
    const textarea = page.getByRole("textbox", { name: t(route.locale, "Your situation") });
    const submit = page.getByRole("button", { name: t(route.locale, "Create my Starting Point") });
    await expect(submit).toBeDisabled();
    await textarea.fill(`USER-OWNED-${route.locale} narrative remains verbatim in this browser session.`);
    await expect(submit).toBeEnabled();
    await submit.click();
    if (route.locale === "el-GR") {
      await expect(page.locator('[data-programme-presentation="support-first"]')).toBeVisible();
      await expect(page.locator("main")).toContainText(/[\u0370-\u03ff]/);
      await page.getByRole("button", { name: t(route.locale, "Continue when I'm ready") }).click();
    }
    await expect(page.locator('[data-programme-presentation="starting-point-ready"]')).toBeVisible();
    await expect(page.getByRole("button", { name: t(route.locale, "Use email instead") })).toBeVisible();
    await assertNoRepresentativeEnglishLeakage(page, route.locale, ["Your Starting Point, in your words.", "Use email instead", "Withdraw consent and clear this draft"]);
    await assertRenderedQuality(page, `${route.locale}:registration:${mobile ? "mobile" : "desktop"}`);
    await context.close();
  }
  expect(turnLocales).toEqual(PROGRAMME_LOCALES);
});

test("ordinary pages retain deny-all capabilities while localized public Programme entries keep their canonical locale", async ({ request }) => {
  test.setTimeout(180_000);
  const denied = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";
  for (const ordinaryPath of ["/", "/de", "/es/learn", "/fi/10-steps", "/help"]) {
    const response = await request.get(`${baseUrl}${ordinaryPath}`);
    expect(response.status(), ordinaryPath).toBe(200);
    expect(response.headers()["permissions-policy"], ordinaryPath).toBe(denied);
  }

  for (const route of PROGRAMME_ROUTES) {
    const market = marketProfileByCountry(route.marketCode);
    expect(market, route.marketCode).not.toBeNull();
    const homePath = publicMarketPath(market!, route.locale, "/");
    const prefix = homePath;
    for (const pathname of [homePath, `${prefix}/10-steps`, `${prefix}/learn`]) {
      const response = await request.get(`${baseUrl}${pathname}`);
      expect(response.status(), pathname).toBe(200);
      const html = await response.text();
      const hrefs = [...html.matchAll(/href="([^"]*\/program(?:\?entry=start)?)"/g)].map((match) => match[1]);
      expect(hrefs.length, `${pathname} should render at least one Programme entry`).toBeGreaterThan(0);
      expect(hrefs.every((href) => href === route.path || href === `${route.path}?entry=start`), `${pathname}: ${hrefs.join(", ")}`).toBe(true);
    }
    if (route.locale !== "en-GB") {
      const response = await request.get(`${baseUrl}${homePath}`);
      const html = await response.text();
      expect(html, `${prefix}/ localized login return target`).toContain(`/login?returnTo=${encodeURIComponent(route.path)}`);
    }
  }
});

test("the Programme selector exposes exactly 11 direct routes and preserves one anonymous subject and local narrative", async ({ page }) => {
  const localeRequests: ProgrammeLocale[] = [];
  let publicPresentationPosts = 0;
  await installAnonymousProgramme(page, "en-GB", localeRequests);
  page.on("request", (request) => {
    if (request.method() === "POST" && new URL(request.url()).pathname === "/api/presentation") publicPresentationPosts += 1;
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(`${baseUrl}/program?auth=google-error&error=account_not_linked&private=discard-me`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-programme-presentation="access"]')).toBeVisible();
  const journey = await page.evaluate(() => window.sessionStorage.getItem("sevenbet.programme.journey.v2"));
  expect(journey).toBeTruthy();
  const contentKey = `sevenbet.programme.local-content.v2:journey:${encodeURIComponent(journey!)}`;
  const localNarrative = "USER-OWNED LOCAL NARRATIVE — byte-for-byte stable";
  await page.evaluate(({ key, value }) => window.sessionStorage.setItem(key, value), { key: contentKey, value: localNarrative });

  for (const route of PROGRAMME_ROUTES) {
    const selector = page.locator("[data-programme-language-selector]:visible");
    const messages = publicShellMessages((await page.locator("html").getAttribute("lang")) as ProgrammeLocale);
    await selector.getByRole("button", { name: messages.changeMarketAndLanguage }).click();
    await expect(selector.getByRole("menuitemradio")).toHaveCount(11);
    await selector.locator(`a[href^="${route.path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`${route.path.replaceAll("/", "\\/")}(?:\\?auth=google-error&error=account_not_linked)?$`));
    await expect(page.locator("html")).toHaveAttribute("lang", route.locale);
    expect(await page.evaluate(() => window.sessionStorage.getItem("sevenbet.programme.journey.v2"))).toBe(journey);
    expect(await page.evaluate((key) => window.sessionStorage.getItem(key), contentKey)).toBe(localNarrative);
    await expect(page).not.toHaveURL(/private=discard-me/);
  }
  expect(publicPresentationPosts).toBe(0);
});

test("all Missions and every action render interactively across the 11-locale desktop/mobile matrix", async ({ page }) => {
  test.setTimeout(180_000);
  const control: AuthenticatedFixtureControl = { missionNumber: 2, actionIndex: 0 };
  const guidanceLocales: ProgrammeLocale[] = [];
  await installAuthenticatedProgramme(page, control, guidanceLocales);
  const coveredLocales = new Set<ProgrammeLocale>();
  const coveredMissions = new Set<number>([1]);
  const coveredActions = new Set<string>();
  const guidanceActionLabels: Readonly<Record<string, ProgrammeMessageKey>> = {
    build_7_day_goal: "Create personal drafts",
    name_early_signal: "Show one possible pattern",
    build_boundary_rule: "Create personal drafts",
    build_friction_stack: "Suggest an order",
    build_support_card: "Create personal drafts",
    rehearse_response: "Create my rehearsal",
    choose_review_cadence: "Build my plan",
  };
  const guidanceBuilderActions = new Set([
    "build_7_day_goal",
    "build_boundary_rule",
    "build_friction_stack",
    "build_support_card",
    "rehearse_response",
    "choose_review_cadence",
  ]);
  let matrixIndex = 0;

  for (const mission of programAiMissionRegistry) {
    coveredMissions.add(mission.missionNumber);
    for (const [actionIndex, action] of mission.actions.entries()) {
      const locale = PROGRAMME_LOCALES[matrixIndex % PROGRAMME_LOCALES.length];
      const mobile = matrixIndex % 2 === 0;
      matrixIndex += 1;
      coveredLocales.add(locale);
      coveredActions.add(action.id);
      control.missionNumber = mission.missionNumber;
      control.actionIndex = actionIndex;
      control.homeError = false;
      await page.setViewportSize(mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 });
      await page.goto(`${baseUrl}${programmePath(locale)}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
      await expect(page.getByText(userStartingPoint, { exact: true })).toBeVisible();
      await page.getByRole("button", { name: t(locale, "Resume mission"), exact: true }).click();
      const workspace = page.locator(`[data-programme-action="${action.id}"]`);
      await expect(workspace).toBeVisible();
      await expect(page.getByRole("heading", { name: programmeMissionCopy(locale, mission.missionNumber).title, exact: true })).toBeVisible();
      await expect(workspace).toContainText(t(locale, "ACTION {position} · +{xp} XP", { position: actionIndex + 1, xp: action.xp }));
      const firstChoice = workspace.locator("input:not([disabled])").first();
      if (await firstChoice.count()) await firstChoice.check();
      if (action.id === "map_urge_sequence") {
        await workspace.getByRole("button", { name: t(locale, "Check sequence · +{xp} XP when correct", { xp: action.xp }) }).click();
        await expect(workspace).toContainText(t(locale, "No XP awarded. Adjust the order and try again."));
      }
      const guidanceLabel = guidanceActionLabels[action.id];
      if (guidanceLabel) {
        await workspace.getByRole("button", { name: t(locale, guidanceLabel) }).click();
        if (guidanceBuilderActions.has(action.id)) {
          await expect(workspace.locator("[aria-pressed]").first()).toBeVisible();
        } else {
          await expect(workspace).toContainText(t(locale, "USEFUL INSIGHT"));
        }
        expect(guidanceLocales.at(-1)).toBe(locale);
      }
      const focusTarget = workspace.locator("button:not([disabled]), input:not([disabled]), textarea:not([disabled])").first();
      await focusTarget.focus();
      await expect(focusTarget).toBeFocused();
      await assertNoRepresentativeEnglishLeakage(page, locale, ["Programme Home", "Protected Help / pause", "Confirm action · +{xp} XP"]);
      await assertRenderedQuality(page, `${locale}:M${mission.missionNumber}:${action.id}:${mobile ? "mobile" : "desktop"}`);
    }
  }

  expect([...coveredLocales]).toEqual(PROGRAMME_LOCALES);
  expect([...coveredMissions].sort((left, right) => left - right)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  expect([...coveredActions].sort()).toEqual(programAiMissionRegistry.flatMap((mission) => mission.actions.map((action) => action.id)).sort());
});

test("localized completion, Review, unavailable, not-found and logout states remain bounded", async ({ page }) => {
  test.setTimeout(180_000);
  const locale: ProgrammeLocale = "de-DE";
  const control: AuthenticatedFixtureControl = { missionNumber: 3, actionIndex: null };
  await installAuthenticatedProgramme(page, control, []);
  await page.goto(`${baseUrl}${programmePath(locale)}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
  await page.getByRole("button", { name: t(locale, "Resume mission"), exact: true }).click();
  await page.getByRole("button", { name: t(locale, "Complete Mission · +{xp} XP", { xp: 25 }) }).click();
  await expect(page.locator("main")).toContainText(t(locale, "MISSION COMPLETE"));
  await expect(page.locator("main")).toContainText(t(locale, "Your result is ready and the completion reward has been added."));
  await assertRenderedQuality(page, `${locale}:completion`);

  await page.getByRole("button", { name: t(locale, "Continue from Programme Home") }).click();
  await page.getByRole("button", { name: t(locale, "Open review") }).first().click();
  await expect(page.getByRole("heading", { name: t(locale, "First Personal Review") })).toBeVisible();
  await assertRenderedQuality(page, `${locale}:review`);

  control.homeError = true;
  await page.goto(`${baseUrl}${programmePath(locale)}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-programme-presentation="unavailable"]')).toBeVisible();
  await expect(page.locator("main")).toContainText(t(locale, "Programme home unavailable"));
  await expect(page.locator("main")).not.toContainText("INTERNAL ENGLISH MUST NOT RENDER");
  control.homeError = false;

  for (const route of PROGRAMME_ROUTES) {
    const response = await page.goto(`${baseUrl}${route.path}/missing`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), `${route.path}/missing`).toBe(404);
    await expect(page.locator("html")).toHaveAttribute("lang", route.locale);
    await expect(page.getByRole("heading", { name: t(route.locale, "This Programme page is unavailable.") })).toBeVisible();
  }

  await page.goto(`${baseUrl}${programmePath(locale)}`, { waitUntil: "domcontentloaded" });
  await expect(page.locator('[data-programme-presentation="dashboard"]')).toBeVisible();
  await page.getByRole("button", { name: t(locale, "Log out of B4GAMBLE") }).click();
  await expect(page).toHaveURL(programmePath(locale));
  await expect(page.locator('[data-programme-presentation="access"]')).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", locale);
});

test("Italian Programme availability does not confer ordinary second-wave publication authority", async ({ page }) => {
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  const programme = await page.goto(`${baseUrl}/it/program`, { waitUntil: "domcontentloaded" });
  expect(programme?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "it-IT");
  await expect(page.locator('[data-runtime-renderer="programme"]')).toBeVisible();

  const publicHome = await page.goto(`${baseUrl}/it/`, { waitUntil: "domcontentloaded" });
  expect(publicHome?.status()).toBe(200);
  await expect(page.locator('[data-runtime-renderer="programme"]')).toHaveCount(0);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
});
