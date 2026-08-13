import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { adminServiceErrorResponse } from "../lib/http/admin-service-error";
import { ValidationError } from "../lib/services/service-error";

test("admin service errors preserve governed failures and hide unknown exception details", async () => {
  const validation = adminServiceErrorResponse(
    new ValidationError("Title is required", { title: "required" }),
    "Unable to save record",
  );
  assert.equal(validation.status, 422);
  assert.equal(validation.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.equal(validation.headers.get("vary"), "Cookie");
  assert.deepEqual(await validation.json(), {
    ok: false,
    error: "Title is required",
    code: "VALIDATION_ERROR",
    details: { title: "required" },
  });

  const malformed = adminServiceErrorResponse(new SyntaxError("secret parser detail"), "Unable to save record");
  assert.equal(malformed.status, 400);
  assert.equal(malformed.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.deepEqual(await malformed.json(), {
    ok: false,
    error: "Request body must be valid JSON",
    code: "INVALID_JSON",
  });

  const unknown = adminServiceErrorResponse(new Error("database host and query detail"), "Unable to save record");
  assert.equal(unknown.status, 500);
  assert.equal(unknown.headers.get("cache-control"), "private, no-store, max-age=0");
  assert.deepEqual(await unknown.json(), {
    ok: false,
    error: "Unable to save record",
    code: "INTERNAL_ERROR",
  });
});

test("legacy generic and Program admin APIs use the shared error boundary", () => {
  const routes = [
    "app/api/admin/[entity]/route.ts",
    "app/api/admin/[entity]/[id]/route.ts",
    "app/api/admin/programs/route.ts",
    "app/api/admin/programs/[programId]/builder/route.ts",
    "app/api/admin/programs/[programId]/action/route.ts",
    "app/api/admin/programs/[programId]/revisions/route.ts",
  ];

  for (const route of routes) {
    const source = readFileSync(route, "utf8");
    assert.match(source, /adminServiceErrorResponse/);
    assert.doesNotMatch(source, /error\.message/);
  }
});
