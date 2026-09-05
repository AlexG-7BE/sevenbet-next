import { expect, test, type Locator } from "@playwright/test";
import { readFileSync } from "node:fs";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const requireAuthorized = process.env.COMMERCIAL_CREATIVE_AUTHORIZED === "1";
const requireBlocked = process.env.COMMERCIAL_CREATIVE_BLOCKED === "1";
const requiredWidths = [390, 430, 768, 1024, 1280, 1440] as const;

async function decodedImageGeometry(image: Locator) {
  await image.evaluate(async (element) => {
    const node = element as HTMLImageElement;
    if (!node.complete) await new Promise<void>((resolve) => node.addEventListener("load", () => resolve(), { once: true }));
    await node.decode();
  });
  return image.evaluate((element) => {
    const node = element as HTMLImageElement;
    const imageRect = node.getBoundingClientRect();
    const figure = node.closest("figure");
    if (!figure) throw new Error("Commercial image is missing its figure");
    const figureRect = figure.getBoundingClientRect();
    return {
      figureHeight: figureRect.height,
      figureWidth: figureRect.width,
      imageHeight: imageRect.height,
      imageWidth: imageRect.width,
      naturalHeight: node.naturalHeight,
      naturalWidth: node.naturalWidth,
      objectFit: getComputedStyle(node).objectFit,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
}

function familyHeightLimit(family: string) {
  if (family === "CARD") return 350;
  if (family === "MOBILE_LANDSCAPE") return 200;
  if (family === "STRIP") return 145;
  if (family === "WIDE") return 190;
  return 180;
}

test("mixed commercial fixtures preserve physical geometry at every required width", async ({ browser }) => {
  for (const width of requiredWidths) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 844 : 900 } });
    const response = await page.goto(`${baseUrl}/en/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status(), `${width}px response`).toBe(200);

    for (const family of ["CARD", "MOBILE_LANDSCAPE", "STRIP", "WIDE"]) {
      if (family === "WIDE") {
        const wideResponse = await page.goto(`${baseUrl}/en/best-offers?visualFixture=true`, { waitUntil: "networkidle" });
        expect(wideResponse?.status(), `${width}px wide response`).toBe(200);
      }
      const figure = page.locator(`figure[data-presentation-family="${family}"]`).first();
      await expect(figure, `${width}px ${family}`).toBeAttached();
      await figure.scrollIntoViewIfNeeded();
      await expect(figure).toBeVisible();
      const geometry = await decodedImageGeometry(figure.locator("img").first());
      const effectiveFamily = width < 768
        ? await figure.getAttribute("data-mobile-presentation-family") ?? family
        : family;
      expect(geometry.objectFit).toBe("contain");
      expect(geometry.overflow, `${width}px ${family} overflow`).toBe(false);
      expect(geometry.imageWidth, `${width}px ${family} horizontal upscale`).toBeLessThanOrEqual(geometry.naturalWidth + 1);
      expect(geometry.imageHeight, `${width}px ${family} vertical upscale`).toBeLessThanOrEqual(geometry.naturalHeight + 1);
      expect(
        Math.abs(geometry.imageWidth / geometry.imageHeight - geometry.naturalWidth / geometry.naturalHeight),
        `${width}px ${family} distortion`,
      ).toBeLessThan(.025);
      expect(geometry.figureHeight, `${width}px ${effectiveFamily} stage`).toBeLessThan(familyHeightLimit(effectiveFamily));
      await expect(figure.locator("figcaption")).toBeVisible();
    }
    await page.close();
  }
});

test("blocked promotional fixtures remain visible and inert", async ({ page }) => {
  test.skip(requireAuthorized && !requireBlocked, "Run this assertion in a local or explicitly blocked commercial state.");
  for (const path of ["/en/bonuses?visualFixture=true", "/en/best-offers?visualFixture=true"]) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const creative = page.locator("figure[data-offer-media]").first();
    await creative.scrollIntoViewIfNeeded();
    await expect(creative).toBeVisible();
    await expect(page.locator('a[data-commercial-action-source="CREATIVE"]')).toHaveCount(0);
    await creative.click({ force: true });
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator('main a[href^="http"]')).toHaveCount(0);
  }
});

test("the controlled Slotnite GIF stays native and browser-decodable", async ({ page, request }) => {
  const response = await request.get(`${baseUrl}/casino-brands/slotnite/partner-brand.gif`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\/gif/);
  await page.setContent(`<img alt="Slotnite controlled 320 by 50 creative" src="${baseUrl}/casino-brands/slotnite/partner-brand.gif" width="320" height="50">`, { waitUntil: "domcontentloaded" });
  const image = page.locator("img");
  await image.evaluate((element) => (element as HTMLImageElement).decode());
  await expect(image).toHaveJSProperty("naturalWidth", 320);
  await expect(image).toHaveJSProperty("naturalHeight", 50);
});

test("a COMPOSED 320×50 asset renders as the real strip without cloned identity or offer copy", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const styles = readFileSync("components/commercial-media/CommercialOfferMedia.module.css", "utf8");
  const gif = readFileSync("public/casino-brands/slotnite/partner-brand.gif").toString("base64");
  await page.setContent(`<style>*{box-sizing:border-box}${styles}</style><main style="width:342px"><figure class="frame" data-media-mode="COMPOSED" data-offer-media="bonus" data-presentation-family="STRIP" data-mobile-presentation-family="STRIP"><div class="mediaStage"><img alt="Slotnite controlled partner creative" class="mediaArtwork" height="50" src="data:image/gif;base64,${gif}" width="320"></div><figcaption><span>B4GAMBLE / CONTROLLED MEDIA</span><small>STRIP</small></figcaption></figure></main>`);
  const figure = page.locator("figure");
  const geometry = await decodedImageGeometry(figure.locator("img"));
  expect(Math.abs(geometry.imageWidth / geometry.imageHeight - 320 / 50)).toBeLessThan(.05);
  expect(geometry.figureHeight).toBeLessThan(135);
  expect(geometry.imageWidth).toBeLessThanOrEqual(320);
  expect(geometry.imageHeight).toBeLessThanOrEqual(50);
  await expect(figure).not.toContainText(/duplicated|100%|free spins|Slotnite/i);
  await expect(figure).toContainText("B4GAMBLE / CONTROLLED MEDIA");
});

test("Best Offers promotes strip and wide inventory into deliberate full-width bands", async ({ browser }) => {
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const response = await page.goto(`${baseUrl}/en/best-offers?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    for (const family of ["STRIP", "WIDE"]) {
      const figure = page.locator(`figure[data-presentation-family="${family}"]`).first();
      await figure.scrollIntoViewIfNeeded();
      await expect(figure).toBeVisible();
      const imageGeometry = await decodedImageGeometry(figure.locator("img").first());
      const parentGeometry = await figure.evaluate((element) => {
        const article = element.closest("article");
        if (!article) throw new Error("Best Offers creative is missing its article");
        const figureRect = element.getBoundingClientRect();
        const articleRect = article.getBoundingClientRect();
        return {
          widthCoverage: figureRect.width / articleRect.width,
          columns: getComputedStyle(article).gridTemplateColumns.split(" ").filter(Boolean).length,
        };
      });
      expect(imageGeometry.figureHeight).toBeLessThan(190);
      expect(imageGeometry.imageWidth).toBeLessThanOrEqual(imageGeometry.naturalWidth + 1);
      expect(parentGeometry.widthCoverage).toBeGreaterThan(.9);
      expect(parentGeometry.columns).toBe(1);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
    await page.close();
  }
});

test("one deterministic page presents all required mixed inventory states intentionally", async ({ page }) => {
  const styles = readFileSync("components/commercial-media/CommercialOfferMedia.module.css", "utf8");
  const figure = (family: string, asset: string, width: number, height: number) => `<figure class="frame" data-offer-media="bonus" data-presentation-family="${family}" data-mobile-presentation-family="${family}"><div class="mediaStage"><img alt="${family} ${width} by ${height}" class="mediaArtwork" height="${height}" src="${baseUrl}/demo-casinos/${asset}" width="${width}"></div><figcaption><span>B4GAMBLE / CONTROLLED MEDIA</span><small>${family}</small></figcaption></figure>`;
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;padding:32px;background:#f5f3ed}.showcase{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));align-items:start;gap:24px}.showcase>article{min-width:0}</style><style>${styles}</style><main class="showcase"><article>${figure("CARD", "adaptive-card-300x250.svg", 300, 250)}</article><article>${figure("CARD", "adaptive-square-250x250.svg", 250, 250)}</article><article>${figure("STRIP", "adaptive-strip-320x50.svg", 320, 50)}</article><article>${figure("MOBILE_LANDSCAPE", "adaptive-mobile-320x100.svg", 320, 100)}</article><article><figure class="identityFallback" data-presentation-family="LOGO_ONLY"><div class="identityFallbackBody"><span>B4GAMBLE / CONTROLLED MEDIA</span><strong>Operator identity</strong><i></i></div><figcaption><span>Published</span><small>LOGO ONLY</small></figcaption></figure></article><article>${figure("WIDE", "adaptive-wide-728x90.svg", 728, 90)}</article></main>`, { waitUntil: "load" });
  for (const family of ["CARD", "MOBILE_LANDSCAPE", "STRIP", "WIDE", "LOGO_ONLY"]) {
    await expect(page.locator(`figure[data-presentation-family="${family}"]`).first(), family).toBeVisible();
  }
  const cardNaturalSizes = await page.locator('figure[data-presentation-family="CARD"] img').evaluateAll((images) =>
    images.map((image) => `${(image as HTMLImageElement).naturalWidth}x${(image as HTMLImageElement).naturalHeight}`),
  );
  expect(cardNaturalSizes).toEqual(["300x250", "250x250"]);
  const logoOnly = page.locator('figure[data-presentation-family="LOGO_ONLY"]');
  await expect(logoOnly.locator("a,button")).toHaveCount(0);
  await expect(logoOnly.locator("xpath=ancestor::a")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)).toBe(false);
});

