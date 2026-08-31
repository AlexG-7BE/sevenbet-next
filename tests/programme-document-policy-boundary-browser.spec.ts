import { expect, test } from "@playwright/test";

const allowed = "camera=(), microphone=(self), geolocation=(), payment=(), usb=()";
const denied = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";

test("crossing public and Programme boundaries reloads the top-level document so Permissions-Policy changes apply", async ({ page }) => {
  const publicResponse = await page.goto("/es/", { waitUntil: "domcontentloaded" });
  expect(publicResponse?.status()).toBe(200);
  expect(publicResponse?.headers()["permissions-policy"]).toBe(denied);

  await page.evaluate(() => {
    (window as typeof window & { __programmePolicyDocumentMarker?: string }).__programmePolicyDocumentMarker = "public-document";
  });

  const programmeLink = page.locator('header a[href="/es/program"]:visible').first();
  await expect(programmeLink).toBeVisible();
  const programmeNavigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await programmeLink.click();
  const programmeResponse = await programmeNavigation;

  expect(new URL(page.url()).pathname).toBe("/es/program");
  expect(programmeResponse?.headers()["permissions-policy"]).toBe(allowed);
  expect(await page.evaluate(() => "__programmePolicyDocumentMarker" in window)).toBe(false);

  await page.evaluate(() => {
    (window as typeof window & { __programmePolicyDocumentMarker?: string }).__programmePolicyDocumentMarker = "programme-document";
  });

  const learnLink = page.locator('header a[href="/es/learn"]:visible').first();
  await expect(learnLink).toBeVisible();
  const publicNavigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await learnLink.click();
  const returnResponse = await publicNavigation;

  expect(new URL(page.url()).pathname).toBe("/es/learn");
  expect(returnResponse?.headers()["permissions-policy"]).toBe(denied);
  expect(await page.evaluate(() => "__programmePolicyDocumentMarker" in window)).toBe(false);
});
