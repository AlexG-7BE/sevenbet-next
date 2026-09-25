import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";
import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const prisma = new PrismaClient();
const fixtureUserId = `customer-core-browser-${randomUUID()}`;
const fixtureEmail = `${fixtureUserId}@example.invalid`;
const fixturePassword = "Customer-Core-Browser-Mfa-42!";
let fixtureAdminId: string | null = null;
let fixtureTotpSecret: string | null = null;

test.beforeAll(async () => {
  await prisma.user.create({
    data: {
      id: fixtureUserId,
      name: "Customer Core Browser Admin",
      email: fixtureEmail,
      emailVerified: true,
      accounts: {
        create: {
          id: `credential-${fixtureUserId}`,
          issuer: "local:credential",
          accountId: fixtureUserId,
          providerId: "credential",
          password: await hashPassword(fixturePassword),
        },
      },
    },
  });
  const admin = await prisma.adminUser.create({
    data: {
      userId: fixtureUserId,
      name: "Customer Core Browser Admin",
      email: fixtureEmail,
      role: "SUPER_ADMIN",
    },
  });
  fixtureAdminId = admin.id;
});

test.afterAll(async () => {
  if (fixtureAdminId) await prisma.adminUser.deleteMany({ where: { id: fixtureAdminId } });
  await prisma.user.deleteMany({ where: { id: fixtureUserId } });
  await prisma.$disconnect();
});

async function authenticateAdmin(page: Page, target: string) {
  await page.goto(`${baseUrl}${target}`, { waitUntil: "domcontentloaded" });
  if (!page.url().includes("/admin/login")) return;

  await page.getByLabel("Email").fill(fixtureEmail);
  await page.getByLabel("Password").fill(fixturePassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/(security\/enroll|two-factor)/);

  if (page.url().includes("/admin/security/enroll")) {
    await page.getByLabel("Confirm your password").fill(fixturePassword);
    await page.getByRole("button", { name: "Set up authenticator" }).click();
    const encodedSecret = await page.locator(".adminMfaSecret").innerText();
    fixtureTotpSecret = new TextDecoder().decode(base32.decode(encodedSecret.trim()));
    await page.getByLabel("I have stored these backup codes securely.").check();
    await page.getByLabel("6-digit code").fill(await createOTP(fixtureTotpSecret).totp());
    await page.getByRole("button", { name: "Verify and activate MFA" }).click();
    await expect(page.getByText("Multi-factor authentication is active.")).toBeVisible();
    await page.getByRole("button", { name: "Continue to Admin" }).click();
  } else {
    await expect(page.getByRole("heading", { name: "Verify Admin sign-in" })).toBeVisible();
    if (!fixtureTotpSecret) throw new Error("Admin MFA fixture secret is unavailable");
    await page.getByLabel("6-digit code").fill(await createOTP(fixtureTotpSecret).totp());
    await page.getByRole("button", { name: "Verify and continue" }).click();
  }

  await expect(page).toHaveURL(new RegExp(`${target.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`));
}

test("undecided visitors see the analytics choice on arrival; Not now holds for the tab; the Programme stays clear", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await context.addInitScript(() => window.sessionStorage.setItem("b4g_privacy_choice_under_automation", "1"));
  const page = await context.newPage();
  await page.goto(`${baseUrl}/privacy`, { waitUntil: "domcontentloaded" });
  const choices = page.getByRole("dialog", { name: "Analytics privacy choices" });
  await expect(choices).toBeVisible();
  // A choice that opens by itself is non-modal and leaves focus on the page.
  expect(await choices.evaluate((dialog) => dialog.contains(document.activeElement))).toBe(false);
  await choices.getByRole("button", { name: "Not now" }).click();
  await expect(choices).toHaveCount(0);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(500);
  await expect(page.getByRole("dialog", { name: "Analytics privacy choices" })).toHaveCount(0);
  expect((await context.cookies()).find((cookie) => cookie.name === "b4g_analytics_consent")).toBeUndefined();
  await context.close();

  const programme = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await programme.addInitScript(() => window.sessionStorage.setItem("b4g_privacy_choice_under_automation", "1"));
  const programmePage = await programme.newPage();
  await programmePage.goto(`${baseUrl}/program`, { waitUntil: "domcontentloaded" });
  await expect(programmePage.locator('[data-public-programme-renderer="program-ai"]')).toHaveCount(1);
  await programmePage.waitForTimeout(800);
  await expect(programmePage.getByRole("dialog", { name: "Analytics privacy choices" })).toHaveCount(0);
  await programme.close();
});

