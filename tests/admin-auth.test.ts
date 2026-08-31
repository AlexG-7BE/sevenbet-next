import assert from "node:assert/strict";
import test from "node:test";
import { NextRequest } from "next/server";

import {
  getAdminAccessStatus,
  getAdminLoginErrorMessage,
  getAdminLoginUrl,
  getSafeAdminCallback,
  isLegacyPreviewTokenValid,
} from "../lib/auth/policy";
import { canAccessAdminArea, type AdminArea } from "../lib/auth/admin-page-policy";
import { createStaffContext } from "../lib/auth/staff-context";
import { permissionForEntity, permissionsForEntity } from "../lib/cms/entities";
import { permissionsForRole } from "../lib/cms/permissions";
import type { AdminRole, CmsUser } from "../lib/cms/types";
import { middleware } from "../middleware";

async function withLegacyEnvironment(
  values: { enabled?: string; token?: string },
  callback: () => void | Promise<void>,
) {
  const previousEnabled = process.env.CMS_PHASE1_ALLOW_DEV_ADMIN;
  const previousToken = process.env.SEVENBET_ADMIN_PREVIEW_TOKEN;

  if (values.enabled === undefined) {
    delete process.env.CMS_PHASE1_ALLOW_DEV_ADMIN;
  } else {
    process.env.CMS_PHASE1_ALLOW_DEV_ADMIN = values.enabled;
  }

  if (values.token === undefined) {
    delete process.env.SEVENBET_ADMIN_PREVIEW_TOKEN;
  } else {
    process.env.SEVENBET_ADMIN_PREVIEW_TOKEN = values.token;
  }

  try {
    await callback();
  } finally {
    if (previousEnabled === undefined) {
      delete process.env.CMS_PHASE1_ALLOW_DEV_ADMIN;
    } else {
      process.env.CMS_PHASE1_ALLOW_DEV_ADMIN = previousEnabled;
    }

    if (previousToken === undefined) {
      delete process.env.SEVENBET_ADMIN_PREVIEW_TOKEN;
    } else {
      process.env.SEVENBET_ADMIN_PREVIEW_TOKEN = previousToken;
    }
  }
}

test("middleware redirects an anonymous admin page to login", async () => {
  await withLegacyEnvironment({}, async () => {
    const response = await middleware(
      new NextRequest("http://localhost:4173/admin/programs?status=DRAFT"),
    );

    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "http://localhost:4173/admin/login?callbackUrl=%2Fadmin%2Fprograms%3Fstatus%3DDRAFT",
    );
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
    assert.equal(response.headers.get("vary"), "Cookie");
  });
});

test("middleware allows the admin login page without a session", async () => {
  const response = await middleware(
    new NextRequest("http://localhost:4173/admin/login"),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("x-middleware-next"), "1");
  assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
});

test("middleware allows only the dedicated MCP login and consent pages to resolve their own staff checks", async () => {
  for (const path of [
    "/admin/integrations/chatgpt-work/login",
    "/admin/integrations/chatgpt-work/consent",
  ]) {
    const response = await middleware(new NextRequest(`http://localhost:4173${path}`));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-middleware-next"), "1");
    assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
  }
  const ordinaryIntegrationPage = await middleware(new NextRequest("http://localhost:4173/admin/integrations"));
  assert.equal(ordinaryIntegrationPage.status, 307);
});

test("middleware allows a correctly gated legacy preview token", async () => {
  await withLegacyEnvironment(
    { enabled: "true", token: "configured-preview-token" },
    async () => {
      const response = await middleware(
        new NextRequest("http://localhost:4173/admin", {
          headers: {
            "x-sevenbet-admin-token": "configured-preview-token",
          },
        }),
      );

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("x-middleware-next"), "1");
      assert.equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
    },
  );
});

test("anonymous admin pages redirect to the login callback", () => {
  assert.equal(
    getAdminAccessStatus({
      hasSession: false,
      hasStaffProfile: false,
    }),
    401,
  );
  assert.equal(
    getAdminLoginUrl("/admin/programs?status=DRAFT"),
    "/admin/login?callbackUrl=%2Fadmin%2Fprograms%3Fstatus%3DDRAFT",
  );
});

test("an authenticated user without an AdminUser is forbidden", () => {
  assert.equal(
    getAdminAccessStatus({
      hasSession: true,
      hasStaffProfile: false,
    }),
    403,
  );
});

test("a SUPER_ADMIN has admin permissions", () => {
  assert.equal(
    getAdminAccessStatus({
      hasSession: true,
      hasStaffProfile: true,
      role: "SUPER_ADMIN",
      permission: "program.publish",
    }),
    200,
  );
});

test("login failures use a safe generic password error", () => {
  assert.equal(
    getAdminLoginErrorMessage(),
    "Email or password is incorrect.",
  );
});

