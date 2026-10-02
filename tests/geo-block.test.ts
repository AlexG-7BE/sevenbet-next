import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { NextRequest } from "next/server";

import { middleware } from "../middleware";
import {
  geoBlockConfig,
  OWNER_BYPASS_COOKIE,
  OWNER_BYPASS_MAX_AGE_SECONDS,
  signOwnerBypassToken,
  verifyOwnerBypassToken,
} from "../lib/security/geo-block";
import {
  GEO_BLOCK_STATIC_ASSET_PATH_PATTERN,
  geoBlockFirewallRule,
} from "../lib/security/geo-block-firewall-rule";
import { GEO_BLOCK_MESSAGES } from "../lib/security/geo-block-page";

const ORIGIN = "https://b4gamble.com";
const OWNER_KEY = "test-owner-key-0123456789abcdefghijklmnopqrstuvwxyz";
const ROTATED_OWNER_KEY = "rotated-owner-key-0123456789abcdefghijklmnopqrstuv";
const UNLOCK_PATH = "/owner-gate-7f3a9c2e";

const testEnvironment = {
  VERCEL: "1",
  VERCEL_ENV: "production",
  GEO_BLOCK_ENABLED: "true",
  BLOCKED_COUNTRIES: "KZ",
  OWNER_BYPASS_KEY: OWNER_KEY,
  OWNER_UNLOCK_PATH: UNLOCK_PATH,
} as const;
const previousEnvironment = new Map<string, string | undefined>();

