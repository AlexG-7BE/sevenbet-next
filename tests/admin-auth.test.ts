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
import { createStaffContext } from "../lib/auth/staff-context";
import { middleware } from "../middleware";

function withLegacyEnvironment(
  values: { enabled?: string; token?: string },
  callback: () => void,
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
    callback();
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

test("middleware redirects an anonymous admin page to login", () => {
  withLegacyEnvironment({}, () => {
    const response = middleware(
      new NextRequest("http://localhost:4173/admin/programs?status=DRAFT"),
    );

    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "http://localhost:4173/admin/login?callbackUrl=%2Fadmin%2Fprograms%3Fstatus%3DDRAFT",
    );
  });
});

test("middleware allows a correctly gated legacy preview token", () => {
  withLegacyEnvironment(
    { enabled: "true", token: "configured-preview-token" },
    () => {
      const response = middleware(
        new NextRequest("http://localhost:4173/admin", {
          headers: {
            "x-sevenbet-admin-token": "configured-preview-token",
          },
        }),
      );

      assert.equal(response.status, 200);
      assert.equal(response.headers.get("x-middleware-next"), "1");
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
