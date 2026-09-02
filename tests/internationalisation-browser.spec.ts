import { expect, test } from "@playwright/test";

import { HOME_SOURCE_COPY, homeMetadata, homeTranslation } from "../lib/i18n/home-catalog";
import { publicFooterMessages, publicShellMessages } from "../lib/i18n/public-shell-catalog";
import { aboutMessages } from "../lib/i18n/static-pages/about";
import { faqMessages } from "../lib/i18n/static-pages/faq";
import { tenStepsTranslation } from "../lib/i18n/static-pages/ten-steps";
import { contactMessages } from "../lib/i18n/static-pages/contact";
import { methodologyMessages } from "../lib/i18n/static-pages/methodology";
import { learningMessages, localizedLearningArticles } from "../lib/i18n/learning-center";
import { publicErrorMessages } from "../lib/i18n/public-errors";
import { INITIAL_EUROPEAN_MARKET_PROFILES, publicMarketPath } from "../lib/market/registry";
import { productPageMessages } from "../lib/i18n/product-pages-catalog";
import { FIRST_WAVE_MARKET_EVIDENCE, FIRST_WAVE_MARKETS } from "../lib/market/first-wave-evidence";

const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:4173";

const founderPublicationSmoke = [
  { market: "DE", locale: "de-DE", representativePath: "/casinos", representativeCopy: productPageMessages("de-DE").casinos.heroLead },
  { market: "ES", locale: "es-ES", representativePath: "/bonuses", representativeCopy: productPageMessages("es-ES").bonuses.heroLead },
  { market: "PE", locale: "es-PE", representativePath: "/casinos", representativeCopy: productPageMessages("es-PE").casinos.heroLead },
  { market: "SE", locale: "sv-SE", representativePath: "/best-offers", representativeCopy: productPageMessages("sv-SE").bestOffers.heroLead },
  { market: "DK", locale: "da-DK", representativePath: "/methodology", representativeCopy: methodologyMessages("da-DK").copy.get("Evidence before") ?? "" },
  { market: "GR", locale: "el-GR", representativePath: "/about", representativeCopy: aboutMessages("el-GR").titleLead },
] as const;

const knownEnglishLeakage = /Compare casinos|Best offers|How we test|Online Casino Basics|Open protected Help|Source status|Direct answer/;

test("localized internal rewrites terminate with signed context and expose no continuation credential", async ({ request }) => {
  const response = await request.get(`${baseUrl}/de-de/about`, { maxRedirects: 0 });
  expect(response.status()).toBe(200);
  expect(response.url()).toBe(`${baseUrl}/de-de/about`);
  expect(response.headers()["content-language"]).toBe("de-DE");
  expect(response.headers()["x-b4gamble-internal-presentation-token"]).toBeUndefined();
  expect(response.headers()["x-middleware-request-x-b4gamble-internal-presentation-token"]).toBeUndefined();
  const html = await response.text();
  expect(html.match(/<html\b/g)).toHaveLength(1);
  expect(html).toContain('<html lang="de-DE"');
  expect(html).toContain(aboutMessages("de-DE").titleLead);
});

