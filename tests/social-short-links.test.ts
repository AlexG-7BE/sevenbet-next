import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import test from "node:test";

type Redirect = { source: string; destination: string; permanent: boolean };
type PathMatch = (path: string) => false | { params: Record<string, string> };

async function socialRedirects() {
  const nextConfig = (await import(new URL("../next.config.mjs", import.meta.url).href) as {
    default: { redirects?: () => Promise<Redirect[]> };
  }).default;
  assert.ok(nextConfig.redirects, "next.config.mjs declares redirects");
  return await nextConfig.redirects();
}

/** Next's own matcher for redirect sources, so the test reads paths the way Production does. */
function matcherFor(source: string): PathMatch {
  const { match } = createRequire(import.meta.url)("next/dist/compiled/path-to-regexp") as {
    match: (pattern: string) => PathMatch;
  };
  return match(source);
}

test("profile short links land on the homepage with their network's bio UTM tags", async () => {
  const bySource = new Map((await socialRedirects()).map((link) => [link.source, link]));
  const expected: Record<string, string> = {
    "/ig": "utm_source=instagram&utm_medium=social&utm_campaign=bio&utm_content=link_in_bio",
    "/fb": "utm_source=facebook&utm_medium=social&utm_campaign=bio",
    "/x": "utm_source=x&utm_medium=social&utm_campaign=bio",
    "/threads": "utm_source=threads&utm_medium=social&utm_campaign=bio",
    "/lana": "utm_source=lana&utm_medium=social&utm_campaign=bio",
  };
  for (const [source, query] of Object.entries(expected)) {
    assert.equal(bySource.get(source)?.destination, `/?${query}`, source);
  }
});

test("post short links carry the post code into utm_content", async () => {
  const redirects = await socialRedirects();
  for (const [path, utmSource] of [["/x/n11", "x"], ["/t/b4s4", "threads"]] as const) {
    const hits = [];
    for (const link of redirects) {
      const hit = matcherFor(link.source)(path);
      if (hit) hits.push({ link, hit });
    }
    assert.equal(hits.length, 1, `${path} matches exactly one short link`);
    const [{ link, hit }] = hits;
    const destination = link.destination.replace(":post", hit.params.post);
    const query = new URL(destination, "https://b4gamble.com").searchParams;
    assert.equal(query.get("utm_source"), utmSource);
    assert.equal(query.get("utm_campaign"), "post");
    assert.equal(query.get("utm_content"), path.split("/")[2]);
  }
  assert.equal(matcherFor("/x/:post([a-z0-9-]{2,24})")("/x/a/b"), false, "post codes are one segment");
});

test("short links are temporary redirects to the homepage and never shadow a real route", async () => {
  const redirects = await socialRedirects();
  const routeSegments = new Set([
    ...readdirSync("app", { withFileTypes: true }),
    ...readdirSync("app/(public)", { withFileTypes: true }),
  ].filter((entry) => entry.isDirectory()).map((entry) => entry.name));
  for (const link of redirects) {
    assert.equal(link.permanent, false, `${link.source} stays re-pointable`);
    assert.ok(link.destination.startsWith("/?utm_source="), `${link.source} lands on the homepage`);
    const firstSegment = link.source.split("/")[1];
    assert.ok(!routeSegments.has(firstSegment), `${link.source} does not shadow app/${firstSegment}`);
    assert.ok(!["r", "go", "outbound"].includes(firstSegment), `${link.source} stays clear of affiliate paths`);
  }
});
