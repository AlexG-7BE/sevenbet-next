import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const adminPreviewToken = "ops-ci-admin-token-not-used-by-production";
const prisma = new PrismaClient();
const fixtureUserId = `customer-core-browser-${randomUUID()}`;
let createdFixture = false;
let fixtureAdminId: string | null = null;

test.beforeAll(async () => {
  const linkedSuperAdmins = await prisma.adminUser.findMany({
    where: { role: "SUPER_ADMIN", userId: { not: null } },
    select: { id: true },
    take: 2,
  });
  if (linkedSuperAdmins.length > 1) throw new Error("Browser fixture requires one unambiguous linked Super Admin");
  if (linkedSuperAdmins.length === 0) {
    await prisma.user.create({
      data: {
        id: fixtureUserId,
        name: "Customer Core Browser Admin",
        email: `${fixtureUserId}@example.invalid`,
        emailVerified: true,
      },
    });
    const admin = await prisma.adminUser.create({
      data: {
        userId: fixtureUserId,
        name: "Customer Core Browser Admin",
        email: `${fixtureUserId}@example.invalid`,
        role: "SUPER_ADMIN",
      },
    });
    fixtureAdminId = admin.id;
    createdFixture = true;
  }
});

test.afterAll(async () => {
  if (createdFixture) {
    if (fixtureAdminId) await prisma.adminUser.deleteMany({ where: { id: fixtureAdminId } });
    await prisma.user.deleteMany({ where: { id: fixtureUserId } });
  }
  await prisma.$disconnect();
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
  await page.getByRole("button", { name: "Privacy choices" }).click();
  const choices = page.getByRole("dialog", { name: "Analytics privacy choices" });
  await expect(choices).toBeVisible();
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

test("authorized Customer, Analytics, Email, and Templates surfaces render responsively", async ({ page }) => {
  await page.setExtraHTTPHeaders({ "x-sevenbet-admin-token": adminPreviewToken });
  for (const [path, heading] of [
    ["/admin/customers", "Customers"],
    ["/admin/analytics?view=overview&range=7", "Analytics"],
    ["/admin/analytics?view=programme&range=30", "Analytics"],
    ["/admin/analytics?view=commercial&range=30", "Analytics"],
    ["/admin/analytics?view=email&range=30", "Analytics"],
    ["/admin/email", "Email"],
    ["/admin/templates", "Templates"],
  ] as const) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), path).toBe(200);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/i);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/admin/customers`, { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await page.goto(`${baseUrl}/admin/templates`, { waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
  await expect(page.getByRole("button", { name: /Save as new version/i })).toBeVisible();
});

test("unsubscribe confirmation remains clear and mobile-safe without disclosing identity", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`${baseUrl}/unsubscribe?status=invalid`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/could not verify/i);
  await expect(page.locator("body")).not.toContainText(/@example\.|userId|recipientEmail/i);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});