test("review hero stays inert while promotional media remains in the offer block", async ({ browser }) => {
  for (const width of [390, 768, 1100, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const response = await page.goto(`${baseUrl}/en/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const hero = page.locator('[class*="heroMedia"][data-presentation-family="LOGO_ONLY"]');
    await expect(hero).toHaveAttribute("data-suppressed-promotion-family", "CARD");
    await expect(hero.locator("a,button")).toHaveCount(0);
    await expect(page.locator('a[data-commercial-action-placement="CASINO_DETAIL_HERO"]')).toHaveCount(0);

    const offer = page.locator('figure[data-presentation-family="STRIP"]');
    await offer.scrollIntoViewIfNeeded();
    await expect(offer).toBeVisible();
    const geometry = await decodedImageGeometry(offer.locator("img").first());
    const containingGeometry = await offer.evaluate((element) => {
      const figure = element.getBoundingClientRect();
      const card = element.parentElement?.getBoundingClientRect();
      return {
        figureWidth: figure.width,
        cardWidth: card?.width ?? 0,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(geometry.figureHeight).toBeLessThan(150);
    expect(geometry.imageWidth).toBeLessThanOrEqual(geometry.naturalWidth + 1);
    expect(containingGeometry.figureWidth).toBeLessThanOrEqual(containingGeometry.cardWidth + 48);
    expect(containingGeometry.horizontalOverflow).toBe(false);
    await expect(page.locator('a[data-commercial-action-placement="CASINO_OFFER_BLOCK"]')).toHaveCount(0);
    await page.close();
  }
});

test("current authorized inventory keeps real formats and the new review click boundary", async ({ page }) => {
  test.skip(!requireAuthorized, "This assertion requires current authorized Preview or Production inventory.");

  const bonusResponse = await page.goto(`${baseUrl}/en/bonuses`, { waitUntil: "networkidle" });
  expect(bonusResponse?.status()).toBe(200);
  const medium = page.locator('figure[data-commercial-format="MEDIUM_RECTANGLE_300_250"] img').first();
  const slotnite = page.locator('figure[data-commercial-format="MOBILE_BANNER_320_50"] img[src*="partner-brand.gif"]').first();
  await expect(medium).toBeVisible();
  await expect(slotnite).toBeVisible();
  await expect(medium).toHaveJSProperty("naturalWidth", 300);
  await expect(medium).toHaveJSProperty("naturalHeight", 250);
  await expect(slotnite).toHaveJSProperty("naturalWidth", 320);
  await expect(slotnite).toHaveJSProperty("naturalHeight", 50);
  const stripGeometry = await decodedImageGeometry(slotnite);
  expect(stripGeometry.figureHeight).toBeLessThan(150);
  expect(stripGeometry.imageWidth).toBeLessThanOrEqual(320);

  const directoryResponse = await page.goto(`${baseUrl}/en/casinos`, { waitUntil: "networkidle" });
  expect(directoryResponse?.status()).toBe(200);
  const skolCard = page.locator("article").filter({ hasText: /Skol Casino/i }).first();
  const directoryCreative = skolCard.locator('a[data-commercial-action-placement="CASINO_DIRECTORY_CARD"]');
  await expect(directoryCreative).toBeVisible();
  await expect(skolCard.locator('[class*="mark"] a')).toHaveCount(0);
  await expect(skolCard.getByRole("button", { name: /compare/i })).toBeAttached();
  await expect(skolCard.getByRole("link", { name: /read review/i })).toBeAttached();

  for (const [slug, suppressedFamily] of [["skol-casino", "CARD"], ["slotnite", "STRIP"]] as const) {
    const response = await page.goto(`${baseUrl}/en/casino/${slug}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const hero = page.locator('[class*="heroMedia"][data-presentation-family="LOGO_ONLY"]');
    await expect(hero).toHaveAttribute("data-suppressed-promotion-family", suppressedFamily);
    await expect(page.locator('a[data-commercial-action-placement="CASINO_DETAIL_HERO"]')).toHaveCount(0);
    const offerCreative = page.locator('a[data-commercial-action-placement="CASINO_OFFER_BLOCK"]');
    await expect(offerCreative).toBeVisible();
    if (slug === "slotnite") await expect(offerCreative.locator('img[src*="partner-brand.gif"]')).toHaveCount(1);
  }

  const helloResponse = await page.goto(`${baseUrl}/en/casino/hello-casino`, { waitUntil: "networkidle" });
  expect(helloResponse?.status()).toBe(200);
  await expect(page.locator('a[data-commercial-action-placement="CASINO_DETAIL_HERO"]')).toHaveCount(0);
  await expect(page.locator('[class*="heroMedia"] a, [class*="brandMedia"] a')).toHaveCount(0);
});

test("authorized promotional anchors match their CTA and confirmation contract", async ({ page }) => {
  test.skip(!requireAuthorized, "This assertion requires current authorized Preview or Production inventory.");
  for (const scenario of [
    { path: "/en/bonuses", placement: "BONUS_LISTING_CARD" },
    { path: "/en/best-offers", placement: "BEST_OFFER_FEATURED" },
    { path: "/en/casino/slotnite", placement: "CASINO_OFFER_BLOCK" },
  ]) {
    const response = await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const creative = page.locator(`a[data-commercial-action-source="CREATIVE"][data-commercial-action-placement="${scenario.placement}"]`).first();
    await expect(creative).toBeVisible();
    await expect(creative).toHaveAttribute("href", /^\/outbound\/[a-z0-9-]+$/);
    const href = await creative.getAttribute("href");
    await expect(page.locator(`a[data-commercial-action-source="CTA"][href="${href}"]`).first()).toBeAttached();
    await expect(creative.locator("a,button")).toHaveCount(0);
    await creative.focus();
    await page.keyboard.press("Enter");
    const dialog = page.locator("dialog[open]");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('a[href^="/r/"]')).toHaveAttribute("rel", /nofollow sponsored noopener/);
    await dialog.getByRole("button", { name: /Cancel|stay/i }).click();
  }
});
