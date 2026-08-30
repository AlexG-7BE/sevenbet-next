import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8");
}

function filesBelow(root: string): string[] {
  return readdirSync(root).flatMap((name) => {
    const path = join(root, name);
    return statSync(path).isDirectory() ? filesBelow(path) : [path];
  });
}

test("root 404 is static, branded and independent of auth and database", () => {
  const notFound = source("app/not-found.tsx");
  const errorCatalog = source("lib/i18n/public-errors.ts");
  const handoff = JSON.parse(source("lib/final-handoff/generated-pages.json")) as Record<string, { html: string }>;
  const document = notFound + handoff.notFound.html;
  assert.match(notFound, /transformNotFoundHandoff/);
  assert.match(notFound, /<HandoffPage name="notFound" transform=/);
  assert.match(notFound, /productHref\(presentation, href\)/);
  assert.match(notFound, /publicErrorMessages\(presentation\.locale\)/);
  assert.match(document, />404</);
  assert.match(errorCatalog, /We couldn't find this page/);
  assert.match(errorCatalog, /Let's get you back on course/);
  assert.match(document, /href="\/"/);
  assert.doesNotMatch(document, /href="\/help"/);
  assert.match(document, /href="\/10-steps"/);
  assert.doesNotMatch(notFound, /getServerSession|Prisma|auth\/|cms/iu);
});

test("public and global error boundaries expose safe recovery with no technical detail", () => {
  const publicError = source("app/(public)/error.tsx");
  const errorCatalog = source("lib/i18n/public-errors.ts");
  assert.match(publicError, /usePublicErrorContext/);
  assert.match(publicError, /messages\.title/);
  assert.match(errorCatalog, /We couldn't load this page/);
  assert.match(publicError, /reset/);
  assert.match(errorCatalog, /Go home/);
  assert.match(errorCatalog, /Open Help/);
  assert.doesNotMatch(publicError, /error\.(?:message|stack|digest)|console\./);

  const globalError = source("app/global-error.tsx");
  assert.match(globalError, /B4GAMBLE/);
  assert.match(globalError, /window\.location\.reload/);
  assert.match(globalError, /Go home/);
  assert.match(globalError, /Open Help/);
  assert.doesNotMatch(globalError, /error\.(?:message|stack|digest)|console\./);
  const imports = [...globalError.matchAll(/from\s+["']([^"']+)["']/g)].map((match) => match[1]);
  assert.deepEqual(imports, ["./global-error.module.css"]);

  const harness = source("app/(public)/launch-polish-error-harness/page.tsx");
  assert.match(harness, /LAUNCH_POLISH_ERROR_HARNESS === "true"/);
  assert.match(harness, /PLAYWRIGHT_BASE_URL === "http:\/\/127\.0\.0\.1:4173"/);
  assert.match(harness, /VERCEL_ENV !== "production"/);
  assert.match(harness, /if \(!enabled\) notFound\(\)/);

  const commercialHarness = source("lib/qa/public-commercial-error-harness.ts");
  assert.match(commercialHarness, /LAUNCH_POLISH_ERROR_HARNESS === "true"/);
  assert.match(commercialHarness, /PLAYWRIGHT_BASE_URL === LOCAL_BROWSER_ORIGIN/);
  assert.match(commercialHarness, /VERCEL !== "1"/);
  assert.match(commercialHarness, /VERCEL_ENV !== "production"/);
  assert.match(commercialHarness, /value === PUBLIC_COMMERCIAL_ERROR_FIXTURE/);
  const retry = source("lib/qa/retry-public-commercial-error.ts");
  assert.match(retry, /searchParams\.delete\("errorFixture"\)/);
  assert.match(retry, /window\.location\.replace/);
  for (const route of ["best-offers/page.tsx", "bonuses/page.tsx", "casinos/page.tsx", "casino/[slug]/page.tsx", "compare/page.tsx"]) {
    const routeSource = source(`app/(public)/${route}`);
    assert.match(routeSource, /triggerPublicCommercialErrorHarness\(raw\.errorFixture\)/, route);
  }
  for (const route of ["best-offers/error.tsx", "bonuses/error.tsx", "casinos/error.tsx", "casino/[slug]/error.tsx", "compare/error.tsx"]) {
    assert.match(source(`app/(public)/${route}`), /retryPublicCommercialError\(reset\)/, route);
  }
});

test("Contact route is bounded and cannot activate dormant communications", () => {
  const route = source("app/api/contact/route.ts");
  const contactSources = filesBelow("lib/contact").map(source).join("\n");
  const communicationsFactory = source("lib/communications/factory.server.ts");
  assert.match(route, /runtime = "nodejs"/);
  assert.match(route, /export async function POST/);
  assert.doesNotMatch(route, /export (?:async )?function GET/);
  assert.doesNotMatch(`${route}\n${contactSources}`, /@prisma|lib\/db|lib\/programme|affiliate|analytics/i);
  assert.doesNotMatch(contactSources, /NEXT_PUBLIC_/);
  assert.match(communicationsFactory, /DisabledEmailTransport/);
  assert.doesNotMatch(communicationsFactory, /contact|Resend/);
});

test("Contact page has exact public contract and footer navigation", () => {
  const page = source("app/(public)/contact/page.tsx");
  const form = source("app/(public)/contact/ContactForm.tsx");
  const contactCatalog = source("lib/i18n/static-pages/contact.ts");
  const footer = source("components/public-shell/PublicFooter.tsx");
  const shellCatalog = source("lib/i18n/public-shell-catalog.ts");
  const site = source("lib/site.ts");
  assert.match(page, /<h1>\{messages\.titleLead\} <em>\{messages\.titleEmphasis\}<\/em><\/h1>/);
  assert.match(contactCatalog, /titleLead: "Talk"/);
  assert.match(contactCatalog, /titleEmphasis: "to us\."/);
  assert.match(page, /productCanonicalPath\(presentation, "\/contact"\)/);
  assert.doesNotMatch(page, /https:\/\/b4gamble\.com\/contact/);
  assert.match(page, /support@b4gamble\.com|SUPPORT_MAILBOX/);
  assert.match(contactCatalog, /helpAction: "Open Help →"/);
  assert.match(form, /name="name"/);
  assert.match(form, /name="email"/);
  assert.match(form, /name="subject"/);
  assert.match(form, /name="message"/);
  assert.match(form, /name="company"/);
  assert.match(form, /messages\.privacyNotice/);
  assert.match(form, /messages\.sensitiveWarning/);
  assert.match(contactCatalog, /Privacy Notice/);
  assert.match(contactCatalog, /Please do not include passwords, payment details or private Programme answers/);
  assert.match(form, /inFlight\.current/);
  assert.doesNotMatch(form, /localStorage|sessionStorage|productAnalytics|track\(/);
  assert.match(footer, /<Link href=\{localizedHref\("\/contact"\)\}>\{footer\.contact\}<\/Link>/);
  assert.match(shellCatalog, /contact: "Contact"/);
  assert.match(site, /"\/contact"/);
  assert.doesNotMatch(source("app/sitemap.ts"), /api\/contact/);
});

test("Contact styles use existing semantic tokens and do not create a duplicate design-system direction", () => {
  const css = source("app/(public)/contact/ContactPage.module.css");
  assert.match(css, /var\(--sb-action-primary\)/);
  assert.match(css, /var\(--sb-safety-verified\)/);
  assert.match(css, /var\(--sb-surface-paper\)/);
  assert.doesNotMatch(css, /#[0-9a-f]{3,8}|rgba?\(/i);
  assert.equal(filesBelow("components/design-system").filter((path) => path.endsWith(".tsx")).length, 1);
});

test("no schema, migration, dependency or analytics-event expansion accompanies launch polish", () => {
  const packageJson = JSON.parse(source("package.json"));
  assert.equal(packageJson.dependencies.resend, undefined);
  assert.equal(packageJson.dependencies["@resend/node"], undefined);
  const analytics = source("lib/analytics/product-analytics-events.ts");
  assert.doesNotMatch(analytics, /contact/i);
  assert.doesNotMatch(source("prisma/schema.prisma"), /ContactMessage|CONTACT_FORM_IP/);
});
