import { expect, test } from "@playwright/test";

async function noHorizontalOverflow(page: import("@playwright/test").Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
}

async function loadDecisionMedia(page: import("@playwright/test").Page) {
  const media = page.locator('[data-golden-section] img');
  for (let index = 0; index < await media.count(); index += 1) await media.nth(index).scrollIntoViewIfNeeded();
  await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete));
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    window.scrollTo(0, 0);
  });
  await page.waitForFunction(() => window.scrollY === 0);
}

async function removeStickyCaptureArtifacts(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('[data-public-shell="header"]');
    const skipLink = document.querySelector<HTMLElement>('.skipLink');
    if (header) header.style.position = "absolute";
    if (skipLink) skipLink.style.display = "none";
  });
}

async function expectRefinedFooterPositions(page: import("@playwright/test").Page) {
  const trustGroup = page.locator('[data-footer-section="groups"] > div').filter({ has: page.getByRole("heading", { name: "Trust", exact: true }) });
  const baseline = page.locator('[data-footer-section="baseline"]');
  await expect(trustGroup.getByRole("link", { name: "About", exact: true })).toHaveAttribute("href", "/about");
  await expect(trustGroup.getByRole("link", { name: "Contact", exact: true })).toHaveAttribute("href", "/contact");
  await expect(trustGroup.getByRole("link", { name: "About", exact: true })).toBeVisible();
  await expect(trustGroup.getByRole("link", { name: "Contact", exact: true })).toBeVisible();
  await expect(trustGroup.getByRole("link", { name: "Privacy", exact: true })).toBeHidden();
  await expect(trustGroup.getByRole("link", { name: "Terms", exact: true })).toBeHidden();
  await expect(baseline.getByRole("link", { name: "Privacy", exact: true })).toHaveAttribute("href", "/privacy");
  await expect(baseline.getByRole("link", { name: "Terms", exact: true })).toHaveAttribute("href", "/terms");
  await expect(baseline.getByRole("link", { name: "Privacy", exact: true })).toBeVisible();
  await expect(baseline.getByRole("link", { name: "Terms", exact: true })).toBeVisible();
}

test("the decision route reaches an internal terminal in one click", async ({ page }) => {
  await page.goto("/best-casinos", { waitUntil: "networkidle" });
  await expect(page.getByText("PREVIEW ONLY", { exact: true }).first()).toBeVisible();
  await expect(page.locator('[data-golden-section="number-one"] article')).toHaveCount(1);
  await expect(page.locator('[data-golden-section="alternatives"] article')).toHaveCount(2);
  const first = page.locator('[data-golden-section="number-one"] article');
  await expect(first.getByRole("link", { name: /Visit Casino/ })).toBeVisible();
  await expect(first.getByRole("link", { name: "Read full review" })).toBeVisible();
  await expect(first.getByRole("link", { name: "Compare" })).toBeVisible();
  await first.getByRole("link", { name: /Visit Casino/ }).click();
  await expect(page).toHaveURL(/\/preview\/outbound\//);
  await expect(page.getByRole("heading", { name: "No external visit occurred." })).toBeVisible();
});

test("Variant B and the Founder comparison hub preserve the Top 3 decision path", async ({ page }) => {
  await page.goto("/preview/cpo-commercial-v3", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: /Open Variant A/ })).toHaveAttribute("href", "/best-casinos");
  await expect(page.getByRole("link", { name: /Open Refined Variant B/ })).toHaveAttribute("href", "/best-casinos-roulette");

  await page.getByRole("link", { name: /Open Refined Variant B/ }).click();
  await expect(page).toHaveURL(/\/best-casinos-roulette$/);
  await expect(page.locator('[data-commercial-variant="roulette"]')).toHaveCount(1);
  await expect(page.locator('[data-golden-section="number-one"] article')).toHaveCount(1);
  await expect(page.locator('[data-golden-section="alternatives"] article')).toHaveCount(2);
  const first = page.locator('[data-golden-section="number-one"] article');
  await expect(first.getByRole("link", { name: /Visit Casino/ })).toBeVisible();
  await expect(first.getByRole("link", { name: "Read full review" })).toBeVisible();
  await expect(first.getByRole("link", { name: "Compare" })).toBeVisible();
  await expect(page.locator('[data-media-authority="GOVERNED_DEMO_MEDIA"]')).toHaveCount(3);

  const mediaSources = await page.locator('[data-media-authority="GOVERNED_DEMO_MEDIA"] img').evaluateAll((images) => images.map((image) => decodeURIComponent(image.getAttribute("src") || "")));
  expect(mediaSources).toHaveLength(9);
  for (const slug of ["northstar", "lantern", "harbour"]) {
    for (const kind of ["logo", "hero", "screen"]) expect(mediaSources.some((source) => source.includes(`demo-${slug}-${kind}.svg`))).toBe(true);
  }

  const chapterSurfaces = await page.evaluate(() => {
    const sectionColour = (id: string) => {
      const section = document.getElementById(id)?.closest("section");
      return section ? getComputedStyle(section).backgroundColor : "";
    };
    const research = document.getElementById("research-title")?.closest("section");
    return {
      alternatives: sectionColour("alternatives-title"),
      evidence: sectionColour("evidence-title"),
      research: sectionColour("research-title"),
      researchDivider: research ? getComputedStyle(research).borderTopWidth : "",
    };
  });
  expect(chapterSurfaces.alternatives).not.toBe(chapterSurfaces.evidence);
  expect(chapterSurfaces.evidence).not.toBe(chapterSurfaces.research);
  expect(chapterSurfaces.researchDivider).toBe("10px");

  await expectRefinedFooterPositions(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/best-casinos-roulette", { waitUntil: "networkidle" });
  await expectRefinedFooterPositions(page);
  expect(await page.locator('[data-footer-section="help"]').evaluate((element) => element.getBoundingClientRect().width)).toBeLessThanOrEqual(286);
});

