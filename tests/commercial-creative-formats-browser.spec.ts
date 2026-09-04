import { expect, test, type Page } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const requireAuthorized = process.env.COMMERCIAL_CREATIVE_AUTHORIZED === "1";
const requireBlocked = process.env.COMMERCIAL_CREATIVE_BLOCKED === "1";

const formatCases = [
  { width: 300, height: 250, family: "MEDIUM_RECTANGLE", mobile: false },
  { width: 250, height: 250, family: "SQUARE", mobile: false },
  { width: 320, height: 100, family: "MOBILE_LARGE", mobile: true },
  { width: 320, height: 50, family: "MOBILE_BANNER", mobile: true },
] as const;

async function applyFormat(page: Page, format: typeof formatCases[number]) {
  const figure = page.locator('section[aria-labelledby="bonus-shortlist-title"] article').first().locator('figure[data-offer-media="bonus"]');
  await expect(figure).toBeVisible();
  const image = figure.locator('img:not([aria-hidden="true"])').first();
  await expect(image).toBeVisible();
  const stability = await image.evaluate(async (element, input) => {
    const imageElement = element as HTMLImageElement;
    const figureElement = element.closest("figure");
    if (!figureElement) throw new Error("Commercial figure is missing");
    for (const source of figureElement.querySelectorAll("source")) source.remove();
    figureElement.dataset.commercialFamily = input.family;
    figureElement.dataset.commercialFormat = `${input.family}_${input.width}_${input.height}`;
    if (input.mobile) {
      figureElement.dataset.mobileCommercialFamily = input.family;
      figureElement.dataset.mobileCommercialFormat = `${input.family}_${input.width}_${input.height}`;
    } else {
      delete figureElement.dataset.mobileCommercialFamily;
      delete figureElement.dataset.mobileCommercialFormat;
    }
    const canvas = document.createElement("canvas");
    canvas.width = input.width;
    canvas.height = input.height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas context is unavailable");
    context.fillStyle = "#171616";
    context.fillRect(0, 0, input.width, input.height);
    context.fillStyle = "#e4e24e";
    context.fillRect(0, 0, Math.max(4, Math.round(input.width * .04)), input.height);
    imageElement.setAttribute("width", String(input.width));
    imageElement.setAttribute("height", String(input.height));
    imageElement.removeAttribute("srcset");
    imageElement.removeAttribute("src");
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
    const reservedHeight = figureElement.getBoundingClientRect().height;
    imageElement.src = canvas.toDataURL("image/png");
    await imageElement.decode();
    return { reservedHeight, decodedHeight: figureElement.getBoundingClientRect().height };
  }, format);
  return { figure, image, stability };
}

test("canonical card and mobile formats keep their ratio across required widths", async ({ browser }) => {
  for (const viewportWidth of [390, 430, 768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width: viewportWidth, height: viewportWidth <= 430 ? 844 : 900 } });
    const response = await page.goto(`${baseUrl}/bonuses?visualFixture=true`, { waitUntil: "networkidle" });
    expect(response?.status(), `${viewportWidth}px status`).toBe(200);
    const applicable = formatCases.filter((format) => !format.mobile || viewportWidth < 768);
    for (const format of applicable) {
      const { figure, image, stability } = await applyFormat(page, format);
      const geometry = await image.evaluate((element) => {
        const imageRect = element.getBoundingClientRect();
        const figureRect = element.closest("figure")!.getBoundingClientRect();
        return {
          imageRatio: imageRect.width / imageRect.height,
          figureHeight: figureRect.height,
          objectFit: getComputedStyle(element).objectFit,
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        };
      });
      expect(Math.abs(geometry.imageRatio - format.width / format.height), `${viewportWidth}px ${format.width}×${format.height} distortion`).toBeLessThan(.025);
      expect(geometry.objectFit).toBe("contain");
      expect(geometry.overflow, `${viewportWidth}px ${format.width}×${format.height} overflow`).toBe(false);
      expect(Math.abs(stability.decodedHeight - stability.reservedHeight), `${viewportWidth}px ${format.width}×${format.height} layout shift`).toBeLessThanOrEqual(1);
      if (format.mobile) expect(geometry.figureHeight, `${format.width}×${format.height} giant mobile stage`).toBeLessThan(190);
      await expect(figure.locator("figcaption")).toBeVisible();
    }
    await page.close();
  }
});

test("blocked fixture creatives stay visible without becoming an outbound action", async ({ page }) => {
  test.skip(requireAuthorized && !requireBlocked, "Production disables visual fixtures and its current real inventory is authorized; run this assertion in local/Preview blocked state or set COMMERCIAL_CREATIVE_BLOCKED=1 for a known blocked origin.");
  for (const path of ["/bonuses?visualFixture=true", "/best-offers?visualFixture=true"]) {
    const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("figure[data-offer-media]").first()).toBeVisible();
    await expect(page.locator('a[data-commercial-action-source="CREATIVE"]')).toHaveCount(0);
    await expect(page.locator('main a[href^="http"]')).toHaveCount(0);
  }
});

