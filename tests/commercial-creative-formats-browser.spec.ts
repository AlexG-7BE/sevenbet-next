import { expect, test, type Locator } from "@playwright/test";
import { readFileSync } from "node:fs";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const requireAuthorized = process.env.COMMERCIAL_CREATIVE_AUTHORIZED === "1";
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
  const styles = readFileSync("components/commercial-media/CommercialOfferMedia.module.css", "utf8");
  const figure = (family: string, asset: string, width: number, height: number) => `<article><figure class="frame" data-offer-media="format-safety-fixture" data-presentation-family="${family}" data-mobile-presentation-family="${family}"><div class="mediaStage"><img alt="${family} ${width} by ${height}" class="mediaArtwork" height="${height}" src="${baseUrl}/demo-casinos/${asset}" style="object-fit:contain" width="${width}"></div><figcaption><span>B4GAMBLE / HISTORICAL FORMAT SAFETY</span><small>${family}</small></figcaption></figure><div class="actions" /></article>`;
  for (const width of requiredWidths) {
    const livePage = await browser.newPage({ viewport: { width, height: width <= 430 ? 844 : 900 } });
    const response = await livePage.goto(`${baseUrl}/en/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status(), `${width}px response`).toBe(200);
    await expect(livePage.locator('figure[data-offer-media], a[data-commercial-action-source="CREATIVE"]')).toHaveCount(0);
    await expect(livePage.locator("[data-commercial-bonus-card]").first()).toBeVisible();
    await livePage.close();

    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 844 : 900 } });
    await page.setContent(`<style>*{box-sizing:border-box}body{margin:0;padding:24px}.fixture{width:100%;display:grid;gap:24px}.fixture article{min-width:0}.actions{height:1px}</style><style>${styles}</style><main class="fixture">${figure("CARD", "adaptive-card-300x250.svg", 300, 250)}${figure("MOBILE_LANDSCAPE", "adaptive-mobile-320x100.svg", 320, 100)}${figure("STRIP", "adaptive-strip-320x50.svg", 320, 50)}${figure("WIDE", "adaptive-wide-728x90.svg", 728, 90)}</main>`, { waitUntil: "load" });

    for (const family of ["CARD", "MOBILE_LANDSCAPE", "STRIP", "WIDE"]) {
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
      if (family === "STRIP" && width >= 768) {
        const cardGap = await figure.evaluate((element) => {
          const actions = element.nextElementSibling;
          if (!actions) throw new Error("Commercial figure is missing its action row");
          return actions.getBoundingClientRect().top - element.getBoundingClientRect().bottom;
        });
        expect(cardGap, `${width}px STRIP dead card space`).toBeLessThan(32);
      }
    }
    await page.close();
  }
});

test("retired promotional fixtures stay absent from replacement decision cards", async ({ page }) => {
  for (const path of ["/en/bonuses?visualFixture=true", "/en/best-offers?visualFixture=true"]) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const card = page.locator("[data-commercial-bonus-card], [data-commercial-best-offer-card]").first();
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();
    await expect(page.locator("figure[data-offer-media]")).toHaveCount(0);
    await expect(page.locator('a[data-commercial-action-source="CREATIVE"]')).toHaveCount(0);
    await expect(page.locator("dialog[open]")).toHaveCount(0);
    await expect(page.locator('main a[href^="http"]')).toHaveCount(0);
    await expect(page.locator('main a[href^="/r/"]')).toHaveCount(0);
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
  const captionSizes = await figure.locator("figcaption span, figcaption small").evaluateAll((elements) =>
    elements.map((element) => Number.parseFloat(getComputedStyle(element).fontSize)),
  );
  expect(captionSizes.every((size) => size >= 12)).toBe(true);
});

test("Best Offers replaces promotional bands with contained ranked identity cards", async ({ browser }) => {
  for (const width of [390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const response = await page.goto(`${baseUrl}/en/best-offers?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator('figure[data-offer-media], figure[data-presentation-family="STRIP"], figure[data-presentation-family="WIDE"]')).toHaveCount(0);
    const cards = page.locator("[data-commercial-best-offer-card]");
    await expect(cards).toHaveCount(3);
    for (const [variant, index] of [["primary", 0], ["secondary", 1]] as const) {
      const card = cards.nth(index);
      const identity = card.locator('[class*="rankIdentity"]');
      const logo = card.locator('[class*="rankLogo"]');
      await card.scrollIntoViewIfNeeded();
      await expect(identity).toBeVisible();
      await expect(logo).toBeVisible();
      const parentGeometry = await card.evaluate((element) => {
        const identity = element.querySelector<HTMLElement>('[class*="rankIdentity"]')!;
        const logo = element.querySelector<HTMLElement>('[class*="rankLogo"]')!;
        const identityRect = identity.getBoundingClientRect();
        const logoRect = logo.getBoundingClientRect();
        const articleRect = element.getBoundingClientRect();
        return {
          height: logoRect.height,
          widthCoverage: identityRect.width / articleRect.width,
          columns: getComputedStyle(element).gridTemplateColumns.split(" ").filter(Boolean).length,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      expect(parentGeometry.height, `${width}px ${variant} height`).toBeLessThan(100);
      expect(parentGeometry.widthCoverage, `${width}px ${variant} containment`).toBeGreaterThan(0);
      expect(parentGeometry.widthCoverage, `${width}px ${variant} containment`).toBeLessThanOrEqual(1.01);
      expect(parentGeometry.columns, `${width}px ${variant} columns`).toBeGreaterThanOrEqual(1);
      expect(parentGeometry.horizontalOverflow, `${width}px ${variant} overflow`).toBe(false);
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

test("review hero stays logo-only with responsive containment", async ({ browser }) => {
  for (const width of [390, 768, 1100, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: width === 390 ? 844 : 900 } });
    const response = await page.goto(`${baseUrl}/en/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const hero = page.locator('section[aria-labelledby="casino-profile-title"]');
    const logo = hero.locator('[class*="logo"]').first();
    await expect(logo).toBeVisible();
    await expect(logo.locator("img")).toBeVisible();
    await expect(logo.locator("a,button")).toHaveCount(0);
    await expect(page.locator('a[data-commercial-action-placement="CASINO_HERO"]')).toHaveCount(0);

    const containingGeometry = await logo.evaluate((element) => {
      const logo = element.getBoundingClientRect();
      const identity = element.parentElement?.getBoundingClientRect();
      return {
        logoWidth: logo.width,
        logoHeight: logo.height,
        identityWidth: identity?.width ?? 0,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(containingGeometry.logoHeight).toBeGreaterThan(0);
    expect(containingGeometry.logoHeight).toBeLessThan(120);
    expect(containingGeometry.logoWidth).toBeLessThanOrEqual(containingGeometry.identityWidth + 1);
    expect(containingGeometry.horizontalOverflow).toBe(false);
    await expect(page.locator('figure[data-offer-media], a[data-commercial-action-source="CREATIVE"], [data-casino-profile-hosted-media]')).toHaveCount(0);
    await expect(page.locator('a[data-commercial-action-placement="CASINO_OFFER_SECTION"]')).toHaveCount(0);
    await page.close();
  }
});

test("review logo stays fully boxed and contained on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const response = await page.goto(`${baseUrl}/en/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  const logo = page.locator('section[aria-labelledby="casino-profile-title"] [class*="logo"]').first();
  const image = logo.locator("img");
  await image.evaluate((element) => (element as HTMLImageElement).decode());
  const geometry = await logo.evaluate((element) => {
    const logoRect = element.getBoundingClientRect();
    const imageNode = element.querySelector("img") as HTMLImageElement;
    const imageRect = imageNode.getBoundingClientRect();
    return {
      logo: { top: logoRect.top, right: logoRect.right, bottom: logoRect.bottom, left: logoRect.left, width: logoRect.width, height: logoRect.height },
      image: { top: imageRect.top, bottom: imageRect.bottom, width: imageRect.width, height: imageRect.height },
      objectFit: getComputedStyle(imageNode).objectFit,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  expect(geometry.logo.height).toBe(72);
  expect(geometry.logo.width).toBe(132);
  expect(geometry.image.height).toBeLessThanOrEqual(geometry.logo.height);
  expect(geometry.image.width).toBeLessThanOrEqual(geometry.logo.width);
  expect(geometry.image.top).toBeGreaterThanOrEqual(geometry.logo.top);
  expect(geometry.image.bottom).toBeLessThanOrEqual(geometry.logo.bottom);
  expect(geometry.objectFit).toBe("contain");
  expect(geometry.overflow).toBe(false);
  await expect(page.locator('figure[data-offer-media], a[data-commercial-action-source="CREATIVE"]')).toHaveCount(0);
});

test("directory-card promotional art owns its full mobile click boundary", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const styles = readFileSync("components/casino-discovery/CasinoDiscovery.module.css", "utf8");
  const creative = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="250" viewBox="0 0 300 250"><rect width="300" height="250" fill="#e4e24e"/><text x="150" y="130" text-anchor="middle" font-size="24">300 by 250</text></svg>`;
  await page.setContent(`<style>*{box-sizing:border-box}body{margin:0}.host{width:100%;padding:24px}${styles}</style><main class="host"><article class="casinoCard"><div class="offerBlock" data-offer-media="exact-offer"><a class="offerMedia"><picture data-responsive-placement-media style="display:contents"><img alt="Controlled 300 by 250 offer" height="250" src="data:image/svg+xml,${encodeURIComponent(creative)}" width="300"></picture></a><span>Published</span><strong>Welcome offer</strong><p>Current researched offer copy.</p><small>Terms apply.</small></div></article></main>`);
  const offer = page.locator(".offerMedia");
  const image = offer.locator("img");
  await image.evaluate((element) => (element as HTMLImageElement).decode());
  const geometry = await offer.evaluate((element) => {
    const offerRect = element.getBoundingClientRect();
    const imageNode = element.querySelector("img") as HTMLImageElement;
    const imageRect = imageNode.getBoundingClientRect();
    return {
      offer: { top: offerRect.top, right: offerRect.right, bottom: offerRect.bottom, left: offerRect.left, width: offerRect.width, height: offerRect.height },
      image: { top: imageRect.top, right: imageRect.right, bottom: imageRect.bottom, left: imageRect.left, width: imageRect.width, height: imageRect.height },
      objectFit: getComputedStyle(imageNode).objectFit,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    };
  });
  expect(await offer.locator("picture").evaluate((element) => getComputedStyle(element).display)).toBe("block");
  expect(geometry.offer.width).toBe(110);
  expect(geometry.offer.height).toBeGreaterThanOrEqual(92);
  expect(geometry.image.left).toBeGreaterThanOrEqual(geometry.offer.left);
  expect(geometry.image.right).toBeLessThanOrEqual(geometry.offer.right);
  expect(geometry.image.top).toBeGreaterThanOrEqual(geometry.offer.top);
  expect(geometry.image.bottom).toBeLessThanOrEqual(geometry.offer.bottom);
  expect(geometry.objectFit).toBe("contain");
  expect(geometry.overflow).toBe(false);
});

test("current authorized inventory keeps decision cards and governed CTA boundaries", async ({ page }) => {
  test.skip(!requireAuthorized, "This assertion requires current authorized Preview or Production inventory.");

  const bonusResponse = await page.goto(`${baseUrl}/en/bonuses`, { waitUntil: "networkidle" });
  expect(bonusResponse?.status()).toBe(200);
  await expect(page.locator("[data-commercial-bonus-card]").first()).toBeVisible();
  await expect(page.locator('figure[data-offer-media], a[data-commercial-action-source="CREATIVE"]')).toHaveCount(0);
  await expect(page.locator('a[data-commercial-action-placement="BONUS_CARD"]').first()).toHaveAttribute("href", /^\/r\/[a-z0-9-]+$/);

  const directoryResponse = await page.goto(`${baseUrl}/en/casinos`, { waitUntil: "networkidle" });
  expect(directoryResponse?.status()).toBe(200);
  const skolCard = page.locator("article").filter({ hasText: /Skol Casino/i }).first();
  await expect(skolCard).toBeVisible();
  await expect(skolCard.locator('a[data-commercial-action-placement="CASINO_COLLECTION_CARD"]')).toHaveAttribute("href", /^\/r\/[a-z0-9-]+$/);
  await expect(skolCard.getByRole("link", { name: /review/i })).toBeAttached();

  for (const slug of ["skol-casino", "slotnite"] as const) {
    const response = await page.goto(`${baseUrl}/en/casino/${slug}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator('section[aria-labelledby="casino-profile-title"] [class*="logo"]').first()).toBeVisible();
    await expect(page.locator('figure[data-offer-media], a[data-commercial-action-source="CREATIVE"]')).toHaveCount(0);
    await expect(page.locator('a[data-commercial-action-placement="CASINO_HERO"]')).toHaveAttribute("href", /^\/r\/[a-z0-9-]+$/);
    await expect(page.locator('a[data-commercial-action-placement="CASINO_OFFER_SECTION"]')).toHaveAttribute("href", /^\/r\/[a-z0-9-]+$/);
  }

  const helloResponse = await page.goto(`${baseUrl}/en/casino/hello-casino`, { waitUntil: "networkidle" });
  expect(helloResponse?.status()).toBe(200);
  await expect(page.locator('section[aria-labelledby="casino-profile-title"] [class*="logo"] a')).toHaveCount(0);
  await expect(page.locator('a[data-commercial-action-source="CREATIVE"]')).toHaveCount(0);
});

test("authorized CTA anchors use the direct governed route contract", async ({ page }) => {
  test.skip(!requireAuthorized, "This assertion requires current authorized Preview or Production inventory.");
  for (const scenario of [
    { path: "/en/bonuses", placement: "BONUS_CARD" },
    { path: "/en/best-offers", placement: "BEST_OFFERS_CARD" },
    { path: "/en/casino/slotnite", placement: "CASINO_OFFER_SECTION" },
  ]) {
    const response = await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const action = page.locator(`a[data-commercial-action-source="CTA"][data-commercial-action-placement="${scenario.placement}"]`).first();
    await expect(action).toBeVisible();
    await expect(action).toHaveAttribute("href", /^\/r\/[a-z0-9-]+$/);
    await expect(action).toHaveAttribute("rel", /nofollow sponsored noopener/);
    await expect(action).toHaveAttribute("target", "_blank");
    await action.focus();
    await expect(page.locator('a[data-commercial-action-source="CREATIVE"]')).toHaveCount(0);
    await expect(page.locator("dialog")).toHaveCount(0);
    await expect(page.getByText("You are leaving B4GAMBLE.", { exact: true })).toHaveCount(0);
  }
});
