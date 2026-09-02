import { expect, test } from "@playwright/test";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

test("demo profile renders one disclosed SSR review without governed actions", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Northstar Casino" })).toBeVisible();
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { exact: true, name: "Demo Northstar Casino" })).toBeVisible();
  expect(await page.locator("h1").count()).toBe(1);
  const profile = page.locator('[data-runtime-renderer="casino-review"]');
  expect(await profile.locator('a[href^="http"]').count()).toBe(0);
  expect(await profile.locator('a[href^="/r/"]').count()).toBe(0);
  const visibleCopy = await page.locator("body").innerText();
  for (const falsePublicationClaim of [
    "Published review",
    "Published bonus",
    "Published detail",
    "Published source",
    "Published control tools",
    "Published evidence",
    "Published facts",
  ]) expect(visibleCopy).not.toContain(falsePublicationClaim);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(errors).toEqual([]);
});

test("casino profile has no horizontal overflow across approved and defensive widths", async ({ browser }) => {
  for (const width of [1440, 1280, 900, 768, 430, 390, 375, 320]) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 844 : 900 }, isMobile: width <= 430 });
    const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
    expect(response?.status(), `${width}px`).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${width}px`).toBe(false);
    expect(await page.locator("h1").count(), `${width}px`).toBe(1);
    await page.close();
  }
});

test("localized profile facts preserve whole words at the tablet composition and on long desktop terms", async ({ browser }) => {
  const tabletContext = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 768, height: 1024 } });
  const tabletPage = await tabletContext.newPage();
  const tabletResponse = await tabletPage.goto(`${baseUrl}/el-gr/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
  expect(tabletResponse?.status()).toBe(200);
  await expect(tabletPage.locator("html")).toHaveAttribute("lang", "el-GR");
  await expect(tabletPage.locator("#overview-heading")).toContainText("Έλεγχος 30 δευτερολέπτων");

  const tabletLayout = await tabletPage.evaluate(() => {
    const visibleWordFragments = (elements: Element[]) => elements.flatMap((element) => {
      const fragments: Array<{ lines: number; word: string }> = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const text = node.textContent ?? "";
        for (const match of text.matchAll(/\p{L}[\p{L}\p{M}]*/gu)) {
          const word = match[0];
          if (word.length < 4 || match.index === undefined) continue;
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + word.length);
          const lines = new Set(Array.from(range.getClientRects())
            .filter((rect) => rect.width > 0.5 && rect.height > 0.5)
            .map((rect) => Math.round(rect.top * 2) / 2)).size;
          if (lines > 1) fragments.push({ lines, word });
        }
        node = walker.nextNode();
      }
      return fragments;
    });

    const overview = document.querySelector<HTMLElement>("#overview")!;
    const overviewHeading = overview.querySelector<HTMLElement>("#overview-heading")!;
    const overviewHeader = overviewHeading.parentElement!;
    const overviewKicker = overviewHeader.querySelector<HTMLElement>(":scope > p")!;
    const overviewCopy = overviewHeader.querySelector<HTMLElement>(":scope > span")!;
    const overviewGrid = overview.children[1] as HTMLElement;
    const overviewCards = Array.from(overviewGrid.children) as HTMLElement[];
    const overviewFacts = overview.querySelector<HTMLDListElement>("dl")!;

    const offer = document.querySelector<HTMLElement>("#offer-evidence")!;
    const offerComposition = offer.children[1] as HTMLElement;
    const offerCopy = offerComposition.children[0] as HTMLElement;
    const offerTerms = offerComposition.children[1] as HTMLElement;

    const hero = document.querySelector<HTMLElement>('section[aria-labelledby="casino-profile-title"]')!;
    const heroTerms = hero.querySelector<HTMLDListElement>("dl")!;
    const heroRows = Array.from(heroTerms.children) as HTMLElement[];

    const kickerRect = overviewKicker.getBoundingClientRect();
    const headingRect = overviewHeading.getBoundingClientRect();
    const copyRect = overviewCopy.getBoundingClientRect();
    const cardRects = overviewCards.map((card) => card.getBoundingClientRect());
    return {
      fragmentedFacts: visibleWordFragments(Array.from(overviewFacts.querySelectorAll("dt, dd"))),
      fragmentedOverviewHeading: visibleWordFragments([overviewHeading]),
      fragmentedTerms: visibleWordFragments([
        ...Array.from(heroTerms.querySelectorAll("dt, dd")),
        ...Array.from(offerTerms.querySelectorAll("dt, dd")),
      ]),
      headingFollowsKicker: headingRect.top >= kickerRect.bottom - 1,
      copyFollowsHeading: copyRect.top >= headingRect.bottom - 1,
      overviewCardsStack: cardRects.slice(1).every((rect, index) => rect.top >= cardRects[index].bottom - 1),
      offerTermsFollowCopy: offerTerms.getBoundingClientRect().top >= offerCopy.getBoundingClientRect().bottom - 1,
      heroTermsUseRows: heroRows.length > 1 && heroRows[1].getBoundingClientRect().top >= heroRows[0].getBoundingClientRect().bottom - 1,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

  expect(tabletLayout.headingFollowsKicker).toBe(true);
  expect(tabletLayout.copyFollowsHeading).toBe(true);
  expect(tabletLayout.overviewCardsStack).toBe(true);
  expect(tabletLayout.offerTermsFollowCopy).toBe(true);
  expect(tabletLayout.heroTermsUseRows).toBe(true);
  expect(tabletLayout.fragmentedOverviewHeading).toEqual([]);
  expect(tabletLayout.fragmentedFacts).toEqual([]);
  expect(tabletLayout.fragmentedTerms).toEqual([]);
  expect(tabletLayout.horizontalOverflow).toBe(0);

  const spanishResponse = await tabletPage.goto(`${baseUrl}/es-es/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
  expect(spanishResponse?.status()).toBe(200);
  await expect(tabletPage.locator("html")).toHaveAttribute("lang", "es-ES");
  const spanishHeroTerms = tabletPage.locator('section[aria-labelledby="casino-profile-title"] [class*="heroOfferCopy"] dl');
  await expect(spanishHeroTerms).toBeVisible();
  const spanishTermLayout = await spanishHeroTerms.evaluate((terms) => {
    const fragments: Array<{ lines: number; word: string }> = [];
    for (const value of terms.querySelectorAll("dt, dd")) {
      const walker = document.createTreeWalker(value, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const text = node.textContent ?? "";
        for (const match of text.matchAll(/\p{L}[\p{L}\p{M}]*/gu)) {
          if (match[0].length < 4 || match.index === undefined) continue;
          const range = document.createRange();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          const lines = new Set(Array.from(range.getClientRects())
            .filter((rect) => rect.width > .5 && rect.height > .5)
            .map((rect) => Math.round(rect.top * 2) / 2)).size;
          if (lines > 1) fragments.push({ lines, word: match[0] });
        }
        node = walker.nextNode();
      }
    }
    return {
      fragments,
      styles: Array.from(terms.querySelectorAll("dt, dd"), (item) => ({
        hyphens: getComputedStyle(item).hyphens,
        overflowWrap: getComputedStyle(item).overflowWrap,
        wordBreak: getComputedStyle(item).wordBreak,
      })),
      text: terms.textContent?.replace(/\s+/g, " ").trim(),
      viewportOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  expect(spanishTermLayout.text).toContain("Se aplican términos y condiciones");
  expect(spanishTermLayout.fragments).toEqual([]);
  expect(spanishTermLayout.styles.every((style) => style.hyphens === "none" && style.overflowWrap === "normal" && style.wordBreak === "normal")).toBe(true);
  expect(spanishTermLayout.viewportOverflow).toBe(0);
  await tabletContext.close();

  const desktopContext = await browser.newContext({ reducedMotion: "reduce", viewport: { width: 1440, height: 900 } });
  const desktopPage = await desktopContext.newPage();
  const desktopResponse = await desktopPage.goto(`${baseUrl}/nl-nl/casino/demo-plume?visualFixture=true`, { waitUntil: "networkidle" });
  expect(desktopResponse?.status()).toBe(200);
  await expect(desktopPage.locator("html")).toHaveAttribute("lang", "nl-NL");

  const desktopEligibility = await desktopPage.evaluate(() => {
    const hero = document.querySelector<HTMLElement>('section[aria-labelledby="casino-profile-title"]')!;
    const row = Array.from(hero.querySelectorAll("dl > div")).find((candidate) => candidate.querySelector("dt")?.textContent?.trim() === "Deelnamevoorwaarden")!;
    const value = row.querySelector<HTMLElement>("dd")!;
    const fragments: Array<{ lines: number; word: string }> = [];
    const walker = document.createTreeWalker(value, NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      const text = node.textContent ?? "";
      for (const match of text.matchAll(/\p{L}[\p{L}\p{M}]*/gu)) {
        if (match[0].length < 4 || match.index === undefined) continue;
        const range = document.createRange();
        range.setStart(node, match.index);
        range.setEnd(node, match.index + match[0].length);
        const lines = new Set(Array.from(range.getClientRects())
          .filter((rect) => rect.width > 0.5 && rect.height > 0.5)
          .map((rect) => Math.round(rect.top * 2) / 2)).size;
        if (lines > 1) fragments.push({ lines, word: match[0] });
      }
      node = walker.nextNode();
    }
    return { fragments, text: value.textContent?.trim(), width: value.getBoundingClientRect().width };
  });

  expect(desktopEligibility.text).toBe("18+ · Nieuwe klanten · Voorwaarden zijn van toepassing");
  expect(desktopEligibility.width).toBeGreaterThan(0);
  expect(desktopEligibility.fragments).toEqual([]);
  await desktopContext.close();
});

test("casino profile breadcrumb clears the fixed public header across responsive widths", async ({ browser }) => {
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 900 },
    { width: 768, height: 900 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
  ] as const;

  for (const viewport of viewports) {
    const mobile = viewport.width <= 430;
    const context = await browser.newContext({ hasTouch: mobile, isMobile: mobile, reducedMotion: "reduce", viewport });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
    expect(response?.status(), `${viewport.width}px status`).toBe(200);

    const header = page.locator('[data-public-shell="header"]');
    const breadcrumb = page.getByRole("navigation", { name: "Breadcrumb" });
    const casinosLink = breadcrumb.locator('a[href="/en-gb/casinos"]');
    const hero = page.getByRole("region", { exact: true, name: "Demo Northstar Casino" });

    await expect(header, `${viewport.width}px public header`).toBeVisible();
    await expect(breadcrumb, `${viewport.width}px breadcrumb`).toBeVisible();
    await expect(casinosLink, `${viewport.width}px Casinos link`).toBeVisible();
    await expect(casinosLink, `${viewport.width}px Casinos link target`).toBeEnabled();
    await expect(casinosLink, `${viewport.width}px Casinos href`).toHaveAttribute("href", "/en-gb/casinos");
    await expect(hero, `${viewport.width}px hero`).toBeVisible();
    await expect(hero.getByRole("heading", { level: 1, name: "Demo Northstar Casino" }), `${viewport.width}px hero heading`).toBeVisible();

    const geometry = await page.evaluate(() => {
      const headerElement = document.querySelector<HTMLElement>('[data-public-shell="header"]')!;
      const breadcrumbElement = document.querySelector<HTMLElement>('nav[aria-label="Breadcrumb"]')!;
      const linkElement = breadcrumbElement.querySelector<HTMLAnchorElement>('a[href="/en-gb/casinos"]')!;
      const headerRect = headerElement.getBoundingClientRect();
      const breadcrumbRect = breadcrumbElement.getBoundingClientRect();
      const linkRect = linkElement.getBoundingClientRect();
      return {
        breadcrumbGap: breadcrumbRect.top - headerRect.bottom,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        linkHeight: linkRect.height,
        linkTop: linkRect.top,
        linkWidth: linkRect.width,
        headerBottom: headerRect.bottom,
      };
    });

    expect(geometry.breadcrumbGap, `${viewport.width}px intentional header clearance`).toBeGreaterThanOrEqual(10);
    expect(geometry.linkTop, `${viewport.width}px link clears header`).toBeGreaterThanOrEqual(geometry.headerBottom);
    expect(geometry.linkWidth, `${viewport.width}px link width`).toBeGreaterThan(0);
    expect(geometry.linkHeight, `${viewport.width}px link height`).toBeGreaterThanOrEqual(32);
    expect(geometry.horizontalOverflow, `${viewport.width}px horizontal overflow`).toBe(0);
    await context.close();
  }
});

test("shared casino profile composition joins the final offer to the footer and separates the mobile score", async ({ browser }) => {
  const viewports = [
    { width: 1440, height: 900 },
    { width: 1024, height: 768 },
    { width: 430, height: 932 },
    { width: 390, height: 844 },
    { width: 375, height: 812 },
    { width: 360, height: 800 },
  ] as const;

  for (const viewport of viewports) {
    const mobile = viewport.width <= 430;
    const context = await browser.newContext({ hasTouch: mobile, isMobile: mobile, reducedMotion: "reduce", viewport });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
    expect(response?.status(), `${viewport.width}px status`).toBe(200);
    await expect(page.locator('[data-runtime-renderer="casino-review"]')).toHaveCount(1);
    await expect(page.locator("[data-handoff-page]")).toHaveCount(0);

    const geometry = await page.evaluate(() => {
      const finalOffer = document.querySelector<HTMLElement>('[data-runtime-renderer="casino-review"] [data-demo-state="fictional"]')!;
      const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')!;
      const limit = document.querySelector<HTMLElement>('#verdict [class*="verdictLimit"]');
      const score = document.querySelector<HTMLElement>('#verdict [class*="scorePanel"]');
      const decisionBar = document.querySelector<HTMLElement>("[data-casino-decision-bar]")!;
      const finalRect = finalOffer.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      const limitRect = limit?.getBoundingClientRect() ?? null;
      const scoreRect = score?.getBoundingClientRect() ?? null;
      const decisionRect = decisionBar.getBoundingClientRect();
      return {
        finalToFooterGap: footerRect.top - finalRect.bottom,
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scoreGap: limitRect && scoreRect ? scoreRect.top - limitRect.bottom : null,
        decisionBottomGap: innerHeight - decisionRect.bottom,
        decisionPosition: getComputedStyle(decisionBar).position,
        mobileVisible: decisionBar.dataset.mobileVisible,
      };
    });

    expect(Math.abs(geometry.finalToFooterGap), `${viewport.width}px final offer/footer join`).toBeLessThanOrEqual(1);
    expect(geometry.horizontalOverflow, `${viewport.width}px horizontal overflow`).toBe(0);
    if (mobile) {
      expect(geometry.scoreGap, `${viewport.width}px Keep in view/score gap`).not.toBeNull();
      expect(geometry.scoreGap!, `${viewport.width}px Keep in view/score gap`).toBeGreaterThanOrEqual(40);
      expect(geometry.decisionPosition, `${viewport.width}px decision bar position`).toBe("fixed");
      expect(geometry.mobileVisible, `${viewport.width}px action follows hero information`).toBe("false");
      await page.locator("#overview").scrollIntoViewIfNeeded();
      await expect(page.locator("[data-casino-decision-bar]"), `${viewport.width}px decision bar reveals after hero`).toHaveAttribute("data-mobile-visible", "true");
      const revealedBottomGap = await page.locator("[data-casino-decision-bar]").evaluate((element) => innerHeight - element.getBoundingClientRect().bottom);
      expect(Math.abs(revealedBottomGap), `${viewport.width}px revealed decision bar bottom`).toBeLessThanOrEqual(1.5);
    }
    await context.close();
  }

  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }] as const) {
    const mobile = viewport.width <= 430;
    const context = await browser.newContext({ hasTouch: mobile, isMobile: mobile, reducedMotion: "reduce", viewport });
    const page = await context.newPage();
    const response = await page.goto(`${baseUrl}/casino/demo-meadow`, { waitUntil: "networkidle" });
    expect(response?.status(), `shared profile ${viewport.width}px status`).toBe(200);
    const gap = await page.evaluate(() => {
      const finalOffer = document.querySelector<HTMLElement>('[data-runtime-renderer="casino-review"] [data-demo-state="fictional"]')!;
      const footer = document.querySelector<HTMLElement>('[data-public-shell="footer"]')!;
      return footer.getBoundingClientRect().top - finalOffer.getBoundingClientRect().bottom;
    });
    expect(Math.abs(gap), `shared profile ${viewport.width}px final offer/footer join`).toBeLessThanOrEqual(1);
    await context.close();
  }
});

test("commercially unavailable state keeps editorial review and removes visit actions", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/demo-meadow`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Meadow Casino" })).toBeVisible();
  await expect(page.getByText("Offer unavailable").first()).toBeVisible();
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
  await expect(page.getByRole("contentinfo").getByRole("link", { name: /Help — protected support/ })).toBeVisible();
});

