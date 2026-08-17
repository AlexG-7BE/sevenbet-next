import { expect, test, type BrowserContext, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function visibleRiseState(page: Page, scope = "[data-handoff-page='home']") {
  return page.locator(`${scope} [data-rise]`).evaluateAll((elements) => elements.map((element) => {
    const style = getComputedStyle(element);
    return {
      opacity: Number(style.opacity),
      state: element.getAttribute("data-rise-state"),
      visibility: style.visibility,
    };
  }));
}

test("Home restores the handoff interaction contracts and reveals every designed element", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  const home = page.locator("[data-handoff-page='home']");
  await expect(home).toHaveAttribute("data-home-interactions", "ready");
  await expect(home.locator("[data-screen-label]")).toHaveCount(9);
  await expect(home.locator("[data-rise]")).toHaveCount(11);
  await expect(home.locator("[data-tphoto]")).toHaveCount(4);
  await expect(home.locator("[data-stackpanel]")).toHaveCount(3);
  await expect(home.locator("[data-snap]")).toHaveCount(9);

  const firstPhoto = home.locator("[data-tphoto]").first();
  const before = await firstPhoto.evaluate((element) => getComputedStyle(element).transform);
  await page.mouse.move(1380, 820);
  await page.waitForTimeout(450);
  const after = await firstPhoto.evaluate((element) => getComputedStyle(element).transform);
  expect(after).not.toBe(before);

  const themes = new Set<string>();
  const screens = home.locator("[data-screen-label]");
  for (let index = 0; index < await screens.count(); index += 1) {
    const screen = screens.nth(index);
    await screen.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await page.waitForTimeout(1_050);
    const navTheme = await page.locator('[data-public-shell="header"]').getAttribute("data-shell-theme");
    if (navTheme) themes.add(navTheme);
    const rise = screen.locator("[data-rise]");
    if (await rise.count()) {
      const states = await rise.evaluateAll((elements) => elements.map((element) => ({
        opacity: Number(getComputedStyle(element).opacity),
        state: element.getAttribute("data-rise-state"),
      })));
      expect(states.every((state) => state.state === "visible" && state.opacity > .99), `screen ${index + 1}`).toBe(true);
    }
  }
  expect(themes.size).toBeGreaterThan(1);
  expect((await visibleRiseState(page)).every((state) => state.state === "visible" && state.opacity > .99 && state.visibility === "visible")).toBe(true);

  const finalScreen = screens.last();
  await finalScreen.scrollIntoViewIfNeeded();
  await expect(finalScreen.getByRole("link", { name: "Start Programme" }).first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

async function assertAllHomeRevealsReadable(context: BrowserContext) {
  const page = await context.newPage();
  await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded" });
  expect((await visibleRiseState(page)).every((state) => state.opacity > .99 && state.visibility === "visible")).toBe(true);
  await page.close();
}

test("Home remains fail-visible without JavaScript, without IntersectionObserver and with reduced motion", async ({ browser }) => {
  const noJavaScript = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1024, height: 768 } });
  await assertAllHomeRevealsReadable(noJavaScript);
  await noJavaScript.close();

  const noObserver = await browser.newContext({ viewport: { width: 1024, height: 768 } });
  await noObserver.addInitScript(() => Object.defineProperty(window, "IntersectionObserver", { configurable: true, value: undefined }));
  await assertAllHomeRevealsReadable(noObserver);
  await noObserver.close();

  const reducedMotion = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 430, height: 932 } });
  await assertAllHomeRevealsReadable(reducedMotion);
  await reducedMotion.close();
});

const geometryRoutes = [
  { route: "/best-offers", selector: "[data-runtime-renderer='best-offers'] > section:first-of-type > div" },
  { route: "/casinos", selector: "[data-runtime-renderer='casinos'] #casino-directory > div" },
  { route: "/bonuses", selector: "[data-runtime-renderer='bonuses'] > section:first-of-type > div" },
  { route: "/faq", selector: "article > header > div" },
  { route: "/contact", selector: "[data-contact-page] > header > div" },
] as const;

