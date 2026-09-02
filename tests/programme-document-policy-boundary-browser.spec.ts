import { expect, test } from "@playwright/test";

const allowed = "camera=(), microphone=(self), geolocation=(), payment=(), usb=()";
const denied = "camera=(), microphone=(), geolocation=(), payment=(), usb=()";

test("crossing public and Programme boundaries reloads the top-level document so Permissions-Policy changes apply", async ({ page }) => {
  const publicResponse = await page.goto("/es-es", { waitUntil: "domcontentloaded" });
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

  // The Programme shell may intentionally keep ordinary public links unprefixed
  // when public-market publication authority is not being carried through the
  // Programme presentation context. This regression is about the document-policy
  // boundary, not about choosing /learn versus /es/learn.
  const learnLink = page.locator('header a[href$="/learn"]:visible').first();
  await expect(learnLink).toBeVisible();
  const learnHref = await learnLink.getAttribute("href");
  expect(learnHref).toBeTruthy();
  expect(learnHref).not.toContain("/program");

  const publicNavigation = page.waitForNavigation({ waitUntil: "domcontentloaded" });
  await learnLink.click();
  const returnResponse = await publicNavigation;

  const expectedPublicPathname = learnHref === "/learn" ? "/en-gb/learn" : learnHref;
  expect(new URL(page.url()).pathname).toBe(expectedPublicPathname);
  expect(returnResponse?.headers()["permissions-policy"]).toBe(denied);
  expect(await page.evaluate(() => "__programmePolicyDocumentMarker" in window)).toBe(false);
});
