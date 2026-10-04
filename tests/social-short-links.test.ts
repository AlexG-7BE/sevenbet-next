import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import test from "node:test";

import { NextRequest } from "next/server";

import { GET as facebookPost } from "../app/fb/[code]/route";
import { GET as facebookProfile } from "../app/fb/route";
import { GET as instagramStory } from "../app/ig/[code]/route";
import { GET as instagramProfile } from "../app/ig/route";
import { GET as lanaProfile } from "../app/lana/route";
import { GET as threadsPost } from "../app/t/[code]/route";
import { GET as threadsProfile } from "../app/threads/route";
import { GET as xPost } from "../app/x/[code]/route";
import { GET as xProfile } from "../app/x/route";
import { middleware } from "../middleware";
import { homeMetadata } from "../lib/i18n/home-catalog";
import { productMetadata } from "../lib/market/product-context";
import { resolvePresentationContext } from "../lib/market/presentation-resolver";
import { PRESENTATION_LANGUAGE_HEADER } from "../lib/market/routing";
import { DEFAULT_OPEN_GRAPH_IMAGES } from "../lib/seo/social-image";
import { absoluteUrl } from "../lib/site";
import {
  SOCIAL_POST_LINKS,
  SOCIAL_PREVIEW_HOME_PATH,
  SOCIAL_PROFILE_LINKS,
  socialHitLogLine,
  socialPostLink,
  socialShortLinkResponse,
} from "../lib/social/short-links";

const VERCEL_PRODUCTION = { VERCEL: "1", VERCEL_ENV: "production" };
const BROWSER = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0";

function request(path: string, headers: Record<string, string> = {}) {
  return new NextRequest(`https://b4gamble.com${path}`, { headers: { "user-agent": BROWSER, ...headers } });
}

const codeParams = (code: string) => ({ params: Promise.resolve({ code }) });

/** Runs `work` with console.info captured; returns what it logged. */
async function capturedInfo(work: () => unknown) {
  const lines: string[] = [];
  const original = console.info;
  console.info = (...values: unknown[]) => { lines.push(values.map(String).join(" ")); };
  try {
    await work();
  } finally {
    console.info = original;
  }
  return lines;
}

function utm(response: Response) {
  const location = response.headers.get("location");
  assert.ok(location?.startsWith("/?"), `homepage redirect, got ${location}`);
  return new URL(location ?? "", "https://b4gamble.com").searchParams;
}

test("profile short links land on the homepage with their network's bio UTM tags", async () => {
  const expected = [
    [instagramProfile, "/ig", "/?utm_source=instagram&utm_medium=social&utm_campaign=bio&utm_content=link_in_bio"],
    [facebookProfile, "/fb", "/?utm_source=facebook&utm_medium=social&utm_campaign=bio"],
    [xProfile, "/x", "/?utm_source=x&utm_medium=social&utm_campaign=bio"],
    [threadsProfile, "/threads", "/?utm_source=threads&utm_medium=social&utm_campaign=bio"],
    [lanaProfile, "/lana", "/?utm_source=lana&utm_medium=social&utm_campaign=bio"],
  ] as const;
  assert.deepEqual(expected.map(([, path]) => path).sort(), Object.keys(SOCIAL_PROFILE_LINKS).sort());
  const lines = await capturedInfo(() => {
    for (const [handler, path, location] of expected) {
      const response = handler(request(path));
      assert.equal(response.status, 307, path);
      assert.equal(response.headers.get("location"), location, path);
    }
  });
  assert.equal(lines.length, expected.length, "one log line per hit");
});

test("post short links carry the post code into utm_content; Instagram's is a Story, txt- codes are text posts", async () => {
  const cases = [
    [xPost, "n11", "x", "post", "n11"],
    [threadsPost, "b4s4", "threads", "post", "b4s4"],
    [facebookPost, "v01", "facebook", "post", "v01"],
    [instagramStory, "b4r1a", "instagram", "story", "b4r1a"],
    [xPost, "txt-poll1", "x", "text", "poll1"],
    [threadsPost, "txt-saturday-5-stages", "threads", "text", "saturday-5-stages"],
  ] as const;
  for (const [handler, code, source, campaign, content] of cases) {
    let response = new Response();
    await capturedInfo(async () => { response = await handler(request(`/x/${code}`), codeParams(code)); });
    assert.equal(response.status, 307, code);
    const query = utm(response);
    assert.equal(query.get("utm_source"), source, code);
    assert.equal(query.get("utm_medium"), "social", code);
    assert.equal(query.get("utm_campaign"), campaign, code);
    assert.equal(query.get("utm_content"), content, code);
  }
  assert.deepEqual(Object.keys(SOCIAL_POST_LINKS).sort(), ["fb", "ig", "t", "x"]);
});