test("demo profile suppresses review, FAQ and commercial structured data", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/demo-lantern`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent || "{}")));
  expect(schemas.some((schema) => ["Review", "FAQPage", "Offer", "Product"].includes(schema["@type"]))).toBe(false);
});

test("localized demo profile keeps generic English chrome out of structured data", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/de-de/casino/demo-northstar`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(200);
  await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
  await expect(page.getByText("Fiktive Bewertungsdemonstration").first()).toBeVisible();

  const schemas = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) => nodes.map((node) => JSON.parse(node.textContent || "{}")));
  const webPage = schemas.find((schema) => schema["@type"] === "WebPage");
  expect(webPage?.name).toContain("Fiktive Bewertungsdemonstration");
  expect(webPage?.description).toContain("Fiktive Bewertungsfelder");
  expect(schemas.some((schema) => schema["@type"] === "FAQPage")).toBe(false);
  expect(JSON.stringify(schemas)).not.toMatch(/fictional review demonstration|Fictional product demonstration/i);
});

test("outbound confirmation is absent while market authority denies referral", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
  await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "networkidle" });
  const hero = page.getByRole("region", { exact: true, name: "Demo Northstar Casino" });
  await expect(hero.getByRole("link", { name: "Visit Demo Northstar Casino" })).toHaveCount(0);
  await expect(hero.getByText("Offer unavailable")).toBeVisible();
  await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
  await page.close();
});

