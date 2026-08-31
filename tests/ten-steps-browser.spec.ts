import { expect, test } from "@playwright/test";
import { tenStepsTranslation } from "../lib/i18n/static-pages/ten-steps";
import { programmeMissionTitles } from "../lib/programme/program-ai/mission-registry";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const approvedOrder = ["hero", "programme-builds", "mission-map", "account-boundary", "final-action"];
const messages = tenStepsTranslation("en-GB");

async function assertTenStepsContract(page: import("@playwright/test").Page) {
  await expect(page.locator("body > header[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("body > footer[data-public-shell]")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  await expect(page.getByRole("heading", { level: 1, name: "TEN STEPS. One plan." })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: messages.text[12], exact: true })).toBeVisible();
  const missionMap = page.locator('[data-ten-steps-section="mission-map"]');
  const missionList = missionMap.getByRole("list", { name: messages.text[19], exact: true });
  const missionItems = missionList.getByRole("listitem");
  await expect(missionList).toBeVisible();
  await expect(missionItems).toHaveCount(programmeMissionTitles.length);
  for (const [index, title] of programmeMissionTitles.entries()) {
    await expect(missionItems.nth(index)).toContainText(String(index + 1).padStart(2, "0"));
    await expect(missionItems.nth(index)).toContainText(title);
  }
  const accountBoundary = page.locator('[data-ten-steps-section="account-boundary"]');
  await expect(accountBoundary.getByRole("heading", { level: 2 })).toContainText(messages.text[41]);
  await expect(accountBoundary.getByRole("heading", { level: 2 })).toContainText(messages.text[42]);
  await expect(accountBoundary).toContainText(messages.text[43]);
  const finalAction = page.locator('[data-ten-steps-section="final-action"]');
  await expect(finalAction.getByRole("heading", { level: 2 })).toContainText(messages.text[46]);
  await expect(finalAction.getByRole("heading", { level: 2 })).toContainText(messages.text[47]);
  await expect(finalAction).toContainText(messages.text[48]);
  await expect(page.getByText(/UK PREVIEW|UK-ready discovery/i)).toHaveCount(0);
  await expect(page.locator("main a[href^='/casinos'], main a[href^='/bonuses'], main a[href^='/best-offers']")).toHaveCount(0);
  expect(await page.locator("[data-ten-steps-section]").evaluateAll((sections) => sections.map((section) => section.getAttribute("data-ten-steps-section")))).toEqual(approvedOrder);
}

test("signed-out 10 Steps is server visible and usable without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/10-steps`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await assertTenStepsContract(page);
  expect(await page.getByRole("heading", { level: 1 }).evaluate((element) => getComputedStyle(element).opacity)).toBe("1");
  await context.close();
});

test("10 Steps remains visible with reduced motion and hydrates without errors", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") browserErrors.push(message.text()); });
  page.on("pageerror", (error) => browserErrors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseUrl}/10-steps`, { waitUntil: "networkidle" });
  await assertTenStepsContract(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);

  const undersizedTargets = await page.locator("main a, main button").evaluateAll((targets) => targets
    .filter((target) => {
      const rect = target.getBoundingClientRect();
      const style = getComputedStyle(target);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
    })
    .map((target) => ({ text: target.textContent?.trim(), width: target.getBoundingClientRect().width, height: target.getBoundingClientRect().height })));

  expect(undersizedTargets).toEqual([]);
  expect(browserErrors).toEqual([]);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 900, height: 900 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 375, height: 667 },
  { width: 320, height: 720 },
]) {
  test(`10 Steps follows the approved order and reflows at ${viewport.width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport });
    await page.goto(`${baseUrl}/10-steps`, { waitUntil: "domcontentloaded" });
    await assertTenStepsContract(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.close();
  });
}

test("10 Steps uses the Public Shell mobile menu without duplicate chrome", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  await page.goto(`${baseUrl}/10-steps`, { waitUntil: "domcontentloaded" });
  const menu = page.getByRole("button", { name: "Open navigation" });
  await menu.click();
  await expect(page.getByRole("dialog", { name: "Site navigation" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: "Site navigation" })).not.toBeVisible();
  await expect(menu).toBeFocused();
  await page.close();
});

test("all signed-out Programme CTAs use the canonical entry", async ({ page }) => {
  await page.goto(`${baseUrl}/10-steps`, { waitUntil: "domcontentloaded" });
  const programmeLinks = page.locator("main a[href='/program?entry=start']");
  await expect(programmeLinks).toHaveCount(2);
  await expect(programmeLinks.first()).toContainText(messages.text[5]);
  const response = await page.request.get(`${baseUrl}/10-steps`);
  expect(response.headers()["link"] ?? "").not.toContain("mission=");
});
