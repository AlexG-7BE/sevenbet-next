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
  assert.match(notFound, /404 · Page not found/);
  assert.match(notFound, /This page isn&apos;t here/);
  assert.match(notFound, /href="\/"/);
  assert.match(notFound, /href="\/responsible-gambling"/);
  assert.doesNotMatch(notFound, /getServerSession|Prisma|auth\/|programme|cms/iu);
});

test("public and global error boundaries expose safe recovery with no technical detail", () => {
  const publicError = source("app/(public)/error.tsx");
  assert.match(publicError, /We couldn&apos;t load this page/);
  assert.match(publicError, /reset/);
  assert.match(publicError, /Go home/);
  assert.match(publicError, /Open Help/);
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
  const footer = source("components/public-shell/PublicFooter.tsx");
  const site = source("lib/site.ts");
  assert.match(page, /How can we help\?/);
  assert.match(page, /https:\/\/b4gamble\.com\/contact/);
  assert.match(page, /support@b4gamble\.com|SUPPORT_MAILBOX/);
  assert.match(page, /Open Help/);
  assert.match(form, /name="name"/);
  assert.match(form, /name="email"/);
  assert.match(form, /name="subject"/);
  assert.match(form, /name="message"/);
  assert.match(form, /name="company"/);
  assert.match(form, /Privacy Notice/);
  assert.match(form, /Please do not include passwords, payment details or private Programme answers/);
  assert.match(form, /inFlight\.current/);
  assert.doesNotMatch(form, /localStorage|sessionStorage|productAnalytics|track\(/);
  assert.match(footer, /<Link href="\/contact">Contact<\/Link>/);
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