function setEnvironment(values: Record<string, string | undefined>) {
  for (const [name, value] of Object.entries(values)) {
    if (!previousEnvironment.has(name)) previousEnvironment.set(name, process.env[name]);
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
}

before(() => setEnvironment(testEnvironment));
after(() => {
  for (const [name, value] of previousEnvironment) {
    if (value === undefined) delete process.env[name];
    else process.env[name] = value;
  }
});

function visit(path: string, { country, cookie, headers = {}, method = "GET" }: {
  country?: string;
  cookie?: string;
  headers?: Record<string, string>;
  method?: string;
} = {}) {
  const requestHeaders = new Headers(headers);
  if (country) requestHeaders.set("x-vercel-ip-country", country);
  if (cookie !== undefined) requestHeaders.set("cookie", `${OWNER_BYPASS_COOKIE}=${cookie}`);
  return middleware(new NextRequest(`${ORIGIN}${path}`, { headers: requestHeaders, method }));
}

function ownerCookieFrom(response: Response) {
  const header = response.headers.get("set-cookie") ?? "";
  const value = header.match(new RegExp(`${OWNER_BYPASS_COOKIE}=([^;]*)`))?.[1];
  return { header, value };
}

async function unlock(key = OWNER_KEY) {
  const response = await visit(`${UNLOCK_PATH}?key=${encodeURIComponent(key)}`, { country: "KZ" });
  return { response, ...ownerCookieFrom(response) };
}

test("a visitor from KZ without the owner cookie gets HTTP 451 on every kind of route", async () => {
  for (const path of [
    "/",
    "/en",
    "/en/bonuses",
    "/casino/playojo",
    "/start",
    "/r/playojo-casino",
    "/api/public/bonuses",
    "/api/presentation",
    "/sitemap.xml",
    "/robots.txt",
    "/llms.txt",
    "/icon.svg",
    "/admin/login",
  ]) {
    const response = await visit(path, { country: "KZ" });
    assert.equal(response.status, 451, `${path} is blocked`);
  }
  const rsc = await visit("/en/casinos?_rsc=abc", { country: "KZ", headers: { RSC: "1", "Next-Router-State-Tree": "%5B%5D" } });
  assert.equal(rsc.status, 451, "client navigation data (RSC payload) is blocked");
  const post = await visit("/api/analytics/events", { country: "KZ", method: "POST" });
  assert.equal(post.status, 451, "API writes are blocked");
});

test("the 451 page is private, noindex and carries only the three-language notice", async () => {
  const response = await visit("/en", { country: "KZ" });
  assert.equal(response.status, 451);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html/);
  assert.match(response.headers.get("content-security-policy") ?? "", /^default-src 'none'/);
  const html = await response.text();
  assert.match(html, /<meta name="robots" content="noindex, nofollow, noarchive">/);
  for (const message of Object.values(GEO_BLOCK_MESSAGES)) assert.ok(html.includes(message), message);
  assert.match(html, /B4GAMBLE/);
  for (const forbidden of [/<a\b/i, /<script\b/i, /<form\b/i, /<img\b/i, /<iframe\b/i, /https?:\/\//i, /src=/i]) {
    assert.doesNotMatch(html, forbidden, `the block page contains no ${forbidden}`);
  }
});

test("the right key sets a signed, HttpOnly owner cookie for the domain and www, then redirects home", async () => {
  const { response, header, value } = await unlock();
  assert.equal(response.status, 303);
  assert.equal(response.headers.get("location"), `${ORIGIN}/`);
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.ok(value, "the owner cookie is set");
  assert.ok(!header.includes(OWNER_KEY) && !value!.includes(OWNER_KEY), "the cookie never carries the key");
  assert.match(header, /HttpOnly/i);
  assert.match(header, /Secure/i);
  assert.match(header, /SameSite=lax/i);
  assert.match(header, /Path=\//i);
  assert.match(header, /Domain=b4gamble\.com/i);
  assert.match(header, new RegExp(`Max-Age=${OWNER_BYPASS_MAX_AGE_SECONDS}`));
});

test("a visitor from KZ with a valid owner cookie passes the geo-block", async () => {
  const { value } = await unlock();
  for (const path of ["/en", "/api/public/bonuses", "/sitemap.xml"]) {
    const response = await visit(path, { country: "KZ", cookie: value });
    assert.notEqual(response.status, 451, `${path} opens for the owner`);
  }
  const home = await visit("/en", { country: "KZ", cookie: value });
  assert.equal(home.status, 200);
});

test("a forged, tampered or empty owner cookie is still blocked", async () => {
  const { value } = await unlock();
  const [version, issuedAt, signature] = value!.split(".");
  const forgedSignature = `${signature.slice(0, 20)}${signature[20] === "x" ? "y" : "x"}${signature.slice(21)}`;
  const lastBits = "AEIMQUYcgkosw048".indexOf(signature.at(-1)!);
  assert.ok(lastBits >= 0, "the issued signature is canonical base64url");
  const nonCanonicalSignature = `${signature.slice(0, -1)}${"BFJNRVZdhlptx159"[lastBits]}`;
  for (const cookie of [
    "",
    "1",
    OWNER_KEY,
    `${version}.${issuedAt}.${forgedSignature}`,
    `${version}.${issuedAt}.${nonCanonicalSignature}`,
    `${version}.${Number(issuedAt) - 60}.${signature}`,
    await signOwnerBypassToken("attacker-key-0123456789abcdefghijklmnopqrstuvwxyz"),
  ]) {
    const response = await visit("/en", { country: "KZ", cookie });
    assert.equal(response.status, 451, `cookie ${JSON.stringify(cookie)} is refused`);
  }
});

test("visitors from other countries see the site as before", async () => {
  for (const country of ["DE", "GB", "RU", "US"]) {
    const response = await visit("/en", { country });
    assert.equal(response.status, 200, `${country} is not blocked`);
  }
});

test("a wrong key sets no cookie and behaves like any visit to that path", async () => {
  for (const key of ["", "wrong", OWNER_KEY.slice(0, -1), `${OWNER_KEY}x`, ROTATED_OWNER_KEY]) {
    const blocked = await visit(`${UNLOCK_PATH}?key=${encodeURIComponent(key)}`, { country: "KZ" });
    assert.equal(blocked.status, 451, "KZ sees the ordinary block page");
    assert.equal(ownerCookieFrom(blocked).value, undefined);

    const elsewhere = await visit(`${UNLOCK_PATH}?key=${encodeURIComponent(key)}`, { country: "DE" });
    assert.notEqual(elsewhere.status, 303, "no owner redirect");
    assert.equal(ownerCookieFrom(elsewhere).value, undefined);
  }
});

test("a new OWNER_BYPASS_KEY invalidates every earlier cookie", async () => {
  const { value } = await unlock();
  setEnvironment({ OWNER_BYPASS_KEY: ROTATED_OWNER_KEY });
  try {
    assert.equal((await visit("/en", { country: "KZ", cookie: value })).status, 451);
    const rotated = await unlock(ROTATED_OWNER_KEY);
    assert.equal((await visit("/en", { country: "KZ", cookie: rotated.value })).status, 200);
  } finally {
    setEnvironment({ OWNER_BYPASS_KEY: OWNER_KEY });
  }
});

test("logout deletes the owner cookie; without a cookie it is an ordinary visit", async () => {
  const { value } = await unlock();
  const response = await visit(`${UNLOCK_PATH}/logout`, { country: "KZ", cookie: value });
  assert.equal(response.status, 303);
  const { header } = ownerCookieFrom(response);
  assert.match(header, new RegExp(`${OWNER_BYPASS_COOKIE}=;`));
  assert.match(header, /Max-Age=0/i);
  assert.match(header, /Domain=b4gamble\.com/i);

  assert.equal((await visit(`${UNLOCK_PATH}/logout`, { country: "KZ" })).status, 451);
});

test("an unknown country passes and is logged without IP, key or query", async () => {
  const warnings: string[] = [];
  const originalWarn = console.warn;
  console.warn = (...values: unknown[]) => { warnings.push(values.map(String).join(" ")); };
  try {
    const response = await visit("/en?key=secret-query-value", {
      headers: { "x-forwarded-for": "203.0.113.7", "x-real-ip": "203.0.113.7" },
    });
    assert.equal(response.status, 200);
    await visit(`${UNLOCK_PATH}?key=${OWNER_KEY}`, { headers: { "x-forwarded-for": "203.0.113.7" } });
  } finally {
    console.warn = originalWarn;
  }
  const geoWarnings = warnings.filter((line) => line.includes("geo_block.country_unknown"));
  assert.equal(geoWarnings.length, 1, "the unknown country is logged; the owner unlock is not a visit");
  for (const line of geoWarnings) {
    assert.doesNotMatch(line, /203\.0\.113\.7/);
    assert.doesNotMatch(line, /secret-query-value/);
    assert.ok(!line.includes(OWNER_KEY));
  }
});

test("a client-supplied country header is ignored outside the trusted Vercel runtime", async () => {
  setEnvironment({ VERCEL: undefined, VERCEL_ENV: undefined });
  const originalWarn = console.warn;
  console.warn = () => {};
  try {
    assert.notEqual((await visit("/en", { country: "KZ" })).status, 451);
  } finally {
    console.warn = originalWarn;
    setEnvironment({ VERCEL: "1", VERCEL_ENV: "production" });
  }
});

test("GEO_BLOCK_ENABLED switches the block off", async () => {
  setEnvironment({ GEO_BLOCK_ENABLED: "false" });
  try {
    assert.equal((await visit("/en", { country: "KZ" })).status, 200);
  } finally {
    setEnvironment({ GEO_BLOCK_ENABLED: "true" });
  }
});

test("configuration refuses weak keys, obvious unlock paths and malformed countries", () => {
  const base = { GEO_BLOCK_ENABLED: "true", BLOCKED_COUNTRIES: "kz, by ,XX1,,RU", OWNER_BYPASS_KEY: OWNER_KEY, OWNER_UNLOCK_PATH: UNLOCK_PATH };
  assert.deepEqual([...geoBlockConfig(base).blockedCountries], ["KZ", "BY", "RU"]);
  assert.equal(geoBlockConfig({ ...base, BLOCKED_COUNTRIES: "" }).enabled, false);
  assert.equal(geoBlockConfig({ ...base, OWNER_BYPASS_KEY: "short-key" }).ownerKey, null);
  assert.equal(geoBlockConfig({ ...base, OWNER_UNLOCK_PATH: `${UNLOCK_PATH}/` }).unlockPath, UNLOCK_PATH);
  for (const path of ["/admin", "/unlock", "/admin/owner-entry-1234", "/unlock-owner-1234", "/api/owner-entry-1234", "/short", "/bad path/x1234567", "no-leading-slash-123"]) {
    const unlockPath = geoBlockConfig({ ...base, OWNER_UNLOCK_PATH: path }).unlockPath;
    if (path === "/unlock-owner-1234") assert.equal(unlockPath, path, "only the exact /unlock segment is reserved");
    else assert.equal(unlockPath, null, `${path} is refused`);
  }
});

test("owner tokens expire after a year and are bound to their key", async () => {
  const issuedAt = Date.UTC(2026, 8, 28);
  const token = await signOwnerBypassToken(OWNER_KEY, issuedAt);
  assert.equal(await verifyOwnerBypassToken(token, OWNER_KEY, issuedAt), true);
  assert.equal(await verifyOwnerBypassToken(token, OWNER_KEY, issuedAt + (OWNER_BYPASS_MAX_AGE_SECONDS - 60) * 1000), true);
  assert.equal(await verifyOwnerBypassToken(token, OWNER_KEY, issuedAt + (OWNER_BYPASS_MAX_AGE_SECONDS + 60) * 1000), false);
  assert.equal(await verifyOwnerBypassToken(token, ROTATED_OWNER_KEY, issuedAt), false);
  assert.equal(await verifyOwnerBypassToken(token, null, issuedAt), false);
});

/** The middleware matcher as Next compiles it (see tests/middleware-matcher.test.ts). */
function middlewareMatcher() {
  const literal = readFileSync("middleware.ts", "utf8").match(/matcher: \["(.+)"\]/)?.[1];
  assert.ok(literal);
  return new RegExp(`^${JSON.parse(`"${literal}"`) as string}$`);
}

test("the Firewall rule covers exactly the static assets that skip middleware", () => {
  const matcher = middlewareMatcher();
  const firewall = new RegExp(GEO_BLOCK_STATIC_ASSET_PATH_PATTERN);
  for (const path of [
    "/_next/static/chunks/1255-8b646a1ae88725c1.js",
    "/_next/static/css/84a81a068b129809.css",
    "/_next/static/media/c214ffb7f5362987-s.p.woff2",
    "/_next/image",
    "/home/responsive/chapter-1.webp",
    "/casino-brands/playojo.png",
    "/best-offers/hero.avif",
    "/about/team.jpg",
    "/brand/b4gamble-logo-512.png",
    "/favicon.ico",
    "/fonts/inter.ttf",
  ]) {
    assert.ok(!matcher.test(path), `${path} skips middleware`);
    assert.ok(firewall.test(path), `${path} is covered by the Firewall rule`);
  }
  for (const path of ["/", "/en", "/api/public/bonuses", "/sitemap.xml", "/icon.svg", UNLOCK_PATH]) {
    assert.ok(matcher.test(path), `${path} runs through middleware`);
    assert.ok(!firewall.test(path), `${path} is left to middleware and its 451 page`);
  }
});

test("the Firewall rule targets Production, the blocked countries and visitors without the owner cookie", () => {
  const rule = geoBlockFirewallRule(["KZ"]);
  const conditions = rule.conditionGroup[0].conditions;
  assert.deepEqual(conditions.find((condition) => condition.type === "geo_country")?.value, ["KZ"]);
  assert.deepEqual(conditions.find((condition) => condition.type === "cookie"), { type: "cookie", op: "nex", key: OWNER_BYPASS_COOKIE });
  assert.deepEqual(conditions.find((condition) => condition.type === "environment"), { type: "environment", op: "eq", value: "production" });
  assert.equal(rule.action.mitigate.action, "deny");
});