test("a malformed post code is a 404 and writes no hit", async () => {
  for (const code of ["A1", "n", "txt-", "n11/extra", "a".repeat(25), "n11%2f"]) {
    assert.equal(socialPostLink("x", code), null, code);
    const lines = await capturedInfo(async () => {
      const response = await xPost(request(`/x/${code}`), codeParams(code));
      assert.equal(response.status, 404, code);
    });
    assert.deepEqual(lines, [], code);
  }
});

test("each hit writes exactly one social_hit line: network, campaign, content, country, crawler flag — nothing personal", async () => {
  const lines = await capturedInfo(() => socialShortLinkResponse(
    request("/x/b4r1a", { "x-vercel-ip-country": "GB", "x-forwarded-for": "203.0.113.7", cookie: "b4_session=secret" }),
    socialPostLink("x", "b4r1a"),
    VERCEL_PRODUCTION,
  ));
  assert.deepEqual(lines, ["social_hit src=x campaign=post content=b4r1a country=GB bot=0"]);
  assert.doesNotMatch(lines[0], /203\.0\.113|secret|Mozilla|Instagram/);

  const [bio] = await capturedInfo(() => socialShortLinkResponse(request("/fb"), SOCIAL_PROFILE_LINKS["/fb"], VERCEL_PRODUCTION));
  assert.equal(bio, "social_hit src=facebook campaign=bio content=- country=- bot=0", "no country header is '-'");

  const [preview] = await capturedInfo(() => socialShortLinkResponse(
    request("/t/n11", { "user-agent": "facebookexternalhit/1.1", "x-vercel-ip-country": "IE" }),
    socialPostLink("t", "n11"),
    VERCEL_PRODUCTION,
  ));
  assert.equal(preview, "social_hit src=threads campaign=post content=n11 country=IE bot=1", "link-preview crawlers are flagged");

  const [untrusted] = await capturedInfo(() => socialShortLinkResponse(
    request("/ig", { "x-vercel-ip-country": "GB" }),
    SOCIAL_PROFILE_LINKS["/ig"],
    {},
  ));
  assert.equal(untrusted, "social_hit src=instagram campaign=bio content=link_in_bio country=- bot=0", "the country header counts only on Vercel");

  assert.equal(
    socialHitLogLine({ source: "x", campaign: "text", content: "poll1" }, { country: "SE", crawler: false }),
    "social_hit src=x campaign=text content=poll1 country=SE bot=0",
  );
});

test("the redirect sets no cookie, is never cached, and keeps a platform click id while the link's UTM tags win", async () => {
  let response = new Response();
  await capturedInfo(() => {
    response = socialShortLinkResponse(
      request("/fb/v01?fbclid=IwAR0abc&utm_source=ig&utm_campaign=spoof"),
      socialPostLink("fb", "v01"),
      VERCEL_PRODUCTION,
    );
  });
  assert.equal(response.status, 307);
  assert.equal(response.headers.get("set-cookie"), null);
  assert.match(response.headers.get("cache-control") ?? "", /no-store/);
  const query = utm(response);
  assert.equal(query.get("utm_source"), "facebook");
  assert.equal(query.get("utm_campaign"), "post");
  assert.equal(query.get("fbclid"), "IwAR0abc");
});

test("short links are app routes now, not next.config redirects, and stay clear of real routes", async () => {
  const nextConfig = (await import(new URL("../next.config.mjs", import.meta.url).href) as {
    default: { redirects?: () => Promise<{ source: string }[]> };
  }).default;
  const configRedirects = (await nextConfig.redirects?.()) ?? [];
  assert.deepEqual(configRedirects.filter((link) => /^\/(?:ig|fb|x|t|threads|lana)(?:\/|$)/.test(link.source)), [],
    "a framework redirect would answer before the route and skip the log line");

  const publicSegments = new Set(readdirSync("app/(public)", { withFileTypes: true })
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name));
  const segments = [...Object.keys(SOCIAL_PROFILE_LINKS).map((path) => path.slice(1)), ...Object.keys(SOCIAL_POST_LINKS)];
  for (const segment of segments) {
    assert.ok(existsSync(`app/${segment}`), `app/${segment} exists`);
    assert.ok(!publicSegments.has(segment), `/${segment} does not shadow a public page`);
    assert.ok(!["r", "go", "outbound"].includes(segment), `/${segment} stays clear of affiliate paths`);
  }
});