test("the controlled Slotnite GIF remains a browser-decodable animated-format asset", async ({ page, request }) => {
  const response = await request.get(`${baseUrl}/casino-brands/slotnite/partner-brand.gif`);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^image\/gif/);
  await page.setContent(`<img alt="Slotnite controlled 320 by 50 creative" loading="lazy" src="${baseUrl}/casino-brands/slotnite/partner-brand.gif" width="320" height="50">`, { waitUntil: "domcontentloaded" });
  await page.locator("img").evaluate((element) => (element as HTMLImageElement).decode());
  await expect(page.locator("img")).toHaveJSProperty("naturalWidth", 320);
  await expect(page.locator("img")).toHaveJSProperty("naturalHeight", 50);
});

test("current authorized inventory keeps native 300×250 and Slotnite 320×50 geometry", async ({ browser }) => {
  test.skip(!requireAuthorized, "This assertion requires the current real governed inventory.");
  for (const viewport of [{ width: 390, height: 844 }, { width: 1440, height: 900 }]) {
    const page = await browser.newPage({ viewport });
    const response = await page.goto(`${baseUrl}/bonuses`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(200);
    const medium = page.locator('figure[data-commercial-format="MEDIUM_RECTANGLE_300_250"] img:not([aria-hidden="true"])').first();
    const slotnite = page.locator('figure[data-commercial-format="MOBILE_BANNER_320_50"] img[src*="partner-brand.gif"]').first();
    await expect(medium).toBeVisible();
    await expect(slotnite).toBeVisible();
    await expect(medium).toHaveJSProperty("naturalWidth", 300);
    await expect(medium).toHaveJSProperty("naturalHeight", 250);
    await expect(slotnite).toHaveJSProperty("naturalWidth", 320);
    await expect(slotnite).toHaveJSProperty("naturalHeight", 50);
    const geometry = await slotnite.evaluate((element) => {
      const image = element.getBoundingClientRect();
      const figure = element.closest("figure")!.getBoundingClientRect();
      return {
        imageRatio: image.width / image.height,
        figureHeight: figure.height,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    if (viewport.width < 768) {
      expect(Math.abs(geometry.imageRatio - 320 / 50)).toBeLessThan(.05);
      expect(geometry.figureHeight).toBeLessThan(190);
    }
    expect(geometry.overflow).toBe(false);
    await page.close();
  }
});

test("authorized creatives match CTA authority and open the same governed confirmation", async ({ page }) => {
  const cases = [
    { paths: ["/bonuses"], placement: "BONUS_LISTING_CARD" },
    { paths: ["/best-offers"], placement: /^BEST_OFFER_(?:FEATURED|SECONDARY)$/ },
    { paths: ["/en-gb/casino/slotnite", "/en/casino/slotnite", "/casino/slotnite"], placement: "CASINO_OFFER_BLOCK" },
  ] as const;
  let verified = 0;

  for (const scenario of cases) {
    let activePath: string | null = null;
    for (const candidatePath of scenario.paths) {
      const response = await page.goto(`${baseUrl}${candidatePath}`, { waitUntil: "networkidle" });
      if (response?.status() === 200) {
        activePath = candidatePath;
        break;
      }
    }
    if (!activePath) {
      if (requireAuthorized) expect(activePath, `${scenario.paths.join(", ")} requires a published profile`).not.toBeNull();
      continue;
    }
    const creatives = page.locator('a[data-commercial-action-source="CREATIVE"]');
    const matching = typeof scenario.placement === "string"
      ? page.locator(`a[data-commercial-action-source="CREATIVE"][data-commercial-action-placement="${scenario.placement}"]`)
      : creatives;
    let creative = matching.first();
    if (typeof scenario.placement !== "string") {
      creative = creatives.filter({ has: page.locator("figure") }).first();
      if (await creative.count()) await expect(creative).toHaveAttribute("data-commercial-action-placement", scenario.placement);
    }
    if (await creative.count() === 0) {
      if (requireAuthorized) expect(await creative.count(), `${activePath} requires an authorized creative`).toBeGreaterThan(0);
      continue;
    }

    verified += 1;
    await expect(creative).toBeVisible();
    await expect(creative).toHaveAttribute("href", /^\/outbound\/[a-z0-9-]+$/);
    await expect(creative).toHaveAttribute("aria-label", /.+ — .+/);
    const href = await creative.getAttribute("href");
    const placement = await creative.getAttribute("data-commercial-action-placement");
    expect(href).toBeTruthy();
    expect(placement).toBeTruthy();
    await expect(page.locator(`a[data-commercial-action-source="CTA"][data-commercial-action-placement="${placement}"][href="${href}"]`).first()).toBeAttached();
    await expect(page.locator('main a[href*="superflypartners"], main a[href*="betsson"][href*="track"], main a[href*="rakuten"][href*="track"]')).toHaveCount(0);

    await creative.focus();
    await expect(creative).toBeFocused();
    await page.keyboard.press("Enter");
    const keyboardDialog = page.locator("dialog[open]");
    await expect(keyboardDialog).toBeVisible();
    await keyboardDialog.getByRole("button", { name: /Cancel|stay/i }).click();

    await creative.click();
    const mouseDialog = page.locator("dialog[open]");
    await expect(mouseDialog).toBeVisible();
    await expect(mouseDialog.locator('a[href^="/r/"]')).toHaveAttribute("rel", /nofollow sponsored noopener/);
    await mouseDialog.getByRole("button", { name: /Cancel|stay/i }).click();

    if (scenario.placement === "CASINO_OFFER_BLOCK" && requireAuthorized) {
      await expect(creative.locator('img[src*="partner-brand.gif"]')).toHaveCount(1);
    }
  }

  if (requireAuthorized) expect(verified).toBe(cases.length);
  else test.skip(verified === 0, "No authorized local commercial inventory; Preview/Production runs set COMMERCIAL_CREATIVE_AUTHORIZED=1.");
});

test("the authorized Casino offer block supports a deliberate 728×90 wide mode", async ({ browser }) => {
  const paths = ["/en-gb/casino/slotnite", "/en/casino/slotnite", "/casino/slotnite"];
  let verified = 0;

  for (const viewportWidth of [768, 1024, 1280, 1440]) {
    const page = await browser.newPage({ viewport: { width: viewportWidth, height: 900 } });
    let foundProfile = false;
    for (const path of paths) {
      const response = await page.goto(`${baseUrl}${path}`, { waitUntil: "networkidle" });
      if (response?.status() === 200) {
        foundProfile = true;
        break;
      }
    }
    if (!foundProfile) {
      await page.close();
      if (requireAuthorized) expect(foundProfile, `${viewportWidth}px requires the published Slotnite profile`).toBe(true);
      break;
    }

    const creative = page.locator('a[data-commercial-action-placement="CASINO_OFFER_BLOCK"]');
    const creativeCount = await creative.count();
    if (creativeCount === 0) {
      await page.close();
      if (requireAuthorized) expect(creativeCount, `${viewportWidth}px requires an authorized Casino offer creative`).toBeGreaterThan(0);
      break;
    }
    const figure = creative.locator("figure");
    const image = figure.locator("img").first();
    await image.evaluate(async (element) => {
      const imageElement = element as HTMLImageElement;
      const figureElement = element.closest("figure");
      if (!figureElement) throw new Error("Casino offer figure is missing");
      for (const source of figureElement.querySelectorAll("source")) source.remove();
      figureElement.dataset.commercialFamily = "LEADERBOARD";
      figureElement.dataset.commercialFormat = "LEADERBOARD_728_90";
      figureElement.dataset.mediaMode = "CONTAIN";
      delete figureElement.dataset.mobileCommercialFamily;
      delete figureElement.dataset.mobileCommercialFormat;
      const canvas = document.createElement("canvas");
      canvas.width = 728;
      canvas.height = 90;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas context is unavailable");
      context.fillStyle = "#171616";
      context.fillRect(0, 0, 728, 90);
      context.fillStyle = "#e4e24e";
      context.fillRect(0, 0, 24, 90);
      imageElement.width = 728;
      imageElement.height = 90;
      imageElement.removeAttribute("srcset");
      imageElement.src = canvas.toDataURL("image/png");
      await imageElement.decode();
    });
    const geometry = await image.evaluate((element) => {
      const imageRect = element.getBoundingClientRect();
      const figureRect = element.closest("figure")!.getBoundingClientRect();
      return {
        imageRatio: imageRect.width / imageRect.height,
        figureHeight: figureRect.height,
        objectFit: getComputedStyle(element).objectFit,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
      };
    });
    expect(Math.abs(geometry.imageRatio - 728 / 90), `${viewportWidth}px leaderboard distortion`).toBeLessThan(.05);
    expect(geometry.objectFit).toBe("contain");
    expect(geometry.figureHeight, `${viewportWidth}px deliberate wide stage`).toBeLessThan(220);
    expect(geometry.overflow, `${viewportWidth}px leaderboard overflow`).toBe(false);
    await expect(figure.locator("figcaption")).toBeVisible();
    verified += 1;
    await page.close();
  }

  if (requireAuthorized) expect(verified).toBe(4);
  else test.skip(verified === 0, "No authorized local Casino creative; Preview/Production runs set COMMERCIAL_CREATIVE_AUTHORIZED=1.");
});
