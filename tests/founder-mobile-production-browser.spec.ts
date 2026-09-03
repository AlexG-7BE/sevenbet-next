import { expect, test, type Page } from "@playwright/test";

import { productPageMessages } from "../lib/i18n/product-pages-catalog";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const messages = productPageMessages("en-GB");

const viewports = [
  { width: 360, height: 800 },
  { width: 375, height: 667 },
  { width: 390, height: 844 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
  { width: 768, height: 1024 },
  { width: 1024, height: 900 },
] as const;

const routes = [
  "/",
  "/best-offers",
  "/casinos",
  "/casino/demo-northstar?visualFixture=true",
  "/bonuses",
  "/program",
  "/10-steps",
  "/learn",
  "/learn/casino-bonuses/welcome-bonus-terms",
  "/bonus-guide",
  "/responsible-gambling",
  "/help",
  "/methodology",
  "/about",
  "/faq",
  "/affiliate-disclosure",
  "/contact",
  "/privacy",
  "/terms",
  "/login",
] as const;

type AuditIssue = {
  kind: string;
  selector: string;
  text: string;
  rect?: number[];
  size?: number[];
};

async function mobileGeometryAudit(page: Page) {
  return page.evaluate(() => {
    const tolerance = 1.5;
    const visible = (element: Element) => {
      const html = element as HTMLElement;
      const style = getComputedStyle(html);
      const rect = html.getBoundingClientRect();
      return !html.closest("nextjs-portal,.skipLink,.srOnly,[class*='srOnly'],[class*='honeypot']")
        && style.clip === "auto"
        && style.clipPath === "none"
        && style.display !== "none"
        && style.visibility !== "hidden"
        && Number(style.opacity) !== 0
        && rect.width > 0
        && rect.height > 0;
    };
    const name = (element: Element) => {
      const html = element as HTMLElement;
      return {
        selector: `${html.tagName.toLowerCase()}.${String(html.className || "").split(" ")[0] || "-"}`,
        text: (html.getAttribute("aria-label") || html.textContent || html.getAttribute("alt") || "")
          .trim().replace(/\s+/g, " ").slice(0, 120),
      };
    };
    const hasHorizontalScroller = (element: Element) => {
      for (let parent = element.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        const style = getComputedStyle(parent);
        if (/auto|scroll/.test(style.overflowX) && parent.scrollWidth > parent.clientWidth + tolerance) return true;
      }
      return false;
    };
    const directTextNodes = (element: Element) => [...element.childNodes]
      .filter((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
    const issues: AuditIssue[] = [];

    if (document.documentElement.scrollWidth > document.documentElement.clientWidth + tolerance) {
      issues.push({ kind: "document-overflow", selector: "html", text: location.pathname, size: [document.documentElement.clientWidth, document.documentElement.scrollWidth] });
    }

    const meaningful = [...document.querySelectorAll<HTMLElement>("h1,h2,h3,h4,p,li,dt,dd,strong,small,span,a,button,label,summary")]
      .filter(visible)
      .filter((element) => element.getAttribute("aria-hidden") !== "true")
      .filter((element) => directTextNodes(element).length > 0);

    for (const element of meaningful) {
      if (!hasHorizontalScroller(element)) {
        const textRects = directTextNodes(element).flatMap((node) => {
          const range = document.createRange();
          range.selectNodeContents(node);
          return [...range.getClientRects()];
        });
        const outside = textRects.find((rect) => rect.left < -tolerance || rect.right > innerWidth + tolerance);
        if (outside) issues.push({ kind: "offscreen-text", ...name(element), rect: [outside.left, outside.right] });
      }

      const style = getComputedStyle(element);
      const clipsWidth = /hidden|clip/.test(style.overflowX) && element.scrollWidth > element.clientWidth + tolerance;
      const clipsHeight = /hidden|clip/.test(style.overflowY) && element.scrollHeight > element.clientHeight + tolerance;
      const truncates = style.textOverflow === "ellipsis" || Number.parseInt(style.webkitLineClamp || "0", 10) > 0;
      if (clipsWidth || clipsHeight || (truncates && (element.scrollWidth > element.clientWidth + tolerance || element.scrollHeight > element.clientHeight + tolerance))) {
        issues.push({ kind: "text-clipping", ...name(element), size: [element.clientWidth, element.scrollWidth, element.clientHeight, element.scrollHeight] });
      }
    }

    const isUiLink = (element: HTMLElement) => {
      if (element.tagName !== "A") return true;
      if (element.closest("header,footer,nav,[role='dialog'],[class*='actions'],[class*='Actions'],[class*='tray'],[class*='Tray']")) return true;
      if (element.parentElement?.matches("h1,h2,h3,h4")) return true;
      const style = getComputedStyle(element);
      return style.display === "flex" || style.display === "inline-flex" || style.display === "grid" || element.getBoundingClientRect().height >= 40;
    };
    const controls = [...document.querySelectorAll<HTMLElement>("a[href],button,input:not([type='hidden']),select,textarea,summary,[role='tab'],[role='switch']")]
      .filter(visible)
      .filter(isUiLink);
    for (const control of controls) {
      let hitTarget = control;
      if (control.matches("input,select,textarea")) {
        const associatedLabel = (control as HTMLInputElement).labels?.[0] as HTMLElement | undefined;
        const label = control.closest("label") as HTMLElement | null ?? associatedLabel ?? null;
        if (label) {
          const labelRect = label.getBoundingClientRect();
          const controlRect = control.getBoundingClientRect();
          if (labelRect.width * labelRect.height > controlRect.width * controlRect.height) hitTarget = label;
        }
      }
      const rect = hitTarget.getBoundingClientRect();
      if (!hasHorizontalScroller(control) && (rect.left < -tolerance || rect.right > innerWidth + tolerance)) {
        issues.push({ kind: "offscreen-control", ...name(control), rect: [rect.left, rect.right, rect.width, rect.height] });
      }
      if (innerWidth <= 430 && (rect.width < 43.5 || rect.height < 43.5)) {
        issues.push({ kind: "touch-target", ...name(control), size: [rect.width, rect.height] });
      }
    }

    const boundedBlocks = [...document.querySelectorAll<HTMLElement>("article,[role='dialog'],input,select,textarea,button,summary")].filter(visible);
    for (const element of boundedBlocks) {
      if (hasHorizontalScroller(element)) continue;
      const rect = element.getBoundingClientRect();
      if (rect.left < -tolerance || rect.right > innerWidth + tolerance) {
        issues.push({ kind: "visible-bounds", ...name(element), rect: [rect.left, rect.right, rect.width, rect.height] });
      }
    }

    const images = [...document.querySelectorAll<HTMLImageElement>("img[alt]")].filter(visible);
    for (const image of images) {
      const rect = image.getBoundingClientRect();
      if (rect.left >= -tolerance && rect.right <= innerWidth + tolerance) continue;
      const overspill = Math.max(0, -rect.left, rect.right - innerWidth);
      const fullBleedAllowance = image.closest("[data-handoff-page]") && innerWidth >= 768 ? innerWidth * .031 : 24;
      let intentionallyClipped = false;
      for (let parent = image.parentElement; parent && parent !== document.body; parent = parent.parentElement) {
        if (/hidden|clip/.test(getComputedStyle(parent).overflowX) && overspill <= fullBleedAllowance + tolerance) {
          intentionallyClipped = true;
          break;
        }
      }
      if (!intentionallyClipped) issues.push({ kind: "image-bounds", ...name(image), rect: [rect.left, rect.right, rect.width, rect.height] });
    }

    const fixed = [...document.querySelectorAll<HTMLElement>("[data-public-shell='header'],[data-casino-decision-bar],[data-comparison-tray]")]
      .filter(visible)
      .map((element) => ({ element, rect: element.getBoundingClientRect() }));
    for (let left = 0; left < fixed.length; left += 1) {
      for (let right = left + 1; right < fixed.length; right += 1) {
        const a = fixed[left];
        const b = fixed[right];
        const width = Math.min(a.rect.right, b.rect.right) - Math.max(a.rect.left, b.rect.left);
        const height = Math.min(a.rect.bottom, b.rect.bottom) - Math.max(a.rect.top, b.rect.top);
        if (width > tolerance && height > tolerance) {
          issues.push({ kind: "fixed-collision", selector: `${name(a.element).selector} / ${name(b.element).selector}`, text: `${name(a.element).text} / ${name(b.element).text}`, size: [width, height] });
        }
      }
    }

    return issues.map((issue) => ({
      ...issue,
      rect: issue.rect?.map((value) => Math.round(value * 10) / 10),
      size: issue.size?.map((value) => Math.round(value * 10) / 10),
    }));
  });
}

async function expectBoundedDialog(page: Page, selector: string) {
  const dialog = page.locator(selector);
  await expect(dialog).toBeVisible();
  const metrics = await dialog.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return {
      rect: [rect.left, rect.top, rect.right, rect.bottom],
      viewport: [innerWidth, innerHeight],
      scrollable: element.scrollHeight > element.clientHeight || [...element.children].some((child) => (child as HTMLElement).scrollHeight > (child as HTMLElement).clientHeight),
    };
  });
  expect(metrics.rect[0]).toBeGreaterThanOrEqual(-1);
  expect(metrics.rect[1]).toBeGreaterThanOrEqual(-1);
  expect(metrics.rect[2]).toBeLessThanOrEqual(metrics.viewport[0] + 1);
  expect(metrics.rect[3]).toBeLessThanOrEqual(metrics.viewport[1] + 1);
  return dialog;
}

async function selectTwoCasinosForComparison(page: Page) {
  await expect(page.locator('[data-runtime-renderer="casinos"]')).toHaveCount(1);
  await expect(page.locator("[data-handoff-page]")).toHaveCount(0);
  const controls = page.locator('[data-comparison-toggle][aria-pressed="false"]');
  if (await controls.count()) {
    await controls.first().click();
    await expect(page.locator("[data-comparison-tray]")).toHaveAttribute("data-comparison-count", "1");
    await controls.first().click();
    return;
  }

  // CI deliberately permits an empty current inventory. Exercise the same
  // public selection event emitted by ContextualCompareToggle without
  // inserting a casino card, renderer or commercial record.
  for (const slug of ["demo-northstar", "demo-summit"]) {
    await page.evaluate((casinoSlug) => {
      window.dispatchEvent(new CustomEvent("b4gamble:comparison-toggle", { detail: { slug: casinoSlug } }));
    }, slug);
    if (slug === "demo-northstar") {
      await expect(page.locator("[data-comparison-tray]")).toHaveAttribute("data-comparison-count", "1");
    }
  }
}

async function installAnonymousProgramme(page: Page) {
  const createdAt = Date.now();
  await page.route("**/api/auth/get-session", (route) => route.fulfill({ status: 200, contentType: "application/json", body: "null" }));
  await page.route("**/api/programme-access/authority", (route) => {
    const body = route.request().postDataJSON() as { journeyId: string };
    return route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, authority: { version: 1, intent: "PROGRAMME_ACCESS", purpose: "PROGRAMME_AUTH_ACCESS", journeyId: body.journeyId, createdAt, expiresAt: createdAt + 3_600_000, termsVersion: "terms:effective-2026-08-19:updated-2026-08-19", privacyVersion: "privacy:effective-2026-08-19:updated-2026-08-19", adultConfirmedAt: createdAt, termsAcceptedAt: createdAt, privacyAcknowledgedAt: createdAt, proof: "pa1.founder.mobile" } }),
    });
  });
  await page.route("**/api/program/program-ai/session", (route) => route.fulfill({ status: 201, contentType: "application/json", body: JSON.stringify({ ok: true, session: { state: "not_started", taskStates: [], xpPreview: 0 } }) }));
  await page.route("**/api/program/program-ai/authority", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, authority: { active: true } }) }));
  await page.route("**/api/program/program-ai/turn", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ ok: true, result: { kind: "STARTING_POINT_CANDIDATE", disposition: "CONTINUE", candidate: { startingPoint: "I open betting apps after difficult work days.", desiredChange: "Pause before opening an app.", broadContext: "WORK", continuationCue: "Continue from the after-work pause." } } }),
  }));
}

