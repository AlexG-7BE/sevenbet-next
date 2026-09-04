import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Browser, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const capture = process.env.MEDIA_PRESENTATION_SCREENSHOTS === "1";
const evidenceDirectory = path.join(process.cwd(), "docs", "02_Product_Design", "qa", "media-presentation-and-admin-01");
const offerNames = ["21 Privé", "Skol Casino", "Slotnite", "Hello Casino", "G'day Casino", "Diamond7"];
const profileSlugs = ["skol-casino", "slotnite", "hello-casino", "21-prive"];

async function newPage(browser: Browser, width: number, height: number) {
  return browser.newPage({
    viewport: { width, height },
    isMobile: width <= 430,
    hasTouch: width <= 430,
    extraHTTPHeaders: { "x-vercel-ip-country": "KZ" },
  });
}

async function open(page: Page, pathname: string) {
  const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  expect(response?.status(), pathname).toBe(200);
  await expect(page.locator("main")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), pathname).toBeLessThanOrEqual(1);
  const html = await page.content();
  expect(html, `${pathname}: raw tracking URL`).not.toMatch(/go\.superflypartners\.net/i);
  expect(html, `${pathname}: demo identity`).not.toMatch(/\/casino\/demo-|Fictional operator/i);
  expect(html, `${pathname}: runtime failure`).not.toMatch(/Application error|Internal Server Error/i);
}

async function expectNoTermCollision(page: Page, pathname: string) {
  const rows = page.locator("#offer-evidence dl").first().locator(":scope > div");
  await expect(rows.first(), pathname).toBeVisible();
  for (const row of await rows.all()) {
    const collision = await row.evaluate((node) => {
      const label = node.querySelector("dt")?.getBoundingClientRect();
      const value = node.querySelector("dd")?.getBoundingClientRect();
      if (!label || !value) return true;
      return label.left < value.right && label.right > value.left && label.top < value.bottom && label.bottom > value.top;
    });
    expect(collision, `${pathname}: label/value collision`).toBe(false);
  }
}

test("all six Bonus records use coherent placement-aware media", async ({ browser }) => {
  test.setTimeout(180_000);
  for (const [width, height] of [[390, 844], [430, 932], [768, 1024], [1024, 900], [1280, 900], [1440, 1000]] as const) {
    const page = await newPage(browser, width, height);
    await open(page, "/en/bonuses");
    const shortlist = page.locator('section[aria-labelledby="bonus-shortlist-title"]');
    const cards = shortlist.locator("article");
    const media = cards.locator("[data-offer-media=bonus]");
    await expect(cards, `${width}px: six Bonus cards`).toHaveCount(6);
    await expect(media, `${width}px: six media stages`).toHaveCount(6);
    await expect(cards.locator('[data-offer-media="bonus"][data-media-mode="CONTAIN"]')).toHaveCount(4);
    await expect(cards.locator('[data-offer-media="bonus"][data-media-mode="COMPOSED"]')).toHaveCount(2);
    const stageHeights = await media.evaluateAll((nodes) => nodes.map((node) => Math.round(node.getBoundingClientRect().height)));
    expect(new Set(stageHeights).size, `${width}px: coherent media heights`).toBe(1);
    for (const image of await media.locator("img").all()) {
      expect(await image.evaluate((node) => getComputedStyle(node).objectFit), `${width}px: no distorted media`).not.toBe("fill");
    }
    if (capture && (width === 390 || width === 1440)) {
      await mkdir(evidenceDirectory, { recursive: true });
      await shortlist.screenshot({ path: path.join(evidenceDirectory, `bonuses-${width}.png`) });
    }
    await page.close();
  }
});

test("Best Offers keeps all six records and composes Slotnite in the shared media renderer", async ({ browser }) => {
  test.setTimeout(180_000);
  for (const [width, height] of [[390, 844], [430, 932], [768, 1024], [1024, 900], [1280, 900], [1440, 1000]] as const) {
    const page = await newPage(browser, width, height);
    await open(page, "/en/best-offers");
    for (const name of offerNames) await expect(page.getByText(name, { exact: false }).first(), `${width}px: ${name}`).toBeVisible();
    const media = page.locator('[data-runtime-renderer="best-offers"] [data-offer-media]');
    await expect(media).toHaveCount(3);
    await expect(page.locator('[data-runtime-renderer="best-offers"] [data-offer-media][data-media-state="presented"]')).toHaveCount(3);
    await expect(page.locator('[data-runtime-renderer="best-offers"] [data-offer-media][data-media-mode="COMPOSED"]')).toHaveCount(1);
    for (const image of await media.locator("img").all()) {
      expect(await image.evaluate((node) => getComputedStyle(node).objectFit), `${width}px: no distorted media`).not.toBe("fill");
    }
    if (capture && width === 1440) {
      await mkdir(evidenceDirectory, { recursive: true });
      await page.locator('[data-runtime-renderer="best-offers"] #shortlist').screenshot({ path: path.join(evidenceDirectory, "best-offers-1440.png") });
    }
    await page.close();
  }
});

test("long review evidence wraps without collisions and Slotnite payout evidence is deduplicated", async ({ browser }) => {
  test.setTimeout(240_000);
  for (const [width, height] of [[390, 844], [430, 932], [768, 1024], [1024, 900], [1280, 900], [1440, 1000]] as const) {
    const page = await newPage(browser, width, height);
    for (const slug of profileSlugs) {
      const pathname = `/en/casino/${slug}`;
      await open(page, pathname);
      await expect(page.locator('nav[aria-label="Current review"]')).toBeVisible();
      await expectNoTermCollision(page, pathname);
      const actions = page.locator("main .commercialOutboundPrimary:visible");
      if (await actions.count()) {
        const actionBox = await actions.first().boundingBox();
        expect(actionBox?.x ?? -1, `${pathname}: CTA left edge`).toBeGreaterThanOrEqual(0);
        expect((actionBox?.x ?? width) + (actionBox?.width ?? width), `${pathname}: CTA right edge`).toBeLessThanOrEqual(width + 1);
      }
      if (slug === "slotnite") {
        const hero = page.locator('aside[data-media-ratio="ultra-wide"]');
        await expect(hero).toHaveAttribute("data-media-mode", "COMPOSED");
        const payout = page.locator("#offer-evidence dl").first().locator("div").filter({ has: page.locator("dt", { hasText: "Payout" }) }).first().locator("dd");
        const text = await payout.innerText();
        expect(text.match(/Pending review 24–48 hours/g)?.length ?? 0).toBe(1);
        if (capture && (width === 390 || width === 1440)) {
          await mkdir(evidenceDirectory, { recursive: true });
          await hero.screenshot({ path: path.join(evidenceDirectory, `slotnite-hero-${width}.png`) });
          await page.locator("#offer-evidence").screenshot({ path: path.join(evidenceDirectory, `slotnite-terms-${width}.png`) });
        }
      }
    }
    await page.close();
  }
});

test("all eight real Casino profiles smoke without inventory, CTA, GEO or Programme leakage", async ({ browser }) => {
  test.setTimeout(180_000);
  const page = await newPage(browser, 1024, 900);
  for (const slug of ["betsson", "skol-casino", "hello-casino", "gday-casino", "diamond7", "dragonbet", "21-prive", "slotnite"]) {
    await open(page, `/en/casino/${slug}`);
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toBeVisible();
  }
  await open(page, "/en/program");
  await expect(page.locator("main")).toBeVisible();
  await page.close();
});
