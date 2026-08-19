import { expect, test, type Browser, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

async function scrollToTheme(page: Page, selector: string, theme: string) {
  await page.locator(selector).first().evaluate((element) => {
    const headerHeight = document.querySelector<HTMLElement>('[data-public-shell="header"]')?.getBoundingClientRect().height ?? 81;
    window.scrollTo({ top: window.scrollY + element.getBoundingClientRect().top - headerHeight + 2, behavior: "instant" });
  });
  await expect(page.locator('[data-public-shell="header"]')).toHaveAttribute("data-shell-theme", theme);
}

async function expectNoOverflow(page: Page, label: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), label).toBe(true);
}

test("Casino Review uses the real renderer, sticky decision state, reversible themes and bounded interactions", async ({ page }) => {
  test.setTimeout(45_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  const response = await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator('[data-runtime-renderer="casino-review"]')).toHaveCount(1);
  await expect(page.locator("[data-handoff-page]")).toHaveCount(0);
  const heroTheme = await page.locator('[data-runtime-renderer="casino-review"] > div > section[data-nav-theme]').first().getAttribute("data-nav-theme");
  expect(heroTheme).toMatch(/^(dark|photo)$/);
  await expect(page.locator('[data-public-shell="header"]')).toHaveAttribute("data-shell-theme", heroTheme!);

  await scrollToTheme(page, "#overview", "light");
  await expect(page.locator("[data-casino-decision-bar]")).toHaveAttribute("data-stuck", "true");
  await expect(page.locator('[data-casino-decision-bar] a[href="#overview"]')).toHaveAttribute("aria-current", "location");

  await scrollToTheme(page, "#offer-evidence", "cream");
  await expect(page.locator('[data-casino-decision-bar] a[href="#offer-evidence"]')).toHaveAttribute("aria-current", "location");
  if (await page.locator("#editorial-review").count()) await scrollToTheme(page, "#editorial-review", "light");
  await scrollToTheme(page, "#verdict", "cream");
  await expect(page.locator("#verdict")).toHaveAttribute("data-motion-state", "visible");
  if (await page.locator("[data-score-row]").count()) {
    await expect.poll(async () => page.locator("[data-score-row] i b").first().evaluate((element) => getComputedStyle(element).transform)).not.toBe("matrix(0, 0, 0, 1, 0, 0)");
  }

  const faq = page.locator("#faq details").first();
  await faq.locator("summary").click();
  await expect(faq).not.toHaveAttribute("open", "");
  await faq.locator("summary").click();
  await expect(faq).toHaveAttribute("open", "");
  await scrollToTheme(page, "#faq [data-nav-theme='dark']", "dark");
  await scrollToTheme(page, "#overview", "light");
  await scrollToTheme(page, `[data-runtime-renderer="casino-review"] [data-nav-theme="${heroTheme}"]`, heroTheme!);
  await expectNoOverflow(page, "Casino Review desktop overflow");
});

test("Casino Review remains purpose-bounded at every Founder viewport", async ({ browser }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 430, height: 932 }, { width: 390, height: 844 }]) {
    const page = await browser.newPage({ viewport, isMobile: viewport.width <= 430 });
    await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "networkidle" });
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toHaveCount(1);
    await expectNoOverflow(page, `Casino Review ${viewport.width}px overflow`);
    if (viewport.width <= 430) {
      const decision = await page.locator("[data-casino-decision-bar]").evaluate((element) => element.getBoundingClientRect().toJSON());
      expect(Math.abs(viewport.height - decision.bottom), `${viewport.width}px fixed action bottom`).toBeLessThanOrEqual(1.5);
      expect(decision.height, `${viewport.width}px fixed action height`).toBeLessThanOrEqual(90);
    }
    await page.close();
  }
});

test("Bonuses drives the shared chameleon header down and back up and keeps calculator truth deterministic", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
  await expect(page.locator('[data-runtime-renderer="bonuses"]')).toHaveCount(1);
  await expect(page.locator("[data-handoff-page]")).toHaveCount(0);
  await expect(page.locator('[data-public-shell="header"]')).toHaveAttribute("data-shell-theme", "dark");
  await scrollToTheme(page, '[aria-labelledby="bonus-shortlist-title"]', "light");
  await page.getByRole("tab", { name: "Low Wagering" }).click();
  await expect(page.getByRole("tab", { name: "Low Wagering" })).toHaveAttribute("aria-selected", "true");
  await scrollToTheme(page, "section[class*='directorySection']", "cream");
  await scrollToTheme(page, "#bonus-calculator-title", "dark");

  const output = page.locator("output");
  await page.getByLabel("Bonus amount").fill("100");
  await page.getByRole("radio", { name: "Deposit + bonus" }).locator("..").click();
  await page.getByRole("radio", { name: "Blackjack · 10%" }).locator("..").click();
  await expect(output).toContainText("€70,000");
  await scrollToTheme(page, "section[class*='method']", "cream");
  await expect(page.locator("section[class*='disclosure']")).toHaveAttribute("data-nav-theme", "dark");
  await scrollToTheme(page, "section[class*='method']", "cream");
  await scrollToTheme(page, "#bonus-calculator-title", "dark");
  await scrollToTheme(page, "section[class*='directorySection']", "cream");
  await scrollToTheme(page, '[aria-labelledby="bonus-shortlist-title"]', "light");
  await scrollToTheme(page, "section:first-of-type", "dark");
});

