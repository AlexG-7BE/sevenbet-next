import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { PublicCommercialActionResolver } from "../lib/commercial/public-commercial-action-resolver";
import { MarketActivationRuntime } from "../lib/market-activation/runtime";
import { allowGbCommercialReadinessAuthority } from "./market-authority.fixtures";

const now = new Date("2030-06-01T00:00:00.000Z");
const casinoId = "10000000-0000-4000-8000-000000000001";

function activation(lifecycleActive: boolean, trackingUrl = "https://tracker.example/click") {
  return {
    id: "10000000-0000-4000-8000-000000000002",
    casinoId,
    countryCode: "NL",
    marketCode: "NL",
    product: "CASINO",
    desiredState: "ACTIVE",
    status: "ACTIVE",
    marketProfileId: null,
    affiliateOfferId: "10000000-0000-4000-8000-000000000003",
    primaryTrackingLinkId: "10000000-0000-4000-8000-000000000004",
    redirectSlugId: "10000000-0000-4000-8000-000000000005",
    casinoBonusId: null,
    version: 1,
    controllerVersion: "MARKET-ACTIVATION-V2",
    reconciliationFingerprint: "a".repeat(64),
    requestedBy: "founder",
    requestedAt: now,
    requestReason: "test",
    sourceReferences: ["TEST"],
    activatedAt: now,
    disabledAt: null,
    blockedAt: null,
    lastReconciledAt: now,
    routeVerificationStatus: "HEALTHY",
    routeLastCheckedAt: now,
    routeFinalHost: "casino.example",
    routeVerificationDetail: "HEAD_OK",
    externalBlockerCode: null,
    externalBlockerDetail: null,
    externalBlockerSource: null,
    globalFallbackBlockedCountries: [],
    diagnostics: {},
    createdAt: now,
    updatedAt: now,
    casino: { id: casinoId, slug: "casino", title: "Casino" },
    marketProfile: null,
    affiliateOffer: {
      id: "10000000-0000-4000-8000-000000000003",
      casinoId,
      casinoBonusId: null,
      programId: "10000000-0000-4000-8000-000000000006",
      status: lifecycleActive ? "ACTIVE" : "ARCHIVED",
      archivedAt: lifecycleActive ? null : now,
      startAt: null,
      expiresAt: null,
      program: {
        id: "10000000-0000-4000-8000-000000000006",
        casinoId,
        operator: "Operator Limited",
        metadata: {},
        status: lifecycleActive ? "ACTIVE" : "ARCHIVED",
        workflowStatus: lifecycleActive ? "PUBLISHED" : "DRAFT",
        archivedAt: lifecycleActive ? null : now,
        network: { active: lifecycleActive, archivedAt: lifecycleActive ? null : now },
      },
    },
    casinoBonus: null,
    primaryTrackingLink: {
      id: "10000000-0000-4000-8000-000000000004",
      offerId: "10000000-0000-4000-8000-000000000003",
      label: "Canonical endpoint",
      destinationUrl: "https://casino.example/welcome",
      trackingUrl,
      active: lifecycleActive,
      archivedAt: lifecycleActive ? null : now,
      verifiedAt: now,
      lastCheckedAt: now,
      validFrom: null,
      expiresAt: null,
    },
    redirectSlug: {
      id: "10000000-0000-4000-8000-000000000005",
      slug: "casino-nl",
      casinoId,
      casinoBonusId: null,
      affiliateOfferId: "10000000-0000-4000-8000-000000000003",
      active: true,
      archivedAt: null,
    },
  };
}

function runtime(record: ReturnType<typeof activation> | null) {
  return new MarketActivationRuntime({
    marketActivation: {
      findMany: async () => record ? [record] : [],
    },
  } as never);
}