for (const acceptance of founderPublicationSmoke) {
  const prefix = `/${acceptance.locale.toLowerCase()}`;
  const evidence = FIRST_WAVE_MARKET_EVIDENCE[acceptance.market];
  const article = localizedLearningArticles(acceptance.locale)[0];
  const rootHero = homeTranslation(acceptance.locale)?.hero ?? HOME_SOURCE_COPY.hero;
  const routes = [
    { pathname: prefix, heading: rootHero[2], publicSelector: true },
    { pathname: `${prefix}${acceptance.representativePath}`, heading: acceptance.representativeCopy, publicSelector: true },
    { pathname: `${prefix}/help`, heading: evidence.copy.helpTitle, publicSelector: false },
    { pathname: `${prefix}/responsible-gambling`, heading: evidence.copy.responsibleTitle, publicSelector: false },
    { pathname: `${prefix}/learn/casino-basics/online-casino-basics`, heading: article.title, publicSelector: true },
  ] as const;

  test(`Founder-publication smoke: ${acceptance.market} is localized, noindex, fail-closed and internally connected`, async ({ page, request }) => {
    const internalLinks = new Set<string>();
    for (const route of routes) {
      const response = await page.goto(`${baseUrl}${route.pathname}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), route.pathname).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", acceptance.locale);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(route.heading);
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
      expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe(route.pathname);
      if (route.publicSelector) {
        await expect(page.getByRole("button", { name: publicShellMessages(acceptance.locale).changeMarketAndLanguage }).first()).toContainText(acceptance.locale.split("-")[0].toUpperCase());
      }
      expect(await page.locator('main a[href^="/r/"], main a[href^="/go/"]').count(), `${route.pathname} must not expose outbound commercial actions`).toBe(0);
      await expect(page.locator("main")).not.toContainText(knownEnglishLeakage);
      if (route.pathname.endsWith("/help") || route.pathname.endsWith("/responsible-gambling")) {
        await expect(page.locator("main")).not.toContainText(/GAMSTOP|GamCare|NHS/);
      }
      for (const href of await page.locator('a[href^="/"]').evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href")).filter((href): href is string => Boolean(href)))) {
        internalLinks.add(href);
      }
    }

    for (const href of internalLinks) {
      if (/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?casino\//.test(new URL(href, baseUrl).pathname)) continue;
      const response = await request.get(new URL(href, baseUrl).toString());
      expect(response.status(), `${acceptance.market} internal link ${href}`).toBeLessThan(400);
    }
  });
}

for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
  const locale = profile.defaultLocale;
  const pathname = publicMarketPath(profile, locale);
  test(`${pathname} renders a localized Home contract`, async ({ page }) => {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "http://invalid").pathname).toBe(pathname);
    await expect(page).toHaveTitle(homeMetadata(locale).title);
    const translation = homeTranslation(locale);
    const hero = translation?.hero ?? HOME_SOURCE_COPY.hero;
    await expect(page.getByRole("heading", { name: `${hero[1]} ${hero[2]}` })).toBeVisible();
    const messages = publicShellMessages(locale);
    await expect(page.getByRole("navigation", { name: messages.primaryNavigation })).toBeVisible();
    await expect(page.getByRole("button", { name: messages.changeMarketAndLanguage }).first()).toContainText(locale.split("-")[0].toUpperCase());
    const footer = publicFooterMessages(locale);
    await expect(page.getByRole("contentinfo", { name: footer.label })).toContainText(footer.financialRisk);
  });
}

test("invalid market-language pairs and protected prefixed paths fail without a rewrite", async ({ page }) => {
  for (const pathname of ["/de/en/", "/gr/gr/", "/xx/", "/de/admin", "/de/api/private", "/de/program/api/private", "/it/help", "/nl/responsible-gambling", "/de/help/article"]) {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(404);
  }
});

for (const market of FIRST_WAVE_MARKETS) {
  const evidence = FIRST_WAVE_MARKET_EVIDENCE[market];
  const prefix = `/${evidence.locale.toLowerCase()}`;
  test(`${market} renders localized, noindex Help and Responsible Gambling evidence`, async ({ page }) => {
    for (const [route, title] of [["/help", evidence.copy.helpTitle], ["/responsible-gambling", evidence.copy.responsibleTitle]] as const) {
      const response = await page.goto(`${baseUrl}${prefix}${route}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${market}${route}`).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", evidence.locale);
      await expect(page.locator(`[data-first-wave-safety="${market}"]`)).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
      await expect(page.locator("aside strong").filter({ hasText: evidence.authorityName })).toBeVisible();
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
      expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe(`${prefix}${route}`);
      expect(await page.locator('main a[href^="/r/"], main a[href^="/go/"], main a[href^="/program"], main a[href^="/casinos"], main a[href^="/bonuses"]').count()).toBe(0);
      await expect(page.locator("main")).not.toContainText(/GAMSTOP|GamCare|NHS/);
    }
  });
}

test("desktop selector persists presentation and preserves a supported equivalent path", async ({ page, context }) => {
  await page.goto(`${baseUrl}/de-de/casinos`, { waitUntil: "domcontentloaded" });
  const messages = publicShellMessages("de-DE");
  const trigger = page.getByRole("button", { name: messages.changeMarketAndLanguage }).first();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  const menu = page.getByRole("menu", { name: messages.changeMarketAndLanguage }).first();
  await expect(menu).toBeVisible();
  await expect(menu.locator('button[value="DE|de-DE"]')).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("button", { name: "Anwenden", exact: true })).toHaveCount(0);
  await menu.locator('button[value="ES|es-ES"]').click();
  await expect(page).toHaveURL(/\/es-es\/casinos\/?$/);
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
  const cookies = await context.cookies();
  expect(cookies.find((cookie) => cookie.name === "b4gamble_presentation")?.value).toBe("v1.ES.es-ES");
  await expect(page.getByRole("navigation", { name: publicShellMessages("es-ES").primaryNavigation })).toBeVisible();
});

test("automatic presentation clears the preference and returns to an unprefixed compatible URL", async ({ page, context }) => {
  await context.addCookies([{ name: "b4gamble_presentation", value: "v1.PT.pt-PT", domain: "127.0.0.1", path: "/", httpOnly: true, sameSite: "Lax" }]);
  await page.goto(`${baseUrl}/pt-pt/bonuses?type=welcome&country=PT`, { waitUntil: "domcontentloaded" });
  const messages = publicShellMessages("pt-PT");
  await page.getByRole("button", { name: messages.changeMarketAndLanguage }).first().click();
  await page.getByRole("menu", { name: messages.changeMarketAndLanguage }).first().locator('button[value="automatic"]').click();
  await expect(page).toHaveURL(/\/en-gb\/bonuses\?type=welcome$/);
  expect((await context.cookies()).some((cookie) => cookie.name === "b4gamble_presentation")).toBe(false);
});

test("mobile selector is keyboard-accessible inside the existing modal navigation", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
  const messages = publicShellMessages("da-DK");
  await page.goto(`${baseUrl}/da-dk`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: messages.openNavigation }).click();
  const dialog = page.getByRole("dialog", { name: messages.siteNavigation });
  await expect(dialog).toBeVisible();
  const selector = dialog.getByRole("button", { name: messages.changeMarketAndLanguage });
  await selector.focus();
  await expect(selector).toBeFocused();
  await selector.press("Enter");
  const menu = dialog.getByRole("menu", { name: messages.changeMarketAndLanguage });
  await expect(menu).toBeVisible();
  await expect(menu.locator('[role="menuitemradio"][aria-checked="true"]')).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(dialog).toBeVisible();
  await expect(selector).toBeFocused();
  await selector.press("Enter");
  await expect(menu).toBeVisible();
  const spain = menu.locator('button[value="ES|es-ES"]');
  await spain.focus();
  await spain.press("Enter");
  await expect(page).toHaveURL(/\/es-es\/?$/);
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
  await page.close();
});

test("unprefixed public URLs remain compatible", async ({ page }) => {
  for (const pathname of ["/", "/casinos", "/bonuses", "/best-offers", "/learn"]) {
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(200);
  }
});

const representativeProductMarkets = INITIAL_EUROPEAN_MARKET_PROFILES.filter((profile) => ["GB", "DE", "ES", "GR", "NL", "NO"].includes(profile.countryCode));

for (const profile of representativeProductMarkets) {
  const locale = profile.defaultLocale;
  const prefix = publicMarketPath(profile, locale).replace(/\/$/, "");
  const messages = productPageMessages(locale);
  test(`${profile.countryCode} product pages use localized bodies, self canonicals and no inferred outbound action`, async ({ page }) => {
    for (const [route, expected] of [
      ["/best-offers", messages.bestOffers.heroLead],
      ["/casinos", messages.casinos.heroLead],
      ["/bonuses", messages.bonuses.heroLead],
    ] as const) {
      const response = await page.goto(`${baseUrl}${prefix}${route}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `${profile.countryCode}${route}`).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", locale);
      await expect(page.getByRole("heading", { level: 1 })).toContainText(expected);
      const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
      expect(new URL(canonical ?? "http://invalid").pathname).toBe(`${prefix}${route}`);
      if (profile.countryCode !== "GB") {
        await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
      }
      expect(await page.locator('main a[href^="/r/"]').count(), `${profile.countryCode}${route} must fail closed`).toBe(0);
    }
  });

  test(`${profile.countryCode} localized profile and Compare preserve the explicit prefix`, async ({ page, request }) => {
    const profilePath = `${prefix}/casino/demo-northstar`;
    const response = await page.goto(`${baseUrl}${profilePath}`, { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(new URL(canonical ?? "http://invalid").pathname).toBe(profilePath);
    await expect(page.getByText(messages.profile.offerUnavailable).first()).toBeVisible();
    await expect(page.locator(`a[href="${prefix}/casinos"]`).first()).toBeVisible();
    expect(await page.locator('main a[href^="/r/"]').count()).toBe(0);

    const redirect = await request.get(`${baseUrl}${prefix}/compare?casino=alpha&casino=beta&differences=true`, { maxRedirects: 0 });
    expect(redirect.status()).toBe(308);
    expect(redirect.headers().location).toBe(`${prefix}/casinos?casino=alpha&casino=beta&differences=true`);
  });
}

test("market-first and redundant-language URLs redirect in one hop to locale-market canonicals", async ({ request }) => {
  for (const [legacy, canonical] of [
    ["/de/de/casinos?source=partner", "/de-de/casinos?source=partner"],
    ["/es/es/bonuses", "/es-es/bonuses"],
    ["/se/sv/best-offers", "/sv-se/best-offers"],
    ["/dk/da/methodology", "/da-dk/methodology"],
    ["/gr/el/about", "/el-gr/about"],
    ["/gb/en/", "/en-gb"],
  ] as const) {
    const redirect = await request.get(`${baseUrl}${legacy}`, { maxRedirects: 0 });
    expect(redirect.status(), legacy).toBe(308);
    expect(redirect.headers().location, legacy).toBe(canonical);
    expect((await request.get(`${baseUrl}${canonical}`, { maxRedirects: 0 })).status(), canonical).toBe(200);
  }
});

test("localized 10 Steps and About publish complete draft bodies with localized metadata and accessibility text", async ({ page }) => {
  const tenSteps = tenStepsTranslation("de-DE");
  await page.goto(`${baseUrl}/de-de/10-steps`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(tenSteps.text[1]);
  await expect(page.getByRole("link", { name: tenSteps.text[5] }).first()).toHaveAttribute("href", "/de/program?entry=start");
  await expect(page.locator("main").getByRole("img")).toHaveAttribute("alt", tenSteps.text.at(-1) ?? "");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe("/de-de/10-steps");

  const about = aboutMessages("es-ES");
  await page.goto(`${baseUrl}/es-es/about`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "es-ES");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(about.titleLead);
  await expect(page.locator('[data-about-section="three-parts"]')).toContainText(about.parts[0].body);
  await expect(page.locator('[data-about-section="commercial-separation"]')).toContainText(about.separationPoints[2]);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe("/es-es/about");

  const faq = faqMessages("pt-PT");
  await page.goto(`${baseUrl}/pt-pt/faq`, { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "pt-PT");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(faq.titleLead);
  await expect(page.getByText(faq.groups[0].items[0][1])).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe("/pt-pt/faq");
});

for (const profile of INITIAL_EUROPEAN_MARKET_PROFILES) {
  const locale = profile.defaultLocale;
  const prefix = publicMarketPath(profile, locale).replace(/\/$/, "");
  test(`${profile.countryCode} Methodology, Contact and Learn bodies are locale-complete`, async ({ page }) => {
    const methodology = methodologyMessages(locale);
    await page.goto(`${baseUrl}${prefix}/methodology`, { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(methodology.copy.get("Evidence before") ?? "Evidence before");
    expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe(`${prefix}/methodology` || "/methodology");

    const contact = contactMessages(locale);
    await page.goto(`${baseUrl}${prefix}/contact`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(contact.titleLead);
    await expect(page.getByRole("textbox", { name: contact.emailLabel, exact: true })).toBeVisible();

    const learning = learningMessages(locale);
    await page.goto(`${baseUrl}${prefix}/learn`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1 })).toContainText(learning.hub[1]);
    await expect(page.getByRole("searchbox", { name: learning.hub[10] })).toBeVisible();
    await expect(page.locator('a[data-learn-category]')).toHaveCount(17);
    if (locale !== "en-GB") await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  });
}

test("localized Contact validation announces active-locale constraints without sending", async ({ page }) => {
  const messages = contactMessages("pt-PT");
  await page.goto(`${baseUrl}/pt-pt/contact`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: messages.submit }).click();
  await expect(page.getByText(messages.emailError)).toBeVisible();
  await expect(page.getByRole("textbox", { name: messages.emailLabel, exact: true })).toBeFocused();
});

test("localized Learning article preserves source-unavailable semantics and prefixed internal links", async ({ page }) => {
  const messages = learningMessages("el-GR");
  const article = localizedLearningArticles("el-GR")[0];
  await page.goto(`${baseUrl}/el-gr/learn/casino-basics/online-casino-basics`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { level: 1 })).toContainText(article.title);
  await expect(page.getByRole("heading", { name: messages.ui.sourceUnavailable })).toBeVisible();
  await expect(page.getByText(messages.ui.noClaimSource)).toBeVisible();
  await expect(page.locator('a[href^="/el-gr/learn/"]').first()).toBeVisible();
  await expect(page.locator('a[href="/el-gr/casinos"]').first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex, follow/i);
  expect(new URL(await page.locator('link[rel="canonical"]').getAttribute("href") ?? "http://invalid").pathname).toBe("/el-gr/learn/casino-basics/online-casino-basics");
});

test("localized not-found copy is used when a valid market route has no editorial record", async ({ page }) => {
  const messages = publicErrorMessages("de-DE");
  const response = await page.goto(`${baseUrl}/de-de/learn/unknown/unknown`, { waitUntil: "domcontentloaded" });
  expect(response?.status()).toBe(404);
  await expect(page.locator("html")).toHaveAttribute("lang", "de-DE");
  await expect(page.getByText(messages.notFoundLost)).toBeVisible();
  await expect(page.getByRole("link", { name: messages.notFoundHome })).toHaveAttribute("href", "/de-de");
});

test("newly localized long-copy surfaces have no horizontal overflow at every required width", async ({ browser }) => {
  const samples = [
    [360, "/de-de/methodology"], [375, "/pt-pt/contact"], [390, "/el-gr/learn"],
    [412, "/fi-fi/learn/casino-basics/online-casino-basics"], [430, "/es-es/contact"],
    [768, "/nl-nl/methodology"], [1024, "/nb-no/learn"], [1440, "/de-de/learn/casino-basics/online-casino-basics"],
  ] as const;
  for (const [width, pathname] of samples) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 960 : 1_000 }, isMobile: width <= 430 });
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${pathname} at ${width}px`).toBe(0);
    await page.close();
  }
});

test("long localized copy has no horizontal overflow across the required responsive widths", async ({ browser }) => {
  const samples = [
    [360, "/de-de/about"],
    [375, "/pt-pt/faq"],
    [390, "/el-gr"],
    [412, "/fi-fi/casinos"],
    [430, "/es-es/bonuses"],
    [768, "/nl-nl/about"],
    [1024, "/nb-no/10-steps"],
    [1440, "/de-de/best-offers"],
  ] as const;
  for (const [width, pathname] of samples) {
    const page = await browser.newPage({ viewport: { width, height: width <= 430 ? 900 : 1_000 }, isMobile: width <= 430 });
    const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
    expect(response?.status(), pathname).toBe(200);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth), `${pathname} at ${width}px`).toBe(0);
    await page.close();
  }
});

test("reported localized article and 10 Steps compounds fit without clipping", async ({ browser }) => {
  test.setTimeout(120_000);
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  const measureReadableRegion = async (selector: string, last = false) => {
    const matches = page.locator(selector);
    const root = last ? matches.last() : matches.first();
    await expect(root).toBeVisible();
    return root.evaluate((region) => {
      const viewportWidth = document.documentElement.clientWidth;
      const hiddenOverflow = new Set(["clip", "hidden"]);
      const candidates = [region, ...region.querySelectorAll<HTMLElement>("h1,h2,summary,li,a,strong,span,em")];
      const offenders = candidates.flatMap((element) => {
        const box = element.getBoundingClientRect();
        const text = element.textContent?.replace(/\s+/g, " ").trim() ?? "";
        if (!text || box.width <= 0 || box.height <= 0) return [];
        const range = document.createRange();
        range.selectNodeContents(element);
        const textRects = Array.from(range.getClientRects()).filter((rect) => rect.width > 0 && rect.height > 0);
        const left = textRects.length ? Math.min(...textRects.map((rect) => rect.left)) : box.left;
        const right = textRects.length ? Math.max(...textRects.map((rect) => rect.right)) : box.right;
        const issues: string[] = [];
        if (element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1) issues.push("self-overflow");
        if (left < -1 || right > viewportWidth + 1) issues.push("outside-viewport");
        let ancestor = element.parentElement;
        while (ancestor && ancestor !== document.body && ancestor !== document.documentElement) {
          const style = getComputedStyle(ancestor);
          if (hiddenOverflow.has(style.overflowX)) {
            const clip = ancestor.getBoundingClientRect();
            if (left < clip.left - 1 || right > clip.right + 1) {
              issues.push("ancestor-clip");
              break;
            }
          }
          ancestor = ancestor.parentElement;
        }
        return issues.length ? [{ element: element.tagName.toLowerCase(), issues, left, right, text: text.slice(0, 100) }] : [];
      });
      return {
        documentOffenders: document.documentElement.scrollWidth <= viewportWidth + 1 ? [] : Array.from(document.querySelectorAll<HTMLElement>("body *"))
          .map((element) => {
            const rect = element.getBoundingClientRect();
            return { element: element.tagName.toLowerCase(), left: rect.left, right: rect.right, text: element.textContent?.replace(/\s+/g, " ").trim().slice(0, 100) ?? "" };
          })
          .filter(({ left, right }) => left < -1 || right > viewportWidth + 1)
          .slice(0, 8),
        documentWidth: document.documentElement.scrollWidth,
        offenders: offenders.slice(0, 8),
        viewportWidth,
      };
    });
  };

  const articleCases = [
    ["/de-de/learn/casino-bonuses/welcome-bonus-terms", "related"],
    ["/de-de/learn/casino-reviews/how-casino-reviews-work", "related"],
    ["/de-de/learn/country-guides/country-guide-structure", "related"],
    ["/sv-se/learn/responsible-gambling/responsible-gambling-tools", "faq"],
    ["/sv-se/learn/casino-bonuses/welcome-bonus-terms", "faq"],
    ["/sv-se/learn/casino-reviews/how-casino-reviews-work", "faq"],
    ["/sv-se/learn/country-guides/country-guide-structure", "faq"],
    ["/da-dk/learn/responsible-gambling/responsible-gambling-tools", "faq"],
    ["/da-dk/learn/casino-bonuses/welcome-bonus-terms", "faq"],
    ["/da-dk/learn/casino-reviews/how-casino-reviews-work", "faq"],
    ["/da-dk/learn/country-guides/country-guide-structure", "faq"],
    ["/nl-nl/learn/responsible-gambling/responsible-gambling-tools", "related"],
    ["/nl-nl/learn/casino-reviews/how-casino-reviews-work", "related"],
    ["/nl-nl/learn/country-guides/country-guide-structure", "related"],
  ] as const;

  try {
    for (const [pathname, region] of articleCases) {
      const response = await page.goto(`${baseUrl}${pathname}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), pathname).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      const selector = region === "faq"
        ? '[data-learning-article] section[aria-labelledby="article-faq-title"]'
        : '[data-learning-article] section[aria-labelledby="related-reading-title"]';
      const report = await measureReadableRegion(selector);
      expect(report.documentWidth, `${pathname}: document overflow`).toBeLessThanOrEqual(report.viewportWidth + 1);
      expect(report.offenders, `${pathname}: clipped ${region} copy`).toEqual([]);
    }

    for (const sample of [
      { height: 844, pathname: "/es-es/10-steps", selector: '[data-handoff-page="tenSteps"] h2', useLast: true, width: 390 },
      { height: 932, pathname: "/es-es/10-steps", selector: '[data-handoff-page="tenSteps"] h2', useLast: true, width: 430 },
      { height: 900, pathname: "/fi-fi/10-steps", selector: '[data-handoff-page="tenSteps"] [data-mob="copy"] > h1', useLast: false, width: 1440 },
    ] as const) {
      await page.setViewportSize({ width: sample.width, height: sample.height });
      const response = await page.goto(`${baseUrl}${sample.pathname}`, { waitUntil: "domcontentloaded" });
      expect(response?.status(), sample.pathname).toBe(200);
      await page.evaluate(() => document.fonts.ready);
      const report = await measureReadableRegion(sample.selector, sample.useLast);
      expect(report.documentWidth, `${sample.pathname} at ${sample.width}px: document overflow ${JSON.stringify(report.documentOffenders)}`)
        .toBeLessThanOrEqual(report.viewportWidth + 1);
      expect(report.offenders, `${sample.pathname} at ${sample.width}px: clipped heading`).toEqual([]);
    }
  } finally {
    await context.close();
  }
});