test("mobile visible bounds, text clipping, touch targets and fixed controls pass the full route matrix", async ({ browser }) => {
  test.setTimeout(12 * 60_000);
  const failures: Array<{ viewport: number; route: string; issues: AuditIssue[] }> = [];
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, hasTouch: viewport.width <= 430, isMobile: viewport.width <= 430, reducedMotion: "reduce" });
    const page = await context.newPage();
    for (const route of routes) {
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${route} at ${viewport.width}px`).toBe(200);
      await page.waitForTimeout(40);
      if (route === "/casino/demo-northstar?visualFixture=true") {
        await expect(page.locator('[data-runtime-renderer="casino-review"]')).toHaveCount(1);
        await expect(page.locator("[data-handoff-page]")).toHaveCount(0);
      }
      if (route === "/program") {
        await expect(page.locator('[data-public-programme-renderer="program-ai"]')).toHaveCount(1);
        await expect(page.locator(".activeProgrammePage,[data-handoff-page]")).toHaveCount(0);
      }
      const issues = await mobileGeometryAudit(page);
      if (issues.length) failures.push({ viewport: viewport.width, route, issues });
    }
    await context.close();
  }
  if (failures.length) throw new Error(`${failures.length} route/viewport audits failed\n${JSON.stringify(failures.slice(0, 60), null, 2)}`);
});

test("mobile navigation, filters and contextual comparison remain bounded sheets", async ({ browser }) => {
  test.setTimeout(3 * 60_000);
  for (const viewport of viewports.filter(({ width }) => width <= 430)) {
    const context = await browser.newContext({ viewport, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
    const page = await context.newPage();

    await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
    const menuButton = page.getByRole("button", { name: "Open navigation" });
    await menuButton.click();
    const menu = await expectBoundedDialog(page, "#public-mobile-navigation");
    await expect(menu.getByRole("button", { name: "Close navigation" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(menuButton).toBeFocused();

    await page.goto(`${baseUrl}/bonuses`, { waitUntil: "networkidle" });
    const filterTrigger = page.getByRole("button", { name: /Open bonus filters|Filters/i });
    if (await filterTrigger.count()) {
      await filterTrigger.click();
      const filters = await expectBoundedDialog(page, "#bonus-filter-dialog");
      const filterInputs = filters.locator("input,select");
      for (let index = 0; index < await filterInputs.count(); index += 1) {
        expect(await filterInputs.nth(index).evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
      }
      await page.keyboard.press("Escape");
      await expect(filters).toBeHidden();
      await expect(filterTrigger).toBeFocused();
    } else {
      await expect(page.locator("main")).toContainText(/No comparison records match/i);
    }

    await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
    await page.evaluate(() => sessionStorage.removeItem("b4gamble:public-comparison:v1"));
    await page.reload({ waitUntil: "networkidle" });
    await selectTwoCasinosForComparison(page);
    const comparison = await expectBoundedDialog(page, 'dialog[data-runtime-renderer="contextual-comparison"]');
    const close = comparison.getByRole("button", { name: messages.comparison.close });
    const closeBox = await close.boundingBox();
    expect(closeBox?.width).toBeGreaterThanOrEqual(44);
    expect(closeBox?.height).toBeGreaterThanOrEqual(44);
    const before = await page.evaluate(() => scrollY);
    await comparison.hover();
    await page.mouse.wheel(0, 700);
    expect(await page.evaluate(() => scrollY)).toBe(before);
    await close.click();
    await expect(comparison).toBeHidden();
    await page.getByRole("button", { name: messages.comparison.open }).click();
    await expect(comparison).toBeVisible();
    await context.close();
  }
});

test("390px touch journeys preserve commercial, learning and canonical Programme behaviour", async ({ browser }) => {
  test.setTimeout(3 * 60_000);
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
  const page = await context.newPage();

  await page.goto(`${baseUrl}/best-offers`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("link", { name: /Review|details/i }).first()).toBeVisible();

  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  await page.evaluate(() => sessionStorage.removeItem("b4gamble:public-comparison:v1"));
  await page.reload({ waitUntil: "networkidle" });
  await selectTwoCasinosForComparison(page);
  await expect(page.locator('dialog[data-runtime-renderer="contextual-comparison"]')).toBeVisible();

  await page.goto(`${baseUrl}/casino/demo-northstar?visualFixture=true`, { waitUntil: "networkidle" });
  await page.locator("#faq").scrollIntoViewIfNeeded();
  const faq = page.locator("#faq details").first();
  await faq.locator("summary").click();
  await expect(faq).not.toHaveAttribute("open", "");
  await faq.locator("summary").click();
  await expect(faq).toHaveAttribute("open", "");

  await page.goto(`${baseUrl}/bonuses`, { waitUntil: "networkidle" });
  await page.getByLabel("Bonus amount").fill("100");
  await page.getByRole("radio", { name: "Deposit + bonus" }).check({ force: true });
  await page.getByRole("radio", { name: "Blackjack · 10%" }).check({ force: true });
  await expect(page.locator("output")).toContainText("€70,000");

  await page.goto(`${baseUrl}/learn`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "Bonuses", exact: true }).click();
  await expect(page.getByRole("button", { name: "Bonuses", exact: true })).toBeVisible();
  await page.goto(`${baseUrl}/learn/casino-bonuses/welcome-bonus-terms`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await installAnonymousProgramme(page);
  await page.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
  await page.getByRole("checkbox", { name: /I confirm I am 18 or over/ }).check();
  await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
  await page.getByRole("button", { name: "Enter Mission 01" }).click();
  await page.getByRole("checkbox", { name: /I explicitly consent to B4GAMBLE processing what I type or say/ }).check();
  await expect(page.getByRole("button", { name: "Tap to speak" })).toBeVisible();
  await page.getByRole("button", { name: "I'd rather type" }).click();
  const textarea = page.getByLabel("Your situation");
  expect(await textarea.evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize))).toBeGreaterThanOrEqual(16);
  await textarea.fill("After difficult work days I keep opening betting apps late at night.");
  await page.getByRole("button", { name: "Create my Starting Point" }).click();
  await expect(page.locator('[data-programme-presentation="starting-point-ready"]')).toBeVisible();
  await expect(page.locator('[data-public-programme-renderer="program-ai"]')).toHaveCount(1);
  await expect(page.locator("[data-handoff-page]")).toHaveCount(0);
  await context.close();
});
