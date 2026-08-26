import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("demo profile renders one disclosed SSR review without governed actions", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Northstar Casino" })).toBeVisible();
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { exact: true, name: "Demo Northstar Casino" })).toBeVisible();
  expect(await page.locator("h1").count()).toBe(1);
  const profile = page.locator('[data-runtime-renderer="casino-review"]');
  expect(await profile.locator('a[href^="http"]').count()).toBe(0);
  expect(await profile.locator('a[href^="/r/"]').count()).toBe(0);
  const visibleCopy = await page.locator("body").innerText();
  for (const falsePublicationClaim of [
    "Published review",
    "Published bonus",
    "Published detail",
    "Published source",
    "Published control tools",
    "Published evidence",
    "Published facts",
  ]) expect(visibleCopy).not.toContain(falsePublicationClaim);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(errors).toEqual([]);
});

test("casino profile has no horizontal overflow across approved and defensive widths", async ({ browser }) => {
  for (const width of [1440, 1280, 900, 768, 430, 390, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 844 : 900 }, isMobile: width <= 430 });
    const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
    expect(response?.status(), `${width}px`).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${width}px`).toBe(false);
    expect(await page.locator("h1").count(), `${width}px`).toBe(1);
    await page.close();
  }
});

test("shared casino profile composition joins the final offer to the footer and separates the mobile score", async ({ browser }) => {
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
    { width: 375, height: 812 },
    { width: 360, height: 800 },
  ] as const;

  for (const viewport of viewports) {
    const mobile = viewport.width <= 430;
    const context = await browser.newContext({ hasTouch: mobile, isMobile: mobile, reducedMotion: "reduce", viewport });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
    expect(response?.status(), `${viewport.width}px status`).toBe(200);
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toHaveCount(1);
    await expect(page.locator("[data-handoff-page]")).toHaveCount(0);

    const geometry = await page.evaluate(() => {
      const finalOffer = document.querySelector<HTMLElement>('[data-runtime-renderer="casino-review"] [data-demo-state="fictional"]')!;
      const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')!;
      const limit = document.querySelector<HTMLElement>('#verdict [class*="verdictLimit"]');
      const score = document.querySelector<HTMLElement>('#verdict [class*="scorePanel"]');
      const decisionBar = document.querySelector<HTMLElement>("[data-casino-decision-bar]")!;
      const finalRect = finalOffer.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const limitRect = limit?.getBoundingClientRect() ?? null;
      const scoreRect = score?.getBoundingClientRect() ?? null;
      const decisionRect = decisionBar.getBoundingClientRect();
      return {
        finalToFooterGap: footerRect.top - finalRect.bottom,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scoreGap: limitRect && scoreRect ? scoreRect.top - limitRect.bottom : null,
        decisionBottomGap: innerHeight - decisionRect.bottom,
        decisionPosition: getComputedStyle(decisionBar).position,
        mobileVisible: decisionBar.dataset.mobileVisible,
      };
    });

    expect(Math.abs(geometry.finalToFooterGap), `${viewport.width}px final offer/footer join`).toBeLessThanOrEqual(1);
    expect(geometry.horizontalOverflow, `${viewport.width}px horizontal overflow`).toBe(0);
    if (mobile) {
      expect(geometry.scoreGap, `${viewport.width}px Keep in view/score gap`).not.toBeNull();
      expect(geometry.scoreGap!, `${viewport.width}px Keep in view/score gap`).toBeGreaterThanOrEqual(40);
      expect(geometry.decisionPosition, `${viewport.width}px decision bar position`).toBe("fixed");
      expect(geometry.mobileVisible, `${viewport.width}px action follows hero information`).toBe("false");
      await page.locator("#overview").scrollIntoViewIfNeeded();
      await expect(page.locator("[data-casino-decision-bar]"), `${viewport.width}px decision bar reveals after hero`).toHaveAttribute("data-mobile-visible", "true");
      const revealedBottomGap = await page.locator("[data-casino-decision-bar]").evaluate((element) => innerHeight - element.getBoundingClientRect().bottom);
      expect(Math.abs(revealedBottomGap), `${viewport.width}px revealed decision bar bottom`).toBeLessThanOrEqual(1.5);
    }
    await context.close();
  }

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }] as const) {
    const mobile = viewport.width <= 430;
    const context = await browser.newContext({ hasTouch: mobile, isMobile: mobile, reducedMotion: "reduce", viewport });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/casino/demo-meadow`, { waitUntil: "networkidle" });
    expect(response?.status(), `shared profile ${viewport.width}px status`).toBe(200);
    const gap = await page.evaluate(() => {
      const finalOffer = document.querySelector<HTMLElement>('[data-runtime-renderer="casino-review"] [data-demo-state="fictional"]')!;
      const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')!;
      return footer.getBoundingClientRect().top - finalOffer.getBoundingClientRect().bottom;
    });
    expect(Math.abs(gap), `shared profile ${viewport.width}px final offer/footer join`).toBeLessThanOrEqual(1);
    await context.close();
  }
});

