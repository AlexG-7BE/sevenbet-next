import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

/** The middleware matcher as Next compiles it: one custom group spanning the whole path. */
function middlewareMatcher() {
  const source = readFileSync("middleware.ts", "utf8");
  const literal = source.match(/matcher: \["(.+)"\]/)?.[1];
  assert.ok(literal, "middleware.ts declares one literal matcher");
  const pattern = JSON.parse(`"${literal}"`) as string;
  assert.ok(pattern.startsWith("/(") && pattern.endsWith(")"), "the matcher is a single path group");
  return new RegExp(`^${pattern}$`);
}

test("middleware runs on every application, auth, API and document route", () => {
  const matcher = middlewareMatcher();
  for (const path of [
    "/",
    "/en",
    "/de/bonuses",
    "/casino/playojo",
    "/r/playojo-casino",
    "/go/playojo",
    "/program",
    "/program/step/1",
    "/admin",
    "/admin/login",
    "/api/auth/sign-in/email",
    "/api/admin/casinos",
    "/api/analytics/events",
    "/api/presentation",
    "/outbound/unavailable",
    "/robots.txt",
    "/sitemap.xml",
    "/llms.txt",
    "/icon.svg",
    "/home/responsive/logo.svg",
    "/partner-preview/anything",
  ]) {
    assert.ok(matcher.test(path), `${path} runs through middleware`);
  }
});

test("middleware skips hashed build assets, the image optimizer, raster images and fonts", () => {
  const matcher = middlewareMatcher();
  for (const path of [
    "/_next/static/chunks/1255-8b646a1ae88725c1.js",
    "/_next/static/css/84a81a068b129809.css",
    "/_next/static/media/c214ffb7f5362987-s.p.woff2",
    "/_next/image",
    "/home/responsive/chapter-1.webp",
    "/casino-brands/playojo.png",
    "/best-offers/hero.avif",
    "/about/team.jpg",
    "/favicon.ico",
  ]) {
    assert.ok(!matcher.test(path), `${path} skips middleware`);
  }
});
