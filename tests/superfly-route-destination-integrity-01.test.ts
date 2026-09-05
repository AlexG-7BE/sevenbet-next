import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  assertCanonicalSuperflyCampaignDestination,
  destinationSha256,
  extractHashBoundSuperflyCampaignDestination,
} from "../lib/affiliate-routing/superfly-destination-evidence";

const canonical = "https://go.superflypartners.net/c/a9b48a18";
const canonicalHash = destinationSha256(canonical);

test("exact canonical Superfly campaign destinations pass unchanged", () => {
  assert.equal(assertCanonicalSuperflyCampaignDestination(canonical), canonical);
  assert.equal(extractHashBoundSuperflyCampaignDestination(`Portal destination: ${canonical}`, canonicalHash), canonical);
});

test("a hash-bound campaign reference excludes one sentence-ending period", () => {
  assert.equal(
    extractHashBoundSuperflyCampaignDestination(`Portal destination: ${canonical}.`, canonicalHash),
    canonical,
  );
});

test("direct destinations with terminal punctuation never pass destination validation", () => {
  for (const suffix of [".", ",", ";", ":", "!", "?", ")"]) {
    assert.throws(
      () => assertCanonicalSuperflyCampaignDestination(`${canonical}${suffix}`),
      /not an exact canonical campaign URL/,
    );
  }
});

test("evidence extraction is exact and never acts as a generic URL cleaner", () => {
  assert.throws(
    () => extractHashBoundSuperflyCampaignDestination(`Portal destination: ${canonical},`, canonicalHash),
    /not an exact canonical campaign URL/,
  );
  assert.throws(
    () => extractHashBoundSuperflyCampaignDestination(`Portal destination: ${canonical}.`, destinationSha256(`${canonical}.`)),
    /evidence-bound checksum/,
  );
  assert.throws(
    () => extractHashBoundSuperflyCampaignDestination(`${canonical} and ${canonical}`, canonicalHash),
    /exactly one HTTPS destination token/,
  );
  assert.throws(
    () => assertCanonicalSuperflyCampaignDestination("https://go.superflypartners.net/c/a9b48a18?source=prose"),
    /not an exact canonical campaign URL/,
  );
  assert.throws(
    () => assertCanonicalSuperflyCampaignDestination("https://other.example/c/a9b48a18"),
    /not an exact canonical campaign URL/,
  );
});

test("the executor is bounded to forward updates of route destination records", () => {
  const source = readFileSync("scripts/superfly-route-destination-integrity-01.ts", "utf8");
  assert.match(source, /links\.length !== 6/);
  assert.match(source, /DOTTED_TERMINAL_PERIOD/);
  assert.match(source, /affiliateTrackingLink\.updateMany/);
  assert.match(source, /affiliateTrackingLinkRevision\.create/);
  assert.match(source, /auditLog\.create/);
  assert.match(source, /WRITE_TRANSACTION_MAX_WAIT_MS = 30_000/);
  assert.match(source, /WRITE_TRANSACTION_TIMEOUT_MS = 120_000/);
  assert.match(source, /isolationLevel: Prisma\.TransactionIsolationLevel\.Serializable/);
  assert.doesNotMatch(source, /\.(?:delete|deleteMany|createMany)\s*\(/);
  assert.doesNotMatch(source, /prisma\.(?:casino|casinoBonus|affiliateOffer|affiliateRedirectSlug)\.(?:update|upsert|create)/);
});
