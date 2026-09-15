import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) => readFileSync(path, "utf8");

test("Founder-facing sidebar exposes exactly the ten current operational domains", () => {
  const shell = read("components/admin/AdminShell.tsx");
  const start = shell.indexOf("export const adminNav");
  const end = shell.indexOf("];", start);
  const navigation = shell.slice(start, end);
  const labels = [...navigation.matchAll(/label: "([^"]+)"/g)].map((match) => match[1]);
  const hrefs = [...navigation.matchAll(/href: "([^"]+)"/g)].map((match) => match[1]);

  assert.deepEqual(labels, [
    "Dashboard",
    "Programs",
    "Learning Center",
    "Casinos",
    "Affiliate Operations",
    "Commercial",
    "Customers",
    "Analytics",
    "Email",
    "Email Templates",
  ]);
  assert.deepEqual(hrefs, [
    "/admin",
    "/admin/programs",
    "/admin/learning",
    "/admin/casinos",
    "/admin/affiliate",
    "/admin/commercial",
    "/admin/customers",
    "/admin/analytics",
    "/admin/email",
    "/admin/templates",
  ]);
  for (const retired of ["Program settings", "Bonuses", "Media Operations", "Settings"]) {
    assert.equal(labels.includes(retired), false, retired);
  }
  assert.doesNotMatch(navigation, /Achievements|XP Rules/);
  assert.match(shell, /Admin protected/);
  assert.match(shell, /Better Auth \+ TOTP protects privileged Admin access/);
  assert.doesNotMatch(shell, /preview token remains|environment-gated fallback/i);
});

test("Programme and Email subdomains remain discoverable without top-level duplication", () => {
  const shell = read("components/admin/AdminShell.tsx");
  for (const href of ["/admin/programs", "/admin/xp-rules", "/admin/achievements"]) {
    assert.match(shell, new RegExp(href.replaceAll("/", "\\/")));
  }
  for (const page of [
    "app/admin/(protected)/programs/page.tsx",
    "app/admin/(protected)/xp-rules/page.tsx",
    "app/admin/(protected)/achievements/page.tsx",
  ]) {
    assert.match(read(page), /ProgrammeAdminNavigation/);
  }
  assert.match(read("app/admin/(protected)/email/page.tsx"), /EmailAdminNavigation/);
  const templates = read("app/admin/(protected)/templates/page.tsx");
  assert.match(templates, /EmailAdminNavigation/);
  assert.match(templates, /title="Email Templates"/);
});

test("dashboard uses only current PostgreSQL domain services", () => {
  const dashboard = read("app/admin/(protected)/page.tsx");
  for (const evidence of [
    /programService\.listPrograms/,
    /articleService\.listAdminArticles/,
    /casinoService\.listCasinos/,
    /listCustomers/,
    /No Phase-1 seed or in-memory CMS record is included/,
  ]) assert.match(dashboard, evidence);
  assert.doesNotMatch(dashboard, /listCmsRecords|listAuditEntries|Recent CMS Records|cms\/repository|cms\/seed/);
});

test("legacy seed store and shadow mutation APIs are retired", () => {
  for (const file of [
    "lib/cms/seed.ts",
    "lib/cms/repository.ts",
    "lib/cms/audit.ts",
    "lib/cms/revisions.ts",
    "lib/cms/validation.ts",
    "lib/cms/workflow.ts",
    "scripts/cms-smoke-tests.mjs",
  ]) assert.equal(existsSync(file), false, file);

  for (const route of ["app/api/admin/[entity]/route.ts", "app/api/admin/[entity]/[id]/route.ts"]) {
    const source = read(route);
    assert.match(source, /requireAdminAccess/);
    assert.match(source, /LEGACY_CMS_RETIRED/);
    assert.match(source, /status: 410/);
    assert.doesNotMatch(source, /createCmsRecord|updateCmsRecord|archiveCmsRecord|listCmsRecords|globalThis|cms\/seed/);
  }
  const dynamicSection = read("app/admin/(protected)/[section]/page.tsx");
  assert.match(dynamicSection, /notFound\(\)/);
  assert.doesNotMatch(dynamicSection, /listCmsRecords|sectionConfig|CmsEntity/);
});

test("retired routes have deliberate semantics and current domain routes remain dedicated", () => {
  assert.match(read("app/admin/(protected)/program-settings/page.tsx"), /redirect\("\/admin\/programs"\)/);
  assert.match(read("app/admin/(protected)/bonuses/page.tsx"), /redirect\("\/admin\/casinos"\)/);
  assert.match(read("app/admin/(protected)/media-operations/page.tsx"), /redirect\("\/admin\/casinos"\)/);
  assert.match(read("app/admin/(protected)/learning/page.tsx"), /articleService\.listAdminArticles/);
  assert.match(read("app/admin/(protected)/casinos/page.tsx"), /casinoService\.listCasinos/);
  assert.match(read("app/admin/(protected)/affiliate/page.tsx"), /AffiliateDashboard/);
  assert.match(read("app/admin/(protected)/commercial/page.tsx"), /Commercial/);
  assert.match(read("app/admin/(protected)/customers/page.tsx"), /listCustomers/);
  assert.match(read("app/admin/(protected)/analytics/page.tsx"), /founderOverview/);
  assert.match(read("app/admin/(protected)/email/page.tsx"), /listEmailCampaigns/);
  assert.match(read("app/admin/(protected)/templates/page.tsx"), /listEmailTemplates/);
});

test("responsive Admin CSS keeps compact navigation and Learning controls usable", () => {
  const css = read("app/globals.css");
  assert.match(css, /\.adminLocalNav/);
  assert.match(css, /\.adminSidebar nav,[\s\S]*\.adminDomainGrid[\s\S]*grid-template-columns: repeat\(2/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.adminSidebar nav,[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /@media \(max-width: 700px\)[\s\S]*\.articleFilters,[\s\S]*grid-template-columns: 1fr/);
});