test("middleware hands short links to their routes untouched", async () => {
  for (const path of ["/ig", "/fb", "/x", "/threads", "/lana", "/x/n11", "/t/b4r1a", "/fb/v01", "/ig/b4r1a"]) {
    const response = await middleware(new NextRequest(`https://b4gamble.com${path}`, { headers: { "user-agent": BROWSER } }));
    assert.equal(response.headers.get("location"), null, `${path} is not redirected by middleware`);
    assert.equal(response.headers.get("x-middleware-rewrite"), null, `${path} is not rewritten by middleware`);
    assert.equal(response.headers.get("x-middleware-next"), "1", `${path} continues to its route`);
  }
});

/** Link-preview crawlers of the networks we post on and the apps people paste links into. */
const PREVIEW_CRAWLERS = [
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "meta-externalagent/1.1 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
  "Twitterbot/1.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/601.2.4 (KHTML, like Gecko) Version/9.0.1 Safari/601.2.4 facebookexternalhit/1.1 Facebot Twitterbot/1.0",
  "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  "LinkedInBot/1.0 (compatible; Mozilla/5.0; Apache-HttpClient +http://www.linkedin.com)",
  "WhatsApp/2.23.20.0",
  "TelegramBot (like TwitterBot)",
  "Mozilla/5.0 (compatible; Discordbot/2.0; +https://discordapp.com)",
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
];

/** People: in-app browsers of the networks and an ordinary desktop browser. */
const PEOPLE = [
  BROWSER,
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/FBIOS;FBAV/480.0.0;FBBV/1;FBDV/iPhone15,2;FBMD/iPhone;FBSN/iOS;FBSV/18.0;FBSS/3;FBCR/;FBID/phone;FBLC/en_GB;FBOP/5]",
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Mobile Safari/537.36 Barcelona 350.0.0.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
];

const SHORT_LINK_HITS = [
  ["/fb/v01", () => socialPostLink("fb", "v01"), "/?utm_source=facebook&utm_medium=social&utm_campaign=post&utm_content=v01"],
  ["/x/n11", () => socialPostLink("x", "n11"), "/?utm_source=x&utm_medium=social&utm_campaign=post&utm_content=n11"],
  ["/t/txt-poll1", () => socialPostLink("t", "txt-poll1"), "/?utm_source=threads&utm_medium=social&utm_campaign=text&utm_content=poll1"],
  ["/ig/b4r1a", () => socialPostLink("ig", "b4r1a"), "/?utm_source=instagram&utm_medium=social&utm_campaign=story&utm_content=b4r1a"],
  ["/ig", () => SOCIAL_PROFILE_LINKS["/ig"], "/?utm_source=instagram&utm_medium=social&utm_campaign=bio&utm_content=link_in_bio"],
  ["/threads", () => SOCIAL_PROFILE_LINKS["/threads"], "/?utm_source=threads&utm_medium=social&utm_campaign=bio"],
  ["/lana", () => SOCIAL_PROFILE_LINKS["/lana"], "/?utm_source=lana&utm_medium=social&utm_campaign=bio"],
] as const;