test("Affiliate lifecycle state alone can neither create nor destroy a GovernedCommercialAction", async () => {
  const authority = {
    countryCode: "NL",
    commercialAllowed: true,
    referralAllowed: true,
    reasonCode: "POLICY_APPROVED",
    policyVersion: "test",
  } as const;
  const resolve = async (record: ReturnType<typeof activation> | null) => {
    const resolver = new PublicCommercialActionResolver(runtime(record), allowGbCommercialReadinessAuthority, () => true);
    return (await resolver.resolveMany({
      subjects: [{ casinoId, casinoSlug: "casino", published: true }],
      authority,
      countryCode: "NL",
      marketCode: "NL",
      product: "CASINO",
      now,
    })).get(casinoId);
  };

  assert.deepEqual((await resolve(activation(true)))?.action, { href: "/r/casino-nl" });
  assert.deepEqual((await resolve(activation(false)))?.action, { href: "/r/casino-nl" });
  assert.equal((await resolve(null))?.action, null, "active legacy entities cannot synthesize canonical authority");
});

test("technical and legal blockers remain authoritative after lifecycle collapse", async () => {
  assert.deepEqual(await runtime(activation(false, "http://unsafe.example")).listActive([casinoId], "NL", now), []);
  let routeReads = 0;
  const resolver = new PublicCommercialActionResolver({
    async listPublicRoutes() { routeReads += 1; return [{ casinoId, slug: "must-not-authorize" }]; },
  }, allowGbCommercialReadinessAuthority, () => true);
  const result = (await resolver.resolveMany({
    subjects: [{ casinoId, casinoSlug: "casino", published: true }],
    authority: { countryCode: "NL", commercialAllowed: false, referralAllowed: false, reasonCode: "MARKET_RESTRICTED", policyVersion: "test" },
    countryCode: "NL",
    marketCode: "NL",
    product: "CASINO",
    now,
  })).get(casinoId);
  assert.equal(result?.reasonCode, "MARKET_RESTRICTED");
  assert.equal(routeReads, 0);
});

test("runtime and canonical writes contain no hidden Affiliate lifecycle permission predicate", () => {
  const executableSource = (path: string) => readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  const runtimeSource = executableSource("lib/market-activation/runtime.ts");
  for (const predicate of [
    /primaryTrackingLink\.active/,
    /affiliateOffer\.status/,
    /program\.status/,
    /workflowStatus/,
    /program\.network\.active/,
    /commercialContract/,
  ]) assert.doesNotMatch(runtimeSource, predicate);

  const readiness = executableSource("lib/affiliate-commercial/gb-commercial-route-readiness.ts");
  for (const predicate of [/program\.status/, /workflowStatus/, /offer\.status/, /trackingLink\.active/, /commercialContract/]) {
    assert.doesNotMatch(readiness, predicate);
  }
  const repository = readFileSync("lib/market-activation/repository.ts", "utf8");
  assert.doesNotMatch(repository, /COMMERCIAL_SOURCE_RESTORE_PENDING|TRACKING_LINK_RESTORE_PENDING|trackingActive|offerArchivedAt/);
  const registrar = readFileSync("lib/repositories/partner-tracking-registration.repository.ts", "utf8");
  assert.doesNotMatch(registrar, /data:\s*\{\s*active:\s*(?:true|false),\s*archivedAt:[^}]*updatedBy/);
  const legacyBundleService = readFileSync("lib/commercial-activation/service.ts", "utf8");
  const legacyBundleRepository = readFileSync("lib/commercial-activation/repository.ts", "utf8");
  const legacyBundleCli = readFileSync("scripts/commercial-activation.ts", "utf8");
  assert.doesNotMatch(legacyBundleService, /async apply\(/);
  assert.doesNotMatch(legacyBundleRepository, /async apply\(/);
  assert.match(legacyBundleCli, /COMMERCIAL_ACTIVATION_LEGACY_WRITE_RETIRED_BY_PR4/);
  assert.doesNotMatch(legacyBundleCli, /commercialActivationService\.apply/);
});
