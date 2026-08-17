import { randomUUID } from "node:crypto";
import { resolve } from "node:path";

import { PrismaClient } from "@prisma/client";
import {
  expect,
  request as playwrightRequest,
  test,
  type Page,
} from "@playwright/test";
import sharp from "sharp";

import {
  PROGRAMME_AUTH_ACCESS_HEADERS,
  PROGRAMME_PRIVACY_VERSION,
  PROGRAMME_TERMS_VERSION,
} from "../lib/programme/access-contract";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const ciDatabaseUrl = "postgresql://sevenbet:sevenbet@127.0.0.1:54329/sevenbet_ci";
const captureEvidence = process.env.UPDATE_FOUNDER_EVIDENCE === "1";
const evidenceRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/founder-header-home-responsive-review");
const prisma = new PrismaClient({ datasourceUrl: ciDatabaseUrl });

async function saveWebp(page: Page, path: string, selector?: string) {
  if (!captureEvidence) return;
  const buffer = selector
    ? await page.locator(selector).screenshot({ animations: "disabled" })
    : await page.screenshot({ animations: "disabled" });
  await sharp(buffer).webp({ quality: 88 }).toFile(path);
}

async function authenticatedStorageState() {
  const email = `founder-header-${randomUUID()}@example.test`;
  const client = await playwrightRequest.newContext({ baseURL: baseUrl });
  const journeyId = randomUUID();
  const authorityResponse = await client.post("/api/programme-access/authority", {
    data: {
      adultConfirmed: true,
      journeyId,
      privacyAcknowledged: true,
      privacyVersion: PROGRAMME_PRIVACY_VERSION,
      termsAccepted: true,
      termsVersion: PROGRAMME_TERMS_VERSION,
    },
  });
  expect(authorityResponse.status()).toBe(200);
  const { authority } = await authorityResponse.json() as { authority: { journeyId: string; proof: string } };
  const signUpResponse = await client.post("/api/auth/sign-up/email", {
    data: {
      email,
      name: "Founder header responsive test",
      password: "Founder-header-responsive-42!",
    },
    headers: {
      [PROGRAMME_AUTH_ACCESS_HEADERS.journey]: authority.journeyId,
      [PROGRAMME_AUTH_ACCESS_HEADERS.proof]: authority.proof,
      origin: baseUrl,
      "x-forwarded-for": "203.0.113.249",
    },
  });
  expect(signUpResponse.status(), await signUpResponse.text()).toBe(200);
  const storageState = await client.storageState();
  await client.dispose();
  return { email, storageState };
}

async function assertHeaderState(page: Page, expectedLabel: "Start Programme" | "My Programme") {
  await page.goto(`${baseUrl}/casinos`, { waitUntil: "networkidle" });
  const header = page.locator('header[data-public-shell="header"]');
  const action = header.locator('a[href^="/program"]:visible').first();
  await expect(action).toHaveText(expectedLabel);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBe(0);
  return { action, header };
}

test.afterAll(async () => {
  await prisma.$disconnect();
});

test("anonymous header uses one label source at desktop and mobile", async ({ browser }) => {
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      hasTouch: viewport.width < 900,
      isMobile: viewport.width < 900,
      viewport,
    });
    const page = await context.newPage();
    const { header } = await assertHeaderState(page, "Start Programme");
    const evidenceName = viewport.width === 1440 ? "header-anonymous-1440.webp" : "header-anonymous-390.webp";
    await saveWebp(page, resolve(evidenceRoot, evidenceName), 'header[data-public-shell="header"]');
    if (viewport.width === 390) {
      await saveWebp(page, resolve(evidenceRoot, "mobile-header-hamburger-390.webp"), 'header[data-public-shell="header"]');
      await expect(header.getByRole("button", { name: "Open navigation" })).toBeVisible();
    }
    await context.close();
  }
});

test("one authenticated session renders My Programme at desktop and mobile", async ({ browser }) => {
  const authenticated = await authenticatedStorageState();
  try {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      const context = await browser.newContext({
        hasTouch: viewport.width < 900,
        isMobile: viewport.width < 900,
        storageState: authenticated.storageState,
        viewport,
      });
      const page = await context.newPage();
      await assertHeaderState(page, "My Programme");
      const evidenceName = viewport.width === 1440 ? "header-authenticated-1440.webp" : "header-authenticated-390.webp";
      await saveWebp(page, resolve(evidenceRoot, evidenceName), 'header[data-public-shell="header"]');
      await context.close();
    }
  } finally {
    await prisma.user.deleteMany({ where: { email: authenticated.email } });
  }
});

test("mobile navigation controls are icon-only, accessible, and restore focus", async ({ browser }) => {
  const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const { header } = await assertHeaderState(page, "Start Programme");
  const menu = header.getByRole("button", { name: "Open navigation" });
  await expect(menu).toHaveAttribute("aria-controls", "public-mobile-navigation");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  expect((await menu.innerText()).trim()).toBe("");
  expect(await menu.locator("svg").count()).toBe(1);
  expect((await menu.boundingBox())?.width).toBeGreaterThanOrEqual(44);
  expect((await menu.boundingBox())?.height).toBeGreaterThanOrEqual(44);

  await menu.focus();
  await menu.click();
  const dialog = page.getByRole("dialog", { name: "Site navigation" });
  const close = dialog.getByRole("button", { name: "Close navigation" });
  await expect(dialog).toBeVisible();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(close).toBeFocused();
  expect((await close.innerText()).trim()).toBe("");
  expect(await close.locator("svg").count()).toBe(1);
  expect((await close.boundingBox())?.width).toBeGreaterThanOrEqual(44);
  expect((await close.boundingBox())?.height).toBeGreaterThanOrEqual(44);
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("hidden");
  await saveWebp(page, resolve(evidenceRoot, "mobile-menu-open-390.webp"));

  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(menu).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.style.overflow)).toBe("");

  await menu.click();
  await expect(dialog).toBeVisible();
  await close.click();
  await expect(dialog).not.toBeVisible();
  await expect(menu).toBeFocused();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await context.close();
});

for (const width of [360, 375, 390, 412, 430]) {
  test(`mobile header geometry remains clean at ${width}px`, async ({ browser }) => {
    const context = await browser.newContext({ hasTouch: true, isMobile: true, viewport: { width, height: 844 } });
    const page = await context.newPage();
    const { action, header } = await assertHeaderState(page, "Start Programme");
    const brand = header.getByRole("link", { name: "B4GAMBLE home", exact: true });
    const menu = header.getByRole("button", { name: "Open navigation" });
    const geometry = await Promise.all([brand.boundingBox(), action.boundingBox(), menu.boundingBox(), header.boundingBox()]);
    const [brandBox, actionBox, menuBox, headerBox] = geometry;
    expect(brandBox && actionBox && menuBox && headerBox).toBeTruthy();
    expect(brandBox!.x + brandBox!.width).toBeLessThanOrEqual(actionBox!.x + 1);
    expect(actionBox!.x + actionBox!.width).toBeLessThanOrEqual(menuBox!.x + 1);
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(headerBox!.x + headerBox!.width + 1);
    expect(menuBox!.width).toBe(44);
    expect(menuBox!.height).toBe(44);
    await context.close();
  });
}
