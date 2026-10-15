import { randomUUID } from "node:crypto";

import { base32 } from "@better-auth/utils/base32";
import { createOTP } from "@better-auth/utils/otp";
import { expect, test, type Page } from "@playwright/test";
import { hashPassword } from "better-auth/crypto";

import { prisma } from "../lib/db/prisma";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const articleId = "00000000-0000-4000-8000-000000000952";
const actorId = "00000000-0000-4000-8000-000000000953";
const slug = "learn-apply-browser-acceptance";
const path = `/learn/casino-basics/${slug}`;
const adminUserId = `learn-apply-browser-admin-${randomUUID()}`;
const adminEmail = `${adminUserId}@example.invalid`;
const adminPassword = "Learn-Apply-Browser-Acceptance-42!";
let adminProfileId: string | null = null;

function assertDisposableDatabase(value: string | undefined) {
  if (!value) throw new Error("DATABASE_URL is required");
  const url = new URL(value);
  const loopback = new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname);
  const ciService = process.env.CI === "true" && url.hostname === "postgres";
  if (!url.pathname.slice(1).endsWith("_ci") || (!loopback && !ciService)) {
    throw new Error("learn_apply browser acceptance requires a disposable _ci database");
  }
}

test.beforeAll(async () => {
  assertDisposableDatabase(process.env.DATABASE_URL);
  await prisma.article.deleteMany({ where: { OR: [{ id: articleId }, { slug }] } });
  await prisma.article.create({
    data: {
      id: articleId,
      slug,
      locale: "en-GB",
      title: "Learn Apply Responsive Acceptance",
      excerpt: "A bounded browser fixture proving responsive hero and inline Article images.",
      category: "casino-basics",
      tags: ["Learning", "Acceptance"],
      status: "PUBLISHED",
      bodyBlocks: [
        { id: "intro", type: "paragraph", text: "The public Article remains readable and responsive at every supported viewport." },
        { id: "visual", type: "image", url: "/learn/magazine-shelf-charles-postiaux.jpg", alt: "Editorial magazines on a shelf", caption: "A responsive inline Article image." },
      ],
      heroImageUrl: "/learn/welcome-bonus-feature-cover.png",
      heroImageAlt: "A Learn editorial feature cover",
      seoTitle: "Learn Apply Responsive Acceptance",
      seoDescription: "Browser acceptance for responsive autonomous Learn publication images.",
      readingTime: "3 min read",
      difficulty: "Beginner",
      publishedAt: new Date(),
      lastReviewedAt: new Date(),
      createdBy: actorId,
      updatedBy: actorId,
    },
  });
  await prisma.user.create({
    data: {
      id: adminUserId,
      name: "Learn Apply Browser Admin",
      email: adminEmail,
      emailVerified: true,
      accounts: {
        create: {
          id: `credential-${adminUserId}`,
          issuer: "local:credential",
          accountId: adminUserId,
          providerId: "credential",
          password: await hashPassword(adminPassword),
        },
      },
    },
  });
  const profile = await prisma.adminUser.create({
    data: { userId: adminUserId, name: "Learn Apply Browser Admin", email: adminEmail, role: "ADMIN" },
  });
  adminProfileId = profile.id;
});

async function authenticateAdmin(page: Page) {
  await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.getByLabel("Email").fill(adminEmail);
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/security\/enroll/);
  await page.getByLabel("Confirm your password").fill(adminPassword);
  await page.getByRole("button", { name: "Set up authenticator" }).click();
  const encodedSecret = await page.locator(".adminMfaSecret").innerText();
  const totpSecret = new TextDecoder().decode(base32.decode(encodedSecret.trim()));
  await page.getByLabel("I have stored these backup codes securely.").check();
  await page.getByLabel("6-digit code").fill(await createOTP(totpSecret).totp());
  await page.getByRole("button", { name: "Verify and activate MFA" }).click();
  await expect(page.getByText("Multi-factor authentication is active.")).toBeVisible();
  await page.getByRole("button", { name: "Continue to Admin" }).click();
  await expect(page).toHaveURL(`${baseUrl}/admin`);
}

// The guide is written straight through Prisma, so the server's editorial cache never hears of
// it. Every render of it still fills the shared Learn list: Read next reads the same `take: 100`
// list as the Learn index (15 Oct 2026), and that entry lives up to 60 seconds. Retire the guide
// the way an editor does: the Admin archive action invalidates the Learn editorial cache tag
// inside the server, so the empty-catalogue Learning Center spec that runs next reads a fresh
// list whatever the cache held before.
test.afterAll(async ({ browser }) => {
  try {
    const context = await browser.newContext();
    try {
      const page = await context.newPage();
      await authenticateAdmin(page);
      const current = await prisma.article.findUniqueOrThrow({ where: { id: articleId }, select: { updatedAt: true } });
      const archive = await page.request.post(`${baseUrl}/api/admin/articles/${articleId}/action`, {
        headers: { origin: baseUrl, "content-type": "application/json" },
        data: { action: "archive", expectedUpdatedAt: current.updatedAt.toISOString() },
      });
      expect(archive.status()).toBe(200);
    } finally {
      await context.close();
    }
  } finally {
    await prisma.contentRevision.deleteMany({ where: { entityType: "article", entityId: articleId } });
    await prisma.article.deleteMany({ where: { id: articleId, slug } });
    if (adminProfileId) await prisma.adminUser.deleteMany({ where: { id: adminProfileId } });
    await prisma.user.deleteMany({ where: { id: adminUserId } });
    await prisma.$disconnect();
  }
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 320, height: 720 },
] as const) {
  test(`published Article images remain visible without horizontal overflow at ${viewport.width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    const response = await page.goto(path, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator(`article[data-article-id="${articleId}"][data-article-updated-at]`)).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Learn Apply Responsive Acceptance");
    await expect(page.locator("article > header img")).toHaveAttribute("alt", "A Learn editorial feature cover");
    await expect(page.locator("figure img")).toHaveAttribute("alt", "Editorial magazines on a shelf");
    const geometry = await page.evaluate(() => ({
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      images: Array.from(document.querySelectorAll<HTMLImageElement>("article img")).map((image) => {
        const rect = image.getBoundingClientRect();
        return { left: rect.left, right: rect.right, naturalWidth: image.naturalWidth };
      }),
      viewportWidth: document.documentElement.clientWidth,
    }));
    expect(geometry.overflow).toBeLessThanOrEqual(1);
    expect(geometry.images.length).toBeGreaterThanOrEqual(2);
    for (const image of geometry.images) {
      expect(image.naturalWidth).toBeGreaterThan(0);
      expect(image.left).toBeGreaterThanOrEqual(-1);
      expect(image.right).toBeLessThanOrEqual(geometry.viewportWidth + 1);
    }
    expect(errors).toEqual([]);
  });
}
