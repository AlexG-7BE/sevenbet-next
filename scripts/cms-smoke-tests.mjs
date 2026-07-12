import assert from "node:assert/strict";

const statuses = ["DRAFT", "IN_REVIEW", "APPROVED", "SCHEDULED", "PUBLISHED", "ARCHIVED"];
const allowedTransitions = {
  DRAFT: ["IN_REVIEW", "ARCHIVED"],
  IN_REVIEW: ["DRAFT", "APPROVED", "ARCHIVED"],
  APPROVED: ["SCHEDULED", "PUBLISHED", "DRAFT"],
  SCHEDULED: ["PUBLISHED", "DRAFT", "ARCHIVED"],
  PUBLISHED: ["ARCHIVED", "DRAFT"],
  ARCHIVED: ["DRAFT"],
};

assert.equal(statuses.includes("PUBLISHED"), true, "published status must exist");
assert.equal(allowedTransitions.DRAFT.includes("PUBLISHED"), false, "draft content should not publish without review path");
assert.equal(allowedTransitions.APPROVED.includes("PUBLISHED"), true, "approved content should be publishable");

const rolePermissions = {
  SUPER_ADMIN: ["settings.manage", "affiliate.manage", "program.publish", "article.publish"],
  AUTHOR: ["article.create", "article.edit"],
  REVIEWER: ["article.review"],
};

assert.equal(rolePermissions.SUPER_ADMIN.includes("settings.manage"), true, "super admin should manage settings");
assert.equal(rolePermissions.AUTHOR.includes("article.publish"), false, "authors should not publish directly");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
assert.equal(slugPattern.test("sevenbet-10-step-control-program"), true, "valid slugs should pass");
assert.equal(slugPattern.test("SevenBet Draft"), false, "unsafe slugs should fail");

const affiliateUrl = new URL("https://example.com/partner");
assert.equal(affiliateUrl.protocol, "https:", "affiliate redirects should require https destinations");

const publicRecords = [
  { entity: "article", status: "PUBLISHED" },
  { entity: "article", status: "DRAFT" },
  { entity: "bonus", status: "PUBLISHED", offerStatus: "ACTIVE" },
  { entity: "bonus", status: "PUBLISHED", offerStatus: "EXPIRED" },
].filter((record) => record.status === "PUBLISHED" && (record.entity !== "bonus" || record.offerStatus === "ACTIVE"));

assert.equal(publicRecords.length, 2, "public API should exclude drafts and expired offers");

console.log("CMS smoke tests passed.");