test("link-preview crawlers are sent to the English home with the same UTM tags; people keep the localized homepage", async () => {
  assert.equal(SOCIAL_PREVIEW_HOME_PATH, "/en");
  for (const [path, link, peopleLocation] of SHORT_LINK_HITS) {
    for (const userAgent of PREVIEW_CRAWLERS) {
      const lines = await capturedInfo(() => {
        const response = socialShortLinkResponse(
          request(path, { "user-agent": userAgent, "x-vercel-ip-country": "DK" }),
          link(),
          VERCEL_PRODUCTION,
        );
        assert.equal(response.status, 307, `${path} ${userAgent}`);
        assert.equal(response.headers.get("location"), `/en${peopleLocation.slice(1)}`, `${path} ${userAgent}`);
        assert.match(response.headers.get("cache-control") ?? "", /no-store/, "never cached, so a person never gets the crawler's redirect");
      });
      assert.equal(lines.length, 1, "still exactly one hit");
      assert.match(lines[0], / country=DK bot=1$/, `${path} ${userAgent}`);
    }
    for (const userAgent of PEOPLE) {
      const lines = await capturedInfo(() => {
        const response = socialShortLinkResponse(
          request(path, { "user-agent": userAgent, "x-vercel-ip-country": "GB" }),
          link(),
          VERCEL_PRODUCTION,
        );
        assert.equal(response.status, 307, `${path} ${userAgent}`);
        assert.equal(response.headers.get("location"), peopleLocation, `${path} ${userAgent}`);
      });
      assert.equal(lines.length, 1, "one hit");
      assert.match(lines[0], / country=GB bot=0$/, `${path} ${userAgent}`);
    }
  }

  // A platform click id still passes on, and the link's own UTM tags still win.
  await capturedInfo(() => {
    const response = socialShortLinkResponse(
      request("/fb/v01?fbclid=IwAR0abc&utm_source=spoof", { "user-agent": PREVIEW_CRAWLERS[0] }),
      socialPostLink("fb", "v01"),
      VERCEL_PRODUCTION,
    );
    assert.equal(response.headers.get("location"), "/en?utm_source=facebook&utm_medium=social&utm_campaign=post&utm_content=v01&fbclid=IwAR0abc");
  });
});

test("the English home answers a Danish crawler in English, while the unprefixed homepage would have sent it to Danish", async () => {
  const names = ["BETTER_AUTH_SECRET", "VERCEL", "VERCEL_ENV", "GEO_BLOCK_ENABLED", "BLOCKED_COUNTRIES"] as const;
  const previous = Object.fromEntries(names.map((name) => [name, process.env[name]]));
  Object.assign(process.env, {
    BETTER_AUTH_SECRET: "social-short-link-english-preview-test-secret",
    VERCEL: "1",
    VERCEL_ENV: "production",
    GEO_BLOCK_ENABLED: "true",
    BLOCKED_COUNTRIES: "KZ",
  });
  const crawler = (path: string, country: string) => middleware(new NextRequest(`https://b4gamble.com${path}`, {
    headers: { "user-agent": PREVIEW_CRAWLERS[0], "x-vercel-ip-country": country },
  }));
  try {
    const query = "?utm_source=facebook&utm_medium=social&utm_campaign=post&utm_content=v01";
    const english = await crawler(`/en${query}`, "DK");
    assert.equal(english.headers.get("location"), null, "/en is served, not redirected");
    assert.equal(new URL(english.headers.get("x-middleware-rewrite") ?? "http://invalid").pathname, "/");
    assert.equal(english.headers.get(`x-middleware-request-${PRESENTATION_LANGUAGE_HEADER}`), "en");
    assert.equal(english.headers.get("content-language"), "en-GB");

    const neutral = await crawler(`/${query}`, "DK");
    assert.equal(neutral.status, 307);
    assert.equal(new URL(neutral.headers.get("location") ?? "http://invalid").pathname, "/da", "the 3 Oct Danish card");

    const blocked = await crawler("/fb/v01", "KZ");
    assert.equal(blocked.status, 451, "the KZ geo-block still answers before the short link");
  } finally {
    for (const name of names) {
      if (previous[name] === undefined) delete process.env[name]; else process.env[name] = previous[name];
    }
  }

  // What app/(public)/page.tsx renders for that request: the English home's own card.
  const presentation = resolvePresentationContext({ routeLanguage: "en", trustedCountryCode: "DK" });
  assert.equal(presentation.locale, "en-GB");
  const { title, description } = homeMetadata(presentation.locale);
  const metadata = productMetadata({ presentation, pathname: "/", title, description, robots: { index: true, follow: true } });
  assert.equal(metadata.openGraph?.title, homeMetadata("en-GB").title);
  assert.match(String(metadata.openGraph?.title), /^B4GAMBLE \(Before Gamble\)/);
  assert.equal(metadata.openGraph?.description, homeMetadata("en-GB").description);
  assert.equal(metadata.openGraph?.url, absoluteUrl(SOCIAL_PREVIEW_HOME_PATH), "og:url is the English home, so a re-scrape stays English");
  assert.equal((metadata.openGraph as { locale?: string }).locale, "en_GB");
  assert.deepEqual(metadata.openGraph?.images, DEFAULT_OPEN_GRAPH_IMAGES);
  assert.equal((metadata.twitter as { title?: string }).title, homeMetadata("en-GB").title);
});
