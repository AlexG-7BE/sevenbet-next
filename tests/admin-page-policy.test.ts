import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(path, "utf8");
}

test("every direct-data admin page checks its area before reading records", () => {
  const guardedPages = [
    "app/admin/(protected)/page.tsx",
    "app/admin/(protected)/[section]/page.tsx",
    "app/admin/(protected)/achievements/page.tsx",
    "app/admin/(protected)/xp-rules/page.tsx",
    "app/admin/(protected)/program-settings/page.tsx",
    "app/admin/(protected)/programs/page.tsx",
    "app/admin/(protected)/programs/new/page.tsx",
    "app/admin/(protected)/programs/[programId]/page.tsx",
    "app/admin/(protected)/programs/[programId]/builder/page.tsx",
    "app/admin/(protected)/programs/[programId]/preview/page.tsx",
    "app/admin/(protected)/programs/[programId]/revisions/page.tsx",
    "app/admin/(protected)/casinos/page.tsx",
    "app/admin/(protected)/casinos/new/page.tsx",
    "app/admin/(protected)/casinos/[casinoId]/page.tsx",
    "app/admin/(protected)/casinos/[casinoId]/builder/page.tsx",
    "app/admin/(protected)/casinos/[casinoId]/preview/page.tsx",
    "app/admin/(protected)/casinos/[casinoId]/revisions/page.tsx",
  ];
  for (const path of guardedPages) {
    const text = source(path);
    assert.match(text, /getAdminPageAccess\(await headers\(\),/i, path);
  }
  assert.match(source("app/admin/(protected)/affiliate/layout.tsx"), /getAdminPageAccess\(await headers\(\), "affiliate"\)/);
  assert.match(source("app/admin/(protected)/commercial/layout.tsx"), /getAdminPageAccess\(await headers\(\), "commercial"\)/);
});

test("admin navigation is role-filtered and the dashboard filters record and audit reads", () => {
  const shell = source("components/admin/AdminShell.tsx");
  const dashboard = source("app/admin/(protected)/page.tsx");
  assert.match(shell, /visibleNavigation = adminNav\.filter/);
  assert.match(shell, /canAccessAdminArea\(staff, item\.area\)/);
  assert.match(shell, /\/admin\/program-settings/);
  assert.match(dashboard, /legacyEntities\.filter\(canReadEntity\)/);
  assert.match(dashboard, /listAuditEntries\(\)\.filter/);
});

test("all admin routes inherit a private robots policy", () => {
  const layout = source("app/admin/layout.tsx");
  assert.match(layout, /robots:\s*\{ index: false, follow: false \}/);
});