test("commercially unavailable state keeps editorial review and removes visit actions", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/demo-meadow`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Meadow Casino" })).toBeVisible();
  await expect(page.getByText("Offer unavailable").first()).toBeVisible();
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: /Help — protected support/ })).toBeVisible();
});

test("demo profile suppresses review, FAQ and commercial structured data", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/demo-lantern`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent || "{}")));
  expect(schemas.some((schema) => ["Review", "FAQPage", "Offer", "Product"].includes(schema["@type"]))).toBe(false);
});

test("outbound confirmation is absent while market authority denies referral", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
  const hero = page.getByRole("region", { exact: true, name: "Demo Northstar Casino" });
  await expect(hero.getByRole("link", { name: "Visit Demo Northstar Casino" })).toHaveCount(0);
  await expect(hero.getByText("Offer unavailable")).toBeVisible();
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  await page.close();
});

test("every rendered Best Offers demo detail action resolves to a disclosed review-only page", async ({ page }) => {
  const shortlist = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  expect(shortlist?.status()).toBe(200);
  const hrefs = [...new Set(await page.locator('a[href^="/casino/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")).filter((href): href is string => Boolean(href))))];
  expect(hrefs.length).toBeGreaterThanOrEqual(3);
  expect(hrefs.every((href) => /^\/casino\/demo-/.test(href))).toBe(true);
  const shortlistCopy = await page.locator("body").textContent() ?? "";
  for (const falsePublicationClaim of [
    "Published ranking method",
    "Only active, current records explicitly available",
    "important conditions must all be published",
    "exact published signal behind the result",
    "Withdrawal timing is a published signal",
    "The operator’s current terms control the final decision",
    "strongest balance under the published method",
    "Published terms are a comparison snapshot",
    "latest published, non-archived snapshots",
    "The evidence behind the headline",
    "It is a set of facts a user can compare",
    "Read the evidence",
  ]) expect(shortlistCopy).not.toContain(falsePublicationClaim);

  for (const href of hrefs) {
    const response = await page.goto(`${baseUrl}${href}`, { waitUntil: "networkidle" });
    expect(response?.status(), href).toBe(200);
    await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
    expect(await page.locator('[data-runtime-renderer="casino-review"] a[href^="http"], [data-runtime-renderer="casino-review"] a[href^="/r/"]').count()).toBe(0);
  }
});

test("server HTML remains useful with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Northstar Casino" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit Demo Northstar Casino" })).toHaveCount(0);
  await expect(page.getByText("Offer unavailable").first()).toBeVisible();
  await context.close();
});

test("unknown profiles fail closed and are noindex", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/not-a-published-profile`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "This review is not available." })).toBeVisible();
  const robots = await page.locator('meta[name="robots"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("content") ?? ""));
  expect(robots.length).toBeGreaterThan(0);
  expect(robots.every((value) => value.includes("noindex"))).toBe(true);
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
});
