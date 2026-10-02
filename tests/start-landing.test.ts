import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { after, before, test } from "node:test";

import type { Metadata } from "next";
import { NextRequest } from "next/server";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { isLocalizedPublicDestination, parsePublicMarketRoute, publicRoutePolicy } from "../lib/market/routing";
import { absoluteUrl, coreRoutes } from "../lib/site";

// The /start help-ad landing (Founder, 2 October 2026): TikTok reviewers judge the landing page,
// so it must carry no casino, bonus, offer or partner destination, read the same for every
// visitor and stay out of search.

const read = (path: string) => readFileSync(path, "utf8");
const require = createRequire(import.meta.url);
require.extensions[".css"] = (module) => { module.exports = {}; };

const COMMERCIAL_HREF = /href="[^"]*\/(?:best-offers|casinos|bonuses|casino\/|r\/|go\/|outbound\/|compare)/;
const startSources = readdirSync("app/start").map((name) => ({ name, text: read(join("app/start", name)) }));

const environment = {
  VERCEL: "1",
  VERCEL_ENV: "production",
  GEO_BLOCK_ENABLED: "true",
  BLOCKED_COUNTRIES: "KZ",
  OWNER_BYPASS_KEY: "start-test-owner-key-0123456789abcdefghijklmnopqrstuvwxyz",
  OWNER_UNLOCK_PATH: "/owner-gate-5c1d8e4b",
  NEXT_PUBLIC_ANALYTICS_ENABLED: undefined,
} as const;
const previousEnvironment = new Map<string, string | undefined>();

