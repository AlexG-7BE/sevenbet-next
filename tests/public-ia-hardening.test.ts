import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { serializeJsonLd } from "../components/seo/JsonLd";
import {
  assertValidLearningManifest,
  learningArticles,
  publishedLearningArticles,
  type LearningArticle,
} from "../lib/learning-center";
import {
  buildContentSecurityPolicy,
  createCspNonce,
} from "../lib/security/content-security-policy";

const read = (path: string) => readFileSync(path, "utf8");

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

test("Responsible Gambling hub and Protected Help have separate canonical shells", () => {
  const hub = read("app/(public)/responsible-gambling/page.tsx");
  const help = read("app/help/page.tsx");
  const helpLayout = read("app/help/layout.tsx");
  const legacy = read("app/(public)/responsible-gambling/[slug]/page.tsx");

  assert.match(hub, /canonical: absoluteUrl\("\/responsible-gambling"\)/);
  assert.match(hub, /data-responsible-gambling-hub/);
  for (const path of ["/learn/responsible-gambling", "/self-check", "/tools/budget-calculator", "/10-steps", "/help"]) {
    assert.match(hub, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(hub, /safe for you|affordability score|diagnoses you|treatment plan|guaranteed outcome/iu);
  assert.match(help, /canonical: absoluteUrl\("\/help"\)/);
  assert.match(helpLayout, /data-protected-help-shell="true"/);
  assert.doesNotMatch(helpLayout, /PublicHeader|PublicFooter/);
  assert.match(legacy, /permanentRedirect\(`\/help\/\$\{slug\}`\)/);
  for (const requestTimeRoute of [
    "app/help/[slug]/page.tsx",
    "app/(public)/learn/[category]/page.tsx",
    "app/(public)/learn/[category]/[slug]/page.tsx",
    "app/(public)/responsible-gambling/[slug]/page.tsx",
  ]) {
    const source = read(requestTimeRoute);
    assert.match(source, /export const dynamic = "force-dynamic"/);
    assert.doesNotMatch(source, /generateStaticParams/);
  }
});

test("shared navigation exposes the closed Control & Support destinations", () => {
  const navigation = read("lib/public-shell.ts");
  const footer = read("components/public-shell/PublicFooter.tsx");
  const category = read("app/(public)/learn/[category]/LearningCategoryView.tsx");
  assert.match(navigation, /\{ label: "Help", href: "\/help", safety: true \}/);
  assert.match(navigation, /const protectedHelpPrefixes = \["\/help"\]/);
  assert.match(footer, /title: "Control & Support"/);
  for (const pair of [
    '["Responsible gambling", "/responsible-gambling"]',
    '["Self-Check", "/self-check"]',
    '["Personal Limit Tracker", "/tools/budget-calculator"]',
    '["Help", "/help"]',
  ]) assert.ok(footer.includes(pair), pair);
  assert.match(category, /Open Responsible Gambling hub/);
});

test("public Learn pages and API use one explicit published manifest", () => {
  assert.equal(learningArticles.length, 13);
  assert.ok(learningArticles.every((article) => article.status === "PUBLISHED"));
  assert.ok(learningArticles.every((article) => Number.isFinite(Date.parse(article.publishedAt))));
  const first = learningArticles[0];
  const draft: LearningArticle = { ...first, slug: "not-public", status: "DRAFT" };
  assert.deepEqual(publishedLearningArticles([draft, first]), [first]);
  assert.throws(
    () => assertValidLearningManifest([first, { ...first, categorySlug: "casino-bonuses" }]),
    /Duplicate public Learn article slug/,
  );

  const publicRoute = read("app/api/public/[resource]/route.ts");
  assert.match(publicRoute, /import \{ learningArticles \} from "@\/lib\/learning-center"/);
  assert.match(publicRoute, /if \(resource === "articles"\)[\s\S]*learningArticles\.slice\(0, limit\)/);
  assert.ok(publicRoute.indexOf('if (resource === "articles")') < publicRoute.indexOf("listPublishedContent(resource)"));
  assert.match(read("lib/cms/publishing.ts"), /Exclude<PublicCmsResource, "articles">/);
  assert.match(read("app/(public)/learn/[category]/[slug]/page.tsx"), /datePublished: article\.publishedAt/);
});

test("production CSP is nonce-based and has only documented compatibility exceptions", () => {
  const nonce = createCspNonce();
  const production = buildContentSecurityPolicy(nonce);
  const scriptDirective = production.split("; ").find((directive) => directive.startsWith("script-src ")) ?? "";
  assert.match(scriptDirective, new RegExp(`'nonce-${nonce}'`));
  assert.match(scriptDirective, /'strict-dynamic'/);
  assert.doesNotMatch(scriptDirective, /'unsafe-inline'|'unsafe-eval'/);
  assert.match(production, /script-src-attr 'none'/);
  assert.match(production, /style-src-attr 'unsafe-inline'/);
  assert.match(production, /object-src 'none'/);
  assert.match(production, /frame-ancestors 'none'/);
  assert.match(production, /frame-src https:\/\/www\.youtube-nocookie\.com https:\/\/player\.vimeo\.com/);
  assert.match(production, /upgrade-insecure-requests/);

  const development = buildContentSecurityPolicy(nonce, { development: true });
  assert.match(development, /script-src [^;]*'unsafe-eval'/);
  assert.doesNotMatch(development, /script-src [^;]*'unsafe-inline'/);
  assert.doesNotMatch(development, /upgrade-insecure-requests/);
  assert.throws(() => buildContentSecurityPolicy("bad nonce"), /Invalid CSP nonce/);
});

test("JSON-LD escapes markup input and runtime source has no Pexels hotlink", () => {
  const serialized = serializeJsonLd({ value: "</script><script>alert(1)</script>\u2028" });
  assert.doesNotMatch(serialized, /<\/script>|<script>/);
  assert.match(serialized, /\\u003c\/script>/);
  assert.match(serialized, /\\u2028/);
  const nonceStyle = read("components/security/NonceStyle.tsx");
  assert.match(nonceStyle, /nonce=\{nonce\}/);
  assert.match(read("app/(public)/contact/page.tsx"), /<NonceStyle>/);

  const runtime = ["app", "components", "lib"]
    .flatMap(filesBelow)
    .filter((path) => /\.(?:ts|tsx|css|mjs)$/.test(path))
    .map(read)
    .join("\n");
  assert.doesNotMatch(runtime, /images\.pexels\.com/);
  assert.match(read("app/(public)/10-steps/TenStepsLanding.tsx"), /"\/home\/hero-plan\.jpg"/);
  assert.match(read("components/programme/ActiveControlProgramme.tsx"), /"\/home\/hero-confidence\.jpg"/);
});
