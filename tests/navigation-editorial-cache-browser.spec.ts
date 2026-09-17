import { randomUUID } from "node:crypto";

import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { expect, test, type Page } from "@playwright/test";
import { Prisma, PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const prisma = new PrismaClient();
const casinoId = "b4200000-0000-4000-8000-000000000001";
const casinoSlug = "navigation-stage2-casino";
const casinoPath = `/en/casino/${casinoSlug}`;
const originalTitle = "Navigation Stage 2 Casino";
const mutatedTitle = "Navigation Stage 2 Cache Mutation";
const adminId = `navigation-cache-admin-${randomUUID()}`;
const adminEmail = `${adminId}@example.invalid`;
const adminPassword = "Navigation-Cache-Acceptance-42!";
let adminProfileId: string | null = null;
let totpSecret: string | null = null;
let originalSnapshot: Prisma.JsonValue | null = null;
let originalCasino: {
  status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  archivedAt: Date | null;
  updatedAt: Date;
  updatedBy: string;
} | null = null;
let originalBonuses: Array<{
  id: string;
  status: "DRAFT" | "IN_REVIEW" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";
  updatedAt: Date;
}> = [];

test.beforeAll(async () => {
  const version = await prisma.casinoVersion.findUniqueOrThrow({
    where: { casinoId_version: { casinoId, version: 1 } },
    select: { snapshot: true },
  });
  originalSnapshot = version.snapshot;
  originalCasino = await prisma.casino.findUniqueOrThrow({
    where: { id: casinoId },
    select: { status: true, archivedAt: true, updatedAt: true, updatedBy: true },
  });
  originalBonuses = await prisma.casinoBonus.findMany({
    where: { casinoId },
    select: { id: true, status: true, updatedAt: true },
  });
  await prisma.user.create({
    data: {
      id: adminId,
      name: "Navigation Cache Acceptance Admin",
      email: adminEmail,
      emailVerified: true,
      accounts: {
        create: {
          id: `credential-${adminId}`,
          issuer: "local:credential",
          accountId: adminId,
          providerId: "credential",
          password: await hashPassword(adminPassword),
        },
      },
    },
  });
  const profile = await prisma.adminUser.create({
    data: {
      userId: adminId,
      name: "Navigation Cache Acceptance Admin",
      email: adminEmail,
      role: "SUPER_ADMIN",
    },
  });
  adminProfileId = profile.id;
});

test.afterAll(async () => {
  if (originalSnapshot) {
    await prisma.casinoVersion.update({
      where: { casinoId_version: { casinoId, version: 1 } },
      data: { snapshot: originalSnapshot },
    });
  }
  for (const bonus of originalBonuses) {
    await prisma.casinoBonus.update({
      where: { id: bonus.id },
      data: { status: bonus.status, updatedAt: bonus.updatedAt },
    });
  }
  if (originalCasino) {
    await prisma.casino.update({
      where: { id: casinoId },
      data: originalCasino,
    });
  }
  if (adminProfileId) {
    await prisma.casinoRevision.deleteMany({ where: { casinoId, createdBy: adminProfileId } });
  }
  if (adminProfileId) await prisma.adminUser.deleteMany({ where: { id: adminProfileId } });
  await prisma.user.deleteMany({ where: { id: adminId } });
  await prisma.$disconnect();
});

async function authenticateAdmin(page: Page) {
  await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/(security\/enroll|two-factor)/);

  if (page.url().includes("/admin/security/enroll")) {
    await page.getByLabel("Confirm your password").fill(adminPassword);
    await page.getByRole("button", { name: "Set up authenticator" }).click();
    const encodedSecret = await page.locator(".adminMfaSecret").innerText();
    totpSecret = new TextDecoder().decode(base32.decode(encodedSecret.trim()));
    await page.getByLabel("I have stored these backup codes securely.").check();
    await page.getByLabel("6-digit code").fill(await createOTP(totpSecret).totp());
    await page.getByRole("button", { name: "Verify and activate MFA" }).click();
    await expect(page.getByText("Multi-factor authentication is active.")).toBeVisible();
    await page.getByRole("button", { name: "Continue to Admin" }).click();
  } else {
    if (!totpSecret) throw new Error("Navigation cache MFA fixture secret is unavailable");
    await page.getByLabel("6-digit code").fill(await createOTP(totpSecret).totp());
    await page.getByRole("button", { name: "Verify and continue" }).click();
  }
  await expect(page).toHaveURL(`${baseUrl}/admin`);
}

