import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { isCrawlerUserAgent } from "../lib/seo/crawler";

const read = (path: string) => readFileSync(path, "utf8");

// 25 Sep 2026: the commercial pages stream their route frame at once, as the home page does.
test("catalogue pages stream the route frame before their data loads", () => {
  for (const [path, destination, content] of [
    ["app/(public)/casinos/page.tsx", "casinos", "CasinosContent"],
    ["app/(public)/bonuses/page.tsx", "bonuses", "BonusesContent"],
    ["app/(public)/best-offers/page.tsx", "best-offers", "BestOffersContent"],
  ] as const) {
    const page = read(path);
    const exported = page.slice(page.indexOf("export default async function"));
    assert.match(exported, new RegExp(`<Suspense fallback=\\{<PublicRouteLoadingFrame destination="${destination}"`), path);
    assert.match(exported, new RegExp(`<${content} raw=\\{raw\\} />`), path);
    // The error harness fires before the boundary so a failure keeps its error status.
    assert.ok(exported.indexOf("triggerPublicCommercialErrorHarness(raw.errorFixture)") < exported.indexOf("<Suspense"), path);
    // Crawlers get the complete page in the first response.
    assert.match(exported, new RegExp(`if \\(isCrawlerUserAgent\\(requestHeaders\\.get\\("user-agent"\\)\\)\\) return <${content} raw=\\{raw\\} />;`), path);
    // Only presentation (headers and cookies) is awaited before the frame; the catalogue loads inside.
    assert.doesNotMatch(exported, /await load|Service\./, path);
  }
});

test("a casino profile settles existence before its frame streams, so a missing casino stays a 404", () => {
  const page = read("app/(public)/casino/[slug]/page.tsx");
  const exported = page.slice(page.indexOf("export default async function"));
  assert.match(exported, /await publicCasinoService\.findPublishedCasino\(slug, presentation\.marketCountryCode\)/);
  assert.ok(exported.indexOf("notFound()") > -1 && exported.indexOf("notFound()") < exported.indexOf("<Suspense"));
  assert.match(exported, /<Suspense fallback=\{<PublicRouteLoadingFrame destination="casino" label=\{published\.name\} \/>\}>/);
  assert.doesNotMatch(exported, /loadCasinoPage\(/, "the review, offers and action decision load inside the boundary");
  assert.ok(exported.indexOf("isCrawlerUserAgent(") > exported.indexOf("notFound()"), "a crawler also gets a real 404 first");
});

test("search, AI and preview crawlers are recognised; browsers are not", () => {
  for (const crawler of [
    "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; Claude-User/1.0; +Claude-User@anthropic.com)",
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
    "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
    "TelegramBot (like TwitterBot)",
    "WhatsApp/2.23.20.0",
    "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
    "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
  ]) assert.equal(isCrawlerUserAgent(crawler), true, crawler);
  for (const person of [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 12; CUBOT_X30 Build/SP1A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36 Chrome-Lighthouse",
    "",
  ]) assert.equal(isCrawlerUserAgent(person), false, person);
  assert.equal(isCrawlerUserAgent(null), false);
});