test("admin callbacks reject external and non-admin destinations", () => {
  assert.equal(getSafeAdminCallback("https://example.com/admin"), "/admin");
  assert.equal(getSafeAdminCallback("//example.com/admin"), "/admin");
  assert.equal(getSafeAdminCallback("/catalog"), "/admin");
  assert.equal(getSafeAdminCallback("/administrator"), "/admin");
  assert.equal(getSafeAdminCallback("/admin/login"), "/admin");
  assert.equal(
    getSafeAdminCallback("/admin/login?callbackUrl=%2Fadmin"),
    "/admin",
  );
  assert.equal(getSafeAdminCallback("/admin/programs?status=DRAFT"), "/admin/programs?status=DRAFT");
});

test("anonymous API access resolves to 401", () => {
  assert.equal(
    getAdminAccessStatus({
      hasSession: false,
      hasStaffProfile: false,
      permission: "program.view",
    }),
    401,
  );
});

test("staff without the requested permission resolves to 403", () => {
  assert.equal(
    getAdminAccessStatus({
      hasSession: true,
      hasStaffProfile: true,
      role: "AUTHOR",
      permission: "program.publish",
    }),
    403,
  );
});

test("legacy preview requires both the env gate and the correct token", () => {
  const input = {
    configuredToken: "configured-preview-token",
    providedTokens: [null, "configured-preview-token"],
  };

  assert.equal(isLegacyPreviewTokenValid({ ...input, enabled: true }), true);
  assert.equal(isLegacyPreviewTokenValid({ ...input, enabled: false }), false);
  assert.equal(
    isLegacyPreviewTokenValid({
      ...input,
      enabled: true,
      providedTokens: ["wrong-token"],
    }),
    false,
  );
});

test("the audit actor is the AdminUser UUID, not the Better Auth User ID", () => {
  const context = createStaffContext({
    authMethod: "better-auth",
    user: {
      id: "better-auth-user-id",
      email: "staff@example.com",
      name: "Staff User",
      emailVerified: false,
    },
    adminUser: {
      id: "63acbb21-e999-424c-9f83-a20010787a91",
      userId: "better-auth-user-id",
      email: "staff@example.com",
      name: "Staff User",
      role: "SUPER_ADMIN",
      createdAt: new Date("2026-07-14T00:00:00.000Z"),
      updatedAt: new Date("2026-07-14T00:00:00.000Z"),
    },
  });

  assert.equal(context.id, context.adminUser.id);
  assert.notEqual(context.id, context.user.id);
});

test("generic CMS entity reads use the entity permission contract", () => {
  assert.equal(permissionForEntity("article", "read"), "article.edit");
  assert.equal(permissionForEntity("casino", "read"), "casino.edit");
  assert.equal(permissionForEntity("bonus", "read"), "bonus.edit");
  assert.equal(permissionForEntity("affiliate-link", "read"), "affiliate.manage");
  assert.equal(permissionForEntity("navigation", "read"), "settings.manage");
  assert.equal(permissionForEntity("settings", "read"), "settings.manage");
  assert.equal(permissionForEntity("program", "read"), "program.view");
  assert.deepEqual(permissionsForEntity("article", "read"), [
    "article.create",
    "article.edit",
    "article.review",
    "article.publish",
  ]);
});

function staffForRole(role: AdminRole): CmsUser {
  return {
    id: role,
    email: `${role.toLowerCase()}@example.invalid`,
    name: role,
    role,
    permissions: permissionsForRole(role),
    authProvider: "email",
    createdAt: "2026-08-13T00:00:00.000Z",
    updatedAt: "2026-08-13T00:00:00.000Z",
  };
}

test("admin page areas enforce the role matrix and any-of editorial access", () => {
  const allowed: Record<AdminRole, AdminArea[]> = {
    SUPER_ADMIN: ["dashboard", "programs", "program-create", "program-edit", "program-preview", "achievements", "xp-rules", "program-settings", "learning", "casinos", "bonuses", "affiliate", "users", "analytics", "settings"],
    ADMIN: ["dashboard", "programs", "program-create", "program-edit", "program-preview", "achievements", "xp-rules", "learning", "casinos", "bonuses", "affiliate", "users", "analytics"],
    EDITOR: ["dashboard", "programs", "program-create", "program-edit", "program-preview", "learning", "casinos", "bonuses"],
    AUTHOR: ["dashboard", "learning"],
    REVIEWER: ["dashboard", "programs", "program-preview", "learning", "casinos", "bonuses"],
    AFFILIATE_MANAGER: ["dashboard", "casinos", "bonuses", "affiliate"],
    ANALYST: ["dashboard", "analytics"],
    SUPPORT: ["dashboard", "users"],
  };
  const areas = allowed.SUPER_ADMIN;

  for (const role of Object.keys(allowed) as AdminRole[]) {
    const staff = staffForRole(role);
    for (const area of areas) {
      assert.equal(
        canAccessAdminArea(staff, area),
        allowed[role].includes(area),
        `${role} ${area}`,
      );
    }
  }
});