test("cache-on server partitions GEO and locale, serves a real hit, and invalidates publication withdrawal", async ({ browser }) => {
  const peContext = await browser.newContext({
    extraHTTPHeaders: { "x-vercel-ip-country": "PE" },
  });
  const pePage = await peContext.newPage();
  const first = await pePage.goto(`${baseUrl}${casinoPath}`, { waitUntil: "domcontentloaded" });
  expect(first?.status()).toBe(200);
  await expect(pePage.locator("#casino-profile-title")).toHaveText(originalTitle);
  await expect(pePage.locator('a[href^="/r/"]').first()).toBeVisible();
  await expect(pePage.getByText("Fixture Bank", { exact: true })).toBeVisible();

  const kzContext = await browser.newContext({
    extraHTTPHeaders: { "x-vercel-ip-country": "KZ" },
  });
  const kzPage = await kzContext.newPage();
  const kzResponse = await kzPage.goto(`${baseUrl}${casinoPath}`, { waitUntil: "domcontentloaded" });
  expect(kzResponse?.status()).toBe(200);
  await expect(kzPage.locator("#casino-profile-title")).toHaveText(originalTitle);
  await expect(kzPage.locator('[href^="/r/"]')).toHaveCount(0);
  await expect(kzPage.getByText("Fixture Bank", { exact: true })).toHaveCount(0);

  const enLearn = await pePage.goto(`${baseUrl}/en/learn`, { waitUntil: "domcontentloaded" });
  expect(enLearn?.status()).toBe(200);
  await expect(pePage.locator('a[href="/en/learn/casino-basics/navigation-stage2-guide"]')).toBeVisible();
  const ptLearn = await pePage.goto(`${baseUrl}/pt/learn`, { waitUntil: "domcontentloaded" });
  expect(ptLearn?.status()).toBe(200);
  await expect(pePage.locator('a[href="/pt/learn/casino-basics/navigation-stage2-guide"]')).toHaveCount(0);

  if (!originalSnapshot || Array.isArray(originalSnapshot) || typeof originalSnapshot !== "object") {
    throw new Error("Representative Casino snapshot must be an object");
  }
  await prisma.casinoVersion.update({
    where: { casinoId_version: { casinoId, version: 1 } },
    data: { snapshot: { ...originalSnapshot, title: mutatedTitle } },
  });
  await pePage.goto(`${baseUrl}${casinoPath}`, { waitUntil: "domcontentloaded" });
  await expect(pePage.locator("#casino-profile-title"), "the second request must use the warmed editorial cache").toHaveText(originalTitle);

  await authenticateAdmin(pePage);
  const current = await prisma.casino.findUniqueOrThrow({ where: { id: casinoId }, select: { updatedAt: true } });
  const withdrawal = await pePage.request.post(`${baseUrl}/api/admin/casinos/${casinoId}/action`, {
    headers: { origin: baseUrl, "content-type": "application/json" },
    data: { action: "request-changes", expectedUpdatedAt: current.updatedAt.toISOString() },
  });
  expect(withdrawal.status()).toBe(200);

  const afterInvalidation = await pePage.goto(`${baseUrl}${casinoPath}`, { waitUntil: "domcontentloaded" });
  expect(afterInvalidation?.status()).toBe(404);
  await expect(pePage.locator("#casino-profile-title")).toHaveCount(0);
  await peContext.close();
  await kzContext.close();
});