test("every rendered Best Offers demo detail action resolves to a disclosed review-only page", async ({ page }) => {
  const shortlist = await page.goto(`${baseUrl}/best-offers`, { waitUntil: "networkidle" });
  expect(shortlist?.status()).toBe(200);
  const hrefs = [...new Set(await page.locator('a[href^="/en-gb/casino/"]').evaluateAll((links) => links.map((link) => link.getAttribute("href")).filter((href): href is string => Boolean(href))))];
  expect(hrefs.length).toBeGreaterThanOrEqual(3);
  expect(hrefs.every((href) => /^\/en-gb\/casino\/demo-/.test(href))).toBe(true);
  const shortlistCopy = await page.locator("body").textContent() ?? "";
  for (const falsePublicationClaim of [
    "Published ranking method",
    "Only active, current records explicitly available",
    "important conditions must all be published",
    "exact published signal behind the result",
    "Withdrawal timing is a published signal",
    "The operator’s current terms control the final decision",
    "strongest balance under the published method",
    "Published terms are a comparison snapshot",
    "latest published, non-archived snapshots",
    "The evidence behind the headline",
    "It is a set of facts a user can compare",
    "Read the evidence",
  ]) expect(shortlistCopy).not.toContain(falsePublicationClaim);

  for (const href of hrefs) {
    const response = await page.goto(`${baseUrl}${href}`, { waitUntil: "networkidle" });
    expect(response?.status(), href).toBe(200);
    await expect(page.getByText("DEMONSTRATION DATA.", { exact: true })).toBeVisible();
    expect(await page.locator('[data-runtime-renderer="casino-review"] a[href^="http"], [data-runtime-renderer="casino-review"] a[href^="/r/"]').count()).toBe(0);
  }
});

test("server HTML remains useful with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const response = await page.goto(`${baseUrl}/casino/demo-northstar`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1, name: "Demo Northstar Casino" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Visit Demo Northstar Casino" })).toHaveCount(0);
  await expect(page.getByText("Offer unavailable").first()).toBeVisible();
  await context.close();
});

test("unknown profiles fail closed and are noindex", async ({ page }) => {
  const response = await page.goto(`${baseUrl}/casino/not-a-published-profile`, { waitUntil: "networkidle" });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Casino profile unavailable" })).toBeVisible();
  const robots = await page.locator('meta[name="robots"]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("content") ?? ""));
  expect(robots.length).toBeGreaterThan(0);
  expect(robots.every((value) => value.includes("noindex"))).toBe(true);
  expect(await page.locator('a[href^="/r/"]').count()).toBe(0);
});
