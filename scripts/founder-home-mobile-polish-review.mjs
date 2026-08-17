import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";
const outputRoot = resolve("docs/02_Product_Design/qa/final-design-handoff/founder-home-mobile-polish");
const mobileViewports = [
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 393, height: 852 },
  { width: 412, height: 915 },
  { width: 430, height: 932 },
];

await mkdir(outputRoot, { recursive: true });

const browser = await chromium.launch();
const metrics = {};

async function settle(page) {
  await page.evaluate(() => {
    document.documentElement.style.setProperty("scroll-behavior", "auto", "important");
    document.body.style.setProperty("scroll-behavior", "auto", "important");
  });
  await page.waitForTimeout(250);
}

async function captureSection(page, label, filename) {
  const section = page.locator(`[data-screen-label="${label}"]`);
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const screenshot = await section.screenshot({
    animations: "disabled",
    type: "png",
  });
  await sharp(screenshot).webp({ quality: 84 }).toFile(resolve(outputRoot, filename));
}

try {
  for (const viewport of mobileViewports) {
    const context = await browser.newContext({ isMobile: true, viewport });
    const page = await context.newPage();
    await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
    await settle(page);
    if (await page.locator('[data-handoff-page="home"]').count() !== 1) {
      throw new Error("Home evidence is not using the canonical public Home runtime");
    }

    const composition = await page.evaluate(() => {
      const rect = (element) => element.getBoundingClientRect();
      const hero = document.querySelector('[data-screen-label="Hero"]');
      const visiblePhotos = [...hero.querySelectorAll("[data-tphoto]")]
        .filter((photo) => getComputedStyle(photo).display !== "none")
        .map(rect);
      const description = rect(hero.querySelector("h1 + p"));
      const cta = rect(hero.querySelector('a[href^="/program"]'));
      const kicker = rect(hero.querySelector("h1").previousElementSibling);
      const overlap = (first, second) => (
        Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
        * Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top))
      );
      const recognition = document.querySelector('[data-screen-label="Recognition"]');
      const finalSignal = recognition.querySelector(":scope > div > div > div:last-child > div:last-child");
      const productEyebrow = document.querySelector('[data-screen-label="A plan you can see"]').firstElementChild;
      const evidence = document.querySelector('[data-screen-label="Built from evidence"]');
      const evidenceGrid = evidence.querySelector(":scope > div > div:last-child");
      const trust = document.querySelector('[data-screen-label="Why trust"]');
      const trustLeft = trust.querySelector('[data-mob="trustL"]');
      const trustRight = trust.querySelector('[data-mob="trustR"]');
      return {
        cta: { height: cta.height, width: cta.width },
        evidenceCardHeights: [...evidenceGrid.children].map((card) => rect(card).height),
        evidenceHeight: rect(evidence).height,
        heroCtaOverlapAreas: visiblePhotos.map((photo) => overlap(photo, cta)),
        heroDescriptionOverlapAreas: visiblePhotos.map((photo) => overlap(photo, description)),
        heroPhotoKickerGap: kicker.top - Math.max(...visiblePhotos.map((photo) => photo.bottom)),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        recognitionToProductContentGap: rect(productEyebrow).top - rect(finalSignal).bottom,
        trust: {
          leftBorderBottom: getComputedStyle(trustLeft).borderBottomWidth,
          leftBorderRight: getComputedStyle(trustLeft).borderRightWidth,
          rightTextAlign: getComputedStyle(trustRight).textAlign,
        },
      };
    });

    const panelTops = await page.locator("[data-stackpanel]").evaluateAll((panels) => panels.map((panel) => panel.getBoundingClientRect().top + scrollY));
    await page.evaluate((target) => {
      document.documentElement.style.setProperty("scroll-snap-type", "none", "important");
      scrollTo(0, target);
    }, panelTops[0] + viewport.height * .25);
    await page.waitForTimeout(250);
    const progression = await page.locator("[data-stackpanel]").evaluateAll((panels) => panels.map((panel) => {
      const panelRect = panel.getBoundingClientRect();
      return {
        marginTop: Number.parseFloat(getComputedStyle(panel).marginTop),
        snapAlign: getComputedStyle(panel).scrollSnapAlign,
        snapStop: getComputedStyle(panel).scrollSnapStop,
        visibleHeight: Math.max(0, Math.min(innerHeight, panelRect.bottom) - Math.max(0, panelRect.top)),
      };
    }));
    metrics[viewport.width] = { ...composition, progression };

    if (viewport.width === 390 || viewport.width === 430) {
      await captureSection(page, "Hero", `${viewport.width}-01-hero.webp`);
      if (viewport.width === 390) {
        await captureSection(page, "Recognition", "390-02-recognition-flow.webp");
        await captureSection(page, "A plan you can see", "390-03-product-entry.webp");
      }
      await page.evaluate((target) => {
        document.documentElement.style.setProperty("scroll-snap-type", "none", "important");
        scrollTo(0, target);
      }, panelTops[0] + viewport.height * .25);
      await page.waitForTimeout(250);
      const photoFocus = await page.screenshot({
        animations: "disabled",
        type: "png",
      });
      await sharp(photoFocus).webp({ quality: 84 }).toFile(resolve(outputRoot, `${viewport.width}-04-photo-focus.webp`));
      await captureSection(page, "Built from evidence", `${viewport.width}-05-evidence.webp`);
      await captureSection(page, "Why trust", `${viewport.width}-06-two-businesses.webp`);
    }
    await context.close();
  }
} finally {
  await browser.close();
}

await writeFile(resolve(outputRoot, "metrics.json"), `${JSON.stringify(metrics, null, 2)}\n`);
console.log(`Founder Home mobile polish evidence written to ${outputRoot}`);