for (const viewport of [
  { width: 1440, height: 900, gutter: 72 },
  { width: 1024, height: 768, gutter: 51.2 },
  { width: 430, height: 932, gutter: 24 },
  { width: 390, height: 844, gutter: 24 },
]) {
  test(`final public surfaces share the site grid at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const item of geometryRoutes) {
      const response = await page.goto(`${baseUrl}${item.route}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), item.route).toBe(200);
      const anchor = page.locator(item.selector).first();
      await expect(anchor, item.route).toBeVisible();
      await expect.poll(async () => {
        const current = await anchor.evaluate((element) => element.getBoundingClientRect().toJSON());
        return Math.max(
          Math.abs(current.x - viewport.gutter),
          Math.abs(viewport.width - current.right - viewport.gutter),
        );
      }, { message: `${item.route} settles on the shared grid` }).toBeLessThanOrEqual(1.5);
      const rect = await anchor.evaluate((element) => element.getBoundingClientRect().toJSON());
      expect(Math.abs(rect.x - viewport.gutter), `${item.route} left anchor`).toBeLessThanOrEqual(1.5);
      expect(Math.abs(viewport.width - rect.right - viewport.gutter), `${item.route} right anchor`).toBeLessThanOrEqual(1.5);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${item.route} overflow`).toBe(true);
    }
  });
}

test("Mission 01 uses the final responsive presentation from access through registration", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/programme-access/authority", async (route) => {
    const request = route.request();
    const body = request.postDataJSON() as { journeyId: string };
    const createdAt = Date.now();
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
          termsVersion: "terms:effective-2026-08-07:updated-2026-08-09",
          privacyVersion: "privacy:effective-2026-08-09:updated-2026-08-13",
          adultConfirmedAt: createdAt,
          termsAcceptedAt: createdAt,
          privacyAcknowledgedAt: createdAt,
          proof: "pa1.eyJ0ZXN0Ijp0cnVlfQ.c2ln",
        },
      }),
    });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
  await page.route("**/api/program/program-ai/turn", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({
      ok: true,
      result: {
        kind: "STARTING_POINT_CANDIDATE",
        disposition: "CONTINUE",
        candidate: {
          startingPoint: "I open betting apps after difficult work days.",
          desiredChange: "Pause before opening an app.",
          broadContext: "WORK",
          continuationCue: "Continue from the after-work pause.",
        },
      },
    }),
  }));

  await page.goto(`${baseUrl}/program`, { waitUntil: "networkidle" });
  await expect(page.locator("[data-programme-presentation='access']")).toBeVisible();
  await expect(page.locator("[data-handoff-page]")).toHaveCount(0);
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await expect(page.locator("[data-programme-presentation='mission-01-intake']")).toBeVisible();
  await expect(page.locator("[data-voice-state='idle']")).toBeVisible();
  await page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ }).check();
  await page.getByRole("button", { name: "I'd rather type" }).click();
  await expect(page.locator("[data-programme-presentation-state='text-fallback']")).toBeVisible();
  await page.getByLabel("Your situation").fill("After difficult work days I keep opening betting apps late at night.");
  await page.getByRole("button", { name: "Create my Starting Point" }).click();
  await expect(page.locator("[data-programme-presentation='starting-point-ready']")).toBeVisible();
  await expect(page.locator("[data-programme-presentation-state='registration']")).toBeVisible();
  await expect(page.getByRole("heading", { name: "A plan built around your evenings." })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("Bonus calculator and native FAQ details retain their bounded interactions", async ({ page }) => {
  await page.goto(`${baseUrl}/bonuses`, { waitUntil: "networkidle" });
  const output = page.locator("output");
  await expect(output).toContainText("€7,000");
  await page.getByLabel("Bonus amount").fill("100");
  const depositAndBonus = page.getByRole("radio", { name: "Deposit + bonus" });
  await depositAndBonus.locator("..").evaluate((label) => label.scrollIntoView({ block: "center" }));
  await depositAndBonus.locator("..").click();
  await expect(depositAndBonus).toBeChecked();
  await expect(output).toContainText("€7,000");
  const blackjack = page.getByRole("radio", { name: "Blackjack · 10%" });
  await blackjack.locator("..").evaluate((label) => label.scrollIntoView({ block: "center" }));
  await blackjack.locator("..").click();
  await expect(blackjack).toBeChecked();
  await expect(output).toContainText("€70,000");

  await page.goto(`${baseUrl}/faq`, { waitUntil: "domcontentloaded" });
  const details = page.locator("details").nth(1);
  await expect(details).not.toHaveAttribute("open", "");
  await details.locator("summary").click();
  await expect(details).toHaveAttribute("open", "");
});
