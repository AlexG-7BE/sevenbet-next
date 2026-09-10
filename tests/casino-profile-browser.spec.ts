import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("demo profile renders one disclosed SSR review without governed actions", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Solvane Casino" })).toBeVisible();
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { exact: true, name: "Solvane Casino" })).toBeVisible();
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
    const response = await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status(), `${width}px`).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${width}px`).toBe(false);
    expect(await page.locator("h1").count(), `${width}px`).toBe(1);
    await page.close();
  }
});

test("localized profile facts and no-offer panels preserve whole words", async ({ browser }) => {
  const cases = [
    { locale: "el", lang: "el-GR", width: 768 },
    { locale: "es", lang: "es-ES", width: 768 },
    { locale: "nl", lang: "nl-NL", width: 1440 },
  ] as const;

  for (const item of cases) {
    const context = await browser.newContext({ reducedMotion: "reduce", viewport: { width: item.width, height: 1024 } });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/${item.locale}/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", item.lang);
    await expect(page.locator('[data-offer-state="unavailable"]')).toBeVisible();
    await expect(page.locator('[data-offer-state="unavailable"] a[href^="/r/"]')).toHaveCount(0);
    const layout = await page.evaluate(() => {
      const fragments: Array<{ lines: number; word: string }> = [];
      for (const element of document.querySelectorAll('[data-offer-state="unavailable"] h2, #overview-heading, #overview dt, #overview dd')) {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        let node = walker.nextNode();
        while (node) {
          const text = node.textContent ?? "";
          for (const match of text.matchAll(/\p{L}[\p{L}\p{M}]*/gu)) {
            if (match[0].length < 4 || match.index === undefined) continue;
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            const lines = new Set(Array.from(range.getClientRects()).filter((rect) => rect.width > .5 && rect.height > .5).map((rect) => Math.round(rect.top * 2) / 2)).size;
            if (lines > 1) fragments.push({ lines, word: match[0] });
          }
          node = walker.nextNode();
        }
      }
      const hero = document.querySelector<HTMLElement>('section[aria-labelledby="casino-profile-title"]')!;
      const review = hero.firstElementChild as HTMLElement;
      const panel = hero.querySelector<HTMLElement>('[data-offer-state="unavailable"]')!;
      return {
        fragments,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        panelStacked: innerWidth <= 1000 ? panel.getBoundingClientRect().top >= review.getBoundingClientRect().bottom - 1 : true,
      };
    });
    expect(layout.fragments).toEqual([]);
    expect(layout.horizontalOverflow).toBe(0);
    expect(layout.panelStacked).toBe(true);
    await context.close();
  }
});

test("casino profile breadcrumb clears the fixed public header across responsive widths", async ({ browser }) => {
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 900 },
    { width: 768, height: 900 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
  ] as const;

  for (const viewport of viewports) {
    const mobile = viewport.width <= 430;
    const context = await browser.newContext({ hasTouch: mobile, isMobile: mobile, reducedMotion: "reduce", viewport });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status(), `${viewport.width}px status`).toBe(200);

    const header = page.locator('[data-public-shell="header"]');
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    const casinosLink = breadcrumb.locator('a[href="/en/casinos"]');
    const hero = page.getByRole("region", { exact: true, name: "Solvane Casino" });

    await expect(header, `${viewport.width}px public header`).toBeVisible();
    await expect(breadcrumb, `${viewport.width}px breadcrumb`).toBeVisible();
    await expect(casinosLink, `${viewport.width}px Casinos link`).toBeVisible();
    await expect(casinosLink, `${viewport.width}px Casinos link target`).toBeEnabled();
    await expect(casinosLink, `${viewport.width}px Casinos href`).toHaveAttribute("href", "/en/casinos");
    await expect(hero, `${viewport.width}px hero`).toBeVisible();
    await expect(hero.getByRole("heading", { level: 1, name: "Solvane Casino" }), `${viewport.width}px hero heading`).toBeVisible();

    const geometry = await page.evaluate(() => {
      const headerElement = document.querySelector<HTMLElement>('[data-public-shell="header"]')!;
      const breadcrumbElement = document.querySelector<HTMLElement>('nav[aria-label="Breadcrumb"]')!;
      const linkElement = breadcrumbElement.querySelector<HTMLAnchorElement>('a[href="/en/casinos"]')!;
      const headerRect = headerElement.getBoundingClientRect();
      const breadcrumbRect = breadcrumbElement.getBoundingClientRect();
      const linkRect = linkElement.getBoundingClientRect();
      return {
        breadcrumbGap: breadcrumbRect.top - headerRect.bottom,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        linkHeight: linkRect.height,
        linkTop: linkRect.top,
        linkWidth: linkRect.width,
        headerBottom: headerRect.bottom,
      };
    });

    expect(geometry.breadcrumbGap, `${viewport.width}px intentional header clearance`).toBeGreaterThanOrEqual(10);
    expect(geometry.linkTop, `${viewport.width}px link clears header`).toBeGreaterThanOrEqual(geometry.headerBottom);
    expect(geometry.linkWidth, `${viewport.width}px link width`).toBeGreaterThan(0);
    expect(geometry.linkHeight, `${viewport.width}px link height`).toBeGreaterThanOrEqual(32);
    expect(geometry.horizontalOverflow, `${viewport.width}px horizontal overflow`).toBe(0);
    await context.close();
  }
});

test("shared casino profile composition removes the final offer banner and keeps verdict and FAQ ordered", async ({ browser }) => {
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
    const response = await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status(), `${viewport.width}px status`).toBe(200);
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toHaveCount(1);
    await expect(page.locator("[data-handoff-page]")).toHaveCount(0);

    await expect(page.locator('[data-runtime-renderer="casino-review"] [data-demo-state="fictional"]')).toHaveCount(0);
    const geometry = await page.evaluate(() => {
      const verdict = document.querySelector<HTMLElement>("#verdict")!;
      const faq = document.querySelector<HTMLElement>("#faq")!;
      const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')!;
      return {
        faqAfterVerdict: faq.getBoundingClientRect().top >= verdict.getBoundingClientRect().bottom - 1,
        footerAfterFaq: footer.getBoundingClientRect().top >= faq.getBoundingClientRect().bottom - 1,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });

    expect(geometry.horizontalOverflow, `${viewport.width}px horizontal overflow`).toBe(0);
    expect(geometry.faqAfterVerdict, `${viewport.width}px verdict/FAQ order`).toBe(true);
    expect(geometry.footerAfterFaq, `${viewport.width}px FAQ/footer order`).toBe(true);
    await context.close();
  }
});

test("commercially unavailable state keeps editorial review and removes visit actions", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/demo-meadow?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Solvane Casino" })).toBeVisible();
  await expect(page.getByText("No current offer in your jurisdiction.").first()).toBeVisible();
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: /Help — protected support/ })).toBeVisible();
});

test("demo profile suppresses review, FAQ and commercial structured data", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/demo-lantern?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent || "{}")));
  expect(schemas.some((schema) => ["Review", "FAQPage", "Offer", "Product"].includes(schema["@type"]))).toBe(false);
});

test("localized demo profile keeps generic English chrome out of structured data", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/de/casino/demo-northstar?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
  await expect(page.getByText("Fiktive Bewertungsdemonstration").first()).toBeVisible();

  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent || "{}")));
  const webPage = schemas.find((schema) => schema["@type"] === "WebPage");
  expect(webPage?.name).toContain("Fiktive Bewertungsdemonstration");
  expect(webPage?.description).toContain("Fiktive Bewertungsfelder");
  expect(schemas.some((schema) => schema["@type"] === "FAQPage")).toBe(false);
  expect(JSON.stringify(schemas)).not.toMatch(/fictional review demonstration|Fictional product demonstration/i);
});

test("outbound confirmation is absent while market authority denies referral", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "networkidle" });
  const hero = page.getByRole("region", { exact: true, name: "Solvane Casino" });
  await expect(hero.getByRole("link", { name: "Visit Casino" })).toHaveCount(0);
  await expect(hero.getByText("No current offer in your jurisdiction.")).toBeVisible();
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  await page.close();
});

test("global Best Offers never reintroduces demo records or ungoverned actions", async ({ page }) => {
  const shortlist = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  expect(shortlist?.status()).toBe(200);
  await expect(page.locator('main a[href*="/casino/demo-"]')).toHaveCount(0);
  await expect(page.locator('main a[href^="/r/"], main a[href^="/go/"]')).toHaveCount(0);
  const shortlistCopy = await page.locator("body").textContent() ?? "";
  expect(shortlistCopy).not.toMatch(/Demo Northstar|Demo Meadow|Demo Lantern|Fictional casino/i);
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
});

test("server HTML remains useful with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Solvane Casino" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit Casino" })).toHaveCount(0);
  await expect(page.getByText("No current offer in your jurisdiction.").first()).toBeVisible();
  await context.close();
});

test("unknown profiles fail closed and are noindex", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/not-a-published-profile`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Casino profile unavailable" })).toBeVisible();
  const robots = await page.locator('meta[name="robots"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("content") ?? ""));
  expect(robots.length).toBeGreaterThan(0);
  expect(robots.every((value) => value.includes("noindex"))).toBe(true);
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
});