function setEnvironment(values: Record<string, string | undefined>) {
  for (const [name, value] of Object.entries(values)) {
    if (!previousEnvironment.has(name)) previousEnvironment.set(name, process.env[name]);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

let renderStart: () => string;
let metadata: Metadata;

before(async () => {
  setEnvironment(environment);
  (globalThis as typeof globalThis & { React: typeof React }).React = React;
  const [{ default: StartLayout }, page] = await Promise.all([
    import("../app/start/layout"),
    import("../app/start/page"),
  ]);
  metadata = page.metadata;
  renderStart = () => renderToStaticMarkup(React.createElement(StartLayout, null, React.createElement(page.default)));
});

after(() => {
  for (const [name, value] of previousEnvironment) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

function hrefs(html: string) {
  return [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map((match) => match[1]);
}

function textContent(html: string) {
  return html.replace(/<[^>]+>/g, " ").replaceAll("&amp;", "&").replace(/\s+/g, " ").trim();
}

test("/start renders the 10 Steps pitch with no commercial or public-shell destination", () => {
  const html = renderStart();

  assert.doesNotMatch(html, COMMERCIAL_HREF);
  assert.deepEqual(hrefs(html), [
    "#main-content",
    // Hero, first Mission, final section and the phone-only sticky start bar.
    "/program?entry=start",
    "/program?entry=start",
    "/program?entry=start",
    "/program?entry=start",
    "https://www.gamcare.org.uk/get-support/",
    "https://www.gamstop.co.uk/",
    "/privacy",
    "/terms",
  ]);
  assert.doesNotMatch(html, /data-public-shell|data-commercial-navigation|Primary navigation/);
  assert.doesNotMatch(textContent(html), /best offers|casinos?\b|bonus(?:es)?\b|welcome offer|free spins/i);
  assert.match(html, /data-runtime-renderer="ten-steps"/);
  assert.deepEqual(
    [...html.matchAll(/data-ten-steps-section="([^"]+)"/g)].map((match) => match[1]),
    ["hero", "programme-builds", "mission-map", "account-boundary", "final-action"],
  );
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.equal((html.match(/<main id="main-content">/g) ?? []).length, 1);
});

test("/start keeps the 18+ notice, the Programme disclaimer, legal links and UK support", () => {
  const html = renderStart();
  const text = textContent(html);

  assert.match(html, /<span[^>]*>B4GAMBLE<\/span>/, "the wordmark is not a link");
  assert.match(text, /18\+/);
  assert.match(text, /The B4GAMBLE Programme does not diagnose or treat gambling addiction\. Completion does not mean gambling is safe or suitable\./);
  assert.match(html, /<a href="\/privacy">Privacy<\/a>/);
  assert.match(html, /<a href="\/terms">Terms<\/a>/);
  for (const name of ["GamCare", "GAMSTOP Online"]) assert.ok(text.includes(name), name);
  for (const external of html.match(/<a\b[^>]*href="https:[^"]*"[^>]*>/g) ?? []) {
    assert.match(external, /rel="noopener noreferrer"/);
    assert.match(external, /target="_blank"/);
  }
  assert.doesNotMatch(text, /\b0\d{3} ?\d{3} ?\d{3,4}\b/, "no phone number the repository has not verified");
  assert.doesNotMatch(html, /data-privacy-choices-trigger/, "the cookie control follows the analytics switch");

  process.env.NEXT_PUBLIC_ANALYTICS_ENABLED = "true";
  try {
    assert.match(renderStart(), /<button[^>]*data-privacy-choices-trigger[^>]*>Cookie settings<\/button>/);
  } finally {
    delete process.env.NEXT_PUBLIC_ANALYTICS_ENABLED;
  }
});

test("/start is noindex, follow, with a help-focused title and description", () => {
  assert.deepEqual(metadata.robots, { index: false, follow: true });
  assert.equal(metadata.alternates?.canonical, absoluteUrl("/start"));
  const copy = `${String(metadata.title)} ${String(metadata.description)}`;
  assert.match(String(metadata.title), /gambling/i);
  assert.match(String(metadata.title), /\| B4GAMBLE$/);
  assert.ok(String(metadata.description).length <= 155);
  assert.doesNotMatch(copy, /treat|therap|clinic|cure|casino|bonus|offer/i);
  assert.equal(metadata.openGraph && "images" in metadata.openGraph, false, "no comparison social image");
});

test("/start stays out of the sitemap and llms.txt", () => {
  assert.equal(coreRoutes.includes("/start"), false);
  assert.doesNotMatch(read("lib/seo/llms.ts") + read("lib/seo/llms-full.ts") + read("app/sitemap.ts"), /["'`(]\/start["'`)]/);
});

test("/start is the same page for everyone and adds no tracking", () => {
  const layout = startSources.find((source) => source.name === "layout.tsx")?.text ?? "";
  assert.match(layout, /<StartHeader \/>[\s\S]*<main id="main-content">\{children\}<\/main>[\s\S]*<StartFooter \/>/);
  for (const { name, text } of startSources) {
    assert.doesNotMatch(text, /PublicHeader|PublicNavigation|PublicFooter|components\/commercial|components\/public-shell/, name);
    assert.doesNotMatch(text, /next\/headers|headers\(\)|cookies\(\)|userAgent|user-agent|\breferer\b|document\.referrer|navigator\.|x-vercel-ip-country|requestCountry|resolveServerPresentationContext|searchParams/i, name);
    assert.doesNotMatch(text, /next\/script|<Script|<script|googletagmanager|gtag\(|fbq\(|ttq\.|analytics\.tiktok|tiktok pixel|@vercel\/analytics|clarity\.ms|segment\.com|hotjar/i, name);
  }
});

test("/start is an unprefixed route that middleware passes through unchanged, except for the KZ block", async () => {
  assert.equal(publicRoutePolicy("/start"), "UNPREFIXED_ONLY");
  assert.equal(isLocalizedPublicDestination("/start"), false);
  assert.equal(parsePublicMarketRoute("/start").kind, "INVALID");
  assert.equal(parsePublicMarketRoute("/en/start").kind, "INVALID");

  const { middleware } = await import("../middleware");
  const visit = (headers: Record<string, string>) => middleware(new NextRequest("https://b4gamble.com/start", { headers }));

  const blocked = await visit({ "x-vercel-ip-country": "KZ" });
  assert.equal(blocked.status, 451);

  const visitors: Record<string, string>[] = [
    { "x-vercel-ip-country": "GB", "user-agent": "Mozilla/5.0 (iPhone) TikTok", referer: "https://www.tiktok.com/" },
    { "x-vercel-ip-country": "US", "user-agent": "Googlebot/2.1" },
    { "x-vercel-ip-country": "SE", "accept-language": "sv-SE", "user-agent": "TikTokReviewBot" },
    {},
  ];
  for (const headers of visitors) {
    const response = await visit(headers);
    assert.equal(response.status, 200, JSON.stringify(headers));
    assert.equal(response.headers.get("location"), null);
    assert.equal(response.headers.get("x-middleware-rewrite"), null);
    assert.equal(response.headers.get("vary"), null);
    assert.equal(response.headers.get("content-language"), null);
  }
});