test("Casinos tray, auto-open sheet, reopen and three-selection cap remain contextual", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/casinos?visualFixture=true`, { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.removeItem("b4gamble:public-comparison:v1"));
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("tab", { name: "Mobile" }).click();
  await expect(page.getByRole("tab", { name: "Mobile" })).toHaveAttribute("aria-selected", "true");

  await page.getByRole("button", { name: "Compare", exact: true }).first().click();
  const tray = page.locator("[data-comparison-tray]");
  await expect(tray).toHaveAttribute("data-comparison-count", "1");
  await page.getByRole("button", { name: "Compare", exact: true }).first().click();
  await expect(page.locator('dialog[data-runtime-renderer="contextual-comparison"]')).toHaveAttribute("open", "");
  await expect(tray).toHaveAttribute("data-comparison-count", "2");
  await page.getByRole("button", { name: "Close comparison" }).click();
  await expect(page.getByRole("heading", { name: "Side by side" })).not.toBeVisible();
  await page.getByRole("button", { name: "Open comparison" }).click();
  await expect(page.getByRole("heading", { name: "Side by side" })).toBeVisible();
  await page.getByRole("button", { name: "Close comparison" }).click();
  await page.getByRole("button", { name: "Compare", exact: true }).first().click();
  await expect(tray).toHaveAttribute("data-comparison-count", "3");
  const before = await page.evaluate(() => sessionStorage.getItem("b4gamble:public-comparison:v1"));
  await page.getByRole("button", { name: "Compare", exact: true }).first().click();
  expect(await page.evaluate(() => sessionStorage.getItem("b4gamble:public-comparison:v1"))).toBe(before);
});

async function expectRevealFallback(browser: Browser, options: { noObserver?: boolean; reducedMotion?: "reduce" }) {
  const context = await browser.newContext({ viewport: { width: 1024, height: 768 }, reducedMotion: options.reducedMotion });
  if (options.noObserver) await context.addInitScript(() => Object.defineProperty(window, "IntersectionObserver", { configurable: true, value: undefined }));
  const page = await context.newPage();
  await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "domcontentloaded" });
  const states = await page.locator("[data-motion-reveal]").evaluateAll((elements) => elements.map((element) => ({ opacity: Number(getComputedStyle(element).opacity), state: element.getAttribute("data-motion-state") })));
  expect(states.length).toBeGreaterThan(4);
  expect(states.every((state) => state.opacity > .99 && state.state !== "pending")).toBe(true);
  await context.close();
}

test("shared reveals fail visible without IntersectionObserver and under reduced motion", async ({ browser }) => {
  await expectRevealFallback(browser, { noObserver: true });
  await expectRevealFallback(browser, { reducedMotion: "reduce" });
});

test("Programme preserves the canonical voice-first recording waveform and reduced-motion contract", async ({ page }) => {
  await page.addInitScript(() => {
    class TestMediaRecorder {
      static isTypeSupported(type: string) { return type === "audio/webm;codecs=opus"; }
      state = "inactive";
      mimeType = "audio/webm;codecs=opus";
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; this.ondataavailable?.({ data: new Blob([new Uint8Array(3)], { type: this.mimeType }) }); this.onstop?.(); }
    }
    Object.defineProperty(window, "MediaRecorder", { configurable: true, value: TestMediaRecorder });
    Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: async () => ({ getTracks: () => [{ stop() {} }] }) } });
  });
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", async (route) => {
    const journeyId = (route.request().postDataJSON() as { journeyId: string }).journeyId;
    const createdAt = Date.now();
    await route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId, createdAt, expiresAt: createdAt + 3_600_000, termsVersion: "terms:effective-2026-08-19:updated-2026-08-19", privacyVersion: "privacy:effective-2026-08-19:updated-2026-08-19", adultConfirmedAt: createdAt, termsAcceptedAt: createdAt, privacyAcknowledgedAt: createdAt, proof: "pa1.founder.interaction" } }) });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
  await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("checkbox", { name: /I choose to share this for Programme personalisation/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await page.getByRole("button", { name: "Tap to speak" }).click();
  await expect(page.locator('[data-voice-state="recording"]')).toBeVisible();
  await expect(page.locator("[data-recording-indicator]")).toBeVisible();
  expect(await page.locator("[data-recording-indicator]").evaluate((element) => getComputedStyle(element).animationName)).toContain("voice-pulse");
  await expect(page.locator('[data-public-programme-renderer="program-ai"]')).toHaveCount(1);
  await expect(page.locator("[data-handoff-page]")).toHaveCount(0);
});
