import { expect, test } from "@playwright/test";

import { prisma } from "../lib/db/prisma";

const articleId = "00000000-0000-4000-8000-000000000952";
const actorId = "00000000-0000-4000-8000-000000000953";
const slug = "learn-apply-browser-acceptance";
const path = `/learn/casino-basics/${slug}`;

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
});

test.afterAll(async () => {
  await prisma.article.deleteMany({ where: { id: articleId, slug } });
  await prisma.$disconnect();
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