test("affirmative analytics consent persists, emits a minimal event, and deduplicates replay", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const observedPayloads: unknown[] = [];
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/analytics/events")) {
      observedPayloads.push(request.postDataJSON());
    }
  });
  const response = await page.goto(`${baseUrl}/privacy`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  // Founder decision 25 Sep 2026: the choice lives in the footer, not a floating tab, and opens a compact site-style banner.
  await expect(page.locator("footer[data-public-shell='footer'] [data-privacy-choices-trigger]")).toHaveCount(1);
  await expect(page.locator("[data-privacy-choices-trigger]")).toHaveCount(1);
  await page.getByRole("button", { name: "Privacy choices" }).click();
  const choices = page.getByRole("dialog", { name: "Analytics privacy choices" });
  await expect(choices).toBeVisible();
  await expect(choices.getByRole("button", { name: "Not now" })).toBeFocused();
  const [decline, allow, banner] = await Promise.all([choices.getByRole("button", { name: "Decline analytics" }).boundingBox(), choices.getByRole("button", { name: "Allow analytics" }).boundingBox(), choices.boundingBox()]);
  expect(Math.round(decline!.width)).toBe(Math.round(allow!.width));
  expect(Math.round(decline!.height)).toBe(Math.round(allow!.height));
  // The open banner was 364px (55% of a phone screen) before the redesign.
  expect(banner!.height).toBeLessThanOrEqual(220);
  await page.keyboard.press("Escape");
  await expect(choices).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Privacy choices" })).toBeFocused();
  await page.getByRole("button", { name: "Privacy choices" }).click();
  await choices.getByRole("button", { name: "Decline analytics" }).click();
  await expect(page.getByRole("button", { name: "Privacy choices" })).toBeVisible();
  expect(observedPayloads).toHaveLength(0);

  await page.getByRole("button", { name: "Privacy choices" }).click();
  const ingestion = page.waitForResponse((candidate) => candidate.url().endsWith("/api/analytics/events"));
  await page.getByRole("button", { name: "Allow analytics" }).click();
  expect((await ingestion).status()).toBe(202);
  await expect.poll(() => observedPayloads.length).toBe(1);
  const serialized = JSON.stringify(observedPayloads[0]);
  expect(serialized).toContain('"name":"page_viewed"');
  expect(serialized).not.toMatch(/email|password|auth.?token|affiliate.?token|programme.?answer/i);
  const cookies = await page.context().cookies();
  expect(cookies.find((cookie) => cookie.name === "b4g_analytics_consent")?.value).toMatch(/^v1\.granted\./);
  expect(cookies.find((cookie) => cookie.name === "b4g_analytics_anonymous")?.httpOnly).toBe(true);
  expect(cookies.find((cookie) => cookie.name === "b4g_analytics_session")?.httpOnly).toBe(true);

  const event = {
    eventId: randomUUID(),
    schemaVersion: 1,
    name: "page_viewed",
    occurredAt: new Date().toISOString(),
    pagePath: "/privacy",
    locale: "en",
  };
  const send = () => page.request.post(`${baseUrl}/api/analytics/events`, {
    headers: { origin: baseUrl, "content-type": "application/json" },
    data: { events: [event] },
  });
  const first = await send();
  const second = await send();
  expect(first.status()).toBe(202);
  expect((await first.json()).accepted).toBe(1);
  expect(second.status()).toBe(202);
  expect((await second.json()).duplicate).toBe(1);

  const partial = await page.request.post(`${baseUrl}/api/analytics/events`, {
    headers: { origin: baseUrl, "content-type": "application/json" },
    data: { events: [{ ...event, eventId: randomUUID() }, { ...event, eventId: randomUUID(), email: "must-not-be-accepted@example.invalid" }] },
  });
  expect(partial.status()).toBe(207);
  expect((await partial.json()).rejected).toHaveLength(1);
  const crossOrigin = await page.request.post(`${baseUrl}/api/analytics/events`, {
    headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
    data: { events: [{ ...event, eventId: randomUUID() }] },
  });
  expect(crossOrigin.status()).toBe(403);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("Customer Core public/admin security boundaries deny unauthenticated and forged requests", async ({ request }) => {
  for (const path of ["/api/admin/email/campaigns", "/api/admin/email/templates"]) {
    const response = await request.get(`${baseUrl}${path}`);
    expect([401, 403]).toContain(response.status());
    expect(await response.text()).not.toMatch(/@example\.|recipientEmail|customer-core-browser/i);
  }
  expect((await request.get(`${baseUrl}/api/customer/email-preference`)).status()).toBe(401);
  expect((await request.post(`${baseUrl}/api/customer/email-preference`, {
    headers: { origin: "https://attacker.invalid", "content-type": "application/json" },
    data: { marketingAllowed: true, source: "ACCOUNT_PREFERENCES" },
  })).status()).toBe(403);
  expect((await request.post(`${baseUrl}/api/email/unsubscribe`, {
    headers: { "content-type": "application/json" },
    data: { token: "tampered" },
  })).status()).toBe(403);
  expect((await request.post(`${baseUrl}/api/email/unsubscribe`, {
    headers: { origin: baseUrl, "content-type": "application/json" },
    data: { token: "tampered" },
  })).status()).toBe(400);
  const forgedWebhook = await request.post(`${baseUrl}/api/email/webhooks/resend`, {
    headers: {
      "content-type": "application/json",
      "svix-id": "evt_forged",
      "svix-timestamp": String(Math.floor(Date.now() / 1000)),
      "svix-signature": "v1,ZmFrZQ==",
    },
    data: { type: "email.delivered", created_at: new Date().toISOString(), data: { email_id: "fake" } },
  });
  expect(forgedWebhook.status()).toBe(404);
  expect((await request.get(`${baseUrl}/api/internal/cron/customer-lifecycle`)).status()).toBe(401);
});

test("authorized Admin operational domains and simplified navigation render responsively", async ({ page }) => {
  await authenticateAdmin(page, "/admin/customers");
  await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
  const primaryNavigation = page.getByRole("navigation", { name: "Primary Admin navigation" });
  await expect(primaryNavigation.locator("a")).toHaveText([
    "Dashboard",
    "Programs",
    "Learning Center",
    "Casinos",
    "Affiliate Operations",
    "Commercial",
    "Customers",
    "Analytics",
    "Email",
    "Email Templates",
  ]);
  await expect(page.getByText(/preview token remains/i)).toHaveCount(0);

  for (const [path, heading] of [
    ["/admin", "Operations Dashboard"],
    ["/admin/programs", "Programs"],
    ["/admin/learning", "Learning Center"],
    ["/admin/casinos", "Casinos"],
    ["/admin/affiliate", "Affiliate Operations"],
    ["/admin/commercial", "Commercial Pipeline"],
    ["/admin/customers", "Customers"],
    ["/admin/analytics?view=overview&range=7", "Analytics"],
    ["/admin/analytics?view=programme&range=30", "Analytics"],
    ["/admin/analytics?view=commercial&range=30", "Analytics"],
    ["/admin/analytics?view=email&range=30", "Analytics"],
    ["/admin/email", "Email"],
    ["/admin/templates", "Email Templates"],
  ] as const) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  }

  for (const [legacyPath, replacement] of [
    ["/admin/program-settings", "/admin/programs"],
    ["/admin/bonuses", "/admin/casinos"],
    ["/admin/media-operations", "/admin/casinos"],
  ] as const) {
    await page.goto(`${baseUrl}${legacyPath}`, { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(new RegExp(`${replacement}$`));
  }
  const retiredSettings = await page.goto(`${baseUrl}/admin/settings`, { waitUntil: "domcontentloaded" });
  expect(retiredSettings?.status()).toBe(404);
  const retiredApi = await page.request.get(`${baseUrl}/api/admin/settings`);
  expect(retiredApi.status()).toBe(410);
  expect(await retiredApi.json()).toMatchObject({ code: "LEGACY_CMS_RETIRED" });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.goto(`${baseUrl}/admin/learning`, { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.goto(`${baseUrl}/admin/templates`, { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await expect(page.getByRole("button", { name: /Save as new version/i })).toBeVisible();
});

test("Commercial dashboard and reporting directory expose distinct truthful contracts", async ({ page }) => {
  await authenticateAdmin(page, "/admin/analytics?view=commercial&range=30");

  await page.goto(`${baseUrl}/admin/analytics?view=commercial&range=30`, { waitUntil: "domcontentloaded" });
  for (const label of [
    "Casino views",
    "Offer views",
    "Commercial card views",
    "View selections",
    "Casino review clicks",
    "CTA clicks",
    "Successful outbound",
    "CTR",
  ]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("heading", { name: "Detailed runtime attribution" })).toBeVisible();
  await expect(page.getByText(/must not be added to these figures/)).toBeVisible();

  await page.goto(`${baseUrl}/admin/commercial/analytics`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1, name: "Commercial reporting" })).toBeVisible();
  await expect(page.getByText("Detailed runtime attribution", { exact: true })).toBeVisible();
  await expect(page.getByText("Aggregate-only accounting", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "No verified registrations, FTDs, revenue or commission source" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open fixed dashboard" })).toHaveAttribute("href", /\/admin\/analytics\?view=commercial/);
  await expect(page.getByRole("link", { name: "Open 30-day aggregate report" })).toHaveAttribute("href", "/api/admin/affiliate/outbound-clicks");
  await expect(page.locator("body")).not.toContainText(/no verified clicks/i);

  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("unsubscribe confirmation remains clear and mobile-safe without disclosing identity", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`${baseUrl}/unsubscribe?status=invalid`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/could not verify/i);
  await expect(page.locator("body")).not.toContainText(/@example\.|userId|recipientEmail/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