test("Variant B combines Variant B shell sizing with Variant A shell colours", async ({ page }) => {
  await page.goto("/best-casinos", { waitUntil: "networkidle" });
  const variantA = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('[data-public-shell="header"]');
    const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
    return { header: header ? getComputedStyle(header).backgroundColor : "", footer: footer ? getComputedStyle(footer).backgroundColor : "" };
  });

  await page.goto("/best-casinos-roulette", { waitUntil: "networkidle" });
  const variantB = await page.evaluate(() => {
    const header = document.querySelector<HTMLElement>('[data-public-shell="header"]');
    const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]');
    return {
      header: header ? getComputedStyle(header).backgroundColor : "",
      headerHeight: header ? header.getBoundingClientRect().height : 0,
      footer: footer ? getComputedStyle(footer).backgroundColor : "",
    };
  });
  expect(variantB.header).toBe(variantA.header);
  expect(variantB.footer).toBe(variantA.footer);
  expect(variantB.headerHeight).toBeGreaterThanOrEqual(96);
});

test("key commercial and protected surfaces remain usable at review widths", async ({ page }) => {
  for (const width of [390, 430, 768, 1024, 1280, 1440, 1920]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    const response = await page.goto("/best-casinos", { waitUntil: "domcontentloaded" });
    expect(response?.status(), `/best-casinos at ${width}px`).toBeLessThan(400);
    await noHorizontalOverflow(page);
  }

  for (const width of [390, 430, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    for (const path of ["/best-casinos-roulette", "/preview/cpo-commercial-v3"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${path} at ${width}px`).toBeLessThan(400);
      await noHorizontalOverflow(page);
    }
  }

  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    for (const path of ["/bonuses", "/casinos", "/learn", "/help", "/preview/cpo-commercial-v2"]) {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), path).toBeLessThan(400);
      await noHorizontalOverflow(page);
    }
  }
});

test("Top Offers exposes a primary Preview action on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/bonuses#top-offers", { waitUntil: "networkidle" });
  await expect(page.getByText("Top 3 offers", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "View Offer" }).first()).toBeVisible();
});

test("capture CPO visual QA evidence", async ({ page }) => {
  test.setTimeout(120_000);
  for (const [label, width, height, path] of [
    ["best-casinos-1440", 1440, 1000, "/best-casinos"],
    ["best-casinos-430", 430, 932, "/best-casinos"],
    ["best-casinos-390", 390, 844, "/best-casinos"],
    ["bonuses-390", 390, 844, "/bonuses#top-offers"],
    ["review-hub-1440", 1440, 1000, "/preview/cpo-commercial-v2"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(path, { waitUntil: "networkidle" });
    await loadDecisionMedia(page);
    await page.screenshot({ fullPage: true, path: `/tmp/cpo-${label}.png` });

    if (path === "/best-casinos") {
      await removeStickyCaptureArtifacts(page);
      for (const section of ["hero", "number-one", "alternatives", "evidence-research"] as const) {
        await page.locator(`[data-golden-section="${section}"]`).screenshot({ path: `/tmp/cpo-${label}-${section}.png` });
      }
    }
  }

  for (const [label, width, height, path] of [
    ["variant-a-1440-full", 1440, 1000, "/best-casinos"],
    ["variant-a-430-first", 430, 932, "/best-casinos"],
    ["variant-b-1440-full", 1440, 1000, "/best-casinos-roulette"],
    ["variant-b-430-full", 430, 932, "/best-casinos-roulette"],
    ["variant-b-390-full", 390, 844, "/best-casinos-roulette"],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(path, { waitUntil: "networkidle" });
    await loadDecisionMedia(page);
    await page.screenshot({ fullPage: true, path: `/tmp/cpo-${label}.png` });
    if (label === "variant-a-1440-full") {
      await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 1000 }, path: "/tmp/cpo-variant-a-1440-first.png" });
    }
    if (label === "variant-a-430-first") {
      await page.screenshot({ clip: { x: 0, y: 0, width: 430, height: 932 }, path: "/tmp/cpo-variant-a-430-first-screen.png" });
    }
    if (label === "variant-b-1440-full") {
      await page.screenshot({ clip: { x: 0, y: 0, width: 1440, height: 1000 }, path: "/tmp/cpo-refined-b-1440-first.png" });
      await removeStickyCaptureArtifacts(page);
      await page.locator('[data-golden-section="hero"]').screenshot({ path: "/tmp/cpo-variant-b-1440-hero.png" });
      await page.locator('[data-golden-section="number-one"]').screenshot({ path: "/tmp/cpo-variant-b-1440-number-one.png" });
      await page.locator('[data-golden-section="alternatives"]').screenshot({ path: "/tmp/cpo-variant-b-1440-alternatives.png" });
      await page.locator('[data-golden-section="evidence-research"]').screenshot({ path: "/tmp/cpo-variant-b-1440-shortlist-transition.png" });
      await page.locator('[data-public-shell="footer"]').screenshot({ path: "/tmp/cpo-variant-b-1440-footer.png" });
    }
    if (label === "variant-b-430-full") {
      await page.screenshot({ clip: { x: 0, y: 0, width: 430, height: 932 }, path: "/tmp/cpo-variant-b-430-first.png" });
    }
  }
});
