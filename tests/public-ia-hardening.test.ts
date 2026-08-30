import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { serializeJsonLd } from "../components/seo/JsonLd";
import {
  getArticleBySlug,
  getLearningCategory,
  assertValidLearningManifest,
  learningArticles,
  publishedLearningArticles,
  type LearningArticle,
} from "../lib/learning-center";
import {
  LEGACY_RESPONSIBLE_GAMBLING_ROUTES,
  getLegacyResponsibleGamblingRoute,
  protectedHelpArticles,
  withPreservedLegacyQuery,
} from "../lib/responsible-gambling";
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
  const handoffPages = JSON.parse(read("lib/final-handoff/generated-pages.json")) as Record<string, { html: string }>;
  const hubDocument = hub + handoffPages.responsibleGambling.html;
  const help = read("app/help/page.tsx");
  const helpLayout = read("app/help/layout.tsx");
  const legacy = read("app/(public)/responsible-gambling/[slug]/page.tsx");

  assert.match(hub, /pathname: "\/responsible-gambling"/);
  assert.match(hub, /firstWaveSafetyLanguageAlternates\("\/responsible-gambling"\)/);
  assert.match(hub, /transformResponsibleGamblingHandoff/);
  assert.match(hub, /<HandoffPage name="responsibleGambling" transform=\{transformResponsibleGamblingHandoff\} \/>/);
  for (const path of ["/learn", "/10-steps", "/help"]) {
    assert.match(hubDocument, new RegExp(path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.doesNotMatch(hubDocument, /href:\s*"\/(?:self-check|tools\/budget-calculator)"/);
  assert.doesNotMatch(hubDocument, /safe for you|affordability score|diagnoses you|treatment plan|guaranteed outcome/iu);
  assert.match(help, /pathname: "\/help"/);
  assert.match(help, /firstWaveSafetyLanguageAlternates\("\/help"\)/);
  assert.match(helpLayout, /data-protected-help-shell="true"/);
  assert.doesNotMatch(helpLayout, /PublicHeader|PublicFooter/);
  assert.match(legacy, /getLegacyResponsibleGamblingRoute\(slug\)/);
  assert.match(legacy, /withPreservedLegacyQuery\(route\.destination, await searchParams\)/);
  assert.doesNotMatch(legacy, /`\/help\/\$\{slug\}`|`\/learn\/\$\{slug\}`/);
  for (const requestTimeRoute of [
    "app/(public)/learn/[category]/[slug]/page.tsx",
    "app/(public)/responsible-gambling/[slug]/page.tsx",
  ]) {
    const source = read(requestTimeRoute);
    assert.match(source, /export const dynamic = "force-dynamic"/);
    assert.doesNotMatch(source, /generateStaticParams/);
  }
  assert.match(read("components/protected-help/ProtectedHelpHub.tsx"), /We&apos;re here\.<br \/>No strings\./i);
  assert.match(read("app/help/[slug]/page.tsx"), /permanentRedirect\(article \? `\/help#/);
  assert.match(read("app/(public)/learn/[category]/page.tsx"), /permanentRedirect\(productHref\(presentation, `\/learn\?category=/);
});

test("every former mixed Responsible Gambling article has one explicit canonical authority", () => {
  assert.deepEqual(LEGACY_RESPONSIBLE_GAMBLING_ROUTES, {
    budgeting: {
      classification: "EDUCATION",
      destination: "/learn/responsible-gambling/responsible-gambling-tools",
      reason: "Budget planning is educational context, not an immediate Help action or access control.",
    },
    "time-management": {
      classification: "EDUCATION",
      destination: "/learn/responsible-gambling/responsible-gambling-tools",
      reason: "Session planning is educational context; the canonical Learn guide covers reminders and time controls.",
    },
    "bonus-terms": {
      classification: "EDUCATION",
      destination: "/learn/casino-bonuses/welcome-bonus-terms",
      reason: "Bonus mechanics belong to the published Learn bonus guide, not Protected Help.",
    },
    "self-exclusion": {
      classification: "HELP",
      destination: "/help/self-exclusion",
      reason: "Self-exclusion is a direct access-control action with an official support destination.",
    },
    "deposit-limits": {
      classification: "HELP",
      destination: "/help/deposit-limits",
      reason: "A deposit limit is a direct account control that can cap access to funds.",
    },
    "cooling-off": {
      classification: "HELP",
      destination: "/help/cooling-off",
      reason: "Cooling-off is a direct temporary pause control and remains fail-closed where local terms are unverified.",
    },
    "reality-checks": {
      classification: "HELP",
      destination: "/help/reality-checks",
      reason: "Reality checks are direct in-session controls that interrupt continuous play.",
    },
    "casino-licenses": {
      classification: "EDUCATION",
      destination: "/learn/licensing/casino-licenses-explained",
      reason: "Licence interpretation is educational trust context owned by Learn.",
    },
    "payment-safety": {
      classification: "EDUCATION",
      destination: "/learn/payments/casino-payment-methods",
      reason: "Payment and withdrawal mechanics are educational comparison context owned by Learn.",
    },
    faq: {
      classification: "EDUCATION",
      destination: "/learn/responsible-gambling",
      reason: "The mixed FAQ is redundant with the canonical Responsible Gambling Learn category and its published guide.",
    },
  });

  assert.deepEqual(protectedHelpArticles.map((article) => article.slug), [
    "self-exclusion",
    "deposit-limits",
    "cooling-off",
    "reality-checks",
  ]);
  for (const route of Object.values(LEGACY_RESPONSIBLE_GAMBLING_ROUTES)) {
    assert.match(route.destination, /^\/(?:help|learn)(?:\/|$)/);
    assert.doesNotMatch(route.destination, /^\/responsible-gambling(?:\/|$)/);
    if (route.classification === "EDUCATION") {
      const [, area, category, article] = route.destination.split("/");
      assert.equal(area, "learn");
      assert.ok(getLearningCategory(category));
      if (article) assert.ok(getArticleBySlug(article));
    } else if (route.classification === "HELP") {
      assert.match(route.destination, /^\/help\//);
    }
  }
  assert.equal(getLegacyResponsibleGamblingRoute("not-a-former-guide"), null);
  assert.equal(
    withPreservedLegacyQuery("/help/cooling-off", { utm_source: "old page", tag: ["one", "two"], empty: undefined }),
    "/help/cooling-off?utm_source=old+page&tag=one&tag=two",
  );
  assert.throws(() => withPreservedLegacyQuery("https://example.com", {}), /Invalid legacy Responsible Gambling destination/);
  assert.throws(() => withPreservedLegacyQuery("//example.com/help", {}), /Invalid legacy Responsible Gambling destination/);
});

test("shared navigation and footer expose only the final handoff destinations", () => {
  const navigation = read("lib/public-shell.ts");
  const footer = read("components/public-shell/PublicFooter.tsx");
  const shellCatalog = read("lib/i18n/public-shell-catalog.ts");
  const category = read("app/(public)/learn/[category]/LearningCategoryView.tsx");
  for (const destination of ["Best Offers", "Casinos", "Bonuses", "Learn"]) assert.match(navigation, new RegExp(`label: "${destination}"`));
  assert.doesNotMatch(navigation, /label: "(?:Help|Compare)"/);
  assert.match(navigation, /const protectedHelpPrefixes = \["\/help"\]/);
  assert.match(footer, /aria-label=\{footer\.label\}/);
  assert.match(shellCatalog, /label: "Control and support"/);
  for (const destination of ["/responsible-gambling", "/learn", "/privacy", "/terms"]) {
    assert.ok(footer.includes(destination), destination);
  }
  assert.match(footer, /<Link href="\/privacy">\{footer\.privacy\}<\/Link>/);
  assert.match(footer, /<Link href="\/terms">\{footer\.terms\}<\/Link>/);
  assert.doesNotMatch(footer, /\/self-check|\/tools\/budget-calculator|\/compare/);
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
