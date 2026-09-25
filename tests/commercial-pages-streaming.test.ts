import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

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
});
